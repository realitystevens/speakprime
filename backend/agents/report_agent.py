"""
Report Generation Agent

Uses Gemini Flash to analyze a completed session's transcript and feedback events,
then produces a structured coaching report matching the Report Pydantic model.
This agent runs as a background task after a session ends — not in real time.
"""

import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from google.genai import types

from core.gemini import FLASH_MODEL, get_genai_client
from models.report import (
    FillerWordBreakdown,
    Recommendation,
    Report,
    ScoreBreakdown,
    SlideReport,
    TranscriptAnnotation,
)
from models.session import FeedbackEvent

logger = logging.getLogger(__name__)

_REPORT_SCHEMA_PROMPT = """
You are an expert speech and interview coach analyst for Speakprime.
Analyze the provided session data and generate a detailed coaching report.

Respond with a single valid JSON object matching EXACTLY this schema:

{
  "scores": {
    "clarity": <int 0-100>,
    "confidence": <int 0-100>,
    "pacing": <int 0-100>,
    "eye_contact": <int 0-100>,
    "filler_words": <int 0-100, INVERTED: 100 = zero filler words, 0 = very many>,
    "answer_structure": <int 0-100, quality of STAR structure for interviews>,
    "overall": <int 0-100, weighted average>
  },
  "filler_word_breakdown": [
    {"word": "<filler word>", "count": <int>}
  ],
  "recommendations": [
    {
      "category": "<Clarity|Confidence|Pacing|Eye Contact|Filler Words|Structure|Slide Design>",
      "tip": "<specific actionable coaching tip>",
      "priority": "<high|medium|low>"
    }
  ],
  "annotated_transcript": [
    {
      "text": "<excerpt from transcript>",
      "annotation_type": "<filler_word|low_confidence|strong_star>",
      "start_index": <int>,
      "end_index": <int>
    }
  ],
  "slide_reports": null
}

Rules:
- Generate exactly 3-5 recommendations, specific and actionable.
- Annotate at least 3 notable moments from the transcript.
- filler_word_breakdown must list each unique filler word and its total count.
- slide_reports should be an array if slide data is provided, otherwise null.
- overall score = weighted average: clarity(20%) + confidence(25%) + pacing(15%) + eye_contact(10%) + filler_words(15%) + answer_structure(15%)
"""


