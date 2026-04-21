# Phase 3 — Backend: Vehicles API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full CRUD API for vehicles plus nested resources (maintenance, onboard equipment, inspections), a photo upload endpoint, and driver-reference handling. All endpoints require an authenticated chief session.

**Architecture:** Mirrors Phase 2 (employees). New `app/routes/vehicles.py` and `app/schemas/vehicles.py` follow the same patterns. `app/services/uploads.py` gains `save_vehicle_photo`. FK to `employees.id` for `driver_id` is enforced at DB level and surfaces as a clear Arabic 422 error.

**Tech Stack:** FastAPI, Pydantic 2.x, SQLAlchemy 2.x, pytest, Pillow (already installed).

---

## File Structure

```
backend/
├── app/
│   ├── main.py                       # register vehicles router
│   ├── schemas/
│   │   └── vehicles.py               # Vehicle + nested Pydantic models
│   ├── services/
│   │   └── uploads.py                # add save_vehicle_photo
│   └── routes/
│       └── vehicles.py               # /api/vehicles[/...]
└── tests/
    ├── test_routes_vehicles.py
    ├── test_routes_vehicle_photo.py
    ├── test_routes_vehicle_maintenance.py
    ├── test_routes_vehicle_equipment.py
    └── test_routes_vehicle_inspections.py
```

---

## Task 1: Add `save_vehicle_photo` to uploads service

**Files:**
- Modify: `backend/app/services/uploads.py`

- [ ] **Step 1: Replace `backend/app/services/uploads.py`**

```python
"""Photo upload service: save, delete, resolve URL."""

from io import BytesIO
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from PIL import Image, UnidentifiedImageError

from app.config import BACKEND_DIR

UPLOADS_DIR = BACKEND_DIR / "uploads"
EMPLOYEES_PHOTOS_DIR = UPLOADS_DIR / "employees"
VEHICLES_PHOTOS_DIR = UPLOADS_DIR / "vehicles"
MAX_PHOTO_BYTES = 5 * 1024 * 1024  # 5 MB
ALLOWED_PHOTO_EXT = {"jpg", "jpeg", "png", "webp"}


def _extension(filename: str) -> str:
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


def _save_photo(directory: Path, entity_id: int, url_prefix: str, upload: UploadFile) -> str:
    ext = _extension(upload.filename or "")
    if ext not in ALLOWED_PHOTO_EXT:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="نوع الملف غير مدعوم، استخدم JPG أو PNG أو WebP",
        )

    data = upload.file.read()
    if len(data) > MAX_PHOTO_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="حجم الملف كبير جداً (الحد الأقصى 5 ميجابايت)",
        )

    try:
        Image.open(BytesIO(data)).verify()
    except (UnidentifiedImageError, Exception) as err:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="الملف ليس صورة صالحة",
        ) from err

    directory.mkdir(parents=True, exist_ok=True)
    target = directory / f"{entity_id}.{ext}"
    for candidate in directory.glob(f"{entity_id}.*"):
        if candidate != target:
            candidate.unlink()
    target.write_bytes(data)
    return f"{url_prefix}/{target.name}"


def save_employee_photo(employee_id: int, upload: UploadFile) -> str:
    return _save_photo(EMPLOYEES_PHOTOS_DIR, employee_id, "/uploads/employees", upload)


def delete_employee_photo(employee_id: int) -> None:
    if not EMPLOYEES_PHOTOS_DIR.exists():
        return
    for candidate in EMPLOYEES_PHOTOS_DIR.glob(f"{employee_id}.*"):
        candidate.unlink()


def save_vehicle_photo(vehicle_id: int, upload: UploadFile) -> str:
    return _save_photo(VEHICLES_PHOTOS_DIR, vehicle_id, "/uploads/vehicles", upload)


def delete_vehicle_photo(vehicle_id: int) -> None:
    if not VEHICLES_PHOTOS_DIR.exists():
        return
    for candidate in VEHICLES_PHOTOS_DIR.glob(f"{vehicle_id}.*"):
        candidate.unlink()
```

- [ ] **Step 2: Verify existing photo test still passes**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_routes_employee_photo.py -v
```

Expected: `3 passed`.

- [ ] **Step 3: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add backend/app/services/uploads.py
git commit -m "refactor(backend): extract _save_photo helper and add save_vehicle_photo"
```

---

## Task 2: Vehicle schemas

**Files:**
- Create: `backend/app/schemas/vehicles.py`
- Modify: `backend/app/schemas/common.py` (add vehicle enums)

- [ ] **Step 1: Append enums to `backend/app/schemas/common.py`**

Add these after the existing enums:

