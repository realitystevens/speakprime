import asyncio
import logging
import uuid
from datetime import datetime, timezone
from typing import Annotated, List, Optional

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    HTTPException,
    Query,
    UploadFile,
    status,
)

from agents.report_agent import generate_report
from core.dependencies import get_current_user
from models.session import (
    CreateSessionRequest,
    FeedbackEvent,
    Session,
    TranscriptEntry,
    UpdateSessionRequest,
)
from services.firestore import firestore_service
from services.pubsub import pubsub_service
from services.storage import storage_service

logger = logging.getLogger(__name__)
router = APIRouter()

_ALLOWED_SLIDE_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-powerpoint",
}
_MAX_SLIDE_SIZE = 50 * 1024 * 1024  # 50 MB


def _normalize_session(data: dict) -> dict:
    """Ensure datetime fields are ISO strings."""
    for field in ("created_at", "started_at", "ended_at"):
        if hasattr(data.get(field), "isoformat"):
            data[field] = data[field].isoformat()
    return data


async def _run_report_generation(
    session_id: str,
    user_id: str,
    session_config: dict,
    report_id: str,
) -> None:
    """Background task: generate report and save to Firestore."""
    try:
        transcript = await firestore_service.get_session_transcript(session_id)
        feedback_events = await firestore_service.get_session_feedback(session_id)

        report = await generate_report(
            session_id=session_id,
            user_id=user_id,
            transcript=transcript,
            feedback_events=feedback_events,
            session_config=session_config,
        )
        # Override the report id so it matches what we already returned to the client
        report_dict = report.model_dump(mode="json")
        report_dict["id"] = report_id

        await firestore_service.save_report(report_dict)

        # Update session with overall score
        await firestore_service.update_session(
            session_id, {"overall_score": report.scores.overall}
        )

        await pubsub_service.publish_session_event(
            session_id, "report_ready", {"report_id": report_id}
        )
        logger.info(f"Report {report_id} generated for session {session_id}")
    except Exception as e:
        logger.error(
            f"Background report generation failed for session {session_id}: {e}")


# Endpoints

@router.post("", status_code=status.HTTP_201_CREATED, summary="Create a new session")
async def create_session(
    body: CreateSessionRequest,
    uid: Annotated[str, Depends(get_current_user)],
):
    """Create a new coaching session with status='setup'."""
    data = {
        "user_id": uid,
        "name": body.name,
        "mode": body.config.mode.value,
        "config": body.config.model_dump(mode="json"),
        "status": "setup",
        "started_at": None,
        "ended_at": None,
        "duration_seconds": None,
        "overall_score": None,
        "slide_file_url": None,
    }

    try:
        created = await firestore_service.create_session(data)
    except Exception as e:
        logger.error(f"create_session error for uid={uid}: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to create session.")

    return Session(**_normalize_session(created)).model_dump(mode="json")


