"""
WebSocket endpoints for live coaching sessions.

WS /ws/interview/{session_id}?token=<firebase_token>
WS /ws/presentation/{session_id}?token=<firebase_token>
"""

import asyncio
import base64
import json
import logging
import time
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from google.genai import types

from agents.interview_agent import INTERVIEW_SYSTEM_PROMPT, get_interview_config
from agents.presentation_agent import (
    PRESENTATION_SYSTEM_PROMPT,
    analyze_slide,
    get_presentation_config,
)
from core.dependencies import verify_websocket_token
from core.gemini import LIVE_MODEL, get_genai_client
from models.session import FeedbackEvent, SessionConfig, TranscriptEntry
from services.firestore import firestore_service
from services.pubsub import pubsub_service
from services.storage import storage_service

logger = logging.getLogger(__name__)
router = APIRouter()

# Filler words to detect in real time from user speech
_FILLER_WORDS = [
    "um",
    "uh",
    "like",
    "you know",
    "basically",
    "literally",
    "sort of",
    "kind of",
]


def _detect_filler_words(text: str) -> list[str]:
    """Return a list of filler words found in the text (case-insensitive)."""
    lower = text.lower()
    return [fw for fw in _FILLER_WORDS if fw in lower]


async def _save_transcript(session_id: str, speaker: str, text: str, timestamp: float) -> None:
    """Persist a transcript entry to Firestore; silently log on failure."""
    try:
        entry = TranscriptEntry(
            session_id=session_id,
            timestamp_seconds=timestamp,
            speaker=speaker,
            text=text,
        )
        await firestore_service.save_transcript_entry(entry.model_dump(mode="json"))
    except Exception as e:
        logger.warning(f"Failed to save transcript entry: {e}")


async def _save_feedback(
    session_id: str,
    event_type: str,
    severity: str,
    message: str,
    timestamp: float,
    speaker: str = "user",
) -> None:
    """Persist a feedback event to Firestore; silently log on failure."""
    try:
        event = FeedbackEvent(
            session_id=session_id,
            timestamp_seconds=timestamp,
            type=event_type,
            severity=severity,
            message=message,
            speaker=speaker,
        )
        await firestore_service.save_feedback_event(event.model_dump(mode="json"))
    except Exception as e:
        logger.warning(f"Failed to save feedback event: {e}")



# Interview WebSocket