```python
VehicleType = Literal["إطفاء", "إسعاف", "سلم", "قيادة", "إنقاذ"]
VehicleStatus = Literal["في الخدمة", "خارج الخدمة", "صيانة"]
MaintenanceStatus = Literal["مكتمل", "قيد التنفيذ", "مجدول", "ملغي"]
InspectionResult = Literal["ناجح", "يحتاج صيانة", "غير صالح"]
```

- [ ] **Step 2: Create `backend/app/schemas/vehicles.py`**

```python
from datetime import date, datetime

from pydantic import BaseModel, Field

from app.schemas.common import (
    EquipmentCondition,
    InspectionResult,
    MaintenanceStatus,
    OrmBase,
    VehicleStatus,
    VehicleType,
)

# ---------- Vehicle maintenance ----------


class VehicleMaintenanceBase(BaseModel):
    date: date
    description: str = Field(min_length=1, max_length=500)
    cost: float = Field(ge=0)
    contractor: str = Field(min_length=1, max_length=200)
    status: MaintenanceStatus


class VehicleMaintenanceCreate(VehicleMaintenanceBase):
    pass


class VehicleMaintenanceUpdate(BaseModel):
    date: date | None = None
    description: str | None = Field(default=None, min_length=1, max_length=500)
    cost: float | None = Field(default=None, ge=0)
    contractor: str | None = Field(default=None, min_length=1, max_length=200)
    status: MaintenanceStatus | None = None


class VehicleMaintenanceOut(OrmBase):
    id: int
    date: date
    description: str
    cost: float
    contractor: str
    status: MaintenanceStatus


# ---------- Onboard equipment ----------


class VehicleEquipmentBase(BaseModel):
    item_name: str = Field(min_length=1, max_length=200)
    quantity: int = Field(ge=0)
    condition: EquipmentCondition


class VehicleEquipmentCreate(VehicleEquipmentBase):
    pass


class VehicleEquipmentUpdate(BaseModel):
    item_name: str | None = Field(default=None, min_length=1, max_length=200)
    quantity: int | None = Field(default=None, ge=0)
    condition: EquipmentCondition | None = None


class VehicleEquipmentOut(OrmBase):
    id: int
    item_name: str
    quantity: int
    condition: EquipmentCondition


# ---------- Vehicle inspections ----------


class VehicleInspectionBase(BaseModel):
    inspection_date: date
    inspector_name: str = Field(min_length=1, max_length=200)
    result: InspectionResult
    notes: str | None = Field(default=None, max_length=1000)


class VehicleInspectionCreate(VehicleInspectionBase):
    pass


class VehicleInspectionUpdate(BaseModel):
    inspection_date: date | None = None
    inspector_name: str | None = Field(default=None, min_length=1, max_length=200)
    result: InspectionResult | None = None
    notes: str | None = Field(default=None, max_length=1000)


class VehicleInspectionOut(OrmBase):
    id: int
    inspection_date: date
    inspector_name: str
    result: InspectionResult
    notes: str | None = None


# ---------- Vehicles ----------


class VehicleBase(BaseModel):
    type: VehicleType
    plate_number: str = Field(min_length=1, max_length=30)
    status: VehicleStatus
    driver_id: int | None = None


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(BaseModel):
    type: VehicleType | None = None
    plate_number: str | None = Field(default=None, min_length=1, max_length=30)
    status: VehicleStatus | None = None
    driver_id: int | None = None


class VehicleSummary(OrmBase):
    id: int
    type: VehicleType
    plate_number: str
    status: VehicleStatus
    driver_id: int | None = None
    photo_path: str | None = None


class VehicleRead(OrmBase):
    id: int
    type: VehicleType
    plate_number: str
    status: VehicleStatus
    driver_id: int | None = None
    photo_path: str | None = None
    created_at: datetime
    updated_at: datetime
    maintenance: list[VehicleMaintenanceOut] = []
    equipment: list[VehicleEquipmentOut] = []
    inspections: list[VehicleInspectionOut] = []
```

- [ ] **Step 3: Verify imports**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
python -c "from app.schemas.vehicles import VehicleCreate, VehicleRead, VehicleSummary; print('OK')"
```

Expected: `OK`.

- [ ] **Step 4: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add backend/app/schemas/common.py backend/app/schemas/vehicles.py
git commit -m "feat(backend): add vehicle Pydantic schemas and enums"
```

---

## Task 3: Vehicle list + get-by-id (TDD)

**Files:**
- Create: `backend/app/routes/vehicles.py`
- Create: `backend/tests/test_routes_vehicles.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Write failing tests**

Create `backend/tests/test_routes_vehicles.py`:

```python
from app.db import SessionLocal
from app.models import Vehicle
from tests.helpers.auth import make_authed_client


