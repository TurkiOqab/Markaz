from app.db import SessionLocal
from app.models import Building
from tests.helpers.auth import make_authed_client


def test_get_building_creates_singleton_on_first_call():
    client = make_authed_client()
    r = client.get("/api/building")
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["id"] == 1
    assert "name" in data and "address" in data


def test_get_building_returns_existing_row():
    with SessionLocal() as db:
        db.add(
            Building(
                id=1,
                name="المركز الرئيسي",
                address="الرياض",
                notes="مبنى رئيسي",
            )
        )
        db.commit()
    client = make_authed_client()
    r = client.get("/api/building")
    assert r.status_code == 200
    assert r.json()["data"]["name"] == "المركز الرئيسي"


def test_patch_building_updates_fields():
    client = make_authed_client()
    client.get("/api/building")
    r = client.patch(
        "/api/building",
        json={"name": "الاسم الجديد", "address": "عنوان جديد"},
    )
    assert r.status_code == 200
    assert r.json()["data"]["name"] == "الاسم الجديد"
    assert r.json()["data"]["address"] == "عنوان جديد"


def test_building_requires_auth():
    from fastapi.testclient import TestClient

    from app.main import app

    client = TestClient(app)
    assert client.get("/api/building").status_code == 401
    assert client.patch("/api/building", json={}).status_code == 401