@router.websocket("/interview/{session_id}")
async def interview_websocket(
    websocket: WebSocket,
    session_id: str,
    token: Optional[str] = None,
):
    """
    Full-duplex WebSocket for live interview coaching sessions.

    Client sends:
      - Binary: PCM audio chunks (16kHz, mono, 16-bit)
      - JSON text: {"type": "end_session"} | {"type": "mute"} | {"type": "unmute"}

    Server sends:
      - Binary: PCM audio from Gemini (AI coach voice)
      - JSON text: transcript, feedback, session control messages
    """
    await websocket.accept()

    # Authenticate
    if not token:
        await websocket.send_json({"type": "error", "message": "Missing authentication token."})
        await websocket.close(code=1008)
        return

    try:
        uid = await verify_websocket_token(token)
    except ValueError:
        await websocket.send_json({"type": "error", "message": "Invalid authentication token."})
        await websocket.close(code=1008)
        return

    # Load session
    session_data = await firestore_service.get_session(session_id)
    if session_data is None:
        await websocket.send_json({"type": "error", "message": "Session not found."})
        await websocket.close(code=1008)
        return
    if session_data.get("user_id") != uid:
        await websocket.send_json({"type": "error", "message": "Access denied."})
        await websocket.close(code=1008)
        return

    session_config = SessionConfig(**session_data["config"])
    live_config = get_interview_config(session_config)
    client = get_genai_client()

    muted = False
    stop_event = asyncio.Event()
    session_start_time = time.time()

    try:
        async with client.aio.live.connect(model=LIVE_MODEL, config=live_config) as gemini_session:
            # Mark session as live
            await firestore_service.update_session(
                session_id,
                {"status": "live", "started_at": _utc_iso()},
            )
            await websocket.send_json({"type": "session_started", "session_id": session_id})

            # Trigger the AI greeting
            await gemini_session.send(
                input=f"Begin the interview. The candidate is ready.",
                end_of_turn=True,
            )

            async def receive_from_client():
                """Read from the WebSocket and forward audio to Gemini."""
                nonlocal muted
                try:
                    while not stop_event.is_set():
                        message = await websocket.receive()

                        if message.get("type") == "websocket.disconnect":
                            stop_event.set()
                            break

                        # Binary frame → raw PCM audio
                        if message.get("bytes"):
                            if not muted:
                                audio_bytes = message["bytes"]
                                await gemini_session.send(
                                    input=types.LiveClientRealtimeInput(
                                        audio=types.Blob(
                                            mime_type="audio/pcm;rate=16000",
                                            data=audio_bytes,
                                        )
                                    )
                                )

                        # Text frame → JSON control message
                        elif message.get("text"):
                            try:
                                data = json.loads(message["text"])
                            except json.JSONDecodeError:
                                continue

                            msg_type = data.get("type")
                            if msg_type == "end_session":
                                stop_event.set()
                                return
                            elif msg_type == "mute":
                                muted = True
                            elif msg_type == "unmute":
                                muted = False

                except WebSocketDisconnect:
                    stop_event.set()
                except Exception as e:
                    logger.error(
                        f"Interview WS receive_from_client error: {e}")
                    stop_event.set()

            async def receive_from_gemini():
                """Receive responses from Gemini and forward to the WebSocket client."""
                try:
                    async for response in gemini_session.receive():
                        if stop_event.is_set():
                            break

                        timestamp = time.time() - session_start_time

                        # Audio response → forward as binary
                        audio_data = getattr(response, "data", None)
                        if audio_data:
                            try:
                                await websocket.send_bytes(audio_data)
                            except Exception:
                                break

                        # Text response → transcript message + filler word detection
                        server_content = getattr(
                            response, "server_content", None)
                        if server_content:
                            model_turn = getattr(
                                server_content, "model_turn", None)
                            if model_turn:
                                for part in getattr(model_turn, "parts", []):
                                    part_text = getattr(part, "text", None)
                                    if part_text:
                                        await websocket.send_json(
                                            {
                                                "type": "transcript",
                                                "speaker": "ai",
                                                "text": part_text,
                                            }
                                        )
                                        await _save_transcript(session_id, "ai", part_text, timestamp)

                                    inline = getattr(part, "inline_data", None)
                                    if inline and getattr(inline, "data", None):
                                        try:
                                            await websocket.send_bytes(inline.data)
                                        except Exception:
                                            break

                            # Handle interrupted turn signal
                            interrupted = getattr(
                                server_content, "interrupted", False)
                            if interrupted:
                                await websocket.send_json({"type": "interrupted"})

                except Exception as e:
                    logger.error(
                        f"Interview WS receive_from_gemini error: {e}")
                    stop_event.set()

            # Run both coroutines concurrently
            client_task = asyncio.create_task(receive_from_client())
            gemini_task = asyncio.create_task(receive_from_gemini())

            await asyncio.wait(
                [client_task, gemini_task],
                return_when=asyncio.FIRST_COMPLETED,
            )

            # Cleanup
            for task in (client_task, gemini_task):
                if not task.done():
                    task.cancel()
                    try:
                        await task
                    except (asyncio.CancelledError, Exception):
                        pass

        # Session ended — generate report via the sessions router logic
        from routers.sessions import _run_report_generation
        import uuid

        report_id = str(uuid.uuid4())
        asyncio.create_task(
            _run_report_generation(
                session_id=session_id,
                user_id=uid,
                session_config=session_data.get("config", {}),
                report_id=report_id,
            )
        )

        await firestore_service.update_session(
            session_id,
            {"status": "completed", "ended_at": _utc_iso()},
        )

        try:
            await websocket.send_json({"type": "session_ended", "report_id": report_id})
        except Exception:
            pass

    except WebSocketDisconnect:
        logger.info(f"Interview WS disconnected: session={session_id}")
    except Exception as e:
        logger.error(
            f"Interview WS unhandled error for session {session_id}: {e}")
        try:
            await websocket.send_json({"type": "error", "message": "An internal error occurred."})
        except Exception:
            pass
    finally:
        try:
            await websocket.close()
        except Exception:
            pass


# ---------------------------------------------------------------------------
# Presentation WebSocket
# ---------------------------------------------------------------------------