def _add_vehicles() -> None:
    with SessionLocal() as db:
        db.add_all(
            [
                Vehicle(type="إطفاء", plate_number="A-1", status="في الخدمة"),
                Vehicle(type="إسعاف", plate_number="A-2", status="صيانة"),
                Vehicle(type="إنقاذ", plate_number="A-3", status="في الخدمة"),
            ]
        )
        db.commit()


def test_list_vehicles_empty():
    client = make_authed_client()
    r = client.get("/api/vehicles")
    assert r.status_code == 200
    assert r.json()["data"]["total"] == 0


def test_list_vehicles_returns_all():
    _add_vehicles()
    client = make_authed_client()
    r = client.get("/api/vehicles")
    assert r.status_code == 200
    body = r.json()["data"]
    assert body["total"] == 3
    assert len(body["items"]) == 3


def test_list_vehicles_filters_by_status():
    _add_vehicles()
    client = make_authed_client()
    r = client.get("/api/vehicles?status=صيانة")
    items = r.json()["data"]["items"]
    assert len(items) == 1
    assert items[0]["plate_number"] == "A-2"


def test_list_vehicles_filters_by_type():
    _add_vehicles()
    client = make_authed_client()
    r = client.get("/api/vehicles?type=إسعاف")
    items = r.json()["data"]["items"]
    assert len(items) == 1
    assert items[0]["plate_number"] == "A-2"


def test_list_vehicles_searches_by_plate():
    _add_vehicles()
    client = make_authed_client()
    r = client.get("/api/vehicles?q=A-2")
    items = r.json()["data"]["items"]
    assert len(items) == 1


def test_list_vehicles_requires_auth():
    from fastapi.testclient import TestClient

    from app.main import app

    client = TestClient(app)
    r = client.get("/api/vehicles")
    assert r.status_code == 401


def test_get_vehicle_returns_full_record():
    _add_vehicles()
    with SessionLocal() as db:
        vid = db.query(Vehicle).first().id

    client = make_authed_client()
    r = client.get(f"/api/vehicles/{vid}")
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["plate_number"] == "A-1"
    assert data["maintenance"] == []
    assert data["equipment"] == []
    assert data["inspections"] == []


def test_get_vehicle_404_for_unknown():
    client = make_authed_client()
    r = client.get("/api/vehicles/99999")
    assert r.status_code == 404
```

- [ ] **Step 2: Run — expect fail**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_routes_vehicles.py -v
```

Expected: 404s (endpoint not yet registered).

- [ ] **Step 3: Create `backend/app/routes/vehicles.py`**

```python
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_chief
from app.models import Chief, Vehicle
from app.schemas.common import ListResponse, VehicleStatus, VehicleType
from app.schemas.vehicles import VehicleRead, VehicleSummary

router = APIRouter(prefix="/api/vehicles", tags=["vehicles"])


@router.get("")
def list_vehicles(
    q: str | None = Query(default=None, description="Search by plate number"),
    type: VehicleType | None = None,
    status_: VehicleStatus | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=200),
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    stmt = select(Vehicle)
    filters = []
    if q:
        filters.append(or_(Vehicle.plate_number.like(f"%{q}%")))
    if type is not None:
        filters.append(Vehicle.type == type)
    if status_ is not None:
        filters.append(Vehicle.status == status_)
    if filters:
        stmt = stmt.where(*filters)

    total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar_one()
    rows = (
        db.execute(stmt.order_by(Vehicle.id).offset((page - 1) * page_size).limit(page_size))
        .scalars()
        .all()
    )
    items = [VehicleSummary.model_validate(v) for v in rows]
    return {
        "data": ListResponse[VehicleSummary](
            items=items, total=total, page=page, page_size=page_size
        ).model_dump()
    }


@router.get("/{vehicle_id}")
def get_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    veh = db.get(Vehicle, vehicle_id)
    if veh is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="المركبة غير موجودة")
    return {"data": VehicleRead.model_validate(veh).model_dump(mode="json")}
```

- [ ] **Step 4: Register router in `backend/app/main.py`**

Replace with:

```python
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.auth.routes import router as auth_router
from app.config import BACKEND_DIR
from app.routes.employees import router as employees_router
from app.routes.teams import router as teams_router
from app.routes.vehicles import router as vehicles_router

app = FastAPI(title="Markaz", version="0.1.0")
app.include_router(auth_router)
app.include_router(teams_router)
app.include_router(employees_router)
app.include_router(vehicles_router)

(BACKEND_DIR / "uploads").mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=BACKEND_DIR / "uploads"), name="uploads")


@app.get("/api/health")
def health() -> dict:
    return {"data": {"status": "ok"}}
```

- [ ] **Step 5: Run — expect pass**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_routes_vehicles.py -v
```

Expected: `8 passed`.

- [ ] **Step 6: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add backend/app/routes/vehicles.py backend/app/main.py backend/tests/test_routes_vehicles.py
git commit -m "feat(backend): add GET /api/vehicles and GET /api/vehicles/{id}"
```

