import logging

from fastapi import Request
from fastapi.websockets import WebSocket

logger = logging.getLogger(__name__)

_COOKIE_NAME = "demo_session_id"
_FALLBACK_ID = "demo-user"


def get_current_user(request: Request) -> str:
    """Return the per-browser demo session ID from cookie, falling back to a shared ID."""
    return request.cookies.get(_COOKIE_NAME) or _FALLBACK_ID


def get_websocket_user(websocket: WebSocket) -> str:
    """Return the per-browser demo session ID from the WebSocket cookie."""
    return websocket.cookies.get(_COOKIE_NAME) or _FALLBACK_ID
