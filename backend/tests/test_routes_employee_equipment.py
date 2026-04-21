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
            national_id="6666666666",
            phone="0500000000",
            team_id=team.id,
            shift="صباحية",
        )
        db.add(emp)
        db.commit()
        return emp.id


def _payload() -> dict:
    return {
        "item_name": "بدلة إطفاء",
        "serial_number": "UF-123",
        "assigned_date": "2024-03-10",
        "condition": "ممتاز",
    }


def test_create_list_equipment():
    emp_id = _seed_employee()
    client = make_authed_client()
    r = client.post(f"/api/employees/{emp_id}/equipment", json=_payload())
    assert r.status_code == 201
    r = client.get(f"/api/employees/{emp_id}/equipment")
    assert r.json()["data"]["total"] == 1


def test_update_equipment():
    emp_id = _seed_employee()
    client = make_authed_client()
    eid = client.post(f"/api/employees/{emp_id}/equipment", json=_payload()).json()["data"]["id"]
    r = client.patch(f"/api/employees/{emp_id}/equipment/{eid}", json={"condition": "متوسط"})
    assert r.json()["data"]["condition"] == "متوسط"


def test_delete_equipment():
    emp_id = _seed_employee()
    client = make_authed_client()
    eid = client.post(f"/api/employees/{emp_id}/equipment", json=_payload()).json()["data"]["id"]
    r = client.delete(f"/api/employees/{emp_id}/equipment/{eid}")
    assert r.status_code == 204