---

## Task 4: Vehicle create/update/delete (TDD)

**Files:**
- Modify: `backend/app/routes/vehicles.py`
- Modify: `backend/tests/test_routes_vehicles.py`

- [ ] **Step 1: Append tests**

Append to `backend/tests/test_routes_vehicles.py`:

```python
from datetime import date as _date

from app.models import Employee, Team


def _seed_team_and_driver() -> int:
    with SessionLocal() as db:
        team = Team(name="الفريق أ")
        db.add(team)
        db.commit()
        emp = Employee(
            name="سائق",
            rank="ج",
            specialty="ح",
            date_of_birth=_date(1990, 1, 1),
            marital_status="أعزب",
            physical_ability="جيد",
            national_id="8888888888",
            phone="0500000000",
            team_id=team.id,
            shift="صباحية",
        )
        db.add(emp)
        db.commit()
        return emp.id


def _payload(plate: str = "NEW-1", driver_id: int | None = None) -> dict:
    return {
        "type": "إطفاء",
        "plate_number": plate,
        "status": "في الخدمة",
        "driver_id": driver_id,
    }


def test_create_vehicle_returns_201():
    client = make_authed_client()
    r = client.post("/api/vehicles", json=_payload())
    assert r.status_code == 201
    assert r.json()["data"]["plate_number"] == "NEW-1"


def test_create_vehicle_with_driver():
    driver_id = _seed_team_and_driver()
    client = make_authed_client()
    r = client.post("/api/vehicles", json=_payload(driver_id=driver_id))
    assert r.status_code == 201
    assert r.json()["data"]["driver_id"] == driver_id


def test_create_vehicle_rejects_duplicate_plate():
    client = make_authed_client()
    client.post("/api/vehicles", json=_payload())
    r = client.post("/api/vehicles", json=_payload())
    assert r.status_code == 409


def test_create_vehicle_with_unknown_driver_returns_422():
    client = make_authed_client()
    r = client.post("/api/vehicles", json=_payload(driver_id=99999))
    assert r.status_code == 422


def test_patch_vehicle_updates_fields():
    client = make_authed_client()
    vid = client.post("/api/vehicles", json=_payload()).json()["data"]["id"]
    r = client.patch(f"/api/vehicles/{vid}", json={"status": "صيانة"})
    assert r.status_code == 200
    assert r.json()["data"]["status"] == "صيانة"


def test_patch_vehicle_404_for_unknown():
    client = make_authed_client()
    r = client.patch("/api/vehicles/99999", json={"status": "صيانة"})
    assert r.status_code == 404


def test_delete_vehicle_removes_record():
    client = make_authed_client()
    vid = client.post("/api/vehicles", json=_payload()).json()["data"]["id"]
    r = client.delete(f"/api/vehicles/{vid}")
    assert r.status_code == 204
    assert client.get(f"/api/vehicles/{vid}").status_code == 404


def test_delete_vehicle_404_for_unknown():
    client = make_authed_client()
    r = client.delete("/api/vehicles/99999")
    assert r.status_code == 404
```

- [ ] **Step 2: Run — expect fail**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_routes_vehicles.py -v
```

Expected: 405s on POST/PATCH/DELETE (not yet implemented).

- [ ] **Step 3: Add handlers to `backend/app/routes/vehicles.py`**

Update imports:

```python
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_chief
from app.models import Chief, Employee, Vehicle
from app.schemas.common import ListResponse, VehicleStatus, VehicleType
from app.schemas.vehicles import (
    VehicleCreate,
    VehicleRead,
    VehicleSummary,
    VehicleUpdate,
)
```

Add a helper at module level (after existing imports, before the first `@router`):

```python
def _validate_driver(db: Session, driver_id: int | None) -> None:
    if driver_id is None:
        return
    if db.get(Employee, driver_id) is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="السائق غير موجود",
        )
```

Append handlers:

```python
@router.post("", status_code=status.HTTP_201_CREATED)
def create_vehicle(
    payload: VehicleCreate,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    _validate_driver(db, payload.driver_id)
    veh = Vehicle(**payload.model_dump())
    db.add(veh)
    try:
        db.commit()
    except IntegrityError as err:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="رقم اللوحة مستخدم مسبقاً",
        ) from err
    db.refresh(veh)
    return {"data": VehicleRead.model_validate(veh).model_dump(mode="json")}


