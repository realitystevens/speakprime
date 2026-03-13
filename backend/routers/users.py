import logging
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from core.dependencies import get_current_user
from models.user import UpdateProfileRequest, UserProfile
from services.firestore import firestore_service
from services.storage import storage_service

logger = logging.getLogger(__name__)
router = APIRouter()


def _normalize_user(user_data: dict) -> dict:
    """Ensure datetime fields are ISO strings for Pydantic parsing."""
    if hasattr(user_data.get("created_at"), "isoformat"):
        user_data["created_at"] = user_data["created_at"].isoformat()
    return user_data


@router.get("/me", summary="Get full user profile")
async def get_my_profile(uid: Annotated[str, Depends(get_current_user)]):
    """Return the demo user's full profile from Firestore, creating it on first visit."""
    user_data = await firestore_service.get_user(uid)
    if user_data is None:
        default_profile = {
            "uid": uid,
            "name": "Demo User",
            "email": "",
            "avatar_url": None,
            "role": "both",
            "industry": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "coaching_preferences": {
                "real_time_voice_feedback": True,
                "filler_word_alerts": True,
                "eye_contact_monitoring": True,
                "slide_analysis": True,
                "post_session_email": True,
            },
            "ai_persona": "balanced",
        }
        await firestore_service.create_user(uid, default_profile)
        user_data = default_profile
        logger.info(f"Auto-created profile for new demo user uid={uid}")
    return UserProfile(**_normalize_user(user_data)).model_dump(mode="json")


@router.put("/me", summary="Update user profile")
async def update_my_profile(
    body: UpdateProfileRequest,
    uid: Annotated[str, Depends(get_current_user)],
):
    """Update the demo user's profile fields."""
    update_fields = body.model_dump(exclude_none=True)

    if "coaching_preferences" in update_fields and isinstance(
        update_fields["coaching_preferences"], dict
    ):
        pass  # already a dict, Firestore accepts it directly

    if not update_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields provided for update.",
        )

    try:
        updated = await firestore_service.update_user(uid, update_fields)
    except Exception as e:
        logger.error(f"update_my_profile error for uid={uid}: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to update profile.")

    return UserProfile(**_normalize_user(updated)).model_dump(mode="json")


@router.get("/me/stats", summary="Get dashboard stats for the current user")
async def get_my_stats(uid: Annotated[str, Depends(get_current_user)]):
    """
    Return aggregated stats for the user's dashboard:
    total_sessions, avg_confidence_score, last_session_filler_words,
    improvement_rate, sessions_this_month, confidence_over_time.
    """
    try:
        stats = await firestore_service.get_user_stats(uid)
    except Exception as e:
        logger.error(f"get_my_stats error for uid={uid}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch stats.")
    return stats


@router.delete("/me", summary="Delete user account and all associated data")
async def delete_my_account(uid: Annotated[str, Depends(get_current_user)]):
    """
    Permanently delete the demo user's account, all sessions,
    reports, and GCS files.
    """
    try:
        # Delete all GCS session files
        sessions = await firestore_service.get_user_sessions(uid, limit=1000)
        for session in sessions:
            try:
                await storage_service.delete_session_files(session["id"])
            except Exception:
                pass  # GCS delete failure should not block account deletion

        # Delete Firestore data
        await firestore_service.delete_all_user_data(uid)

        logger.info(f"Account deleted for uid={uid}")
    except Exception as e:
        logger.error(f"delete_my_account error for uid={uid}: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to delete account.")

    return {"success": True}
