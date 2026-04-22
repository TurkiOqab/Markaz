from pydantic import BaseModel


class EmployeeStats(BaseModel):
    total: int
    by_shift: dict[str, int]


class VehicleStats(BaseModel):
    total: int
    by_status: dict[str, int]


class RoomStats(BaseModel):
    total: int
    by_status: dict[str, int]


class LowStockItem(BaseModel):
    id: int
    item_name: str
    quantity: int
    min_threshold: int


class InventoryStats(BaseModel):
    total: int
    low_stock: list[LowStockItem]


class MonthlyCost(BaseModel):
    year: int
    month: int
    vehicle: float
    building: float


class MaintenanceStats(BaseModel):
    open_count: int
    monthly_costs: list[MonthlyCost]


class MonthlyAverage(BaseModel):
    year: int
    month: int
    average: float


class RatingStats(BaseModel):
    monthly_average: list[MonthlyAverage]


class VehicleOut(BaseModel):
    id: int
    plate_number: str
    status: str


class ExpiringCertification(BaseModel):
    employee_id: int
    employee_name: str
    cert_name: str
    expiry_date: str
    days_until: int


class AttentionSection(BaseModel):
    vehicles_out: list[VehicleOut]
    expiring_certs: list[ExpiringCertification]
    low_stock: list[LowStockItem]


class DashboardStats(BaseModel):
    employees: EmployeeStats
    vehicles: VehicleStats
    rooms: RoomStats
    inventory: InventoryStats
    maintenance: MaintenanceStats
    ratings: RatingStats
    attention: AttentionSection
