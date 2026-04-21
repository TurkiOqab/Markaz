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
            national_id="5555555555",
            phone="0500000000",
            team_id=team.id,
            shift="صباحية",
        )
        db.add(emp)
        db.commit()
        return emp.id


def _payload() -> dict:
    return {
        "name": "شهادة الإنقاذ",
        "issuing_authority": "معهد الدفاع المدني",
        "issue_date": "2024-01-15",
        "expiry_date": "2029-01-15",
    }


def test_create_and_list_certifications():
    emp_id = _seed_employee()
    client = make_authed_client()

    r = client.post(f"/api/employees/{emp_id}/certifications", json=_payload())
    assert r.status_code == 201
    assert r.json()["data"]["name"] == "شهادة الإنقاذ"

    r = client.get(f"/api/employees/{emp_id}/certifications")
    assert r.status_code == 200
    assert r.json()["data"]["total"] == 1


def test_update_certification():
    emp_id = _seed_employee()
    client = make_authed_client()
    cid = client.post(
        f"/api/employees/{emp_id}/certifications", json=_payload()
    ).json()["data"]["id"]

    r = client.patch(
        f"/api/employees/{emp_id}/certifications/{cid}",
        json={"issuing_authority": "الهيئة السعودية"},
    )
    assert r.status_code == 200
    assert r.json()["data"]["issuing_authority"] == "الهيئة السعودية"


def test_delete_certification():
    emp_id = _seed_employee()
    client = make_authed_client()
    cid = client.post(
        f"/api/employees/{emp_id}/certifications", json=_payload()
    ).json()["data"]["id"]

    r = client.delete(f"/api/employees/{emp_id}/certifications/{cid}")
    assert r.status_code == 204
    assert client.get(f"/api/employees/{emp_id}/certifications").json()["data"]["total"] == 0


def test_create_cert_for_missing_employee_returns_404():
    client = make_authed_client()
    r = client.post("/api/employees/99999/certifications", json=_payload())
    assert r.status_code == 404
