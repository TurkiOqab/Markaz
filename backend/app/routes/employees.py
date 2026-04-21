from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Query,
    Response,
    UploadFile,
    status,
)
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_chief
from app.models import Chief, Employee, Vehicle
from app.schemas.common import ListResponse, Shift
from app.schemas.employees import (
    EmployeeCreate,
    EmployeeRead,
    EmployeeSummary,
    EmployeeUpdate,
)
from app.services.uploads import save_employee_photo

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

    total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar_one()

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


@router.get("/{employee_id}")
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    emp = db.get(Employee, employee_id)
    if emp is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الموظف غير موجود")
    return {"data": EmployeeRead.model_validate(emp).model_dump(mode="json")}


@router.post("", status_code=status.HTTP_201_CREATED)
def create_employee(
    payload: EmployeeCreate,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    emp = Employee(**payload.model_dump())
    db.add(emp)
    try:
        db.commit()
    except IntegrityError as err:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="الرقم الوطني مستخدم مسبقاً",
        ) from err
    db.refresh(emp)
    return {"data": EmployeeRead.model_validate(emp).model_dump(mode="json")}


@router.patch("/{employee_id}")
def update_employee(
    employee_id: int,
    payload: EmployeeUpdate,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    emp = db.get(Employee, employee_id)
    if emp is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الموظف غير موجود")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(emp, field, value)
    try:
        db.commit()
    except IntegrityError as err:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="الرقم الوطني مستخدم مسبقاً",
        ) from err
    db.refresh(emp)
    return {"data": EmployeeRead.model_validate(emp).model_dump(mode="json")}


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> Response:
    emp = db.get(Employee, employee_id)
    if emp is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الموظف غير موجود")
    driven = (
        db.execute(select(Vehicle).where(Vehicle.driver_id == employee_id))
        .scalars()
        .first()
    )
    if driven is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="لا يمكن حذف الموظف لأنه سائق لمركبة، أعد تعيين السائق أولاً",
        )
    db.delete(emp)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{employee_id}/photo")
def upload_photo(
    employee_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    emp = db.get(Employee, employee_id)
    if emp is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الموظف غير موجود")
    emp.photo_path = save_employee_photo(employee_id, file)
    db.commit()
    db.refresh(emp)
    return {"data": EmployeeRead.model_validate(emp).model_dump(mode="json")}
