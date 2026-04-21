from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_chief
from app.models import (
    Building,
    BuildingMaintenance,
    BuildingReport,
    InventoryItem,
    Room,
)
from app.schemas.building import (
    BuildingMaintenanceCreate,
    BuildingMaintenanceOut,
    BuildingMaintenanceUpdate,
    BuildingOut,
    BuildingReportCreate,
    BuildingReportOut,
    BuildingReportUpdate,
    BuildingUpdate,
    InventoryItemCreate,
    InventoryItemOut,
    InventoryItemUpdate,
    RoomCreate,
    RoomOut,
    RoomUpdate,
)
from app.schemas.common import ListResponse

router = APIRouter(prefix="/api/building", tags=["building"])


def _get_or_create_singleton(db: Session) -> Building:
    row = db.get(Building, 1)
    if row is None:
        row = Building(id=1, name="", address="")
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


# ---------- Building singleton ----------


@router.get("")
def get_building(
    db: Session = Depends(get_db),
    _chief=Depends(get_current_chief),
) -> dict:
    row = _get_or_create_singleton(db)
    return {"data": BuildingOut.model_validate(row).model_dump(mode="json")}


@router.patch("")
def update_building(
    payload: BuildingUpdate,
    db: Session = Depends(get_db),
    _chief=Depends(get_current_chief),
) -> dict:
    row = _get_or_create_singleton(db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(row, field, value)
    db.commit()
    db.refresh(row)
    return {"data": BuildingOut.model_validate(row).model_dump(mode="json")}


# ---------- Rooms ----------


@router.get("/rooms")
def list_rooms(
    db: Session = Depends(get_db),
    _chief=Depends(get_current_chief),
) -> dict:
    rows = db.execute(select(Room).order_by(Room.id)).scalars().all()
    items = [RoomOut.model_validate(r) for r in rows]
    return {
        "data": ListResponse[RoomOut](
            items=items, total=len(items), page=1, page_size=len(items) or 1
        ).model_dump(mode="json")
    }


@router.post("/rooms", status_code=status.HTTP_201_CREATED)
def create_room(
    payload: RoomCreate,
    db: Session = Depends(get_db),
    _chief=Depends(get_current_chief),
) -> dict:
    room = Room(**payload.model_dump())
    db.add(room)
    db.commit()
    db.refresh(room)
    return {"data": RoomOut.model_validate(room).model_dump(mode="json")}


@router.patch("/rooms/{room_id}")
def update_room(
    room_id: int,
    payload: RoomUpdate,
    db: Session = Depends(get_db),
    _chief=Depends(get_current_chief),
) -> dict:
    room = db.get(Room, room_id)
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الغرفة غير موجودة")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(room, field, value)
    db.commit()
    db.refresh(room)
    return {"data": RoomOut.model_validate(room).model_dump(mode="json")}


@router.delete("/rooms/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_room(
    room_id: int,
    db: Session = Depends(get_db),
    _chief=Depends(get_current_chief),
) -> Response:
    room = db.get(Room, room_id)
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الغرفة غير موجودة")
    db.delete(room)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------- Inventory ----------


@router.get("/inventory")
def list_inventory(
    db: Session = Depends(get_db),
    _chief=Depends(get_current_chief),
) -> dict:
    rows = db.execute(select(InventoryItem).order_by(InventoryItem.id)).scalars().all()
    items = [InventoryItemOut.model_validate(i) for i in rows]
    return {
        "data": ListResponse[InventoryItemOut](
            items=items, total=len(items), page=1, page_size=len(items) or 1
        ).model_dump(mode="json")
    }


@router.post("/inventory", status_code=status.HTTP_201_CREATED)
def create_inventory(
    payload: InventoryItemCreate,
    db: Session = Depends(get_db),
    _chief=Depends(get_current_chief),
) -> dict:
    item = InventoryItem(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"data": InventoryItemOut.model_validate(item).model_dump(mode="json")}


@router.patch("/inventory/{item_id}")
def update_inventory(
    item_id: int,
    payload: InventoryItemUpdate,
    db: Session = Depends(get_db),
    _chief=Depends(get_current_chief),
) -> dict:
    item = db.get(InventoryItem, item_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الصنف غير موجود")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return {"data": InventoryItemOut.model_validate(item).model_dump(mode="json")}


@router.delete("/inventory/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_inventory(
    item_id: int,
    db: Session = Depends(get_db),
    _chief=Depends(get_current_chief),
) -> Response:
    item = db.get(InventoryItem, item_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الصنف غير موجود")
    db.delete(item)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------- Building maintenance ----------


@router.get("/maintenance")
def list_building_maintenance(
    db: Session = Depends(get_db),
    _chief=Depends(get_current_chief),
) -> dict:
    rows = (
        db.execute(select(BuildingMaintenance).order_by(BuildingMaintenance.date.desc()))
        .scalars()
        .all()
    )
    items = [BuildingMaintenanceOut.model_validate(m) for m in rows]
    return {
        "data": ListResponse[BuildingMaintenanceOut](
            items=items, total=len(items), page=1, page_size=len(items) or 1
        ).model_dump(mode="json")
    }


@router.post("/maintenance", status_code=status.HTTP_201_CREATED)
def create_building_maintenance(
    payload: BuildingMaintenanceCreate,
    db: Session = Depends(get_db),
    _chief=Depends(get_current_chief),
) -> dict:
    m = BuildingMaintenance(**payload.model_dump())
    db.add(m)
    db.commit()
    db.refresh(m)
    return {"data": BuildingMaintenanceOut.model_validate(m).model_dump(mode="json")}


@router.patch("/maintenance/{maintenance_id}")
def update_building_maintenance(
    maintenance_id: int,
    payload: BuildingMaintenanceUpdate,
    db: Session = Depends(get_db),
    _chief=Depends(get_current_chief),
) -> dict:
    m = db.get(BuildingMaintenance, maintenance_id)
    if m is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="سجل الصيانة غير موجود")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(m, field, value)
    db.commit()
    db.refresh(m)
    return {"data": BuildingMaintenanceOut.model_validate(m).model_dump(mode="json")}


@router.delete("/maintenance/{maintenance_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_building_maintenance(
    maintenance_id: int,
    db: Session = Depends(get_db),
    _chief=Depends(get_current_chief),
) -> Response:
    m = db.get(BuildingMaintenance, maintenance_id)
    if m is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="سجل الصيانة غير موجود")
    db.delete(m)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------- Building reports ----------


@router.get("/reports")
def list_reports(
    db: Session = Depends(get_db),
    _chief=Depends(get_current_chief),
) -> dict:
    rows = db.execute(select(BuildingReport).order_by(BuildingReport.date.desc())).scalars().all()
    items = [BuildingReportOut.model_validate(r) for r in rows]
    return {
        "data": ListResponse[BuildingReportOut](
            items=items, total=len(items), page=1, page_size=len(items) or 1
        ).model_dump(mode="json")
    }


@router.post("/reports", status_code=status.HTTP_201_CREATED)
def create_report(
    payload: BuildingReportCreate,
    db: Session = Depends(get_db),
    _chief=Depends(get_current_chief),
) -> dict:
    report = BuildingReport(**payload.model_dump())
    db.add(report)
    db.commit()
    db.refresh(report)
    return {"data": BuildingReportOut.model_validate(report).model_dump(mode="json")}


@router.patch("/reports/{report_id}")
def update_report(
    report_id: int,
    payload: BuildingReportUpdate,
    db: Session = Depends(get_db),
    _chief=Depends(get_current_chief),
) -> dict:
    report = db.get(BuildingReport, report_id)
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="التقرير غير موجود")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(report, field, value)
    db.commit()
    db.refresh(report)
    return {"data": BuildingReportOut.model_validate(report).model_dump(mode="json")}


@router.delete("/reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_report(
    report_id: int,
    db: Session = Depends(get_db),
    _chief=Depends(get_current_chief),
) -> Response:
    report = db.get(BuildingReport, report_id)
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="التقرير غير موجود")
    db.delete(report)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
