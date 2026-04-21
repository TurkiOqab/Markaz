"""Helpers for tests that need an authenticated TestClient."""
from fastapi.testclient import TestClient


def make_authed_client() -> TestClient:
    """Return a TestClient already set up with a chief session cookie."""
    from app.main import app

    client = TestClient(app)
    client.post("/api/setup", json={"username": "chief", "password": "StrongPass1!"})
    r = client.post(
        "/api/auth/login", json={"username": "chief", "password": "StrongPass1!"}
    )
    assert r.status_code == 200, r.text
    return client
