from tests.helpers.auth import make_authed_client


def _payload() -> dict:
    return {
        "item_name": "خرطوم احتياطي",
        "category": "معدات إطفاء",
        "quantity": 10,
        "location": "مخزن المعدات",
        "min_threshold": 5,
        "notes": "",
    }


def test_create_and_list_inventory():
    client = make_authed_client()
    r = client.post("/api/building/inventory", json=_payload())
    assert r.status_code == 201
    r = client.get("/api/building/inventory")
    assert r.json()["data"]["total"] == 1


def test_update_inventory():
    client = make_authed_client()
    iid = client.post("/api/building/inventory", json=_payload()).json()["data"]["id"]
    r = client.patch(f"/api/building/inventory/{iid}", json={"quantity": 3})
    assert r.json()["data"]["quantity"] == 3


def test_delete_inventory():
    client = make_authed_client()
    iid = client.post("/api/building/inventory", json=_payload()).json()["data"]["id"]
    r = client.delete(f"/api/building/inventory/{iid}")
    assert r.status_code == 204


def test_patch_unknown_inventory_returns_404():
    client = make_authed_client()
    r = client.patch("/api/building/inventory/99999", json={"quantity": 1})
    assert r.status_code == 404
