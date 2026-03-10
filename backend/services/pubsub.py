import asyncio
import json
import logging
from typing import Optional

from core.config import settings

logger = logging.getLogger(__name__)

_publisher = None
_feedback_topic_path: Optional[str] = None
_sessions_topic_path: Optional[str] = None


def _get_publisher():
    global _publisher, _feedback_topic_path, _sessions_topic_path
    if _publisher is None:
        try:
            from google.cloud import pubsub_v1

            _publisher = pubsub_v1.PublisherClient()
            _feedback_topic_path = _publisher.topic_path(
                settings.google_cloud_project, settings.pubsub_topic_feedback
            )
            _sessions_topic_path = _publisher.topic_path(
                settings.google_cloud_project, settings.pubsub_topic_sessions
            )
        except Exception as e:
            logger.warning(
                f"Pub/Sub publisher initialization failed: {e}. Events will be logged only.")
            _publisher = None
    return _publisher


class PubSubService:
    """Service for publishing events to Google Cloud Pub/Sub."""

    async def publish_feedback_event(self, session_id: str, event: dict) -> Optional[str]:
        """
        Publish a feedback event to the feedback topic.

        Returns the message id on success, or None if Pub/Sub is unavailable.
        """

        def _run() -> Optional[str]:
            publisher = _get_publisher()
            if publisher is None:
                logger.debug(
                    f"Pub/Sub unavailable — feedback event logged: {event}")
                return None
            data = json.dumps(
                {"session_id": session_id, "event": event}).encode("utf-8")
            future = publisher.publish(_feedback_topic_path, data)
            message_id = future.result(timeout=10)
            return message_id

        try:
            return await asyncio.to_thread(_run)
        except Exception as e:
            logger.error(f"PubSub publish_feedback_event error: {e}")
            return None

    async def publish_session_event(self, session_id: str, event_type: str, payload: dict) -> Optional[str]:
        """
        Publish a session lifecycle event (started, ended, report_ready) to the sessions topic.

        Returns the message id on success, or None if Pub/Sub is unavailable.
        """

        def _run() -> Optional[str]:
            publisher = _get_publisher()
            if publisher is None:
                logger.debug(
                    f"Pub/Sub unavailable — session event logged: {event_type}")
                return None
            data = json.dumps(
                {"session_id": session_id, "event_type": event_type, "payload": payload}
            ).encode("utf-8")
            future = publisher.publish(_sessions_topic_path, data)
            message_id = future.result(timeout=10)
            return message_id

        try:
            return await asyncio.to_thread(_run)
        except Exception as e:
            logger.error(f"PubSub publish_session_event error: {e}")
            return None


# Singleton instance
pubsub_service = PubSubService()
