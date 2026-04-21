from io import BytesIO

from PIL import Image

from tests.helpers.auth import make_authed_client


def _png_bytes() -> bytes:
    img = Image.new("RGB", (32, 32), color="red")
    buf = BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _make_employee(client) -> int:
    from app.db import SessionLocal
    from app.models import Team

    with SessionLocal() as db:
        db.add(Team(name="الفريق أ"))
        db.commit()
        team_id = db.query(Team).first().id

    payload = {
        "name": "مع صورة",
        "rank": "جندي",
        "specialty": "إنقاذ",
        "date_of_birth": "1995-05-05",
        "marital_status": "أعزب",
        "physical_ability": "جيد",
        "national_id": "1234567890",
        "phone": "0500000001",
        "team_id": team_id,
        "shift": "صباحية",
    }
    return client.post("/api/employees", json=payload).json()["data"]["id"]


def test_upload_photo_sets_photo_path():
    client = make_authed_client()
    emp_id = _make_employee(client)

    r = client.post(
        f"/api/employees/{emp_id}/photo",
        files={"file": ("test.png", _png_bytes(), "image/png")},
    )
    assert r.status_code == 200, r.text
    data = r.json()["data"]
    assert data["photo_path"].startswith("/uploads/employees/")


def test_upload_rejects_non_image():
    client = make_authed_client()
    emp_id = _make_employee(client)

    r = client.post(
        f"/api/employees/{emp_id}/photo",
        files={"file": ("hack.exe", b"not an image", "application/octet-stream")},
    )
    assert r.status_code == 415


def test_upload_rejects_too_large():
    client = make_authed_client()
    emp_id = _make_employee(client)

    raw = b"x" * (5 * 1024 * 1024 + 1)
    r = client.post(
        f"/api/employees/{emp_id}/photo",
        files={"file": ("big.png", raw, "image/png")},
    )
    assert r.status_code in (413, 400)
