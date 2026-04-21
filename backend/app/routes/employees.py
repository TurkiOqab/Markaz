from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_chief
from app.models import Chief, Employee
from app.schemas.common import ListResponse, Shift
from app.schemas.employees import EmployeeSummary

router = APIRouter(prefix="/api/employees", tags=["employees"])


@router.get("")
def list_employees(
    q: str | None = Query(default=None, description="Search by name"),
    team_id: int | None = None,
    shift: Shift | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=200),
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    stmt = select(Employee)
    filters = []
    if q:
        like = f"%{q}%"
        filters.append(or_(Employee.name.like(like), Employee.national_id.like(like)))
    if team_id is not None:
        filters.append(Employee.team_id == team_id)
    if shift is not None:
        filters.append(Employee.shift == shift)
    if filters:
        stmt = stmt.where(*filters)

    total = db.execute(
        select(func.count()).select_from(stmt.subquery())
    ).scalar_one()

    rows = (
        db.execute(
            stmt.order_by(Employee.id).offset((page - 1) * page_size).limit(page_size)
        )
        .scalars()
        .all()
    )

    items = [EmployeeSummary.model_validate(e) for e in rows]
    return {
        "data": ListResponse[EmployeeSummary](
            items=items, total=total, page=page, page_size=page_size
        ).model_dump()
    }
