from app.db import SessionLocal
from app.models import Vehicle
from tests.helpers.auth import make_authed_client


def _seed_vehicle() -> int:
    with SessionLocal() as db:
        v = Vehicle(type="إطفاء", plate_number="E-1", status="في الخدمة")
        db.add(v)
        db.commit()
        return v.id


def _payload() -> dict:
    return {"item_name": "خرطوم 30 متر", "quantity": 4, "condition": "ممتاز"}


def test_create_and_list_equipment():
    vid = _seed_vehicle()
    client = make_authed_client()
    r = client.post(f"/api/vehicles/{vid}/equipment", json=_payload())
    assert r.status_code == 201
    r = client.get(f"/api/vehicles/{vid}/equipment")
    assert r.json()["data"]["total"] == 1


def test_update_equipment():
    vid = _seed_vehicle()
    client = make_authed_client()
    eid = client.post(f"/api/vehicles/{vid}/equipment", json=_payload()).json()["data"]["id"]
    r = client.patch(f"/api/vehicles/{vid}/equipment/{eid}", json={"quantity": 6})
    assert r.json()["data"]["quantity"] == 6


def test_delete_equipment():
    vid = _seed_vehicle()
    client = make_authed_client()
    eid = client.post(f"/api/vehicles/{vid}/equipment", json=_payload()).json()["data"]["id"]
    r = client.delete(f"/api/vehicles/{vid}/equipment/{eid}")
    assert r.status_code == 204
