import logging
import firebase_admin
from firebase_admin import credentials, firestore, auth, storage

from core.config import settings

logger = logging.getLogger(__name__)

_firebase_app: firebase_admin.App | None = None
_db = None
_bucket = None


def initialize_firebase() -> firebase_admin.App:
    """Initialize Firebase Admin SDK. Safe to call multiple times."""
    global _firebase_app, _db, _bucket

    if len(firebase_admin._apps) > 0:
        _firebase_app = firebase_admin.get_app()
        _db = firestore.client()
        _bucket = storage.bucket()
        return _firebase_app

    try:
        cred = credentials.Certificate(settings.google_application_credentials)
        _firebase_app = firebase_admin.initialize_app(
            cred,
            {
                "storageBucket": settings.firebase_storage_bucket,
                "projectId": settings.firebase_project_id,
            },
        )
    except ValueError:
        _firebase_app = firebase_admin.get_app()

    _db = firestore.client()
    _bucket = storage.bucket()

    logger.info(
        f"Firebase initialized for project: {settings.firebase_project_id}")
    return _firebase_app


def get_db():
    """Return the Firestore client, initializing Firebase if needed."""
    global _db
    if _db is None:
        initialize_firebase()
    return _db


def get_auth():
    """Return the Firebase Auth module."""
    if len(firebase_admin._apps) == 0:
        initialize_firebase()
    return auth


def get_bucket():
    """Return the Firebase Storage bucket."""
    global _bucket
    if _bucket is None:
        initialize_firebase()
    return _bucket
