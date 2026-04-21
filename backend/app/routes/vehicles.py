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
    Chief,
    Employee,
    Vehicle,
    VehicleEquipment,
    VehicleInspection,
    VehicleMaintenance,
)
from app.schemas.common import ListResponse, VehicleStatus, VehicleType
from app.schemas.vehicles import (
    VehicleCreate,
    VehicleEquipmentCreate,
    VehicleEquipmentOut,
    VehicleEquipmentUpdate,
    VehicleInspectionCreate,
    VehicleInspectionOut,
    VehicleInspectionUpdate,
    VehicleMaintenanceCreate,
    VehicleMaintenanceOut,
    VehicleMaintenanceUpdate,
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


# ---------- Maintenance ----------


@router.get("/{vehicle_id}/maintenance")
def list_maintenance(
    vehicle_id: int,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    _get_vehicle_or_404(db, vehicle_id)
    rows = (
        db.execute(
            select(VehicleMaintenance)
            .where(VehicleMaintenance.vehicle_id == vehicle_id)
            .order_by(VehicleMaintenance.date.desc())
        )
        .scalars()
        .all()
    )
    items = [VehicleMaintenanceOut.model_validate(m) for m in rows]
    return {
        "data": ListResponse[VehicleMaintenanceOut](
            items=items, total=len(items), page=1, page_size=len(items) or 1
        ).model_dump(mode="json")
    }


@router.post("/{vehicle_id}/maintenance", status_code=status.HTTP_201_CREATED)
def create_maintenance(
    vehicle_id: int,
    payload: VehicleMaintenanceCreate,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    _get_vehicle_or_404(db, vehicle_id)
    m = VehicleMaintenance(vehicle_id=vehicle_id, **payload.model_dump())
    db.add(m)
    db.commit()
    db.refresh(m)
    return {"data": VehicleMaintenanceOut.model_validate(m).model_dump(mode="json")}


@router.patch("/{vehicle_id}/maintenance/{maintenance_id}")
def update_maintenance(
    vehicle_id: int,
    maintenance_id: int,
    payload: VehicleMaintenanceUpdate,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    _get_vehicle_or_404(db, vehicle_id)
    m = db.get(VehicleMaintenance, maintenance_id)
    if m is None or m.vehicle_id != vehicle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="سجل الصيانة غير موجود")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(m, field, value)
    db.commit()
    db.refresh(m)
    return {"data": VehicleMaintenanceOut.model_validate(m).model_dump(mode="json")}


@router.delete(
    "/{vehicle_id}/maintenance/{maintenance_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_maintenance(
    vehicle_id: int,
    maintenance_id: int,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> Response:
    _get_vehicle_or_404(db, vehicle_id)
    m = db.get(VehicleMaintenance, maintenance_id)
    if m is None or m.vehicle_id != vehicle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="سجل الصيانة غير موجود")
    db.delete(m)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------- Onboard equipment ----------


@router.get("/{vehicle_id}/equipment")
def list_vehicle_equipment(
    vehicle_id: int,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    _get_vehicle_or_404(db, vehicle_id)
    rows = (
        db.execute(select(VehicleEquipment).where(VehicleEquipment.vehicle_id == vehicle_id))
        .scalars()
        .all()
    )
    items = [VehicleEquipmentOut.model_validate(e) for e in rows]
    return {
        "data": ListResponse[VehicleEquipmentOut](
            items=items, total=len(items), page=1, page_size=len(items) or 1
        ).model_dump(mode="json")
    }


@router.post("/{vehicle_id}/equipment", status_code=status.HTTP_201_CREATED)
def create_vehicle_equipment(
    vehicle_id: int,
    payload: VehicleEquipmentCreate,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    _get_vehicle_or_404(db, vehicle_id)
    e = VehicleEquipment(vehicle_id=vehicle_id, **payload.model_dump())
    db.add(e)
    db.commit()
    db.refresh(e)
    return {"data": VehicleEquipmentOut.model_validate(e).model_dump(mode="json")}


@router.patch("/{vehicle_id}/equipment/{equipment_id}")
def update_vehicle_equipment(
    vehicle_id: int,
    equipment_id: int,
    payload: VehicleEquipmentUpdate,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    _get_vehicle_or_404(db, vehicle_id)
    e = db.get(VehicleEquipment, equipment_id)
    if e is None or e.vehicle_id != vehicle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="التجهيز غير موجود")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(e, field, value)
    db.commit()
    db.refresh(e)
    return {"data": VehicleEquipmentOut.model_validate(e).model_dump(mode="json")}


@router.delete(
    "/{vehicle_id}/equipment/{equipment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_vehicle_equipment(
    vehicle_id: int,
    equipment_id: int,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> Response:
    _get_vehicle_or_404(db, vehicle_id)
    e = db.get(VehicleEquipment, equipment_id)
    if e is None or e.vehicle_id != vehicle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="التجهيز غير موجود")
    db.delete(e)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------- Inspections ----------


@router.get("/{vehicle_id}/inspections")
def list_inspections(
    vehicle_id: int,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    _get_vehicle_or_404(db, vehicle_id)
    rows = (
        db.execute(
            select(VehicleInspection)
            .where(VehicleInspection.vehicle_id == vehicle_id)
            .order_by(VehicleInspection.inspection_date.desc())
        )
        .scalars()
        .all()
    )
    items = [VehicleInspectionOut.model_validate(i) for i in rows]
    return {
        "data": ListResponse[VehicleInspectionOut](
            items=items, total=len(items), page=1, page_size=len(items) or 1
        ).model_dump(mode="json")
    }


@router.post("/{vehicle_id}/inspections", status_code=status.HTTP_201_CREATED)
def create_inspection(
    vehicle_id: int,
    payload: VehicleInspectionCreate,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    _get_vehicle_or_404(db, vehicle_id)
    i = VehicleInspection(vehicle_id=vehicle_id, **payload.model_dump())
    db.add(i)
    db.commit()
    db.refresh(i)
    return {"data": VehicleInspectionOut.model_validate(i).model_dump(mode="json")}


@router.patch("/{vehicle_id}/inspections/{inspection_id}")
def update_inspection(
    vehicle_id: int,
    inspection_id: int,
    payload: VehicleInspectionUpdate,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    _get_vehicle_or_404(db, vehicle_id)
    i = db.get(VehicleInspection, inspection_id)
    if i is None or i.vehicle_id != vehicle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="سجل الفحص غير موجود")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(i, field, value)
    db.commit()
    db.refresh(i)
    return {"data": VehicleInspectionOut.model_validate(i).model_dump(mode="json")}


@router.delete(
    "/{vehicle_id}/inspections/{inspection_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_inspection(
    vehicle_id: int,
    inspection_id: int,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> Response:
    _get_vehicle_or_404(db, vehicle_id)
    i = db.get(VehicleInspection, inspection_id)
    if i is None or i.vehicle_id != vehicle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="سجل الفحص غير موجود")
    db.delete(i)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
