from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_chief
from app.models import Chief, RollCall
from app.schemas.roll_calls import RollCallOut, RollCallUpsert

router = APIRouter(prefix="/api/roll-calls", tags=["roll-calls"])


def _get_for_date(db: Session, d: date) -> RollCall | None:
    return db.execute(select(RollCall).where(RollCall.date == d)).scalar_one_or_none()


@router.get("/today")
def get_today(
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    today = date.today()
    rc = _get_for_date(db, today)
    if rc is None:
        return {"data": None}
    return {"data": RollCallOut.model_validate(rc).model_dump(mode="json")}


@router.put("/today")
def upsert_today(
    payload: RollCallUpsert,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    today = date.today()
    rc = _get_for_date(db, today)
    if rc is None:
        rc = RollCall(date=today, **payload.model_dump())
        db.add(rc)
    else:
        for field, value in payload.model_dump().items():
            setattr(rc, field, value)
    db.commit()
    db.refresh(rc)
    return {"data": RollCallOut.model_validate(rc).model_dump(mode="json")}
