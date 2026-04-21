from datetime import datetime, timedelta
from secrets import token_urlsafe
from typing import Optional

from sqlalchemy.orm import Session as SA_Session

from app.config import SESSION_DAYS
from app.models import Chief, Session as SessionModel


def create_session(
    db: SA_Session,
    chief_id: int,
    *,
    expires_at: Optional[datetime] = None,
) -> str:
    now = datetime.utcnow()
    if expires_at is None:
        expires_at = now + timedelta(days=SESSION_DAYS)
    token = token_urlsafe(32)
    db.add(SessionModel(id=token, chief_id=chief_id, created_at=now, expires_at=expires_at))
    db.commit()
    return token


def get_session_chief(db: SA_Session, token: str) -> Optional[Chief]:
    row = db.get(SessionModel, token)
    if row is None:
        return None
    if row.expires_at < datetime.utcnow():
        return None
    return row.chief


def delete_session(db: SA_Session, token: str) -> None:
    row = db.get(SessionModel, token)
    if row is not None:
        db.delete(row)
        db.commit()
