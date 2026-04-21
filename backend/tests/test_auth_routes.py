from fastapi.testclient import TestClient


def _client():
    from app.main import app

    return TestClient(app)


def test_setup_creates_chief_on_first_run():
    client = _client()
    r = client.post("/api/setup", json={"username": "chief", "password": "StrongPass1!"})
    assert r.status_code == 201
    assert r.json() == {"data": {"ok": True}}


def test_setup_rejected_when_chief_already_exists():
    client = _client()
    client.post("/api/setup", json={"username": "chief", "password": "StrongPass1!"})
    r = client.post("/api/setup", json={"username": "chief", "password": "StrongPass1!"})
    assert r.status_code == 409


def test_login_with_correct_credentials_sets_cookie():
    client = _client()
    client.post("/api/setup", json={"username": "chief", "password": "StrongPass1!"})

    r = client.post("/api/auth/login", json={"username": "chief", "password": "StrongPass1!"})
    assert r.status_code == 200
    assert r.json() == {"data": {"ok": True}}
    assert "markaz_session" in r.cookies


def test_login_with_wrong_password_returns_401():
    client = _client()
    client.post("/api/setup", json={"username": "chief", "password": "StrongPass1!"})
    r = client.post("/api/auth/login", json={"username": "chief", "password": "WrongPass9!"})
    assert r.status_code == 401


def test_lockout_after_five_failed_attempts():
    client = _client()
    client.post("/api/setup", json={"username": "chief", "password": "StrongPass1!"})
    for _ in range(5):
        client.post("/api/auth/login", json={"username": "chief", "password": "WrongPass9!"})
    r = client.post("/api/auth/login", json={"username": "chief", "password": "StrongPass1!"})
    assert r.status_code == 429


def test_logout_clears_cookie():
    client = _client()
    client.post("/api/setup", json={"username": "chief", "password": "StrongPass1!"})
    client.post("/api/auth/login", json={"username": "chief", "password": "StrongPass1!"})
    r = client.post("/api/auth/logout")
    assert r.status_code == 200
