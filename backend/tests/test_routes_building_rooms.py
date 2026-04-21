from tests.helpers.auth import make_authed_client


def _payload() -> dict:
    return {
        "type": "غرفة نوم",
        "name": "غرفة رقم 1",
        "capacity": 4,
        "status": "جاهزة",
        "notes": "",
    }


def test_create_and_list_rooms():
    client = make_authed_client()
    r = client.post("/api/building/rooms", json=_payload())
    assert r.status_code == 201
    r = client.get("/api/building/rooms")
    assert r.json()["data"]["total"] == 1


def test_update_room():
    client = make_authed_client()
    rid = client.post("/api/building/rooms", json=_payload()).json()["data"]["id"]
    r = client.patch(f"/api/building/rooms/{rid}", json={"status": "صيانة"})
    assert r.json()["data"]["status"] == "صيانة"


def test_delete_room():
    client = make_authed_client()
    rid = client.post("/api/building/rooms", json=_payload()).json()["data"]["id"]
    r = client.delete(f"/api/building/rooms/{rid}")
    assert r.status_code == 204


def test_get_unknown_room_returns_404():
    client = make_authed_client()
    r = client.patch("/api/building/rooms/99999", json={"status": "صيانة"})
    assert r.status_code == 404


def test_rooms_requires_auth():
    from fastapi.testclient import TestClient

    from app.main import app

    client = TestClient(app)
    assert client.get("/api/building/rooms").status_code == 401
