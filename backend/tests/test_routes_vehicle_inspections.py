from app.db import SessionLocal
from app.models import Vehicle
from tests.helpers.auth import make_authed_client


def _seed_vehicle() -> int:
    with SessionLocal() as db:
        v = Vehicle(type="إطفاء", plate_number="I-1", status="في الخدمة")
        db.add(v)
        db.commit()
        return v.id


def _payload() -> dict:
    return {
        "inspection_date": "2026-04-01",
        "inspector_name": "المفتش",
        "result": "ناجح",
        "notes": "",
    }


def test_create_and_list_inspections():
    vid = _seed_vehicle()
    client = make_authed_client()
    r = client.post(f"/api/vehicles/{vid}/inspections", json=_payload())
    assert r.status_code == 201
    r = client.get(f"/api/vehicles/{vid}/inspections")
    assert r.json()["data"]["total"] == 1


def test_update_inspection():
    vid = _seed_vehicle()
    client = make_authed_client()
    iid = client.post(f"/api/vehicles/{vid}/inspections", json=_payload()).json()["data"]["id"]
    r = client.patch(
        f"/api/vehicles/{vid}/inspections/{iid}",
        json={"result": "يحتاج صيانة"},
    )
    assert r.json()["data"]["result"] == "يحتاج صيانة"


def test_delete_inspection():
    vid = _seed_vehicle()
    client = make_authed_client()
    iid = client.post(f"/api/vehicles/{vid}/inspections", json=_payload()).json()["data"]["id"]
    r = client.delete(f"/api/vehicles/{vid}/inspections/{iid}")
    assert r.status_code == 204
