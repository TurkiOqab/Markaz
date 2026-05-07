from datetime import date
from datetime import date as _date
from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import (
    EquipmentCondition,
    InspectionResult,
    MaintenanceStatus,
    OrmBase,
    VehicleLine,
    VehicleStatus,
    VehicleType,
)

# ---------- Vehicle maintenance ----------


class VehicleMaintenanceBase(BaseModel):
    date: _date
    description: str = Field(min_length=1, max_length=500)
    cost: float = Field(ge=0)
    contractor: str = Field(min_length=1, max_length=200)
    status: MaintenanceStatus


class VehicleMaintenanceCreate(VehicleMaintenanceBase):
    pass


class VehicleMaintenanceUpdate(BaseModel):
    date: _date | None = None
    description: str | None = Field(default=None, min_length=1, max_length=500)
    cost: float | None = Field(default=None, ge=0)
    contractor: str | None = Field(default=None, min_length=1, max_length=200)
    status: MaintenanceStatus | None = None


class VehicleMaintenanceOut(OrmBase):
    id: int
    date: _date
    description: str
    cost: float
    contractor: str
    status: MaintenanceStatus


# ---------- Onboard equipment ----------


class VehicleEquipmentBase(BaseModel):
    item_name: str = Field(min_length=1, max_length=200)
    quantity: int = Field(ge=0)
    condition: EquipmentCondition


class VehicleEquipmentCreate(VehicleEquipmentBase):
    pass


class VehicleEquipmentUpdate(BaseModel):
    item_name: str | None = Field(default=None, min_length=1, max_length=200)
    quantity: int | None = Field(default=None, ge=0)
    condition: EquipmentCondition | None = None


class VehicleEquipmentOut(OrmBase):
    id: int
    item_name: str
    quantity: int
    condition: EquipmentCondition


# ---------- Vehicle inspections ----------


class VehicleInspectionBase(BaseModel):
    inspection_date: _date
    inspector_name: str = Field(min_length=1, max_length=200)
    result: InspectionResult
    notes: str | None = Field(default=None, max_length=1000)


class VehicleInspectionCreate(VehicleInspectionBase):
    pass


class VehicleInspectionUpdate(BaseModel):
    inspection_date: _date | None = None
    inspector_name: str | None = Field(default=None, min_length=1, max_length=200)
    result: InspectionResult | None = None
    notes: str | None = Field(default=None, max_length=1000)


class VehicleInspectionOut(OrmBase):
    id: int
    inspection_date: _date
    inspector_name: str
    result: InspectionResult
    notes: str | None = None


# ---------- Vehicles ----------


class VehicleBase(BaseModel):
    type: VehicleType
    plate_number: str = Field(min_length=1, max_length=30)
    status: VehicleStatus
    line: VehicleLine = "الأول"
    driver_id: int | None = None


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(BaseModel):
    type: VehicleType | None = None
    plate_number: str | None = Field(default=None, min_length=1, max_length=30)
    status: VehicleStatus | None = None
    line: VehicleLine | None = None
    yard_x: float | None = Field(default=None, ge=0.0, le=1.0)
    yard_y: float | None = Field(default=None, ge=0.0, le=1.0)
    driver_id: int | None = None


class VehicleSummary(OrmBase):
    id: int
    type: VehicleType
    plate_number: str
    status: VehicleStatus
    line: VehicleLine = "الأول"
    yard_x: float | None = None
    yard_y: float | None = None
    driver_id: int | None = None
    driver_name: str | None = None
    photo_path: str | None = None
    equipment_count: int = 0
    open_maintenance_count: int = 0
    last_inspection_date: date | None = None
    last_inspection_result: InspectionResult | None = None


class VehicleRead(OrmBase):
    id: int
    type: VehicleType
    plate_number: str
    status: VehicleStatus
    line: VehicleLine = "الأول"
    driver_id: int | None = None
    photo_path: str | None = None
    created_at: datetime
    updated_at: datetime
    maintenance: list[VehicleMaintenanceOut] = []
    equipment: list[VehicleEquipmentOut] = []
    inspections: list[VehicleInspectionOut] = []
