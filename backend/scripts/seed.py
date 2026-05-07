"""Load plan/seed-data/*.json into the database.

Usage:
    python -m scripts.seed

The script is idempotent: it deletes all existing rows before inserting.
"""

import json
from datetime import date
from pathlib import Path

from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.models import (
    Building,
    BuildingMaintenance,
    BuildingReport,
    Certification,
    Employee,
    Equipment,
    InventoryItem,
    MonthlyRating,
    Room,
    Team,
    Vehicle,
    VehicleEquipment,
    VehicleInspection,
    VehicleMaintenance,
)

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
SEED_DIR = PROJECT_ROOT / "plan" / "seed-data"


def _parse_date(value: str) -> date:
    return date.fromisoformat(value)


def _load_json(name: str):
    with (SEED_DIR / name).open(encoding="utf-8") as f:
        return json.load(f)


def _clear_all(session: Session) -> None:
    # Children before parents.
    for model in (
        Certification,
        Equipment,
        MonthlyRating,
        VehicleMaintenance,
        VehicleEquipment,
        VehicleInspection,
        BuildingMaintenance,
        BuildingReport,
        Room,
        InventoryItem,
        Vehicle,
        Employee,
        Team,
        Building,
    ):
        session.query(model).delete()


def seed(session: Session) -> None:
    _clear_all(session)

    for row in _load_json("teams.json"):
        session.add(Team(**row))

    for emp in _load_json("employees.json"):
        certs = emp.pop("certifications", [])
        equip = emp.pop("equipment", [])
        ratings = emp.pop("monthly_ratings", [])
        emp["date_of_birth"] = _parse_date(emp["date_of_birth"])
        employee = Employee(**emp)
        for c in certs:
            c["issue_date"] = _parse_date(c["issue_date"])
            c["expiry_date"] = _parse_date(c["expiry_date"])
            employee.certifications.append(Certification(**c))
        for e in equip:
            e["assigned_date"] = _parse_date(e["assigned_date"])
            employee.equipment.append(Equipment(**e))
        for r in ratings:
            # Backwards compat for old seed JSON: split a single 0-5 `rating`
            # into four equal 0-25 sub-scores. Newer JSON may already provide
            # specialty/discipline/fitness/appearance directly.
            if "rating" in r and "specialty_score" not in r:
                sub = max(0, min(25, round(float(r.pop("rating")) * 5)))
                r["specialty_score"] = sub
                r["discipline_score"] = sub
                r["fitness_score"] = sub
                r["appearance_score"] = sub
            employee.monthly_ratings.append(MonthlyRating(**r))
        session.add(employee)

    for veh in _load_json("vehicles.json"):
        maint = veh.pop("maintenance", [])
        eq = veh.pop("equipment", [])
        insp = veh.pop("inspections", [])
        vehicle = Vehicle(**veh)
        for m in maint:
            m["date"] = _parse_date(m["date"])
            vehicle.maintenance.append(VehicleMaintenance(**m))
        for e in eq:
            vehicle.equipment.append(VehicleEquipment(**e))
        for i in insp:
            i["inspection_date"] = _parse_date(i["inspection_date"])
            vehicle.inspections.append(VehicleInspection(**i))
        session.add(vehicle)

    building_data = _load_json("building.json")
    session.add(Building(**building_data["building"]))
    for r in building_data["rooms"]:
        session.add(Room(**r))
    for i in building_data["inventory"]:
        session.add(InventoryItem(**i))
    for m in building_data["maintenance"]:
        m["date"] = _parse_date(m["date"])
        session.add(BuildingMaintenance(**m))
    for r in building_data["reports"]:
        r["date"] = _parse_date(r["date"])
        session.add(BuildingReport(**r))

    session.commit()


def main() -> None:
    with SessionLocal() as session:
        seed(session)
    print("Seed data loaded.")


if __name__ == "__main__":
    main()
