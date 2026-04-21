from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.session import get_session_chief
from app.config import SESSION_COOKIE_NAME
from app.db import get_db
from app.models import Chief


def get_current_chief(
    session_cookie: Annotated[str | None, Cookie(alias=SESSION_COOKIE_NAME)] = None,
    db: Session = Depends(get_db),
) -> Chief:
    if session_cookie is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="غير مصرح")
    chief = get_session_chief(db, session_cookie)
    if chief is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="غير مصرح")
    return chief
