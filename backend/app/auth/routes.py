from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth.lockout import is_locked_out, record_failed_attempt, reset_attempts
from app.auth.password import hash_password, verify_password
from app.auth.session import create_session, delete_session
from app.config import SESSION_COOKIE_NAME, SESSION_DAYS
from app.db import get_db
from app.models import Chief

router = APIRouter()


class Credentials(BaseModel):
    username: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=10, max_length=200)


@router.post("/api/setup", status_code=status.HTTP_201_CREATED)
def setup(payload: Credentials, db: Session = Depends(get_db)) -> dict:
    existing = db.execute(select(func.count()).select_from(Chief)).scalar_one()
    if existing > 0:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="تم الإعداد مسبقاً")
    chief = Chief(username=payload.username, password_hash=hash_password(payload.password))
    db.add(chief)
    db.commit()
    return {"data": {"ok": True}}


@router.post("/api/auth/login")
def login(payload: Credentials, response: Response, db: Session = Depends(get_db)) -> dict:
    if is_locked_out(db, payload.username):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="تم حظر تسجيل الدخول مؤقتاً، حاول لاحقاً",
        )
    chief = db.execute(select(Chief).where(Chief.username == payload.username)).scalar_one_or_none()
    if chief is None or not verify_password(payload.password, chief.password_hash):
        record_failed_attempt(db, payload.username)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="بيانات الدخول غير صحيحة",
        )
    reset_attempts(db, payload.username)
    token = create_session(db, chief.id)
    response.set_cookie(
        SESSION_COOKIE_NAME,
        token,
        httponly=True,
        samesite="lax",
        max_age=SESSION_DAYS * 24 * 60 * 60,
    )
    return {"data": {"ok": True}}


@router.post("/api/auth/logout")
def logout(
    response: Response,
    db: Session = Depends(get_db),
    session_cookie: Annotated[str | None, Cookie(alias=SESSION_COOKIE_NAME)] = None,
) -> dict:
    if session_cookie:
        delete_session(db, session_cookie)
    response.delete_cookie(SESSION_COOKIE_NAME)
    return {"data": {"ok": True}}


@router.get("/api/auth/status")
def auth_status(
    db: Session = Depends(get_db),
    session_cookie: Annotated[str | None, Cookie(alias=SESSION_COOKIE_NAME)] = None,
) -> dict:
    chief_count = db.execute(select(func.count()).select_from(Chief)).scalar_one()
    setup_complete = chief_count > 0

    authenticated = False
    if setup_complete and session_cookie:
        from app.auth.session import get_session_chief

        authenticated = get_session_chief(db, session_cookie) is not None

    return {"data": {"setup_complete": setup_complete, "authenticated": authenticated}}