@router.patch("/{vehicle_id}")
def update_vehicle(
    vehicle_id: int,
    payload: VehicleUpdate,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    veh = db.get(Vehicle, vehicle_id)
    if veh is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="المركبة غير موجودة")
    data = payload.model_dump(exclude_unset=True)
    if "driver_id" in data:
        _validate_driver(db, data["driver_id"])
    for field, value in data.items():
        setattr(veh, field, value)
    try:
        db.commit()
    except IntegrityError as err:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="رقم اللوحة مستخدم مسبقاً",
        ) from err
    db.refresh(veh)
    return {"data": VehicleRead.model_validate(veh).model_dump(mode="json")}


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> Response:
    veh = db.get(Vehicle, vehicle_id)
    if veh is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="المركبة غير موجودة")
    db.delete(veh)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
```

- [ ] **Step 4: Run — expect pass**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_routes_vehicles.py -v
```

Expected: `16 passed` (8 existing + 8 new).

- [ ] **Step 5: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add backend/app/routes/vehicles.py backend/tests/test_routes_vehicles.py
git commit -m "feat(backend): add POST, PATCH, DELETE for /api/vehicles"
```

---

## Task 5: Vehicle photo upload (TDD)

**Files:**
- Modify: `backend/app/routes/vehicles.py`
- Create: `backend/tests/test_routes_vehicle_photo.py`

- [ ] **Step 1: Write failing tests**

Create `backend/tests/test_routes_vehicle_photo.py`:

```python
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
```

- [ ] **Step 2: Run — expect fail**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_routes_vehicle_photo.py -v
```

Expected: 405.

- [ ] **Step 3: Add the handler to `backend/app/routes/vehicles.py`**

Update imports — add:

```python
from fastapi import File, UploadFile
from app.services.uploads import save_vehicle_photo
```

Append:

```python
@router.post("/{vehicle_id}/photo")
def upload_photo(
    vehicle_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    veh = db.get(Vehicle, vehicle_id)
    if veh is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="المركبة غير موجودة")
    veh.photo_path = save_vehicle_photo(vehicle_id, file)
    db.commit()
    db.refresh(veh)
    return {"data": VehicleRead.model_validate(veh).model_dump(mode="json")}
```

- [ ] **Step 4: Run — expect pass**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_routes_vehicle_photo.py -v
```

Expected: `3 passed`.

- [ ] **Step 5: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add backend/app/routes/vehicles.py backend/tests/test_routes_vehicle_photo.py
git commit -m "feat(backend): add POST /api/vehicles/{id}/photo"
```

---

## Task 6: Vehicle maintenance CRUD (TDD)

**Files:**
- Modify: `backend/app/routes/vehicles.py`
- Create: `backend/tests/test_routes_vehicle_maintenance.py`

- [ ] **Step 1: Write failing tests**

Create `backend/tests/test_routes_vehicle_maintenance.py`:

```python
from app.db import SessionLocal
from app.models import Vehicle
from tests.helpers.auth import make_authed_client


def _seed_vehicle() -> int:
    with SessionLocal() as db:
        v = Vehicle(type="إطفاء", plate_number="M-1", status="في الخدمة")
        db.add(v)
        db.commit()
        return v.id


def _payload() -> dict:
    return {
        "date": "2026-03-01",
        "description": "تغيير زيت",
        "cost": 500,
        "contractor": "ورشة",
        "status": "مكتمل",
    }


def test_create_and_list_maintenance():
    vid = _seed_vehicle()
    client = make_authed_client()
    r = client.post(f"/api/vehicles/{vid}/maintenance", json=_payload())
    assert r.status_code == 201
    r = client.get(f"/api/vehicles/{vid}/maintenance")
    assert r.json()["data"]["total"] == 1


def test_update_maintenance():
    vid = _seed_vehicle()
    client = make_authed_client()
    mid = client.post(
        f"/api/vehicles/{vid}/maintenance", json=_payload()
    ).json()["data"]["id"]
    r = client.patch(
        f"/api/vehicles/{vid}/maintenance/{mid}",
        json={"status": "قيد التنفيذ"},
    )
    assert r.json()["data"]["status"] == "قيد التنفيذ"


def test_delete_maintenance():
    vid = _seed_vehicle()
    client = make_authed_client()
    mid = client.post(
        f"/api/vehicles/{vid}/maintenance", json=_payload()
    ).json()["data"]["id"]
    r = client.delete(f"/api/vehicles/{vid}/maintenance/{mid}")
    assert r.status_code == 204


def test_maintenance_on_unknown_vehicle_404():
    client = make_authed_client()
    r = client.post("/api/vehicles/99999/maintenance", json=_payload())
    assert r.status_code == 404
```

- [ ] **Step 2: Run — expect fail**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_routes_vehicle_maintenance.py -v
```

- [ ] **Step 3: Add handlers to `backend/app/routes/vehicles.py`**

Update imports — add:

```python
from app.models import VehicleMaintenance
from app.schemas.vehicles import (
    VehicleMaintenanceCreate,
    VehicleMaintenanceOut,
    VehicleMaintenanceUpdate,
)
```

Append:

```python
def _get_vehicle_or_404(db: Session, vehicle_id: int) -> Vehicle:
    veh = db.get(Vehicle, vehicle_id)
    if veh is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="المركبة غير موجودة")
    return veh