@router.websocket("/presentation/{session_id}")
async def presentation_websocket(
    websocket: WebSocket,
    session_id: str,
    token: Optional[str] = None,
):
    """
    Full-duplex WebSocket for live presentation coaching sessions.

    Client sends JSON text frames:
      {"type": "audio", "data": "<base64 PCM>"}
      {"type": "slide_screenshot", "data": "<base64 JPEG>", "slide_number": int, "time_on_slide_seconds": float}
      {"type": "webcam_frame", "data": "<base64 JPEG>"}
      {"type": "end_session"}
      {"type": "mute"} | {"type": "unmute"}

    Server sends JSON text frames (audio also base64 encoded):
      {"type": "audio", "data": "<base64 PCM>"}
      {"type": "transcript", "speaker": "ai"|"user", "text": str}
      {"type": "feedback", ...}
      {"type": "slide_analysis", ...}
      {"type": "eye_contact_alert", "message": str}
      {"type": "session_ended", "report_id": str}
      {"type": "error", "message": str}
    """
    await websocket.accept()

    # Authenticate
    if not token:
        await websocket.send_json({"type": "error", "message": "Missing authentication token."})
        await websocket.close(code=1008)
        return

    try:
        uid = await verify_websocket_token(token)
    except ValueError:
        await websocket.send_json({"type": "error", "message": "Invalid authentication token."})
        await websocket.close(code=1008)
        return

    # Load session
    session_data = await firestore_service.get_session(session_id)
    if session_data is None:
        await websocket.send_json({"type": "error", "message": "Session not found."})
        await websocket.close(code=1008)
        return
    if session_data.get("user_id") != uid:
        await websocket.send_json({"type": "error", "message": "Access denied."})
        await websocket.close(code=1008)
        return

    session_config = SessionConfig(**session_data["config"])
    live_config = get_presentation_config(session_config)
    client = get_genai_client()

    muted = False
    stop_event = asyncio.Event()
    session_start_time = time.time()

    try:
        async with client.aio.live.connect(model=LIVE_MODEL, config=live_config) as gemini_session:
            await firestore_service.update_session(
                session_id,
                {"status": "live", "started_at": _utc_iso()},
            )
            await websocket.send_json({"type": "session_started", "session_id": session_id})

            # Trigger greeting
            await gemini_session.send(
                input="Begin the presentation coaching session. Greet the presenter.",
                end_of_turn=True,
            )

            async def receive_from_client():
                """Read all client messages and route to Gemini or specialized handlers."""
                nonlocal muted
                try:
                    while not stop_event.is_set():
                        message = await websocket.receive()

                        if message.get("type") == "websocket.disconnect":
                            stop_event.set()
                            break

                        if not message.get("text"):
                            continue

                        try:
                            data = json.loads(message["text"])
                        except json.JSONDecodeError:
                            continue

                        msg_type = data.get("type")
                        timestamp = time.time() - session_start_time

                        if msg_type == "end_session":
                            stop_event.set()
                            return

                        elif msg_type == "mute":
                            muted = True

                        elif msg_type == "unmute":
                            muted = False

                        elif msg_type == "audio" and not muted:
                            try:
                                audio_bytes = base64.b64decode(data["data"])
                                await gemini_session.send(
                                    input=types.LiveClientRealtimeInput(
                                        audio=types.Blob(
                                            mime_type="audio/pcm;rate=16000",
                                            data=audio_bytes,
                                        )
                                    )
                                )
                            except Exception as e:
                                logger.warning(
                                    f"Presentation WS audio send error: {e}")

                        elif msg_type == "slide_screenshot":
                            await _handle_slide_screenshot(
                                websocket=websocket,
                                session_id=session_id,
                                data=data,
                                timestamp=timestamp,
                                gemini_session=gemini_session,
                            )

                        elif msg_type == "webcam_frame":
                            await _handle_webcam_frame(
                                websocket=websocket,
                                session_id=session_id,
                                data=data,
                                timestamp=timestamp,
                            )

                except WebSocketDisconnect:
                    stop_event.set()
                except Exception as e:
                    logger.error(
                        f"Presentation WS receive_from_client error: {e}")
                    stop_event.set()

            async def receive_from_gemini():
                """Receive Gemini responses and forward to the WebSocket client."""
                try:
                    async for response in gemini_session.receive():
                        if stop_event.is_set():
                            break

                        timestamp = time.time() - session_start_time

                        audio_data = getattr(response, "data", None)
                        if audio_data:
                            try:
                                encoded = base64.b64encode(
                                    audio_data).decode("utf-8")
                                await websocket.send_json({"type": "audio", "data": encoded})
                            except Exception:
                                break

                        server_content = getattr(
                            response, "server_content", None)
                        if server_content:
                            model_turn = getattr(
                                server_content, "model_turn", None)
                            if model_turn:
                                for part in getattr(model_turn, "parts", []):
                                    part_text = getattr(part, "text", None)
                                    if part_text:
                                        await websocket.send_json(
                                            {
                                                "type": "transcript",
                                                "speaker": "ai",
                                                "text": part_text,
                                            }
                                        )
                                        await _save_transcript(session_id, "ai", part_text, timestamp)

                                    inline = getattr(part, "inline_data", None)
                                    if inline and getattr(inline, "data", None):
                                        try:
                                            encoded = base64.b64encode(
                                                inline.data).decode("utf-8")
                                            await websocket.send_json({"type": "audio", "data": encoded})
                                        except Exception:
                                            break

                except Exception as e:
                    logger.error(
                        f"Presentation WS receive_from_gemini error: {e}")
                    stop_event.set()

            client_task = asyncio.create_task(receive_from_client())
            gemini_task = asyncio.create_task(receive_from_gemini())

            await asyncio.wait(
                [client_task, gemini_task],
                return_when=asyncio.FIRST_COMPLETED,
            )

            for task in (client_task, gemini_task):
                if not task.done():
                    task.cancel()
                    try:
                        await task
                    except (asyncio.CancelledError, Exception):
                        pass

        # Generate report
        from routers.sessions import _run_report_generation
        import uuid

        report_id = str(uuid.uuid4())
        asyncio.create_task(
            _run_report_generation(
                session_id=session_id,
                user_id=uid,
                session_config=session_data.get("config", {}),
                report_id=report_id,
            )
        )

        await firestore_service.update_session(
            session_id,
            {"status": "completed", "ended_at": _utc_iso()},
        )

        try:
            await websocket.send_json({"type": "session_ended", "report_id": report_id})
        except Exception:
            pass

    except WebSocketDisconnect:
        logger.info(f"Presentation WS disconnected: session={session_id}")
    except Exception as e:
        logger.error(
            f"Presentation WS unhandled error for session {session_id}: {e}")
        try:
            await websocket.send_json({"type": "error", "message": "An internal error occurred."})
        except Exception:
            pass
    finally:
        try:
            await websocket.close()
        except Exception:
            pass


