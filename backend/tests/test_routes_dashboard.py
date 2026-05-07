from datetime import date, timedelta

from app.db import SessionLocal
from app.models import (
    BuildingMaintenance,
    Certification,
    Employee,
    InventoryItem,
    MonthlyRating,
    Team,
    Vehicle,
    VehicleMaintenance,
)
from fastapi.testclient import TestClient


def _client():
    from app.main import app

    return TestClient(app)


def _auth(client):
    client.post("/api/setup", json={"username": "chief", "password": "StrongPass1!"})
    client.post("/api/auth/login", json={"username": "chief", "password": "StrongPass1!"})


def test_dashboard_requires_auth():
    client = _client()
    r = client.get("/api/dashboard/stats")
    assert r.status_code == 401


def test_dashboard_returns_counts():
    with SessionLocal() as db:
        team = Team(name="الفريق أ")
        db.add(team)
        db.commit()
        db.add_all(
            [
                Employee(
                    name="A",
                    rank="ج",
                    specialty="ح",
                    date_of_birth=date(1990, 1, 1),
                    marital_status="أعزب",
                    physical_ability="جيد",
                    national_id="1" * 10,
                    phone="0500000001",
                    team_id=team.id,
                    shift="صباحية",
                ),
                Employee(
                    name="B",
                    rank="ج",
                    specialty="ح",
                    date_of_birth=date(1990, 1, 1),
                    marital_status="أعزب",
                    physical_ability="جيد",
                    national_id="2" * 10,
                    phone="0500000002",
                    team_id=team.id,
                    shift="ليلية",
                ),
                Vehicle(type="إطفاء", plate_number="V-1", status="في الخدمة"),
                Vehicle(type="إطفاء", plate_number="V-2", status="خارج الخدمة"),
            ]
        )
        db.commit()

    client = _client()
    _auth(client)
    r = client.get("/api/dashboard/stats")
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["employees"]["total"] == 2
    assert data["employees"]["by_shift"]["صباحية"] == 1
    assert data["employees"]["by_shift"]["ليلية"] == 1
    assert data["vehicles"]["total"] == 2
    assert data["vehicles"]["by_status"]["في الخدمة"] == 1
    assert data["vehicles"]["by_status"]["خارج الخدمة"] == 1


def test_dashboard_surfaces_attention_items():
    today = date.today()
    with SessionLocal() as db:
        team = Team(name="الفريق أ")
        db.add(team)
        db.commit()
        emp = Employee(
            name="علي",
            rank="ج",
            specialty="ح",
            date_of_birth=date(1990, 1, 1),
            marital_status="أعزب",
            physical_ability="جيد",
            national_id="3" * 10,
            phone="0500000003",
            team_id=team.id,
            shift="صباحية",
        )
        db.add(emp)
        db.commit()
        db.add_all(
            [
                Vehicle(type="إطفاء", plate_number="V-9", status="خارج الخدمة"),
                Certification(
                    employee_id=emp.id,
                    name="شهادة قريبة من الانتهاء",
                    issuing_authority="جهة",
                    issue_date=date(2020, 1, 1),
                    expiry_date=today + timedelta(days=10),
                ),
                InventoryItem(
                    item_name="صنف منخفض",
                    category="معدات",
                    quantity=1,
                    location="مخزن",
                    min_threshold=5,
                ),
            ]
        )
        db.commit()

    client = _client()
    _auth(client)
    r = client.get("/api/dashboard/stats")
    attention = r.json()["data"]["attention"]
    assert any(v["plate_number"] == "V-9" for v in attention["vehicles_out"])
    assert any(c["cert_name"] == "شهادة قريبة من الانتهاء" for c in attention["expiring_certs"])
    assert any(i["item_name"] == "صنف منخفض" for i in attention["low_stock"])


def test_dashboard_includes_monthly_rating_trend():
    with SessionLocal() as db:
        team = Team(name="الفريق أ")
        db.add(team)
        db.commit()
        emp = Employee(
            name="محمد",
            rank="ج",
            specialty="ح",
            date_of_birth=date(1990, 1, 1),
            marital_status="أعزب",
            physical_ability="جيد",
            national_id="5" * 10,
            phone="0500000005",
            team_id=team.id,
            shift="صباحية",
        )
        db.add(emp)
        db.commit()
        def _rating(year: int, month: int, total: int) -> MonthlyRating:
            # Spread `total` (0-100) evenly across the four 0-25 axes.
            base = total // 4
            extra = total - base * 4  # 0..3 leftover
            scores = [base + (1 if i < extra else 0) for i in range(4)]
            return MonthlyRating(
                employee_id=emp.id,
                year=year,
                month=month,
                specialty_score=scores[0],
                discipline_score=scores[1],
                fitness_score=scores[2],
                appearance_score=scores[3],
            )

        db.add_all(
            [
                _rating(2026, 1, 80),
                _rating(2026, 2, 90),
                _rating(2026, 3, 100),
            ]
        )
        db.commit()

    client = _client()
    _auth(client)
    data = client.get("/api/dashboard/stats").json()["data"]
    trend = data["ratings"]["monthly_average"]
    by_month = {(r["year"], r["month"]): r["average"] for r in trend}
    assert by_month[(2026, 1)] == 80.0
    assert by_month[(2026, 2)] == 90.0
    assert by_month[(2026, 3)] == 100.0


def test_dashboard_includes_maintenance_costs():
    with SessionLocal() as db:
        v = Vehicle(type="إطفاء", plate_number="V-C", status="في الخدمة")
        db.add(v)
        db.commit()
        db.add_all(
            [
                VehicleMaintenance(
                    vehicle_id=v.id,
                    date=date(2026, 1, 15),
                    description="oil",
                    cost=1000,
                    contractor="c",
                    status="مكتمل",
                ),
                BuildingMaintenance(
                    date=date(2026, 1, 20),
                    description="paint",
                    cost=2000,
                    contractor="c",
                    status="مكتمل",
                ),
            ]
        )
        db.commit()

    client = _client()
    _auth(client)
    data = client.get("/api/dashboard/stats").json()["data"]
    by_month = {(m["year"], m["month"]): m for m in data["maintenance"]["monthly_costs"]}
    assert by_month[(2026, 1)]["vehicle"] == 1000
    assert by_month[(2026, 1)]["building"] == 2000
