from tests.helpers.auth import make_authed_client


def _payload() -> dict:
    return {
        "date": "2026-04-01",
        "title": "تقرير الربع الأول",
        "summary": "ملخص التقرير",
        "file_path": None,
    }


def test_create_and_list_reports():
    client = make_authed_client()
    r = client.post("/api/building/reports", json=_payload())
    assert r.status_code == 201
    r = client.get("/api/building/reports")
    assert r.json()["data"]["total"] == 1


def test_update_report():
    client = make_authed_client()
    rid = client.post("/api/building/reports", json=_payload()).json()["data"]["id"]
    r = client.patch(
        f"/api/building/reports/{rid}",
        json={"title": "عنوان معدّل"},
    )
    assert r.json()["data"]["title"] == "عنوان معدّل"


def test_delete_report():
    client = make_authed_client()
    rid = client.post("/api/building/reports", json=_payload()).json()["data"]["id"]
    r = client.delete(f"/api/building/reports/{rid}")
    assert r.status_code == 204


def test_patch_unknown_report_returns_404():
    client = make_authed_client()
    r = client.patch("/api/building/reports/99999", json={"title": "x"})
    assert r.status_code == 404
