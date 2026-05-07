from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_chief
from app.models import Chief, Drill
from app.schemas.drills import DrillCreate, DrillOut, DrillUpdate

router = APIRouter(prefix="/api/drills", tags=["drills"])


@router.get("")
def list_drills(
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    rows = (
        db.execute(select(Drill).order_by(Drill.scheduled_at.desc(), Drill.id.desc()))
        .scalars()
        .all()
    )
    items = [DrillOut.model_validate(d).model_dump(mode="json") for d in rows]
    return {"data": {"items": items, "total": len(items)}}


@router.post("", status_code=status.HTTP_201_CREATED)
def create_drill(
    payload: DrillCreate,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    drill = Drill(**payload.model_dump(), completed=False)
    db.add(drill)
    db.commit()
    db.refresh(drill)
    return {"data": DrillOut.model_validate(drill).model_dump(mode="json")}


@router.patch("/{drill_id}")
def update_drill(
    drill_id: int,
    payload: DrillUpdate,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    drill = db.get(Drill, drill_id)
    if drill is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="غير موجود")
    data = payload.model_dump(exclude_unset=True)
    if "completed" in data:
        if data["completed"] and not drill.completed:
            drill.completed_at = datetime.now()
        elif data["completed"] is False:
            drill.completed_at = None
    for k, v in data.items():
        setattr(drill, k, v)
    db.commit()
    db.refresh(drill)
    return {"data": DrillOut.model_validate(drill).model_dump(mode="json")}


@router.delete("/{drill_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_drill(
    drill_id: int,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> Response:
    drill = db.get(Drill, drill_id)
    if drill is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="غير موجود")
    db.delete(drill)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