# ---------- Maintenance ----------


@router.get("/{vehicle_id}/maintenance")
def list_maintenance(
    vehicle_id: int,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    _get_vehicle_or_404(db, vehicle_id)
    rows = (
        db.execute(
            select(VehicleMaintenance)
            .where(VehicleMaintenance.vehicle_id == vehicle_id)
            .order_by(VehicleMaintenance.date.desc())
        )
        .scalars()
        .all()
    )
    items = [VehicleMaintenanceOut.model_validate(m) for m in rows]
    return {
        "data": ListResponse[VehicleMaintenanceOut](
            items=items, total=len(items), page=1, page_size=len(items) or 1
        ).model_dump(mode="json")
    }


@router.post("/{vehicle_id}/maintenance", status_code=status.HTTP_201_CREATED)
def create_maintenance(
    vehicle_id: int,
    payload: VehicleMaintenanceCreate,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    _get_vehicle_or_404(db, vehicle_id)
    m = VehicleMaintenance(vehicle_id=vehicle_id, **payload.model_dump())
    db.add(m)
    db.commit()
    db.refresh(m)
    return {"data": VehicleMaintenanceOut.model_validate(m).model_dump(mode="json")}


@router.patch("/{vehicle_id}/maintenance/{maintenance_id}")
def update_maintenance(
    vehicle_id: int,
    maintenance_id: int,
    payload: VehicleMaintenanceUpdate,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    _get_vehicle_or_404(db, vehicle_id)
    m = db.get(VehicleMaintenance, maintenance_id)
    if m is None or m.vehicle_id != vehicle_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="سجل الصيانة غير موجود"
        )
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(m, field, value)
    db.commit()
    db.refresh(m)
    return {"data": VehicleMaintenanceOut.model_validate(m).model_dump(mode="json")}


@router.delete(
    "/{vehicle_id}/maintenance/{maintenance_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_maintenance(
    vehicle_id: int,
    maintenance_id: int,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> Response:
    _get_vehicle_or_404(db, vehicle_id)
    m = db.get(VehicleMaintenance, maintenance_id)
    if m is None or m.vehicle_id != vehicle_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="سجل الصيانة غير موجود"
        )
    db.delete(m)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
```

- [ ] **Step 4: Run — expect pass**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_routes_vehicle_maintenance.py -v
```

Expected: `4 passed`.

- [ ] **Step 5: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add backend/app/routes/vehicles.py backend/tests/test_routes_vehicle_maintenance.py
git commit -m "feat(backend): add CRUD for vehicle maintenance"
```

---

## Task 7: Vehicle onboard equipment CRUD (TDD)

**Files:**
- Modify: `backend/app/routes/vehicles.py`
- Create: `backend/tests/test_routes_vehicle_equipment.py`

- [ ] **Step 1: Write failing tests**

Create `backend/tests/test_routes_vehicle_equipment.py`:

```python
from app.db import SessionLocal
from app.models import Vehicle
from tests.helpers.auth import make_authed_client


def _seed_vehicle() -> int:
    with SessionLocal() as db:
        v = Vehicle(type="إطفاء", plate_number="E-1", status="في الخدمة")
        db.add(v)
        db.commit()
        return v.id


def _payload() -> dict:
    return {"item_name": "خرطوم 30 متر", "quantity": 4, "condition": "ممتاز"}


def test_create_and_list_equipment():
    vid = _seed_vehicle()
    client = make_authed_client()
    r = client.post(f"/api/vehicles/{vid}/equipment", json=_payload())
    assert r.status_code == 201
    r = client.get(f"/api/vehicles/{vid}/equipment")
    assert r.json()["data"]["total"] == 1


def test_update_equipment():
    vid = _seed_vehicle()
    client = make_authed_client()
    eid = client.post(
        f"/api/vehicles/{vid}/equipment", json=_payload()
    ).json()["data"]["id"]
    r = client.patch(f"/api/vehicles/{vid}/equipment/{eid}", json={"quantity": 6})
    assert r.json()["data"]["quantity"] == 6


def test_delete_equipment():
    vid = _seed_vehicle()
    client = make_authed_client()
    eid = client.post(
        f"/api/vehicles/{vid}/equipment", json=_payload()
    ).json()["data"]["id"]
    r = client.delete(f"/api/vehicles/{vid}/equipment/{eid}")
    assert r.status_code == 204
```

- [ ] **Step 2: Run — expect fail**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_routes_vehicle_equipment.py -v
```

- [ ] **Step 3: Add handlers to `backend/app/routes/vehicles.py`**

Update imports — add:

```python
from app.models import VehicleEquipment
from app.schemas.vehicles import (
    VehicleEquipmentCreate,
    VehicleEquipmentOut,
    VehicleEquipmentUpdate,
)
```

Append:

```python
# ---------- Onboard equipment ----------


@router.get("/{vehicle_id}/equipment")
def list_vehicle_equipment(
    vehicle_id: int,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    _get_vehicle_or_404(db, vehicle_id)
    rows = (
        db.execute(select(VehicleEquipment).where(VehicleEquipment.vehicle_id == vehicle_id))
        .scalars()
        .all()
    )
    items = [VehicleEquipmentOut.model_validate(e) for e in rows]
    return {
        "data": ListResponse[VehicleEquipmentOut](
            items=items, total=len(items), page=1, page_size=len(items) or 1
        ).model_dump(mode="json")
    }


@router.post("/{vehicle_id}/equipment", status_code=status.HTTP_201_CREATED)
def create_vehicle_equipment(
    vehicle_id: int,
    payload: VehicleEquipmentCreate,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    _get_vehicle_or_404(db, vehicle_id)
    e = VehicleEquipment(vehicle_id=vehicle_id, **payload.model_dump())
    db.add(e)
    db.commit()
    db.refresh(e)
    return {"data": VehicleEquipmentOut.model_validate(e).model_dump(mode="json")}


@router.patch("/{vehicle_id}/equipment/{equipment_id}")
def update_vehicle_equipment(
    vehicle_id: int,
    equipment_id: int,
    payload: VehicleEquipmentUpdate,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    _get_vehicle_or_404(db, vehicle_id)
    e = db.get(VehicleEquipment, equipment_id)
    if e is None or e.vehicle_id != vehicle_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="التجهيز غير موجود"
        )
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(e, field, value)
    db.commit()
    db.refresh(e)
    return {"data": VehicleEquipmentOut.model_validate(e).model_dump(mode="json")}


@router.delete(
    "/{vehicle_id}/equipment/{equipment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_vehicle_equipment(
    vehicle_id: int,
    equipment_id: int,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> Response:
    _get_vehicle_or_404(db, vehicle_id)
    e = db.get(VehicleEquipment, equipment_id)
    if e is None or e.vehicle_id != vehicle_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="التجهيز غير موجود"
        )
    db.delete(e)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
```

- [ ] **Step 4: Run — expect pass**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_routes_vehicle_equipment.py -v
```

Expected: `3 passed`.

- [ ] **Step 5: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add backend/app/routes/vehicles.py backend/tests/test_routes_vehicle_equipment.py
git commit -m "feat(backend): add CRUD for vehicle onboard equipment"
```

---

## Task 8: Vehicle inspections CRUD (TDD)

**Files:**
- Modify: `backend/app/routes/vehicles.py`
- Create: `backend/tests/test_routes_vehicle_inspections.py`

- [ ] **Step 1: Write failing tests**

Create `backend/tests/test_routes_vehicle_inspections.py`:

```python
from app.db import SessionLocal
from app.models import Vehicle
from tests.helpers.auth import make_authed_client


def _seed_vehicle() -> int:
    with SessionLocal() as db:
        v = Vehicle(type="إطفاء", plate_number="I-1", status="في الخدمة")
        db.add(v)
        db.commit()
        return v.id


def _payload() -> dict:
    return {
        "inspection_date": "2026-04-01",
        "inspector_name": "المفتش",
        "result": "ناجح",
        "notes": "",
    }


def test_create_and_list_inspections():
    vid = _seed_vehicle()
    client = make_authed_client()
    r = client.post(f"/api/vehicles/{vid}/inspections", json=_payload())
    assert r.status_code == 201
    r = client.get(f"/api/vehicles/{vid}/inspections")
    assert r.json()["data"]["total"] == 1


def test_update_inspection():
    vid = _seed_vehicle()
    client = make_authed_client()
    iid = client.post(
        f"/api/vehicles/{vid}/inspections", json=_payload()
    ).json()["data"]["id"]
    r = client.patch(
        f"/api/vehicles/{vid}/inspections/{iid}",
        json={"result": "يحتاج صيانة"},
    )
    assert r.json()["data"]["result"] == "يحتاج صيانة"


def test_delete_inspection():
    vid = _seed_vehicle()
    client = make_authed_client()
    iid = client.post(
        f"/api/vehicles/{vid}/inspections", json=_payload()
    ).json()["data"]["id"]
    r = client.delete(f"/api/vehicles/{vid}/inspections/{iid}")
    assert r.status_code == 204
```

- [ ] **Step 2: Run — expect fail**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_routes_vehicle_inspections.py -v
```

- [ ] **Step 3: Add handlers to `backend/app/routes/vehicles.py`**

Update imports — add:

```python
from app.models import VehicleInspection
from app.schemas.vehicles import (
    VehicleInspectionCreate,
    VehicleInspectionOut,
    VehicleInspectionUpdate,
)
```

Append:

```python
# ---------- Inspections ----------


@router.get("/{vehicle_id}/inspections")
def list_inspections(
    vehicle_id: int,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    _get_vehicle_or_404(db, vehicle_id)
    rows = (
        db.execute(
            select(VehicleInspection)
            .where(VehicleInspection.vehicle_id == vehicle_id)
            .order_by(VehicleInspection.inspection_date.desc())
        )
        .scalars()
        .all()
    )
    items = [VehicleInspectionOut.model_validate(i) for i in rows]
    return {
        "data": ListResponse[VehicleInspectionOut](
            items=items, total=len(items), page=1, page_size=len(items) or 1
        ).model_dump(mode="json")
    }


@router.post("/{vehicle_id}/inspections", status_code=status.HTTP_201_CREATED)
def create_inspection(
    vehicle_id: int,
    payload: VehicleInspectionCreate,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    _get_vehicle_or_404(db, vehicle_id)
    i = VehicleInspection(vehicle_id=vehicle_id, **payload.model_dump())
    db.add(i)
    db.commit()
    db.refresh(i)
    return {"data": VehicleInspectionOut.model_validate(i).model_dump(mode="json")}


@router.patch("/{vehicle_id}/inspections/{inspection_id}")
def update_inspection(
    vehicle_id: int,
    inspection_id: int,
    payload: VehicleInspectionUpdate,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    _get_vehicle_or_404(db, vehicle_id)
    i = db.get(VehicleInspection, inspection_id)
    if i is None or i.vehicle_id != vehicle_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="سجل الفحص غير موجود"
        )
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(i, field, value)
    db.commit()
    db.refresh(i)
    return {"data": VehicleInspectionOut.model_validate(i).model_dump(mode="json")}


@router.delete(
    "/{vehicle_id}/inspections/{inspection_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_inspection(
    vehicle_id: int,
    inspection_id: int,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> Response:
    _get_vehicle_or_404(db, vehicle_id)
    i = db.get(VehicleInspection, inspection_id)
    if i is None or i.vehicle_id != vehicle_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="سجل الفحص غير موجود"
        )
    db.delete(i)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
```

- [ ] **Step 4: Run — expect pass**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_routes_vehicle_inspections.py -v
```

Expected: `3 passed`.

- [ ] **Step 5: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add backend/app/routes/vehicles.py backend/tests/test_routes_vehicle_inspections.py
git commit -m "feat(backend): add CRUD for vehicle inspections"
```

---

## Task 9: Phase 3 verification

- [ ] **Step 1: Full backend test suite passes**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest -q
```

Expected: all tests pass (≥ 79: Phase 1 + Phase 2 + Phase 3).

- [ ] **Step 2: Linters clean**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
ruff check .
black --check .
```

Expected: clean.

- [ ] **Step 3: Smoke test the live API**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
rm -f markaz.db
alembic upgrade head
python -m scripts.seed
uvicorn app.main:app --port 8000
```

In a second terminal:

```bash
curl -sX POST http://127.0.0.1:8000/api/setup -H 'Content-Type: application/json' \
  -d '{"username":"chief","password":"StrongPass1!"}'
curl -sX POST http://127.0.0.1:8000/api/auth/login -H 'Content-Type: application/json' \
  -c /tmp/cookies.txt -d '{"username":"chief","password":"StrongPass1!"}'

echo "--- Vehicles list:"
curl -s http://127.0.0.1:8000/api/vehicles -b /tmp/cookies.txt | head -c 400
echo ""
echo "--- Vehicle 1 full:"
curl -s http://127.0.0.1:8000/api/vehicles/1 -b /tmp/cookies.txt | head -c 600
echo ""
```

Expected: list returns 8 seeded vehicles; vehicle 1 returns its record plus nested maintenance/equipment/inspections.

Stop the server.

- [ ] **Step 4: Git status clean**

```bash
cd /Users/turkioqab/Projects/Markaz
git status
git log --oneline | head -15
```

Expected: clean tree, ~9 new commits.

---

## Phase 3 exit criteria

1. `pytest -q` passes all backend tests (≥ 79)
2. Every endpoint from the design spec's "Vehicles (+ nested)" section is implemented
3. Every endpoint requires auth
4. Vehicle creation with a bad `driver_id` returns 422 in Arabic
5. Duplicate plate numbers return 409 in Arabic
6. Photo upload validates ext + size + image content; saves under `uploads/vehicles/{id}.{ext}`
7. `ruff check .` + `black --check .` clean
8. Working tree clean

Phase 4 (Backend: Building API) starts next — it's the last backend phase.