async def generate_report(
    session_id: str,
    user_id: str,
    transcript: list[dict],
    feedback_events: list[dict],
    session_config: dict,
) -> Report:
    """
    Generate a full coaching report from session data using Gemini Flash.

    Args:
        session_id: The session's Firestore document id.
        user_id: The uid of the session owner.
        transcript: List of TranscriptEntry dicts ordered by timestamp.
        feedback_events: List of FeedbackEvent dicts ordered by timestamp.
        session_config: The SessionConfig dict.

    Returns:
        A fully populated Report Pydantic model.
    """
    client = get_genai_client()

    # Build a clean transcript string for the prompt
    transcript_text = "\n".join(
        f"[{e.get('timestamp_seconds', 0):.1f}s] {e.get('speaker', 'user').upper()}: {e.get('text', '')}"
        for e in transcript
    )

    # Summarize feedback events
    feedback_summary = "\n".join(
        f"[{e.get('timestamp_seconds', 0):.1f}s] {e.get('severity', 'warning').upper()} - {e.get('message', '')}"
        for e in feedback_events
    )

    # Count filler words from transcript
    filler_words = ["um", "uh", "like", "you know",
                    "basically", "literally", "sort of", "kind of"]
    filler_counts: dict[str, int] = {}
    for entry in transcript:
        if entry.get("speaker") == "user":
            text_lower = entry.get("text", "").lower()
            for fw in filler_words:
                count = text_lower.count(fw)
                if count > 0:
                    filler_counts[fw] = filler_counts.get(fw, 0) + count

    mode = session_config.get("mode", "interview")
    job_role = session_config.get("job_role", "")
    interview_type = session_config.get("interview_type", "")

    user_prompt = (
        f"SESSION MODE: {mode}\n"
        + (f"JOB ROLE: {job_role}\n" if job_role else "")
        + (f"INTERVIEW TYPE: {interview_type}\n" if interview_type else "")
        + f"\n=== TRANSCRIPT ===\n{transcript_text or '(No transcript available)'}\n"
        + f"\n=== FEEDBACK EVENTS ===\n{feedback_summary or '(No feedback events)'}\n"
        + f"\n=== DETECTED FILLER WORDS ===\n{json.dumps(filler_counts)}\n"
        + "\nNow generate the full coaching report JSON as described."
    )

    try:
        response = await client.aio.models.generate_content(
            model=FLASH_MODEL,
            contents=[
                types.Part(text=_REPORT_SCHEMA_PROMPT),
                types.Part(text=user_prompt),
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.3,
            ),
        )

        raw = json.loads(response.text)

        # Parse scores
        scores_data = raw.get("scores", {})
        scores = ScoreBreakdown(
            clarity=_clamp(scores_data.get("clarity", 70)),
            confidence=_clamp(scores_data.get("confidence", 70)),
            pacing=_clamp(scores_data.get("pacing", 70)),
            eye_contact=_clamp(scores_data.get("eye_contact", 70)),
            filler_words=_clamp(scores_data.get("filler_words", 70)),
            answer_structure=_clamp(scores_data.get("answer_structure", 70)),
            overall=_clamp(scores_data.get("overall", 70)),
        )

        # Parse filler word breakdown
        filler_breakdown = [
            FillerWordBreakdown(word=item["word"], count=item["count"])
            for item in raw.get("filler_word_breakdown", [])
            if item.get("word") and isinstance(item.get("count"), int)
        ]

        # Augment with any detected counts not in the AI response
        existing_words = {fb.word for fb in filler_breakdown}
        for word, count in filler_counts.items():
            if word not in existing_words and count > 0:
                filler_breakdown.append(
                    FillerWordBreakdown(word=word, count=count))

        # Parse recommendations
        recommendations = [
            Recommendation(
                category=r.get("category", "General"),
                tip=r.get("tip", ""),
                priority=r.get("priority", "medium"),
            )
            for r in raw.get("recommendations", [])
            if r.get("tip")
        ]

        # Parse annotated transcript entries
        annotated_transcript = [
            TranscriptAnnotation(
                text=a.get("text", ""),
                annotation_type=a.get("annotation_type", "filler_word"),
                start_index=a.get("start_index", 0),
                end_index=a.get("end_index", 0),
            )
            for a in raw.get("annotated_transcript", [])
            if a.get("text")
        ]

        # Parse slide reports if present
        slide_reports = None
        if raw.get("slide_reports"):
            slide_reports = [
                SlideReport(
                    slide_number=s.get("slide_number", 0),
                    thumbnail_url=s.get("thumbnail_url"),
                    status=s.get("status", "good"),
                    feedback=s.get("feedback", ""),
                )
                for s in raw["slide_reports"]
            ]

        # Build feedback timeline from the provided events
        feedback_timeline = [
            FeedbackEvent(
                session_id=session_id,
                timestamp_seconds=e.get("timestamp_seconds", 0),
                type=e.get("type", "general"),
                severity=e.get("severity", "warning"),
                message=e.get("message", ""),
                speaker=e.get("speaker", "user"),
            )
            for e in feedback_events
        ]

        report_id = str(uuid.uuid4())
        report = Report(
            id=report_id,
            session_id=session_id,
            user_id=user_id,
            generated_at=datetime.now(timezone.utc),
            scores=scores,
            filler_word_breakdown=filler_breakdown,
            recommendations=recommendations,
            annotated_transcript=annotated_transcript,
            slide_reports=slide_reports,
            feedback_timeline=feedback_timeline,
        )
        return report

    except Exception as e:
        logger.error(f"generate_report error for session {session_id}: {e}")
        # Return a minimal fallback report so the session is not left reportless
        return Report(
            id=str(uuid.uuid4()),
            session_id=session_id,
            user_id=user_id,
            generated_at=datetime.now(timezone.utc),
            scores=ScoreBreakdown(
                clarity=70,
                confidence=70,
                pacing=70,
                eye_contact=70,
                filler_words=70,
                answer_structure=70,
                overall=70,
            ),
            recommendations=[
                Recommendation(
                    category="General",
                    tip="Complete a full session to receive detailed coaching recommendations.",
                    priority="high",
                )
            ],
        )


def _clamp(value: Any, lo: int = 0, hi: int = 100) -> int:
    """Clamp a value to an integer in [lo, hi]."""
    try:
        return max(lo, min(hi, int(value)))
    except (TypeError, ValueError):
        return 70
