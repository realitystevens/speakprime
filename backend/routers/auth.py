import logging
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from core.dependencies import get_current_user
from core.firebase import get_auth
from models.user import CoachingPreferences, UserProfile
from services.firestore import firestore_service

logger = logging.getLogger(__name__)
router = APIRouter()


class VerifyTokenRequest(BaseModel):
    id_token: str


class LogoutRequest(BaseModel):
    uid: str


@router.post("/verify-token", summary="Verify Firebase ID token and create user if needed")
async def verify_token(body: VerifyTokenRequest):
    """
    Verify a Firebase ID token.

    If the user does not yet exist in Firestore, their profile is created automatically.
    Returns the uid and UserProfile.
    """
    firebase_auth = get_auth()

    try:
        decoded = firebase_auth.verify_id_token(body.id_token)
    except Exception as e:
        logger.warning(f"verify_token failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired ID token.",
        )

    uid: str = decoded["uid"]

    # Fetch or create user profile
    user_data = await firestore_service.get_user(uid)
    if user_data is None:
        # Extract display info from the decoded token
        name = decoded.get("name") or decoded.get("email", "").split("@")[0]
        email = decoded.get("email", "")
        avatar_url = decoded.get("picture")

        user_data = {
            "uid": uid,
            "name": name,
            "email": email,
            "avatar_url": avatar_url,
            "role": "both",
            "industry": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "coaching_preferences": CoachingPreferences().model_dump(),
            "ai_persona": "balanced",
        }
        await firestore_service.create_user(uid, user_data)
        logger.info(f"Created new user profile for uid={uid}")

    # Normalize datetime fields before parsing into UserProfile
    if isinstance(user_data.get("created_at"), str):
        pass  # already ISO string — Pydantic will parse it
    elif hasattr(user_data.get("created_at"), "isoformat"):
        user_data["created_at"] = user_data["created_at"].isoformat()

    try:
        user_profile = UserProfile(**user_data)
    except Exception as e:
        logger.error(f"UserProfile parse error for uid={uid}: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to parse user profile.")

    return {"uid": uid, "user": user_profile.model_dump(mode="json")}


@router.post("/logout", summary="Revoke Firebase refresh tokens")
async def logout(uid: Annotated[str, Depends(get_current_user)]):
    """Revoke all refresh tokens for the authenticated user."""
    firebase_auth = get_auth()
    try:
        firebase_auth.revoke_refresh_tokens(uid)
        logger.info(f"Revoked refresh tokens for uid={uid}")
    except Exception as e:
        logger.error(f"logout error for uid={uid}: {e}")
        raise HTTPException(status_code=500, detail="Failed to revoke tokens.")
    return {"success": True}


@router.get("/me", summary="Get current authenticated user's profile")
async def get_me(uid: Annotated[str, Depends(get_current_user)]):
    """Return the authenticated user's UserProfile from Firestore."""
    user_data = await firestore_service.get_user(uid)
    if user_data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found.",
        )

    if hasattr(user_data.get("created_at"), "isoformat"):
        user_data["created_at"] = user_data["created_at"].isoformat()

    return UserProfile(**user_data).model_dump(mode="json")