# ---------------------------------------------------------------------------
# Presentation helpers
# ---------------------------------------------------------------------------


async def _handle_slide_screenshot(
    websocket: WebSocket,
    session_id: str,
    data: dict,
    timestamp: float,
    gemini_session,
) -> None:
    """Process a slide screenshot: upload, analyze with Gemini, emit results."""
    try:
        image_bytes = base64.b64decode(data["data"])
        slide_number = int(data.get("slide_number", 1))

        # Upload to GCS
        try:
            await storage_service.upload_slide_screenshot(image_bytes, session_id, slide_number)
        except Exception as e:
            logger.warning(f"Slide screenshot upload failed: {e}")

        # Analyze with Gemini Flash
        slide_report = await analyze_slide(image_bytes, slide_number)

        # Emit slide analysis to client
        await websocket.send_json(
            {
                "type": "slide_analysis",
                "slide_number": slide_number,
                "status": slide_report.status,
                "feedback": slide_report.feedback,
            }
        )

        # Save feedback event to Firestore
        severity = "positive" if slide_report.status == "good" else "warning"
        await _save_feedback(
            session_id=session_id,
            event_type="slide",
            severity=severity,
            message=f"Slide {slide_number}: {slide_report.feedback}",
            timestamp=timestamp,
        )

        # Forward slide context to Gemini for possible verbal comment
        context_msg = (
            f"[Slide {slide_number} analyzed. Status: {slide_report.status}. "
            f"Feedback: {slide_report.feedback}. "
            "If appropriate, give a brief verbal comment on it.]"
        )
        await gemini_session.send(input=context_msg, end_of_turn=False)

    except Exception as e:
        logger.error(f"_handle_slide_screenshot error: {e}")


async def _handle_webcam_frame(
    websocket: WebSocket,
    session_id: str,
    data: dict,
    timestamp: float,
) -> None:
    """
    Analyze a webcam frame for eye contact using Gemini Flash.
    If the speaker is not looking at the camera, emit an alert.
    """
    try:
        from core.gemini import FLASH_MODEL, get_genai_client as _get_client

        image_bytes = base64.b64decode(data["data"])
        genai_client = _get_client()

        prompt = (
            "Look at this webcam frame of a presenter. Is the person looking at the camera "
            "(i.e., maintaining eye contact with their audience)? "
            "Respond with JSON: {\"looking_at_camera\": true|false, \"confidence\": \"high\"|\"medium\"|\"low\"}"
        )

        response = await genai_client.aio.models.generate_content(
            model=FLASH_MODEL,
            contents=[
                types.Part(
                    inline_data=types.Blob(
                        data=image_bytes, mime_type="image/jpeg")
                ),
                types.Part(text=prompt),
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )

        result = json.loads(response.text)
        looking = result.get("looking_at_camera", True)
        confidence = result.get("confidence", "low")

        if not looking and confidence in ("high", "medium"):
            alert_msg = "Maintain eye contact with your audience — they want to connect with you."
            await websocket.send_json({"type": "eye_contact_alert", "message": alert_msg})
            await _save_feedback(
                session_id=session_id,
                event_type="eye_contact",
                severity="warning",
                message=alert_msg,
                timestamp=timestamp,
            )

    except Exception as e:
        logger.warning(f"_handle_webcam_frame error: {e}")


def _utc_iso() -> str:
    """Return the current UTC time as an ISO 8601 string."""
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).isoformat()
