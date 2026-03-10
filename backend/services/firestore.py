import asyncio
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from core.firebase import get_db

logger = logging.getLogger(__name__)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class FirestoreService:
    """Service class encapsulating all Firestore database operations."""

    # USERS
    async def create_user(self, uid: str, data: dict) -> dict:
        """Create a new user document in the users collection."""

        def _run():
            db = get_db()
            doc_ref = db.collection("users").document(uid)
            doc_ref.set(data)
            return data

        try:
            return await asyncio.to_thread(_run)
        except Exception as e:
            logger.error(f"Firestore create_user error for uid={uid}: {e}")
            raise

    async def get_user(self, uid: str) -> Optional[dict]:
        """Retrieve a user document by uid. Returns None if not found."""

        def _run():
            db = get_db()
            doc = db.collection("users").document(uid).get()
            return doc.to_dict() if doc.exists else None

        try:
            return await asyncio.to_thread(_run)
        except Exception as e:
            logger.error(f"Firestore get_user error for uid={uid}: {e}")
            raise

    async def update_user(self, uid: str, data: dict) -> dict:
        """Update fields on a user document. Returns the merged data."""

        def _run():
            db = get_db()
            doc_ref = db.collection("users").document(uid)
            doc_ref.update(data)
            updated = doc_ref.get()
            return updated.to_dict()

        try:
            return await asyncio.to_thread(_run)
        except Exception as e:
            logger.error(f"Firestore update_user error for uid={uid}: {e}")
            raise

    async def delete_user(self, uid: str) -> bool:
        """Delete a user document. Returns True on success."""

        def _run():
            db = get_db()
            db.collection("users").document(uid).delete()
            return True

        try:
            return await asyncio.to_thread(_run)
        except Exception as e:
            logger.error(f"Firestore delete_user error for uid={uid}: {e}")
            raise

    # SESSIONS
    async def create_session(self, data: dict) -> dict:
        """Create a new session document and return it with its generated id."""

        def _run():
            db = get_db()
            doc_ref = db.collection("sessions").document()
            session_id = doc_ref.id
            data["id"] = session_id
            data["created_at"] = _now_iso()
            doc_ref.set(data)
            return data

        try:
            return await asyncio.to_thread(_run)
        except Exception as e:
            logger.error(f"Firestore create_session error: {e}")
            raise

    async def get_session(self, session_id: str) -> Optional[dict]:
        """Retrieve a session document by id."""

        def _run():
            db = get_db()
            doc = db.collection("sessions").document(session_id).get()
            return doc.to_dict() if doc.exists else None

        try:
            return await asyncio.to_thread(_run)
        except Exception as e:
            logger.error(f"Firestore get_session error for {session_id}: {e}")
            raise

    async def get_user_sessions(
        self, uid: str, mode: Optional[str] = None, limit: int = 20, offset: int = 0
    ) -> list[dict]:
        """Retrieve sessions for a user, ordered by created_at descending."""

        def _run():
            db = get_db()
            query = (
                db.collection("sessions")
                .where("user_id", "==", uid)
                .order_by("created_at", direction="DESCENDING")
            )
            if mode:
                query = query.where("mode", "==", mode)
            docs = query.stream()
            results = [doc.to_dict() for doc in docs]
            return results[offset: offset + limit]

        try:
            return await asyncio.to_thread(_run)
        except Exception as e:
            logger.error(
                f"Firestore get_user_sessions error for uid={uid}: {e}")
            raise

    async def update_session(self, session_id: str, data: dict) -> dict:
        """Update fields on a session document."""

        def _run():
            db = get_db()
            doc_ref = db.collection("sessions").document(session_id)
            doc_ref.update(data)
            updated = doc_ref.get()
            return updated.to_dict()

        try:
            return await asyncio.to_thread(_run)
        except Exception as e:
            logger.error(
                f"Firestore update_session error for {session_id}: {e}")
            raise

    async def delete_session(self, session_id: str) -> bool:
        """Delete a session document and all its subcollections."""

        def _run():
            db = get_db()
            # Delete transcript and feedback subcollections
            for sub in ("transcript", "feedback"):
                sub_docs = db.collection("sessions").document(
                    session_id).collection(sub).stream()
                for doc in sub_docs:
                    doc.reference.delete()
            db.collection("sessions").document(session_id).delete()
            return True

        try:
            return await asyncio.to_thread(_run)
        except Exception as e:
            logger.error(
                f"Firestore delete_session error for {session_id}: {e}")
            raise

    async def save_transcript_entry(self, entry: dict) -> dict:
        """Save a transcript entry to the session's transcript subcollection."""

        def _run():
            db = get_db()
            session_id = entry["session_id"]
            doc_ref = (
                db.collection("sessions")
                .document(session_id)
                .collection("transcript")
                .document()
            )
            entry["id"] = doc_ref.id
            doc_ref.set(entry)
            return entry

        try:
            return await asyncio.to_thread(_run)
        except Exception as e:
            logger.error(f"Firestore save_transcript_entry error: {e}")
            raise

    async def save_feedback_event(self, event: dict) -> dict:
        """Save a feedback event to the session's feedback subcollection."""

        def _run():
            db = get_db()
            session_id = event["session_id"]
            doc_ref = (
                db.collection("sessions")
                .document(session_id)
                .collection("feedback")
                .document()
            )
            event["id"] = doc_ref.id
            doc_ref.set(event)
            return event

        try:
            return await asyncio.to_thread(_run)
        except Exception as e:
            logger.error(f"Firestore save_feedback_event error: {e}")
            raise

    async def get_session_transcript(self, session_id: str) -> list[dict]:
        """Retrieve the full ordered transcript for a session."""

        def _run():
            db = get_db()
            docs = (
                db.collection("sessions")
                .document(session_id)
                .collection("transcript")
                .order_by("timestamp_seconds")
                .stream()
            )
            return [doc.to_dict() for doc in docs]

        try:
            return await asyncio.to_thread(_run)
        except Exception as e:
            logger.error(
                f"Firestore get_session_transcript error for {session_id}: {e}")
            raise

    async def get_session_feedback(self, session_id: str) -> list[dict]:
        """Retrieve all feedback events for a session."""

        def _run():
            db = get_db()
            docs = (
                db.collection("sessions")
                .document(session_id)
                .collection("feedback")
                .order_by("timestamp_seconds")
                .stream()
            )
            return [doc.to_dict() for doc in docs]

        try:
            return await asyncio.to_thread(_run)
        except Exception as e:
            logger.error(
                f"Firestore get_session_feedback error for {session_id}: {e}")
            raise

    # REPORTS
    async def save_report(self, data: dict) -> dict:
        """Save or overwrite a report document."""

        def _run():
            db = get_db()
            report_id = data.get("id") or str(uuid.uuid4())
            data["id"] = report_id
            db.collection("reports").document(report_id).set(data)
            return data

        try:
            return await asyncio.to_thread(_run)
        except Exception as e:
            logger.error(f"Firestore save_report error: {e}")
            raise

    async def get_report(self, report_id: str) -> Optional[dict]:
        """Retrieve a report document by id."""

        def _run():
            db = get_db()
            doc = db.collection("reports").document(report_id).get()
            return doc.to_dict() if doc.exists else None

        try:
            return await asyncio.to_thread(_run)
        except Exception as e:
            logger.error(f"Firestore get_report error for {report_id}: {e}")
            raise

    async def get_session_report(self, session_id: str) -> Optional[dict]:
        """Retrieve the report associated with a session."""

        def _run():
            db = get_db()
            docs = (
                db.collection("reports")
                .where("session_id", "==", session_id)
                .limit(1)
                .stream()
            )
            for doc in docs:
                return doc.to_dict()
            return None

        try:
            return await asyncio.to_thread(_run)
        except Exception as e:
            logger.error(
                f"Firestore get_session_report error for {session_id}: {e}")
            raise

    # STATS (dashboard)
    async def get_user_stats(self, uid: str) -> dict:
        """
        Compute and return dashboard stats for a user.

        Returns:
            total_sessions, avg_confidence_score, last_session_filler_words,
            improvement_rate, sessions_this_month, confidence_over_time
        """

        def _run():
            db = get_db()
            sessions_docs = list(
                db.collection("sessions")
                .where("user_id", "==", uid)
                .where("status", "==", "completed")
                .order_by("created_at", direction="DESCENDING")
                .stream()
            )
            sessions = [doc.to_dict() for doc in sessions_docs]

            total_sessions = len(sessions)

            confidence_scores = [
                s["overall_score"]
                for s in sessions
                if s.get("overall_score") is not None
            ]
            avg_confidence_score = (
                round(sum(confidence_scores) / len(confidence_scores), 1)
                if confidence_scores
                else 0.0
            )

            # Last session filler words from the latest report
            last_session_filler_words = 0
            if sessions:
                latest_session_id = sessions[0]["id"]
                report_docs = list(
                    db.collection("reports")
                    .where("session_id", "==", latest_session_id)
                    .limit(1)
                    .stream()
                )
                if report_docs:
                    report = report_docs[0].to_dict()
                    breakdown = report.get("filler_word_breakdown", [])
                    last_session_filler_words = sum(
                        item.get("count", 0) for item in breakdown
                    )

            # Improvement rate: difference between first and last overall score
            improvement_rate = 0.0
            if len(confidence_scores) >= 2:
                improvement_rate = round(
                    confidence_scores[0] - confidence_scores[-1], 1)

            # Sessions this calendar month
            from datetime import datetime, timezone

            now = datetime.now(timezone.utc)
            sessions_this_month = sum(
                1
                for s in sessions
                if s.get("created_at", "")[:7] == now.strftime("%Y-%m")
            )

            # Confidence over time (most recent 10)
            confidence_over_time = []
            for i, s in enumerate(reversed(sessions[:10])):
                if s.get("overall_score") is not None:
                    confidence_over_time.append(
                        {
                            "session_number": i + 1,
                            "score": s["overall_score"],
                            "date": s.get("created_at", "")[:10],
                        }
                    )

            return {
                "total_sessions": total_sessions,
                "avg_confidence_score": avg_confidence_score,
                "last_session_filler_words": last_session_filler_words,
                "improvement_rate": improvement_rate,
                "sessions_this_month": sessions_this_month,
                "confidence_over_time": confidence_over_time,
            }

        try:
            return await asyncio.to_thread(_run)
        except Exception as e:
            logger.error(f"Firestore get_user_stats error for uid={uid}: {e}")
            raise

    async def delete_all_user_data(self, uid: str) -> bool:
        """Delete all sessions, reports, and the user document for a given uid."""

        def _run():
            db = get_db()

            # Delete all sessions (and their subcollections)
            session_docs = list(
                db.collection("sessions").where("user_id", "==", uid).stream()
            )
            for session_doc in session_docs:
                session_id = session_doc.id
                for sub in ("transcript", "feedback"):
                    sub_docs = (
                        db.collection("sessions")
                        .document(session_id)
                        .collection(sub)
                        .stream()
                    )
                    for sub_doc in sub_docs:
                        sub_doc.reference.delete()
                session_doc.reference.delete()

            # Delete all reports
            report_docs = list(
                db.collection("reports").where("user_id", "==", uid).stream()
            )
            for report_doc in report_docs:
                report_doc.reference.delete()

            # Delete user document
            db.collection("users").document(uid).delete()
            return True

        try:
            return await asyncio.to_thread(_run)
        except Exception as e:
            logger.error(
                f"Firestore delete_all_user_data error for uid={uid}: {e}")
            raise


# Singleton instance
firestore_service = FirestoreService()
