import logging
from typing import Annotated

from fastapi import Header, HTTPException, status
from firebase_admin import auth

from core.firebase import get_auth

logger = logging.getLogger(__name__)


async def get_current_user(authorization: Annotated[str | None, Header()] = None) -> str:
    """
    FastAPI dependency that verifies a Firebase ID token from the Authorization header.

    Returns the user's uid string on success.
    Raises HTTP 401 if the token is missing or invalid.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
        )

    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authorization header format. Expected: Bearer <token>",
        )

    id_token = parts[1]

    try:
        firebase_auth = get_auth()
        decoded_token = firebase_auth.verify_id_token(id_token)
        uid: str = decoded_token["uid"]
        return uid
    except auth.RevokedIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked. Please re-authenticate.",
        )
    except auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please re-authenticate.",
        )
    except auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid ID token.",
        )
    except Exception as e:
        logger.error(f"Token verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
        )


async def verify_websocket_token(token: str) -> str:
    """
    Verify a Firebase ID token for WebSocket connections (passed as query param).

    Returns the uid string on success.
    Raises ValueError if token is invalid.
    """
    try:
        firebase_auth = get_auth()
        decoded_token = firebase_auth.verify_id_token(token)
        return decoded_token["uid"]
    except Exception as e:
        logger.error(f"WebSocket token verification error: {e}")
        raise ValueError(f"Invalid token: {e}")
