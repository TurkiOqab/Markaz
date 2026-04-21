from io import BytesIO

from PIL import Image

from app.db import SessionLocal
from app.models import Vehicle
from tests.helpers.auth import make_authed_client


def _png_bytes() -> bytes:
    img = Image.new("RGB", (32, 32), color="blue")
    buf = BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _seed_vehicle() -> int:
    with SessionLocal() as db:
        v = Vehicle(type="إطفاء", plate_number="P-1", status="في الخدمة")
        db.add(v)
        db.commit()
        return v.id


def test_upload_photo_sets_photo_path():
    vid = _seed_vehicle()
    client = make_authed_client()
    r = client.post(
        f"/api/vehicles/{vid}/photo",
        files={"file": ("t.png", _png_bytes(), "image/png")},
    )
    assert r.status_code == 200, r.text
    assert r.json()["data"]["photo_path"].startswith("/uploads/vehicles/")


def test_upload_rejects_non_image():
    vid = _seed_vehicle()
    client = make_authed_client()
    r = client.post(
        f"/api/vehicles/{vid}/photo",
        files={"file": ("hack.exe", b"nope", "application/octet-stream")},
    )
    assert r.status_code == 415


def test_upload_to_unknown_vehicle_returns_404():
    client = make_authed_client()
    r = client.post(
        "/api/vehicles/99999/photo",
        files={"file": ("t.png", _png_bytes(), "image/png")},
    )
    assert r.status_code == 404
