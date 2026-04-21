from datetime import datetime, timedelta

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.config import LOCKOUT_WINDOW_MINUTES, MAX_FAILED_ATTEMPTS
from app.models import FailedLoginAttempt


def record_failed_attempt(
    db: Session,
    username: str,
    *,
    at: datetime | None = None,
    ip_address: str | None = None,
) -> None:
    attempted_at = at or datetime.utcnow()
    db.add(FailedLoginAttempt(username=username, attempted_at=attempted_at, ip_address=ip_address))
    db.commit()


def is_locked_out(db: Session, username: str) -> bool:
    cutoff = datetime.utcnow() - timedelta(minutes=LOCKOUT_WINDOW_MINUTES)
    stmt = select(FailedLoginAttempt).where(
        FailedLoginAttempt.username == username,
        FailedLoginAttempt.attempted_at >= cutoff,
    )
    count = len(db.execute(stmt).scalars().all())
    return count >= MAX_FAILED_ATTEMPTS


def reset_attempts(db: Session, username: str) -> None:
    db.execute(delete(FailedLoginAttempt).where(FailedLoginAttempt.username == username))
    db.commit()
