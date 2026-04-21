from datetime import date

from app.db import SessionLocal
from app.models import Employee, Team
from tests.helpers.auth import make_authed_client


def _seed_employee() -> int:
    with SessionLocal() as db:
        team = Team(name="الفريق أ")
        db.add(team)
        db.commit()
        emp = Employee(
            name="م",
            rank="ج",
            specialty="ح",
            date_of_birth=date(1990, 1, 1),
            marital_status="أعزب",
            physical_ability="جيد",
            national_id="7777777777",
            phone="0500000000",
            team_id=team.id,
            shift="صباحية",
        )
        db.add(emp)
        db.commit()
        return emp.id


def test_create_and_list_ratings():
    emp_id = _seed_employee()
    client = make_authed_client()
    r = client.post(
        f"/api/employees/{emp_id}/ratings",
        json={"year": 2026, "month": 3, "rating": 4.5, "notes": ""},
    )
    assert r.status_code == 201
    r = client.get(f"/api/employees/{emp_id}/ratings")
    assert r.json()["data"]["total"] == 1


def test_duplicate_month_rejected():
    emp_id = _seed_employee()
    client = make_authed_client()
    p = {"year": 2026, "month": 3, "rating": 4.5, "notes": ""}
    assert client.post(f"/api/employees/{emp_id}/ratings", json=p).status_code == 201
    r = client.post(f"/api/employees/{emp_id}/ratings", json=p)
    assert r.status_code == 409


def test_update_rating():
    emp_id = _seed_employee()
    client = make_authed_client()
    rid = client.post(
        f"/api/employees/{emp_id}/ratings",
        json={"year": 2026, "month": 3, "rating": 4.0, "notes": ""},
    ).json()["data"]["id"]
    r = client.patch(
        f"/api/employees/{emp_id}/ratings/{rid}", json={"rating": 4.8}
    )
    assert r.json()["data"]["rating"] == 4.8


def test_delete_rating():
    emp_id = _seed_employee()
    client = make_authed_client()
    rid = client.post(
        f"/api/employees/{emp_id}/ratings",
        json={"year": 2026, "month": 3, "rating": 4.0, "notes": ""},
    ).json()["data"]["id"]
    r = client.delete(f"/api/employees/{emp_id}/ratings/{rid}")
    assert r.status_code == 204
