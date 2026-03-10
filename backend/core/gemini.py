import logging
from google import genai

from core.config import settings

logger = logging.getLogger(__name__)

# Model name constants
LIVE_MODEL = "gemini-2.0-flash-live-001"
FLASH_MODEL = "gemini-2.0-flash"
PRO_MODEL = "gemini-2.0-pro"

_genai_client: genai.Client | None = None


def initialize_gemini() -> genai.Client:
    """Initialize Google GenAI client. Safe to call multiple times."""
    global _genai_client

    if _genai_client is not None:
        return _genai_client

    if not settings.google_api_key:
        raise ValueError("GOOGLE_API_KEY is not set in environment variables")

    _genai_client = genai.Client(api_key=settings.google_api_key)
    logger.info("Google GenAI client initialized")
    return _genai_client


def get_genai_client() -> genai.Client:
    """Return the GenAI client, initializing it if needed."""
    global _genai_client
    if _genai_client is None:
        initialize_gemini()
    return _genai_client
