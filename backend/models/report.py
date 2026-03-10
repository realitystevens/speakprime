from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

from models.session import FeedbackEvent


class ScoreBreakdown(BaseModel):
    """Numeric scores for each coaching dimension."""

    clarity: int = 0           # 0-100
    confidence: int = 0        # 0-100
    pacing: int = 0            # 0-100
    eye_contact: int = 0       # 0-100
    # 0-100 (inverted — fewer filler words = higher score)
    filler_words: int = 0
    answer_structure: int = 0  # 0-100 (STAR framework quality for interviews)
    overall: int = 0           # 0-100


class FillerWordBreakdown(BaseModel):
    """Count of a specific filler word used during the session."""

    word: str
    count: int


class SlideReport(BaseModel):
    """Analysis result for a single presentation slide."""

    slide_number: int
    thumbnail_url: Optional[str] = None
    status: str = "good"    # "good", "needs_work", "revise"
    feedback: str


class Recommendation(BaseModel):
    """An actionable coaching recommendation from the report."""

    category: str
    tip: str
    priority: str = "medium"  # "high", "medium", "low"


class TranscriptAnnotation(BaseModel):
    """An annotation marking a notable moment in the transcript text."""

    text: str
    annotation_type: str    # "filler_word", "low_confidence", "strong_star"
    start_index: int
    end_index: int


class Report(BaseModel):
    """Full post-session coaching report."""

    id: str
    session_id: str
    user_id: str
    generated_at: datetime
    scores: ScoreBreakdown
    filler_word_breakdown: List[FillerWordBreakdown] = []
    recommendations: List[Recommendation] = []
    annotated_transcript: List[TranscriptAnnotation] = []
    slide_reports: Optional[List[SlideReport]] = None
    feedback_timeline: List[FeedbackEvent] = []
    pdf_url: Optional[str] = None
