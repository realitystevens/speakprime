import logging
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from core.config import settings
from core.firebase import initialize_firebase
from core.gemini import initialize_gemini
from routers import reports, sessions, users, websockets

logging.basicConfig(
    level=logging.INFO if settings.environment == "production" else logging.DEBUG,
    format="%(asctime)s | %(levelname)-8s | %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log every HTTP request with method, path, status code, and duration."""

    async def dispatch(self, request: Request, call_next) -> Response:
        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = (time.perf_counter() - start) * 1000
        logger.info(
            "%s %s → %d  (%.1f ms)",
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
        )
        return response


class DemoSessionMiddleware(BaseHTTPMiddleware):
    """Auto-assign a unique demo_session_id cookie so parallel users are data-isolated."""

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        if not request.cookies.get("demo_session_id"):
            new_id = "demo-" + uuid.uuid4().hex
            response.set_cookie(
                key="demo_session_id",
                value=new_id,
                max_age=86400 * 7,  # 1 week
                httponly=True,
                samesite="lax",
            )
        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle handler."""
    logger.info("Starting Speakprime backend...")

    try:
        initialize_firebase()
        logger.info("Firebase connection verified")
    except Exception as e:
        logger.error("Firebase initialization failed: %s", e)

    try:
        initialize_gemini()
        logger.info("Gemini API key verified")
    except Exception as e:
        logger.error("Gemini initialization failed: %s", e)

    logger.info("Speakprime backend started successfully")
    yield
    logger.info("Speakprime backend shutting down")


app = FastAPI(
    title="Speakprime API",
    version="1.0.0",
    description="AI-powered real-time speech and interview coaching platform",
    lifespan=lifespan,
    docs_url="/docs" if settings.environment != "production" else None,
    redoc_url="/redoc" if settings.environment != "production" else None,
)

# CORS — allow the configured frontend URL plus localhost for development
_allowed_origins = [settings.frontend_url,
                    "http://localhost:3000", "http://127.0.0.1:3000"]

app.add_middleware(CORSMiddleware,
                   allow_origins=_allowed_origins,
                   allow_credentials=True,
                   allow_methods=["*"],
                   allow_headers=["*"],
                   )

app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(DemoSessionMiddleware)


app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
app.include_router(reports.router, tags=["reports"])
app.include_router(websockets.router, prefix="/ws", tags=["websockets"])


@app.get("/", tags=["health"], summary="API root")
async def root():
    return {"message": "Speakprime API", "version": "1.0.0"}


@app.get("/health", tags=["health"], summary="Health check")
async def health():
    return {
        "status": "healthy",
        "project": settings.google_cloud_project,
        "environment": settings.environment,
    }
