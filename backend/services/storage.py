import asyncio
import datetime
import logging
from typing import Optional

from google.cloud import storage

from core.config import settings

logger = logging.getLogger(__name__)

_GCS_CLIENT: Optional[storage.Client] = None


def _get_gcs_client() -> storage.Client:
    global _GCS_CLIENT
    if _GCS_CLIENT is None:
        _GCS_CLIENT = storage.Client(project=settings.google_cloud_project)
    return _GCS_CLIENT


class StorageService:
    """Service for all Google Cloud Storage operations."""

    def _get_bucket(self) -> storage.Bucket:
        return _get_gcs_client().bucket(settings.gcs_bucket_name)

    def _generate_signed_url(self, blob: storage.Blob, expiration_hours: int = 1) -> str:
        """Generate a signed URL for a GCS blob."""
        return blob.generate_signed_url(
            expiration=datetime.timedelta(hours=expiration_hours),
            method="GET",
        )

    async def upload_slide_file(
        self, file_bytes: bytes, filename: str, session_id: str
    ) -> str:
        """
        Upload a slide file (.pptx or .pdf) for a session.

        Returns the GCS public URL path.
        """

        def _run() -> str:
            bucket = self._get_bucket()
            blob_path = f"sessions/{session_id}/slides/{filename}"
            blob = bucket.blob(blob_path)
            content_type = (
                "application/pdf"
                if filename.lower().endswith(".pdf")
                else "application/vnd.openxmlformats-officedocument.presentationml.presentation"
            )
            blob.upload_from_string(file_bytes, content_type=content_type)
            return f"gs://{settings.gcs_bucket_name}/{blob_path}"

        try:
            return await asyncio.to_thread(_run)
        except Exception as e:
            logger.error(
                f"GCS upload_slide_file error for session {session_id}: {e}")
            raise

    async def upload_slide_screenshot(
        self, image_bytes: bytes, session_id: str, slide_number: int
    ) -> str:
        """
        Upload a JPEG slide screenshot captured during a presentation session.

        Returns the GCS object path.
        """

        def _run() -> str:
            bucket = self._get_bucket()
            blob_path = f"sessions/{session_id}/screenshots/slide_{slide_number:03d}.jpg"
            blob = bucket.blob(blob_path)
            blob.upload_from_string(image_bytes, content_type="image/jpeg")
            return f"gs://{settings.gcs_bucket_name}/{blob_path}"

        try:
            return await asyncio.to_thread(_run)
        except Exception as e:
            logger.error(
                f"GCS upload_slide_screenshot error for session {session_id}, slide {slide_number}: {e}"
            )
            raise

    async def upload_session_recording(
        self, file_bytes: bytes, session_id: str
    ) -> str:
        """Upload a session audio recording. Returns the GCS object path."""

        def _run() -> str:
            bucket = self._get_bucket()
            blob_path = f"sessions/{session_id}/recording.webm"
            blob = bucket.blob(blob_path)
            blob.upload_from_string(file_bytes, content_type="audio/webm")
            return f"gs://{settings.gcs_bucket_name}/{blob_path}"

        try:
            return await asyncio.to_thread(_run)
        except Exception as e:
            logger.error(
                f"GCS upload_session_recording error for session {session_id}: {e}")
            raise

    async def upload_report_pdf(self, pdf_bytes: bytes, report_id: str) -> str:
        """Upload a generated report PDF and return a signed download URL."""

        def _run() -> str:
            bucket = self._get_bucket()
            blob_path = f"reports/{report_id}/report.pdf"
            blob = bucket.blob(blob_path)
            blob.upload_from_string(pdf_bytes, content_type="application/pdf")
            signed_url = self._generate_signed_url(blob, expiration_hours=24)
            return signed_url

        try:
            return await asyncio.to_thread(_run)
        except Exception as e:
            logger.error(
                f"GCS upload_report_pdf error for report {report_id}: {e}")
            raise

    async def get_signed_url(self, blob_path: str, expiration_hours: int = 1) -> str:
        """Generate a signed URL for any GCS object path."""

        def _run() -> str:
            bucket = self._get_bucket()
            blob = bucket.blob(blob_path)
            return self._generate_signed_url(blob, expiration_hours)

        try:
            return await asyncio.to_thread(_run)
        except Exception as e:
            logger.error(f"GCS get_signed_url error for {blob_path}: {e}")
            raise

    async def delete_session_files(self, session_id: str) -> bool:
        """Delete all GCS objects associated with a session."""

        def _run() -> bool:
            bucket = self._get_bucket()
            prefix = f"sessions/{session_id}/"
            blobs = list(bucket.list_blobs(prefix=prefix))
            for blob in blobs:
                blob.delete()
            logger.info(
                f"Deleted {len(blobs)} GCS objects for session {session_id}")
            return True

        try:
            return await asyncio.to_thread(_run)
        except Exception as e:
            logger.error(
                f"GCS delete_session_files error for session {session_id}: {e}")
            raise


# Singleton instance
storage_service = StorageService()
