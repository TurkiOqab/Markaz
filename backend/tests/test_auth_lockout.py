from datetime import datetime, timedelta

from app.auth.lockout import is_locked_out, record_failed_attempt, reset_attempts
from app.db import SessionLocal


def test_not_locked_out_initially():
    with SessionLocal() as db:
        assert is_locked_out(db, "chief") is False


def test_locked_out_after_five_failed_attempts():
    with SessionLocal() as db:
        for _ in range(5):
            record_failed_attempt(db, "chief")
        assert is_locked_out(db, "chief") is True


def test_old_attempts_do_not_count():
    with SessionLocal() as db:
        old = datetime.utcnow() - timedelta(minutes=30)
        for _ in range(5):
            record_failed_attempt(db, "chief", at=old)
        assert is_locked_out(db, "chief") is False


def test_reset_attempts_clears_lockout():
    with SessionLocal() as db:
        for _ in range(5):
            record_failed_attempt(db, "chief")
        reset_attempts(db, "chief")
        assert is_locked_out(db, "chief") is False
