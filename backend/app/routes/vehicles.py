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
from app.schemas.common import ListResponse, VehicleStatus, VehicleType
from app.schemas.vehicles import (
    VehicleCreate,
    VehicleRead,
    VehicleSummary,
    VehicleUpdate,
)
from app.services.uploads import save_vehicle_photo

router = APIRouter(prefix="/api/vehicles", tags=["vehicles"])


def _validate_driver(db: Session, driver_id: int | None) -> None:
    if driver_id is None:
        return
    if db.get(Employee, driver_id) is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="السائق غير موجود",
        )


def _get_vehicle_or_404(db: Session, vehicle_id: int) -> Vehicle:
    veh = db.get(Vehicle, vehicle_id)
    if veh is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="المركبة غير موجودة")
    return veh


@router.get("")
def list_vehicles(
    q: str | None = Query(default=None, description="Search by plate number"),
    type: VehicleType | None = None,
    status_: VehicleStatus | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=200),
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    stmt = select(Vehicle)
    filters = []
    if q:
        filters.append(or_(Vehicle.plate_number.like(f"%{q}%")))
    if type is not None:
        filters.append(Vehicle.type == type)
    if status_ is not None:
        filters.append(Vehicle.status == status_)
    if filters:
        stmt = stmt.where(*filters)

    total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar_one()
    rows = (
        db.execute(stmt.order_by(Vehicle.id).offset((page - 1) * page_size).limit(page_size))
        .scalars()
        .all()
    )
    items = [VehicleSummary.model_validate(v) for v in rows]
    return {
        "data": ListResponse[VehicleSummary](
            items=items, total=total, page=page, page_size=page_size
        ).model_dump()
    }


@router.get("/{vehicle_id}")
def get_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    veh = _get_vehicle_or_404(db, vehicle_id)
    return {"data": VehicleRead.model_validate(veh).model_dump(mode="json")}


@router.post("", status_code=status.HTTP_201_CREATED)
def create_vehicle(
    payload: VehicleCreate,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    _validate_driver(db, payload.driver_id)
    veh = Vehicle(**payload.model_dump())
    db.add(veh)
    try:
        db.commit()
    except IntegrityError as err:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="رقم اللوحة مستخدم مسبقاً",
        ) from err
    db.refresh(veh)
    return {"data": VehicleRead.model_validate(veh).model_dump(mode="json")}


@router.patch("/{vehicle_id}")
def update_vehicle(
    vehicle_id: int,
    payload: VehicleUpdate,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    veh = _get_vehicle_or_404(db, vehicle_id)
    data = payload.model_dump(exclude_unset=True)
    if "driver_id" in data:
        _validate_driver(db, data["driver_id"])
    for field, value in data.items():
        setattr(veh, field, value)
    try:
        db.commit()
    except IntegrityError as err:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="رقم اللوحة مستخدم مسبقاً",
        ) from err
    db.refresh(veh)
    return {"data": VehicleRead.model_validate(veh).model_dump(mode="json")}


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> Response:
    veh = _get_vehicle_or_404(db, vehicle_id)
    db.delete(veh)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{vehicle_id}/photo")
def upload_photo(
    vehicle_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    veh = _get_vehicle_or_404(db, vehicle_id)
    veh.photo_path = save_vehicle_photo(vehicle_id, file)
    db.commit()
    db.refresh(veh)
    return {"data": VehicleRead.model_validate(veh).model_dump(mode="json")}
