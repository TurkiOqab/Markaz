from datetime import date as _date
from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import (
    MaintenanceStatus,
    OrmBase,
    RoomStatus,
    RoomType,
)

# ---------- Building (singleton) ----------


class BuildingBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    address: str = Field(min_length=1, max_length=500)
    notes: str | None = Field(default=None, max_length=1000)


class BuildingUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    address: str | None = Field(default=None, min_length=1, max_length=500)
    notes: str | None = Field(default=None, max_length=1000)


class BuildingOut(OrmBase):
    id: int
    name: str
    address: str
    notes: str | None = None
    created_at: datetime
    updated_at: datetime


# ---------- Rooms ----------


class RoomBase(BaseModel):
    type: RoomType
    name: str = Field(min_length=1, max_length=200)
    capacity: int = Field(ge=0)
    status: RoomStatus
    notes: str | None = Field(default=None, max_length=500)


class RoomCreate(RoomBase):
    pass


class RoomUpdate(BaseModel):
    type: RoomType | None = None
    name: str | None = Field(default=None, min_length=1, max_length=200)
    capacity: int | None = Field(default=None, ge=0)
    status: RoomStatus | None = None
    notes: str | None = Field(default=None, max_length=500)


class RoomOut(OrmBase):
    id: int
    type: RoomType
    name: str
    capacity: int
    status: RoomStatus
    notes: str | None = None


# ---------- Inventory ----------


class InventoryItemBase(BaseModel):
    item_name: str = Field(min_length=1, max_length=200)
    category: str = Field(min_length=1, max_length=100)
    quantity: int = Field(ge=0)
    location: str = Field(min_length=1, max_length=200)
    min_threshold: int = Field(ge=0)
    notes: str | None = Field(default=None, max_length=500)


class InventoryItemCreate(InventoryItemBase):
    pass


class InventoryItemUpdate(BaseModel):
    item_name: str | None = Field(default=None, min_length=1, max_length=200)
    category: str | None = Field(default=None, min_length=1, max_length=100)
    quantity: int | None = Field(default=None, ge=0)
    location: str | None = Field(default=None, min_length=1, max_length=200)
    min_threshold: int | None = Field(default=None, ge=0)
    notes: str | None = Field(default=None, max_length=500)


class InventoryItemOut(OrmBase):
    id: int
    item_name: str
    category: str
    quantity: int
    location: str
    min_threshold: int
    notes: str | None = None


# ---------- Building maintenance ----------


class BuildingMaintenanceBase(BaseModel):
    date: _date
    description: str = Field(min_length=1, max_length=500)
    cost: float = Field(ge=0)
    contractor: str = Field(min_length=1, max_length=200)
    status: MaintenanceStatus


class BuildingMaintenanceCreate(BuildingMaintenanceBase):
    pass


class BuildingMaintenanceUpdate(BaseModel):
    date: _date | None = None
    description: str | None = Field(default=None, min_length=1, max_length=500)
    cost: float | None = Field(default=None, ge=0)
    contractor: str | None = Field(default=None, min_length=1, max_length=200)
    status: MaintenanceStatus | None = None


class BuildingMaintenanceOut(OrmBase):
    id: int
    date: _date
    description: str
    cost: float
    contractor: str
    status: MaintenanceStatus


# ---------- Building reports ----------


class BuildingReportBase(BaseModel):
    date: _date
    title: str = Field(min_length=1, max_length=300)
    summary: str = Field(min_length=1, max_length=5000)
    file_path: str | None = Field(default=None, max_length=500)


class BuildingReportCreate(BuildingReportBase):
    pass


class BuildingReportUpdate(BaseModel):
    date: _date | None = None
    title: str | None = Field(default=None, min_length=1, max_length=300)
    summary: str | None = Field(default=None, min_length=1, max_length=5000)
    file_path: str | None = Field(default=None, max_length=500)


class BuildingReportOut(OrmBase):
    id: int
    date: _date
    title: str
    summary: str
    file_path: str | None = None
