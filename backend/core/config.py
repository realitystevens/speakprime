from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Google Cloud
    google_cloud_project: str = Field(
        default="canvas-syntax-489713-b2", alias="GOOGLE_CLOUD_PROJECT")
    google_application_credentials: str = Field(
        default="./service-account.json", alias="GOOGLE_APPLICATION_CREDENTIALS")
    google_cloud_region: str = Field(
        default="us-central1", alias="GOOGLE_CLOUD_REGION")

    # Gemini
    google_api_key: str = Field(default="", alias="GOOGLE_API_KEY")
    gemini_live_model: str = Field(
        default="gemini-2.5-flash-native-audio-preview-12-2025", alias="GEMINI_LIVE_MODEL")

    # Firebase
    firebase_project_id: str = Field(
        default="canvas-syntax-489713-b2", alias="FIREBASE_PROJECT_ID")
    firebase_storage_bucket: str = Field(
        default="canvas-syntax-489713-b2.appspot.com", alias="FIREBASE_STORAGE_BUCKET")

    # App
    environment: str = Field(default="development", alias="ENVIRONMENT")
    frontend_url: str = Field(
        default="http://localhost:3000", alias="FRONTEND_URL")
    backend_url: str = Field(
        default="http://localhost:8000", alias="BACKEND_URL")

    # Cloud Storage
    gcs_bucket_name: str = Field(
        default="speakprime-sessions", alias="GCS_BUCKET_NAME")

    # Pub/Sub
    pubsub_topic_feedback: str = Field(
        default="speakprime-feedback", alias="PUBSUB_TOPIC_FEEDBACK")
    pubsub_topic_sessions: str = Field(
        default="speakprime-sessions", alias="PUBSUB_TOPIC_SESSIONS")

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
        "populate_by_name": True,
    }


settings = Settings()
