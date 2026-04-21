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
from app.models import (
    Certification,
    Chief,
    Employee,
    Equipment,
    MonthlyRating,
    Vehicle,
)
from app.schemas.common import ListResponse, Shift
from app.schemas.employees import (
    CertificationCreate,
    CertificationOut,
    CertificationUpdate,
    EmployeeCreate,
    EmployeeRead,
    EmployeeSummary,
    EmployeeUpdate,
    EquipmentCreate,
    EquipmentOut,
    EquipmentUpdate,
    MonthlyRatingCreate,
    MonthlyRatingOut,
    MonthlyRatingUpdate,
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


def _get_employee_or_404(db: Session, employee_id: int) -> Employee:
    emp = db.get(Employee, employee_id)
    if emp is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الموظف غير موجود")
    return emp


# ---------- Certifications ----------


@router.get("/{employee_id}/certifications")
def list_certifications(
    employee_id: int,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    _get_employee_or_404(db, employee_id)
    rows = (
        db.execute(select(Certification).where(Certification.employee_id == employee_id))
        .scalars()
        .all()
    )
    items = [CertificationOut.model_validate(c) for c in rows]
    return {
        "data": ListResponse[CertificationOut](
            items=items, total=len(items), page=1, page_size=len(items) or 1
        ).model_dump(mode="json")
    }


@router.post("/{employee_id}/certifications", status_code=status.HTTP_201_CREATED)
def create_certification(
    employee_id: int,
    payload: CertificationCreate,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    _get_employee_or_404(db, employee_id)
    cert = Certification(employee_id=employee_id, **payload.model_dump())
    db.add(cert)
    db.commit()
    db.refresh(cert)
    return {"data": CertificationOut.model_validate(cert).model_dump(mode="json")}


@router.patch("/{employee_id}/certifications/{certification_id}")
def update_certification(
    employee_id: int,
    certification_id: int,
    payload: CertificationUpdate,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    _get_employee_or_404(db, employee_id)
    cert = db.get(Certification, certification_id)
    if cert is None or cert.employee_id != employee_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="الشهادة غير موجودة"
        )
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(cert, field, value)
    db.commit()
    db.refresh(cert)
    return {"data": CertificationOut.model_validate(cert).model_dump(mode="json")}


@router.delete(
    "/{employee_id}/certifications/{certification_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_certification(
    employee_id: int,
    certification_id: int,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> Response:
    _get_employee_or_404(db, employee_id)
    cert = db.get(Certification, certification_id)
    if cert is None or cert.employee_id != employee_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="الشهادة غير موجودة"
        )
    db.delete(cert)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------- Equipment ----------


@router.get("/{employee_id}/equipment")
def list_equipment(
    employee_id: int,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    _get_employee_or_404(db, employee_id)
    rows = (
        db.execute(select(Equipment).where(Equipment.employee_id == employee_id))
        .scalars()
        .all()
    )
    items = [EquipmentOut.model_validate(e) for e in rows]
    return {
        "data": ListResponse[EquipmentOut](
            items=items, total=len(items), page=1, page_size=len(items) or 1
        ).model_dump(mode="json")
    }


@router.post("/{employee_id}/equipment", status_code=status.HTTP_201_CREATED)
def create_equipment(
    employee_id: int,
    payload: EquipmentCreate,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    _get_employee_or_404(db, employee_id)
    eq = Equipment(employee_id=employee_id, **payload.model_dump())
    db.add(eq)
    db.commit()
    db.refresh(eq)
    return {"data": EquipmentOut.model_validate(eq).model_dump(mode="json")}


@router.patch("/{employee_id}/equipment/{equipment_id}")
def update_equipment(
    employee_id: int,
    equipment_id: int,
    payload: EquipmentUpdate,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    _get_employee_or_404(db, employee_id)
    eq = db.get(Equipment, equipment_id)
    if eq is None or eq.employee_id != employee_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="التجهيز غير موجود"
        )
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(eq, field, value)
    db.commit()
    db.refresh(eq)
    return {"data": EquipmentOut.model_validate(eq).model_dump(mode="json")}


@router.delete(
    "/{employee_id}/equipment/{equipment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_equipment(
    employee_id: int,
    equipment_id: int,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> Response:
    _get_employee_or_404(db, employee_id)
    eq = db.get(Equipment, equipment_id)
    if eq is None or eq.employee_id != employee_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="التجهيز غير موجود"
        )
    db.delete(eq)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------- Monthly ratings ----------


@router.get("/{employee_id}/ratings")
def list_ratings(
    employee_id: int,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    _get_employee_or_404(db, employee_id)
    rows = (
        db.execute(
            select(MonthlyRating)
            .where(MonthlyRating.employee_id == employee_id)
            .order_by(MonthlyRating.year.desc(), MonthlyRating.month.desc())
        )
        .scalars()
        .all()
    )
    items = [MonthlyRatingOut.model_validate(r) for r in rows]
    return {
        "data": ListResponse[MonthlyRatingOut](
            items=items, total=len(items), page=1, page_size=len(items) or 1
        ).model_dump(mode="json")
    }


@router.post("/{employee_id}/ratings", status_code=status.HTTP_201_CREATED)
def create_rating(
    employee_id: int,
    payload: MonthlyRatingCreate,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    _get_employee_or_404(db, employee_id)
    rating = MonthlyRating(employee_id=employee_id, **payload.model_dump())
    db.add(rating)
    try:
        db.commit()
    except IntegrityError as err:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="يوجد تقييم مسبق لهذا الشهر",
        ) from err
    db.refresh(rating)
    return {"data": MonthlyRatingOut.model_validate(rating).model_dump(mode="json")}


@router.patch("/{employee_id}/ratings/{rating_id}")
def update_rating(
    employee_id: int,
    rating_id: int,
    payload: MonthlyRatingUpdate,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    _get_employee_or_404(db, employee_id)
    rating = db.get(MonthlyRating, rating_id)
    if rating is None or rating.employee_id != employee_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="التقييم غير موجود"
        )
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(rating, field, value)
    db.commit()
    db.refresh(rating)
    return {"data": MonthlyRatingOut.model_validate(rating).model_dump(mode="json")}


@router.delete(
    "/{employee_id}/ratings/{rating_id}", status_code=status.HTTP_204_NO_CONTENT
)
def delete_rating(
    employee_id: int,
    rating_id: int,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> Response:
    _get_employee_or_404(db, employee_id)
    rating = db.get(MonthlyRating, rating_id)
    if rating is None or rating.employee_id != employee_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="التقييم غير موجود"
        )
    db.delete(rating)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
