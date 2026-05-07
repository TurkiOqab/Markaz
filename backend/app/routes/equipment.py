from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_chief
from app.models import (
    Chief,
    Employee,
    Equipment,
    InventoryItem,
    Vehicle,
    VehicleEquipment,
)

router = APIRouter(prefix="/api/equipment", tags=["equipment"])


@router.get("/all")
def list_all_equipment(
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    employees = {e.id: e for e in db.execute(select(Employee)).scalars().all()}
    vehicles = {v.id: v for v in db.execute(select(Vehicle)).scalars().all()}

    items: list[dict] = []

    emp_eq = db.execute(select(Equipment)).scalars().all()
    for e in emp_eq:
        owner = employees.get(e.employee_id)
        items.append(
            {
                "id": f"emp-{e.id}",
                "source": "employee",
                "item_name": e.item_name,
                "owner_label": owner.name if owner else "—",
                "owner_id": e.employee_id,
                "quantity": 1,
                "condition": e.condition,
                "serial_number": e.serial_number,
                "assigned_date": e.assigned_date.isoformat(),
            }
        )

    veh_eq = db.execute(select(VehicleEquipment)).scalars().all()
    for v in veh_eq:
        owner = vehicles.get(v.vehicle_id)
        items.append(
            {
                "id": f"veh-{v.id}",
                "source": "vehicle",
                "item_name": v.item_name,
                "owner_label": owner.plate_number if owner else "—",
                "owner_id": v.vehicle_id,
                "quantity": v.quantity,
                "condition": v.condition,
                "serial_number": None,
                "assigned_date": None,
            }
        )

    inv = db.execute(select(InventoryItem)).scalars().all()
    for i in inv:
        items.append(
            {
                "id": f"inv-{i.id}",
                "source": "inventory",
                "item_name": i.item_name,
                "owner_label": i.location,
                "owner_id": i.id,
                "quantity": i.quantity,
                "condition": "منخفض" if i.quantity < i.min_threshold else "متوفر",
                "serial_number": None,
                "assigned_date": None,
                "category": i.category,
                "min_threshold": i.min_threshold,
            }
        )

    items.sort(key=lambda x: (x["source"], x["item_name"]))

    by_source = {
        "employee": sum(1 for x in items if x["source"] == "employee"),
        "vehicle": sum(1 for x in items if x["source"] == "vehicle"),
        "inventory": sum(1 for x in items if x["source"] == "inventory"),
    }

    return {"data": {"items": items, "total": len(items), "by_source": by_source}}
