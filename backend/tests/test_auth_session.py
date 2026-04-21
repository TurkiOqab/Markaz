from datetime import datetime, timedelta

from app.auth.password import hash_password
from app.auth.session import (
    create_session,
    delete_session,
    get_session_chief,
)
from app.db import SessionLocal
from app.models import Chief


def _make_chief() -> int:
    with SessionLocal() as db:
        chief = Chief(username="chief", password_hash=hash_password("pw"))
        db.add(chief)
        db.commit()
        return chief.id


def test_create_and_read_session():
    chief_id = _make_chief()
    with SessionLocal() as db:
        token = create_session(db, chief_id)
        assert isinstance(token, str) and len(token) >= 32
    with SessionLocal() as db:
        chief = get_session_chief(db, token)
        assert chief is not None
        assert chief.id == chief_id


def test_get_session_chief_returns_none_for_unknown_token():
    with SessionLocal() as db:
        assert get_session_chief(db, "nope") is None


def test_get_session_chief_returns_none_for_expired_session():
    chief_id = _make_chief()
    with SessionLocal() as db:
        token = create_session(db, chief_id, expires_at=datetime.utcnow() - timedelta(seconds=1))
    with SessionLocal() as db:
        assert get_session_chief(db, token) is None


def test_delete_session():
    chief_id = _make_chief()
    with SessionLocal() as db:
        token = create_session(db, chief_id)
    with SessionLocal() as db:
        delete_session(db, token)
    with SessionLocal() as db:
        assert get_session_chief(db, token) is None
