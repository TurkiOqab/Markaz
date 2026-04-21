from tests.helpers.auth import make_authed_client


def _payload() -> dict:
    return {
        "date": "2026-03-15",
        "description": "صيانة التكييف",
        "cost": 2000,
        "contractor": "شركة التكييف",
        "status": "مكتمل",
    }


def test_create_and_list_maintenance():
    client = make_authed_client()
    r = client.post("/api/building/maintenance", json=_payload())
    assert r.status_code == 201
    r = client.get("/api/building/maintenance")
    assert r.json()["data"]["total"] == 1


def test_update_maintenance():
    client = make_authed_client()
    mid = client.post("/api/building/maintenance", json=_payload()).json()["data"]["id"]
    r = client.patch(
        f"/api/building/maintenance/{mid}",
        json={"status": "قيد التنفيذ"},
    )
    assert r.json()["data"]["status"] == "قيد التنفيذ"


def test_delete_maintenance():
    client = make_authed_client()
    mid = client.post("/api/building/maintenance", json=_payload()).json()["data"]["id"]
    r = client.delete(f"/api/building/maintenance/{mid}")
    assert r.status_code == 204