@router.get("", summary="List sessions for the current user")
async def list_sessions(
    uid: Annotated[str, Depends(get_current_user)],
    mode: Optional[str] = Query(
        default=None, description="Filter by mode: interview or presentation"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    """Return a list of the user's sessions, newest first."""
    try:
        sessions = await firestore_service.get_user_sessions(uid, mode=mode, limit=limit, offset=offset)
    except Exception as e:
        logger.error(f"list_sessions error for uid={uid}: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to fetch sessions.")

    return [Session(**_normalize_session(s)).model_dump(mode="json") for s in sessions]


@router.get("/{session_id}", summary="Get a single session")
async def get_session(
    session_id: str,
):
    """Return a single session by id."""
    session_data = await firestore_service.get_session(session_id)
    if session_data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")
    return Session(**_normalize_session(session_data)).model_dump(mode="json")


@router.put("/{session_id}", summary="Update a session")
async def update_session(
    session_id: str,
    body: UpdateSessionRequest,
):
    """Update mutable fields on a session (name, status)."""
    session_data = await firestore_service.get_session(session_id)
    if session_data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")

    update_fields = body.model_dump(exclude_none=True)
    if not update_fields:
        raise HTTPException(
            status_code=400, detail="No fields provided for update.")

    try:
        updated = await firestore_service.update_session(session_id, update_fields)
    except Exception as e:
        logger.error(f"update_session error for {session_id}: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to update session.")

    return Session(**_normalize_session(updated)).model_dump(mode="json")


@router.delete("/{session_id}", summary="Delete a session")
async def delete_session(
    session_id: str,
):
    """Delete a session along with its transcript, feedback, and GCS files."""
    session_data = await firestore_service.get_session(session_id)
    if session_data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")

    try:
        await firestore_service.delete_session(session_id)
        await storage_service.delete_session_files(session_id)
    except Exception as e:
        logger.error(f"delete_session error for {session_id}: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to delete session.")

    return {"success": True}


@router.post("/{session_id}/upload-slides", summary="Upload slide file for a session")
async def upload_slides(
    session_id: str,
    file: UploadFile = File(...),
):
    """
    Upload a .pptx or .pdf slide file (max 50 MB).
    Returns the GCS file URL.
    """
    session_data = await firestore_service.get_session(session_id)
    if session_data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")

    content_type = file.content_type or ""
    filename = file.filename or "slides.pdf"

    if content_type not in _ALLOWED_SLIDE_TYPES and not (
        filename.lower().endswith(".pdf") or filename.lower().endswith(".pptx")
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF and PPTX files are supported.",
        )

    file_bytes = await file.read()
    if len(file_bytes) > _MAX_SLIDE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum size of 50 MB.",
        )

    try:
        file_url = await storage_service.upload_slide_file(
            file_bytes=file_bytes, filename=filename, session_id=session_id
        )
        await firestore_service.update_session(session_id, {"slide_file_url": file_url})
    except Exception as e:
        logger.error(f"upload_slides error for session {session_id}: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to upload slide file.")

    # Estimate slide count (rudimentary — count pages for PDF, or return 0 for PPTX)
    slide_count = _estimate_slide_count(file_bytes, filename)

    return {"file_url": file_url, "slide_count": slide_count}


@router.post("/{session_id}/end", summary="End a session and trigger report generation")
async def end_session(
    session_id: str,
    background_tasks: BackgroundTasks,
    uid: Annotated[str, Depends(get_current_user)],
):
    """
    Mark the session as completed and kick off background report generation.
    Returns the session_id and the pre-assigned report_id.
    """
    session_data = await firestore_service.get_session(session_id)
    if session_data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")

    now = datetime.now(timezone.utc)
    started_at_raw = session_data.get("started_at")
    duration_seconds: Optional[int] = None

    if started_at_raw:
        if isinstance(started_at_raw, str):
            from dateutil import parser as dtparser  # type: ignore

            started_at = dtparser.parse(started_at_raw)
        else:
            started_at = started_at_raw
        duration_seconds = max(0, int((now - started_at).total_seconds()))

    report_id = str(uuid.uuid4())

    update_fields = {
        "status": "completed",
        "ended_at": now.isoformat(),
    }
    if duration_seconds is not None:
        update_fields["duration_seconds"] = duration_seconds

    try:
        await firestore_service.update_session(session_id, update_fields)
    except Exception as e:
        logger.error(f"end_session update error for {session_id}: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to update session status.")

    background_tasks.add_task(
        _run_report_generation,
        session_id=session_id,
        user_id=uid,
        session_config=session_data.get("config", {}),
        report_id=report_id,
    )

    await pubsub_service.publish_session_event(session_id, "session_ended", {"report_id": report_id})

    return {"session_id": session_id, "report_id": report_id}


@router.get("/{session_id}/transcript", summary="Get the transcript for a session")
async def get_transcript(
    session_id: str,
):
    """Return all transcript entries for a session, ordered by timestamp."""
    session_data = await firestore_service.get_session(session_id)
    if session_data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")

    entries = await firestore_service.get_session_transcript(session_id)
    return [TranscriptEntry(**e).model_dump(mode="json") for e in entries]


@router.get("/{session_id}/feedback", summary="Get feedback events for a session")
async def get_feedback(
    session_id: str,
):
    """Return all feedback events for a session, ordered by timestamp."""
    session_data = await firestore_service.get_session(session_id)
    if session_data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")

    events = await firestore_service.get_session_feedback(session_id)
    return [FeedbackEvent(**e).model_dump(mode="json") for e in events]


@router.get("/{session_id}/report", summary="Get the report for a session")
async def get_session_report(
    session_id: str,
):
    """Return the report for a session. Returns 404 if not yet generated."""
    session_data = await firestore_service.get_session(session_id)
    if session_data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")

    report_data = await firestore_service.get_session_report(session_id)
    if report_data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not yet generated. Please check back shortly.",
        )

    _fix_report_datetimes(report_data)
    from models.report import Report

    return Report(**report_data).model_dump(mode="json")


# Helpers

def _estimate_slide_count(file_bytes: bytes, filename: str) -> int:
    """Estimate the number of slides/pages in an uploaded file."""
    if filename.lower().endswith(".pdf"):
        try:
            # Count PDF pages by searching for /Page occurrences
            count = file_bytes.count(b"/Page")
            return max(1, count // 2)  # rough heuristic
        except Exception:
            return 0
    return 0  # PPTX count requires python-pptx; return 0 as safe default


def _fix_report_datetimes(data: dict) -> None:
    """Convert Firestore Timestamp objects in a report dict to ISO strings."""
    if hasattr(data.get("generated_at"), "isoformat"):
        data["generated_at"] = data["generated_at"].isoformat()
    for event in data.get("feedback_timeline", []):
        if hasattr(event.get("timestamp"), "isoformat"):
            event["timestamp"] = event["timestamp"].isoformat()
