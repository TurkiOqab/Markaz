from datetime import date as _date

from app.db import SessionLocal
from app.models import Employee, Team, Vehicle
from tests.helpers.auth import make_authed_client


def _add_vehicles() -> None:
    with SessionLocal() as db:
        db.add_all(
            [
                Vehicle(type="إطفاء", plate_number="A-1", status="في الخدمة"),
                Vehicle(type="إسعاف", plate_number="A-2", status="صيانة"),
                Vehicle(type="إنقاذ", plate_number="A-3", status="في الخدمة"),
            ]
        )
        db.commit()


def _seed_team_and_driver() -> int:
    with SessionLocal() as db:
        team = Team(name="الفريق أ")
        db.add(team)
        db.commit()
        emp = Employee(
            name="سائق",
            rank="ج",
            specialty="ح",
            date_of_birth=_date(1990, 1, 1),
            marital_status="أعزب",
            physical_ability="جيد",
            national_id="8888888888",
            phone="0500000000",
            team_id=team.id,
            shift="صباحية",
        )
        db.add(emp)
        db.commit()
        return emp.id


def _payload(plate: str = "NEW-1", driver_id: int | None = None) -> dict:
    return {
        "type": "إطفاء",
        "plate_number": plate,
        "status": "في الخدمة",
        "driver_id": driver_id,
    }


def test_list_vehicles_empty():
    client = make_authed_client()
    r = client.get("/api/vehicles")
    assert r.status_code == 200
    assert r.json()["data"]["total"] == 0


def test_list_vehicles_returns_all():
    _add_vehicles()
    client = make_authed_client()
    r = client.get("/api/vehicles")
    assert r.status_code == 200
    body = r.json()["data"]
    assert body["total"] == 3
    assert len(body["items"]) == 3


def test_list_vehicles_filters_by_status():
    _add_vehicles()
    client = make_authed_client()
    r = client.get("/api/vehicles?status=صيانة")
    items = r.json()["data"]["items"]
    assert len(items) == 1
    assert items[0]["plate_number"] == "A-2"


def test_list_vehicles_filters_by_type():
    _add_vehicles()
    client = make_authed_client()
    r = client.get("/api/vehicles?type=إسعاف")
    items = r.json()["data"]["items"]
    assert len(items) == 1


def test_list_vehicles_searches_by_plate():
    _add_vehicles()
    client = make_authed_client()
    r = client.get("/api/vehicles?q=A-2")
    items = r.json()["data"]["items"]
    assert len(items) == 1


def test_list_vehicles_requires_auth():
    from fastapi.testclient import TestClient

    from app.main import app

    client = TestClient(app)
    r = client.get("/api/vehicles")
    assert r.status_code == 401


def test_get_vehicle_returns_full_record():
    _add_vehicles()
    with SessionLocal() as db:
        vid = db.query(Vehicle).first().id
    client = make_authed_client()
    r = client.get(f"/api/vehicles/{vid}")
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["plate_number"] == "A-1"
    assert data["maintenance"] == []


def test_get_vehicle_404_for_unknown():
    client = make_authed_client()
    r = client.get("/api/vehicles/99999")
    assert r.status_code == 404


def test_create_vehicle_returns_201():
    client = make_authed_client()
    r = client.post("/api/vehicles", json=_payload())
    assert r.status_code == 201
    assert r.json()["data"]["plate_number"] == "NEW-1"


def test_create_vehicle_with_driver():
    driver_id = _seed_team_and_driver()
    client = make_authed_client()
    r = client.post("/api/vehicles", json=_payload(driver_id=driver_id))
    assert r.status_code == 201
    assert r.json()["data"]["driver_id"] == driver_id


def test_create_vehicle_rejects_duplicate_plate():
    client = make_authed_client()
    client.post("/api/vehicles", json=_payload())
    r = client.post("/api/vehicles", json=_payload())
    assert r.status_code == 409


def test_create_vehicle_with_unknown_driver_returns_422():
    client = make_authed_client()
    r = client.post("/api/vehicles", json=_payload(driver_id=99999))
    assert r.status_code == 422


def test_patch_vehicle_updates_fields():
    client = make_authed_client()
    vid = client.post("/api/vehicles", json=_payload()).json()["data"]["id"]
    r = client.patch(f"/api/vehicles/{vid}", json={"status": "صيانة"})
    assert r.status_code == 200
    assert r.json()["data"]["status"] == "صيانة"


def test_patch_vehicle_404_for_unknown():
    client = make_authed_client()
    r = client.patch("/api/vehicles/99999", json={"status": "صيانة"})
    assert r.status_code == 404


def test_delete_vehicle_removes_record():
    client = make_authed_client()
    vid = client.post("/api/vehicles", json=_payload()).json()["data"]["id"]
    r = client.delete(f"/api/vehicles/{vid}")
    assert r.status_code == 204
    assert client.get(f"/api/vehicles/{vid}").status_code == 404


def test_delete_vehicle_404_for_unknown():
    client = make_authed_client()
    r = client.delete("/api/vehicles/99999")
    assert r.status_code == 404
