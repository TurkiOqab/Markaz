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


def test_get_employee_returns_full_record_with_nested():
    team_id = _seed_one_team()
    with SessionLocal() as db:
        emp = Employee(
            name="محمد",
            rank="رائد",
            specialty="مكافحة حرائق",
            date_of_birth=date(1980, 3, 1),
            marital_status="متزوج",
            physical_ability="ممتاز",
            national_id="1111111111",
            phone="0500000000",
            team_id=team_id,
            shift="صباحية",
        )
        db.add(emp)
        db.commit()
        emp_id = emp.id

    client = make_authed_client()
    r = client.get(f"/api/employees/{emp_id}")
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["name"] == "محمد"
    assert data["certifications"] == []
    assert data["equipment"] == []
    assert data["monthly_ratings"] == []


def test_get_employee_returns_404_for_unknown():
    client = make_authed_client()
    r = client.get("/api/employees/99999")
    assert r.status_code == 404


def _new_payload(team_id: int) -> dict:
    return {
        "name": "موظف جديد",
        "rank": "نقيب",
        "specialty": "إنقاذ",
        "date_of_birth": "1990-05-10",
        "marital_status": "متزوج",
        "physical_ability": "ممتاز",
        "national_id": "9999999999",
        "phone": "0500000099",
        "email": "new@markaz.gov.sa",
        "team_id": team_id,
        "shift": "صباحية",
    }


def test_create_employee_returns_201_with_new_record():
    team_id = _seed_one_team()
    client = make_authed_client()
    r = client.post("/api/employees", json=_new_payload(team_id))
    assert r.status_code == 201, r.text
    data = r.json()["data"]
    assert data["name"] == "موظف جديد"
    assert isinstance(data["id"], int)


def test_create_employee_rejects_duplicate_national_id():
    team_id = _seed_one_team()
    client = make_authed_client()
    client.post("/api/employees", json=_new_payload(team_id))
    r = client.post("/api/employees", json=_new_payload(team_id))
    assert r.status_code == 409


def test_create_employee_rejects_invalid_enum():
    team_id = _seed_one_team()
    payload = _new_payload(team_id)
    payload["shift"] = "مساء"
    client = make_authed_client()
    r = client.post("/api/employees", json=payload)
    assert r.status_code == 422


def test_patch_employee_updates_fields():
    team_id = _seed_one_team()
    client = make_authed_client()
    created = client.post("/api/employees", json=_new_payload(team_id)).json()["data"]
    emp_id = created["id"]

    r = client.patch(
        f"/api/employees/{emp_id}",
        json={"rank": "رائد", "shift": "ليلية"},
    )
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["rank"] == "رائد"
    assert data["shift"] == "ليلية"
    assert data["name"] == "موظف جديد"


def test_patch_employee_returns_404_for_unknown():
    client = make_authed_client()
    r = client.patch("/api/employees/99999", json={"rank": "رائد"})
    assert r.status_code == 404


def test_delete_employee_removes_record():
    team_id = _seed_one_team()
    client = make_authed_client()
    created = client.post("/api/employees", json=_new_payload(team_id)).json()["data"]
    emp_id = created["id"]

    r = client.delete(f"/api/employees/{emp_id}")
    assert r.status_code == 204
    assert client.get(f"/api/employees/{emp_id}").status_code == 404


def test_delete_employee_blocked_when_driver():
    from app.models import Vehicle

    team_id = _seed_one_team()
    client = make_authed_client()
    created = client.post("/api/employees", json=_new_payload(team_id)).json()["data"]
    emp_id = created["id"]

    with SessionLocal() as db:
        db.add(
            Vehicle(
                type="إطفاء",
                plate_number="TEST-1",
                status="في الخدمة",
                driver_id=emp_id,
            )
        )
        db.commit()

    r = client.delete(f"/api/employees/{emp_id}")
    assert r.status_code == 409


def test_delete_employee_returns_404_for_unknown():
    client = make_authed_client()
    r = client.delete("/api/employees/99999")
    assert r.status_code == 404
