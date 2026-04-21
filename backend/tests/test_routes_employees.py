from datetime import date

from app.db import SessionLocal
from app.models import Employee, Team
from tests.helpers.auth import make_authed_client


def _seed_one_team() -> int:
    with SessionLocal() as db:
        team = Team(name="الفريق أ", description="")
        db.add(team)
        db.commit()
        return team.id


def _add_employees(team_id: int, count: int) -> None:
    with SessionLocal() as db:
        for i in range(count):
            db.add(
                Employee(
                    name=f"موظف رقم {i}",
                    rank="جندي",
                    specialty="مكافحة حرائق",
                    date_of_birth=date(1990, 1, 1),
                    marital_status="أعزب",
                    physical_ability="جيد",
                    national_id=f"100000000{i}",
                    phone=f"05000000{i:02d}",
                    team_id=team_id,
                    shift="صباحية",
                )
            )
        db.commit()


def test_list_employees_returns_empty_initially():
    _seed_one_team()
    client = make_authed_client()
    r = client.get("/api/employees")
    assert r.status_code == 200
    assert r.json()["data"]["total"] == 0
    assert r.json()["data"]["items"] == []


def test_list_employees_paginates():
    team_id = _seed_one_team()
    _add_employees(team_id, count=25)
    client = make_authed_client()

    r = client.get("/api/employees?page=1&page_size=10")
    body = r.json()["data"]
    assert body["total"] == 25
    assert body["page"] == 1
    assert body["page_size"] == 10
    assert len(body["items"]) == 10

    r2 = client.get("/api/employees?page=3&page_size=10")
    assert len(r2.json()["data"]["items"]) == 5


def test_list_employees_filters_by_shift():
    team_id = _seed_one_team()
    with SessionLocal() as db:
        db.add_all(
            [
                Employee(
                    name="أ",
                    rank="ج",
                    specialty="ح",
                    date_of_birth=date(1990, 1, 1),
                    marital_status="أعزب",
                    physical_ability="جيد",
                    national_id="1000000001",
                    phone="0500000001",
                    team_id=team_id,
                    shift="صباحية",
                ),
                Employee(
                    name="ب",
                    rank="ج",
                    specialty="ح",
                    date_of_birth=date(1990, 1, 1),
                    marital_status="أعزب",
                    physical_ability="جيد",
                    national_id="1000000002",
                    phone="0500000002",
                    team_id=team_id,
                    shift="ليلية",
                ),
            ]
        )
        db.commit()

    client = make_authed_client()
    r = client.get("/api/employees?shift=صباحية")
    items = r.json()["data"]["items"]
    assert len(items) == 1
    assert items[0]["name"] == "أ"


def test_list_employees_searches_by_name():
    team_id = _seed_one_team()
    with SessionLocal() as db:
        db.add_all(
            [
                Employee(
                    name="محمد",
                    rank="ج",
                    specialty="ح",
                    date_of_birth=date(1990, 1, 1),
                    marital_status="أعزب",
                    physical_ability="جيد",
                    national_id="1000000001",
                    phone="0500000001",
                    team_id=team_id,
                    shift="صباحية",
                ),
                Employee(
                    name="أحمد",
                    rank="ج",
                    specialty="ح",
                    date_of_birth=date(1990, 1, 1),
                    marital_status="أعزب",
                    physical_ability="جيد",
                    national_id="1000000002",
                    phone="0500000002",
                    team_id=team_id,
                    shift="صباحية",
                ),
            ]
        )
        db.commit()

    client = make_authed_client()
    r = client.get("/api/employees?q=محمد")
    items = r.json()["data"]["items"]
    assert len(items) == 1
    assert items[0]["name"] == "محمد"


def test_list_employees_requires_auth():
    from fastapi.testclient import TestClient

    from app.main import app

    client = TestClient(app)
    r = client.get("/api/employees")
    assert r.status_code == 401
