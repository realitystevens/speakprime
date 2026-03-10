from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class CoachingPreferences(BaseModel):
    """User's coaching preference settings."""

    real_time_voice_feedback: bool = True
    filler_word_alerts: bool = True
    eye_contact_monitoring: bool = True
    slide_analysis: bool = True
    post_session_email: bool = True


class UserProfile(BaseModel):
    """Full user profile stored in Firestore."""

    uid: str
    name: str
    email: str
    avatar_url: Optional[str] = None
    role: str = "both"  # "interviews", "presentations", "both"
    industry: Optional[str] = None
    created_at: datetime
    coaching_preferences: CoachingPreferences = CoachingPreferences()
    ai_persona: str = "balanced"  # "strict", "balanced", "gentle"


class UpdateProfileRequest(BaseModel):
    """Request body for updating a user profile."""

    name: Optional[str] = None
    role: Optional[str] = None
    industry: Optional[str] = None
    coaching_preferences: Optional[CoachingPreferences] = None
    ai_persona: Optional[str] = None
