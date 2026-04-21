from app.db import SessionLocal
from app.models import Team
from tests.helpers.auth import make_authed_client


def test_get_teams_returns_all_teams():
    with SessionLocal() as db:
        db.add_all(
            [
                Team(name="الفريق أ", description="الأولى"),
                Team(name="الفريق ب", description="الثانية"),
            ]
        )
        db.commit()

    client = make_authed_client()
    r = client.get("/api/teams")
    assert r.status_code == 200
    payload = r.json()
    assert payload["data"]["total"] == 2
    names = {t["name"] for t in payload["data"]["items"]}
    assert names == {"الفريق أ", "الفريق ب"}


def test_get_teams_requires_authentication():
    from fastapi.testclient import TestClient

    from app.main import app

    client = TestClient(app)
    r = client.get("/api/teams")
    assert r.status_code == 401
