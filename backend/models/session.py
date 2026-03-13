from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel


class SessionMode(str, Enum):
    INTERVIEW = "interview"
    PRESENTATION = "presentation"


class InterviewType(str, Enum):
    BEHAVIORAL = "behavioral"
    TECHNICAL = "technical"
    CASE_STUDY = "case_study"
    MIXED = "mixed"
    OTHER = "other"


class SessionConfig(BaseModel):
    """Configuration for a coaching session."""

    mode: SessionMode

    # Interview-specific fields
    interview_type: Optional[InterviewType] = None
    job_role: Optional[str] = None
    difficulty: Optional[str] = None  # "easy", "medium", "hard"
    interview_goal: Optional[str] = None
    company_name: Optional[str] = None
    company_link: Optional[str] = None
    job_posting_link: Optional[str] = None
    interview_context: Optional[str] = None
    interviewer_persona: Optional[str] = None
    resume_highlights: Optional[str] = None
    must_cover_topics: List[str] = []

    # Shared fields
    duration_minutes: int = 30
    focus_areas: List[str] = []

    # Presentation-specific fields
    presentation_topic: Optional[str] = None
    audience_type: Optional[str] = None


class Session(BaseModel):
    """A coaching session document."""

    id: str
    user_id: str
    name: str
    mode: SessionMode
    config: SessionConfig
    status: str = "setup"  # "setup", "live", "completed", "error"
    created_at: datetime
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    overall_score: Optional[int] = None
    slide_file_url: Optional[str] = None


class CreateSessionRequest(BaseModel):
    """Request body for creating a new session."""

    name: str
    config: SessionConfig


class UpdateSessionRequest(BaseModel):
    """Request body for updating a session."""

    name: Optional[str] = None
    status: Optional[str] = None


class FeedbackEvent(BaseModel):
    """A real-time feedback event emitted during a session."""

    session_id: str
    timestamp_seconds: float
    type: str       # "filler_word", "pacing", "eye_contact", "confidence", "slide"
    severity: str   # "positive", "warning", "critical"
    message: str
    speaker: str = "user"  # "ai" or "user"


class TranscriptEntry(BaseModel):
    """A single turn in the session transcript."""

    session_id: str
    timestamp_seconds: float
    speaker: str    # "ai" or "user"
    text: str
    is_filler_word: bool = False
