from collections import defaultdict
from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_chief
from app.models import (
    BuildingMaintenance,
    Certification,
    Chief,
    Employee,
    InventoryItem,
    MonthlyRating,
    Room,
    Vehicle,
    VehicleMaintenance,
)

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


def _group_count(rows, getter: str) -> dict[str, int]:
    buckets: dict[str, int] = defaultdict(int)
    for row in rows:
        buckets[getattr(row, getter)] += 1
    return dict(buckets)


@router.get("/stats")
def dashboard_stats(
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    employees = db.execute(select(Employee)).scalars().all()
    vehicles = db.execute(select(Vehicle)).scalars().all()
    rooms = db.execute(select(Room)).scalars().all()
    inventory = db.execute(select(InventoryItem)).scalars().all()

    low_stock = [
        {
            "id": i.id,
            "item_name": i.item_name,
            "quantity": i.quantity,
            "min_threshold": i.min_threshold,
        }
        for i in inventory
        if i.quantity < i.min_threshold
    ]

    open_vehicle = [
        m
        for m in db.execute(select(VehicleMaintenance)).scalars().all()
        if m.status in ("قيد التنفيذ", "مجدول")
    ]
    open_building = [
        m
        for m in db.execute(select(BuildingMaintenance)).scalars().all()
        if m.status in ("قيد التنفيذ", "مجدول")
    ]

    vmaints = db.execute(select(VehicleMaintenance)).scalars().all()
    bmaints = db.execute(select(BuildingMaintenance)).scalars().all()
    costs_by_month: dict[tuple[int, int], dict[str, float]] = defaultdict(
        lambda: {"vehicle": 0.0, "building": 0.0}
    )
    for m in vmaints:
        costs_by_month[(m.date.year, m.date.month)]["vehicle"] += float(m.cost)
    for m in bmaints:
        costs_by_month[(m.date.year, m.date.month)]["building"] += float(m.cost)
    monthly_costs = [
        {"year": y, "month": mo, "vehicle": v["vehicle"], "building": v["building"]}
        for (y, mo), v in sorted(costs_by_month.items())
    ]

    ratings = db.execute(select(MonthlyRating)).scalars().all()
    rating_bucket: dict[tuple[int, int], list[float]] = defaultdict(list)
    for r in ratings:
        rating_bucket[(r.year, r.month)].append(float(r.rating))
    monthly_avg = [
        {"year": y, "month": m, "average": round(sum(vs) / len(vs), 2)}
        for (y, m), vs in sorted(rating_bucket.items())
    ]

    vehicles_out = [
        {"id": v.id, "plate_number": v.plate_number, "status": v.status}
        for v in vehicles
        if v.status != "في الخدمة"
    ]

    today = date.today()
    cutoff = today + timedelta(days=60)
    certs = db.execute(select(Certification)).scalars().all()
    emp_by_id = {e.id: e.name for e in employees}
    expiring = [
        {
            "employee_id": c.employee_id,
            "employee_name": emp_by_id.get(c.employee_id, "—"),
            "cert_name": c.name,
            "expiry_date": c.expiry_date.isoformat(),
            "days_until": (c.expiry_date - today).days,
        }
        for c in certs
        if today <= c.expiry_date <= cutoff
    ]
    expiring.sort(key=lambda c: c["days_until"])

    return {
        "data": {
            "employees": {
                "total": len(employees),
                "by_shift": _group_count(employees, "shift"),
            },
            "vehicles": {
                "total": len(vehicles),
                "by_status": _group_count(vehicles, "status"),
            },
            "rooms": {
                "total": len(rooms),
                "by_status": _group_count(rooms, "status"),
            },
            "inventory": {
                "total": len(inventory),
                "low_stock": low_stock,
            },
            "maintenance": {
                "open_count": len(open_vehicle) + len(open_building),
                "monthly_costs": monthly_costs,
            },
            "ratings": {"monthly_average": monthly_avg},
            "attention": {
                "vehicles_out": vehicles_out,
                "expiring_certs": expiring,
                "low_stock": low_stock,
            },
        }
    }
