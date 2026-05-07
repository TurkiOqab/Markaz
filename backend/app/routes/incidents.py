import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_chief
from app.models import Chief, Incident
from app.schemas.common import IncidentSeverity, ListResponse
from app.schemas.incidents import (
    IncidentCreate,
    IncidentOut,
    IncidentUpdate,
)

router = APIRouter(prefix="/api/incidents", tags=["incidents"])


def _encode_details(value: Any) -> str | None:
    if value is None:
        return None
    return json.dumps(value, ensure_ascii=False)


@router.get("")
def list_incidents(
    type: str | None = None,
    severity: IncidentSeverity | None = None,
    status_filter: str | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=200),
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    stmt = select(Incident)
    if type is not None:
        stmt = stmt.where(Incident.type == type)
    if severity is not None:
        stmt = stmt.where(Incident.severity == severity)
    if status_filter is not None:
        stmt = stmt.where(Incident.status == status_filter)

    total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar_one()

    rows = (
        db.execute(
            stmt.order_by(Incident.occurred_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        .scalars()
        .all()
    )

    items = [IncidentOut.model_validate(i) for i in rows]
    return {
        "data": ListResponse[IncidentOut](
            items=items, total=total, page=page, page_size=page_size
        ).model_dump(mode="json")
    }


@router.get("/{incident_id}")
def get_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    inc = db.get(Incident, incident_id)
    if inc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الحادث غير موجود")
    return {"data": IncidentOut.model_validate(inc).model_dump(mode="json")}


@router.post("", status_code=status.HTTP_201_CREATED)
def create_incident(
    payload: IncidentCreate,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    data = payload.model_dump()
    data["details"] = _encode_details(data.get("details"))
    inc = Incident(**data)
    db.add(inc)
    db.commit()
    db.refresh(inc)
    return {"data": IncidentOut.model_validate(inc).model_dump(mode="json")}


@router.patch("/{incident_id}")
def update_incident(
    incident_id: int,
    payload: IncidentUpdate,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    inc = db.get(Incident, incident_id)
    if inc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الحادث غير موجود")
    data = payload.model_dump(exclude_unset=True)
    if "details" in data:
        data["details"] = _encode_details(data["details"])
    for field, value in data.items():
        setattr(inc, field, value)
    db.commit()
    db.refresh(inc)
    return {"data": IncidentOut.model_validate(inc).model_dump(mode="json")}


@router.delete("/{incident_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> Response:
    inc = db.get(Incident, incident_id)
    if inc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الحادث غير موجود")
    db.delete(inc)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
