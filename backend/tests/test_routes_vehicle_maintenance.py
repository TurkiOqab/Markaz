from app.db import SessionLocal
from app.models import Vehicle
from tests.helpers.auth import make_authed_client


def _seed_vehicle() -> int:
    with SessionLocal() as db:
        v = Vehicle(type="إطفاء", plate_number="M-1", status="في الخدمة")
        db.add(v)
        db.commit()
        return v.id


def _payload() -> dict:
    return {
        "date": "2026-03-01",
        "description": "تغيير زيت",
        "cost": 500,
        "contractor": "ورشة",
        "status": "مكتمل",
    }


def test_create_and_list_maintenance():
    vid = _seed_vehicle()
    client = make_authed_client()
    r = client.post(f"/api/vehicles/{vid}/maintenance", json=_payload())
    assert r.status_code == 201
    r = client.get(f"/api/vehicles/{vid}/maintenance")
    assert r.json()["data"]["total"] == 1


def test_update_maintenance():
    vid = _seed_vehicle()
    client = make_authed_client()
    mid = client.post(f"/api/vehicles/{vid}/maintenance", json=_payload()).json()["data"]["id"]
    r = client.patch(
        f"/api/vehicles/{vid}/maintenance/{mid}",
        json={"status": "قيد التنفيذ"},
    )
    assert r.json()["data"]["status"] == "قيد التنفيذ"


def test_delete_maintenance():
    vid = _seed_vehicle()
    client = make_authed_client()
    mid = client.post(f"/api/vehicles/{vid}/maintenance", json=_payload()).json()["data"]["id"]
    r = client.delete(f"/api/vehicles/{vid}/maintenance/{mid}")
    assert r.status_code == 204


def test_maintenance_on_unknown_vehicle_404():
    client = make_authed_client()
    r = client.post("/api/vehicles/99999/maintenance", json=_payload())
    assert r.status_code == 404
