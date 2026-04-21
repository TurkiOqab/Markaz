# Phase 4 — Backend: Building API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the CRUD API for the single station building plus its nested resources — rooms, inventory, maintenance records, and reports. Finishes the backend half of the project.

**Architecture:** Single building row (id=1). GET returns the row (creating a placeholder if absent so the chief's first visit doesn't 404). PATCH updates fields. Nested resources (rooms, inventory, maintenance, reports) are independent tables with standard list/create/update/delete endpoints. All endpoints require auth. Report file-upload is deferred to Phase 9 (installer) — the DB column exists, the endpoint does not.

**Tech Stack:** FastAPI, Pydantic 2.x, SQLAlchemy 2.x, pytest.

---

## File Structure

```
backend/
├── app/
│   ├── main.py                  # register building router
│   ├── schemas/
│   │   ├── common.py            # add RoomType / RoomStatus enums
│   │   └── building.py          # all building-related Pydantic models
│   └── routes/
│       └── building.py          # /api/building[/...]
└── tests/
    ├── test_routes_building.py         # GET/PATCH the singleton
    ├── test_routes_building_rooms.py
    ├── test_routes_building_inventory.py
    ├── test_routes_building_maintenance.py
    └── test_routes_building_reports.py
```

---

## Task 1: Building schemas + enums

**Files:**
- Modify: `backend/app/schemas/common.py`
- Create: `backend/app/schemas/building.py`

- [ ] **Step 1: Append enums to `backend/app/schemas/common.py`**

Add these after the existing enums:

```python
RoomType = Literal["غرفة نوم", "مكتب", "قاعة تدريس", "مرفق"]
RoomStatus = Literal["جاهزة", "صيانة"]
```

- [ ] **Step 2: Create `backend/app/schemas/building.py`**

```python
from datetime import date as _date
from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import (
    MaintenanceStatus,
    OrmBase,
    RoomStatus,
    RoomType,
)

# ---------- Building (singleton) ----------


class BuildingBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    address: str = Field(min_length=1, max_length=500)
    notes: str | None = Field(default=None, max_length=1000)


class BuildingUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    address: str | None = Field(default=None, min_length=1, max_length=500)
    notes: str | None = Field(default=None, max_length=1000)


class BuildingOut(OrmBase):
    id: int
    name: str
    address: str
    notes: str | None = None
    created_at: datetime
    updated_at: datetime


# ---------- Rooms ----------


class RoomBase(BaseModel):
    type: RoomType
    name: str = Field(min_length=1, max_length=200)
    capacity: int = Field(ge=0)
    status: RoomStatus
    notes: str | None = Field(default=None, max_length=500)


class RoomCreate(RoomBase):
    pass


class RoomUpdate(BaseModel):
    type: RoomType | None = None
    name: str | None = Field(default=None, min_length=1, max_length=200)
    capacity: int | None = Field(default=None, ge=0)
    status: RoomStatus | None = None
    notes: str | None = Field(default=None, max_length=500)


class RoomOut(OrmBase):
    id: int
    type: RoomType
    name: str
    capacity: int
    status: RoomStatus
    notes: str | None = None


# ---------- Inventory ----------


class InventoryItemBase(BaseModel):
    item_name: str = Field(min_length=1, max_length=200)
    category: str = Field(min_length=1, max_length=100)
    quantity: int = Field(ge=0)
    location: str = Field(min_length=1, max_length=200)
    min_threshold: int = Field(ge=0)
    notes: str | None = Field(default=None, max_length=500)


class InventoryItemCreate(InventoryItemBase):
    pass


class InventoryItemUpdate(BaseModel):
    item_name: str | None = Field(default=None, min_length=1, max_length=200)
    category: str | None = Field(default=None, min_length=1, max_length=100)
    quantity: int | None = Field(default=None, ge=0)
    location: str | None = Field(default=None, min_length=1, max_length=200)
    min_threshold: int | None = Field(default=None, ge=0)
    notes: str | None = Field(default=None, max_length=500)


class InventoryItemOut(OrmBase):
    id: int
    item_name: str
    category: str
    quantity: int
    location: str
    min_threshold: int
    notes: str | None = None


# ---------- Building maintenance ----------


class BuildingMaintenanceBase(BaseModel):
    date: _date
    description: str = Field(min_length=1, max_length=500)
    cost: float = Field(ge=0)
    contractor: str = Field(min_length=1, max_length=200)
    status: MaintenanceStatus


class BuildingMaintenanceCreate(BuildingMaintenanceBase):
    pass


class BuildingMaintenanceUpdate(BaseModel):
    date: _date | None = None
    description: str | None = Field(default=None, min_length=1, max_length=500)
    cost: float | None = Field(default=None, ge=0)
    contractor: str | None = Field(default=None, min_length=1, max_length=200)
    status: MaintenanceStatus | None = None


class BuildingMaintenanceOut(OrmBase):
    id: int
    date: _date
    description: str
    cost: float
    contractor: str
    status: MaintenanceStatus


# ---------- Building reports ----------


class BuildingReportBase(BaseModel):
    date: _date
    title: str = Field(min_length=1, max_length=300)
    summary: str = Field(min_length=1, max_length=5000)
    file_path: str | None = Field(default=None, max_length=500)


class BuildingReportCreate(BuildingReportBase):
    pass


class BuildingReportUpdate(BaseModel):
    date: _date | None = None
    title: str | None = Field(default=None, min_length=1, max_length=300)
    summary: str | None = Field(default=None, min_length=1, max_length=5000)
    file_path: str | None = Field(default=None, max_length=500)


class BuildingReportOut(OrmBase):
    id: int
    date: _date
    title: str
    summary: str
    file_path: str | None = None
```

- [ ] **Step 3: Verify imports**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
python -c "from app.schemas.building import BuildingOut, RoomCreate, InventoryItemCreate, BuildingMaintenanceCreate, BuildingReportCreate; print('OK')"
```

Expected: `OK`.

- [ ] **Step 4: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add backend/app/schemas/common.py backend/app/schemas/building.py
git commit -m "feat(backend): add building/room enums and Pydantic schemas"
```

---

## Task 2: Building singleton GET + PATCH (TDD)

**Files:**
- Create: `backend/app/routes/building.py`
- Create: `backend/tests/test_routes_building.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Write failing tests**

Create `backend/tests/test_routes_building.py`:

```python
from app.db import SessionLocal
from app.models import Building
from tests.helpers.auth import make_authed_client


def test_get_building_creates_singleton_on_first_call():
    client = make_authed_client()
    r = client.get("/api/building")
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["id"] == 1
    # Defaults are empty strings (populated later via PATCH or seed).
    assert "name" in data and "address" in data


def test_get_building_returns_existing_row():
    with SessionLocal() as db:
        db.add(
            Building(
                id=1,
                name="المركز الرئيسي",
                address="الرياض",
                notes="مبنى رئيسي",
            )
        )
        db.commit()
    client = make_authed_client()
    r = client.get("/api/building")
    assert r.status_code == 200
    assert r.json()["data"]["name"] == "المركز الرئيسي"


def test_patch_building_updates_fields():
    client = make_authed_client()
    client.get("/api/building")  # ensure singleton exists
    r = client.patch(
        "/api/building",
        json={"name": "الاسم الجديد", "address": "عنوان جديد"},
    )
    assert r.status_code == 200
    assert r.json()["data"]["name"] == "الاسم الجديد"
    assert r.json()["data"]["address"] == "عنوان جديد"


def test_building_requires_auth():
    from fastapi.testclient import TestClient

    from app.main import app

    client = TestClient(app)
    assert client.get("/api/building").status_code == 401
    assert client.patch("/api/building", json={}).status_code == 401
```

- [ ] **Step 2: Run — expect fail**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_routes_building.py -v
```

Expected: 404s.

- [ ] **Step 3: Create `backend/app/routes/building.py`**

```python
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_chief
from app.models import Building
from app.schemas.building import BuildingOut, BuildingUpdate

router = APIRouter(prefix="/api/building", tags=["building"])


def _get_or_create_singleton(db: Session) -> Building:
    row = db.get(Building, 1)
    if row is None:
        row = Building(id=1, name="", address="")
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


@router.get("")
def get_building(
    db: Session = Depends(get_db),
    _chief=Depends(get_current_chief),
) -> dict:
    row = _get_or_create_singleton(db)
    return {"data": BuildingOut.model_validate(row).model_dump(mode="json")}


@router.patch("")
def update_building(
    payload: BuildingUpdate,
    db: Session = Depends(get_db),
    _chief=Depends(get_current_chief),
) -> dict:
    row = _get_or_create_singleton(db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(row, field, value)
    db.commit()
    db.refresh(row)
    return {"data": BuildingOut.model_validate(row).model_dump(mode="json")}
```

- [ ] **Step 4: Register router in `backend/app/main.py`**

Replace with:

```python
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.auth.routes import router as auth_router
from app.config import BACKEND_DIR
from app.routes.building import router as building_router
from app.routes.employees import router as employees_router
from app.routes.teams import router as teams_router
from app.routes.vehicles import router as vehicles_router

app = FastAPI(title="Markaz", version="0.1.0")
app.include_router(auth_router)
app.include_router(teams_router)
app.include_router(employees_router)
app.include_router(vehicles_router)
app.include_router(building_router)

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
pytest tests/test_routes_building.py -v
```

Expected: `4 passed`.

- [ ] **Step 6: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add backend/app/routes/building.py backend/app/main.py backend/tests/test_routes_building.py
git commit -m "feat(backend): add GET/PATCH /api/building singleton endpoints"
```

---

## Task 3: Rooms CRUD (TDD)

**Files:**
- Modify: `backend/app/routes/building.py`
- Create: `backend/tests/test_routes_building_rooms.py`

- [ ] **Step 1: Write failing tests**

Create `backend/tests/test_routes_building_rooms.py`:

```python
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
```

- [ ] **Step 2: Run — expect fail**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_routes_building_rooms.py -v
```

- [ ] **Step 3: Add handlers to `backend/app/routes/building.py`**

Update imports at the top — replace the model and schema imports with:

```python
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_chief
from app.models import Building, Room
from app.schemas.building import (
    BuildingOut,
    BuildingUpdate,
    RoomCreate,
    RoomOut,
    RoomUpdate,
)
from app.schemas.common import ListResponse
```

Append to the file:

```python
# ---------- Rooms ----------


@router.get("/rooms")
def list_rooms(
    db: Session = Depends(get_db),
    _chief=Depends(get_current_chief),
) -> dict:
    rows = db.execute(select(Room).order_by(Room.id)).scalars().all()
    items = [RoomOut.model_validate(r) for r in rows]
    return {
        "data": ListResponse[RoomOut](
            items=items, total=len(items), page=1, page_size=len(items) or 1
        ).model_dump(mode="json")
    }


@router.post("/rooms", status_code=status.HTTP_201_CREATED)
def create_room(
    payload: RoomCreate,
    db: Session = Depends(get_db),
    _chief=Depends(get_current_chief),
) -> dict:
    room = Room(**payload.model_dump())
    db.add(room)
    db.commit()
    db.refresh(room)
    return {"data": RoomOut.model_validate(room).model_dump(mode="json")}


@router.patch("/rooms/{room_id}")
def update_room(
    room_id: int,
    payload: RoomUpdate,
    db: Session = Depends(get_db),
    _chief=Depends(get_current_chief),
) -> dict:
    room = db.get(Room, room_id)
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الغرفة غير موجودة")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(room, field, value)
    db.commit()
    db.refresh(room)
    return {"data": RoomOut.model_validate(room).model_dump(mode="json")}


@router.delete("/rooms/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_room(
    room_id: int,
    db: Session = Depends(get_db),
    _chief=Depends(get_current_chief),
) -> Response:
    room = db.get(Room, room_id)
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الغرفة غير موجودة")
    db.delete(room)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
```

- [ ] **Step 4: Run — expect pass**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_routes_building_rooms.py -v
```

Expected: `5 passed`.

- [ ] **Step 5: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add backend/app/routes/building.py backend/tests/test_routes_building_rooms.py
git commit -m "feat(backend): add CRUD for building rooms"
```

---

## Task 4: Inventory CRUD (TDD)

**Files:**
- Modify: `backend/app/routes/building.py`
- Create: `backend/tests/test_routes_building_inventory.py`

- [ ] **Step 1: Write failing tests**

Create `backend/tests/test_routes_building_inventory.py`:

```python
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
```

- [ ] **Step 2: Run — expect fail**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_routes_building_inventory.py -v
```

- [ ] **Step 3: Add handlers to `backend/app/routes/building.py`**

Update imports — add to the existing imports:

```python
from app.models import InventoryItem
from app.schemas.building import (
    InventoryItemCreate,
    InventoryItemOut,
    InventoryItemUpdate,
)
```

Append:

```python
# ---------- Inventory ----------


@router.get("/inventory")
def list_inventory(
    db: Session = Depends(get_db),
    _chief=Depends(get_current_chief),
) -> dict:
    rows = db.execute(select(InventoryItem).order_by(InventoryItem.id)).scalars().all()
    items = [InventoryItemOut.model_validate(i) for i in rows]
    return {
        "data": ListResponse[InventoryItemOut](
            items=items, total=len(items), page=1, page_size=len(items) or 1
        ).model_dump(mode="json")
    }


@router.post("/inventory", status_code=status.HTTP_201_CREATED)
def create_inventory(
    payload: InventoryItemCreate,
    db: Session = Depends(get_db),
    _chief=Depends(get_current_chief),
) -> dict:
    item = InventoryItem(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"data": InventoryItemOut.model_validate(item).model_dump(mode="json")}


@router.patch("/inventory/{item_id}")
def update_inventory(
    item_id: int,
    payload: InventoryItemUpdate,
    db: Session = Depends(get_db),
    _chief=Depends(get_current_chief),
) -> dict:
    item = db.get(InventoryItem, item_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الصنف غير موجود")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return {"data": InventoryItemOut.model_validate(item).model_dump(mode="json")}


@router.delete("/inventory/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_inventory(
    item_id: int,
    db: Session = Depends(get_db),
    _chief=Depends(get_current_chief),
) -> Response:
    item = db.get(InventoryItem, item_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الصنف غير موجود")
    db.delete(item)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
```

- [ ] **Step 4: Run — expect pass**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_routes_building_inventory.py -v
```

Expected: `4 passed`.

- [ ] **Step 5: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add backend/app/routes/building.py backend/tests/test_routes_building_inventory.py
git commit -m "feat(backend): add CRUD for building inventory"
```

---

## Task 5: Building maintenance CRUD (TDD)

**Files:**
- Modify: `backend/app/routes/building.py`
- Create: `backend/tests/test_routes_building_maintenance.py`

- [ ] **Step 1: Write failing tests**

Create `backend/tests/test_routes_building_maintenance.py`:

```python
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
```

- [ ] **Step 2: Run — expect fail**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_routes_building_maintenance.py -v
```

- [ ] **Step 3: Add handlers to `backend/app/routes/building.py`**

Update imports — add:

```python
from app.models import BuildingMaintenance
from app.schemas.building import (
    BuildingMaintenanceCreate,
    BuildingMaintenanceOut,
    BuildingMaintenanceUpdate,
)
```

Append:

```python
# ---------- Building maintenance ----------


@router.get("/maintenance")
def list_building_maintenance(
    db: Session = Depends(get_db),
    _chief=Depends(get_current_chief),
) -> dict:
    rows = (
        db.execute(
            select(BuildingMaintenance).order_by(BuildingMaintenance.date.desc())
        )
        .scalars()
        .all()
    )
    items = [BuildingMaintenanceOut.model_validate(m) for m in rows]
    return {
        "data": ListResponse[BuildingMaintenanceOut](
            items=items, total=len(items), page=1, page_size=len(items) or 1
        ).model_dump(mode="json")
    }


@router.post("/maintenance", status_code=status.HTTP_201_CREATED)
def create_building_maintenance(
    payload: BuildingMaintenanceCreate,
    db: Session = Depends(get_db),
    _chief=Depends(get_current_chief),
) -> dict:
    m = BuildingMaintenance(**payload.model_dump())
    db.add(m)
    db.commit()
    db.refresh(m)
    return {"data": BuildingMaintenanceOut.model_validate(m).model_dump(mode="json")}


@router.patch("/maintenance/{maintenance_id}")
def update_building_maintenance(
    maintenance_id: int,
    payload: BuildingMaintenanceUpdate,
    db: Session = Depends(get_db),
    _chief=Depends(get_current_chief),
) -> dict:
    m = db.get(BuildingMaintenance, maintenance_id)
    if m is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="سجل الصيانة غير موجود"
        )
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(m, field, value)
    db.commit()
    db.refresh(m)
    return {"data": BuildingMaintenanceOut.model_validate(m).model_dump(mode="json")}


@router.delete(
    "/maintenance/{maintenance_id}", status_code=status.HTTP_204_NO_CONTENT
)
def delete_building_maintenance(
    maintenance_id: int,
    db: Session = Depends(get_db),
    _chief=Depends(get_current_chief),
) -> Response:
    m = db.get(BuildingMaintenance, maintenance_id)
    if m is None:
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
pytest tests/test_routes_building_maintenance.py -v
```

Expected: `3 passed`.

- [ ] **Step 5: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add backend/app/routes/building.py backend/tests/test_routes_building_maintenance.py
git commit -m "feat(backend): add CRUD for building maintenance"
```

---

## Task 6: Building reports CRUD (TDD)

**Files:**
- Modify: `backend/app/routes/building.py`
- Create: `backend/tests/test_routes_building_reports.py`

- [ ] **Step 1: Write failing tests**

Create `backend/tests/test_routes_building_reports.py`:

```python
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
```

- [ ] **Step 2: Run — expect fail**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_routes_building_reports.py -v
```

- [ ] **Step 3: Add handlers to `backend/app/routes/building.py`**

Update imports — add:

```python
from app.models import BuildingReport
from app.schemas.building import (
    BuildingReportCreate,
    BuildingReportOut,
    BuildingReportUpdate,
)
```

Append:

```python
# ---------- Building reports ----------


@router.get("/reports")
def list_reports(
    db: Session = Depends(get_db),
    _chief=Depends(get_current_chief),
) -> dict:
    rows = (
        db.execute(select(BuildingReport).order_by(BuildingReport.date.desc()))
        .scalars()
        .all()
    )
    items = [BuildingReportOut.model_validate(r) for r in rows]
    return {
        "data": ListResponse[BuildingReportOut](
            items=items, total=len(items), page=1, page_size=len(items) or 1
        ).model_dump(mode="json")
    }


@router.post("/reports", status_code=status.HTTP_201_CREATED)
def create_report(
    payload: BuildingReportCreate,
    db: Session = Depends(get_db),
    _chief=Depends(get_current_chief),
) -> dict:
    report = BuildingReport(**payload.model_dump())
    db.add(report)
    db.commit()
    db.refresh(report)
    return {"data": BuildingReportOut.model_validate(report).model_dump(mode="json")}


@router.patch("/reports/{report_id}")
def update_report(
    report_id: int,
    payload: BuildingReportUpdate,
    db: Session = Depends(get_db),
    _chief=Depends(get_current_chief),
) -> dict:
    report = db.get(BuildingReport, report_id)
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="التقرير غير موجود"
        )
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(report, field, value)
    db.commit()
    db.refresh(report)
    return {"data": BuildingReportOut.model_validate(report).model_dump(mode="json")}


@router.delete("/reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_report(
    report_id: int,
    db: Session = Depends(get_db),
    _chief=Depends(get_current_chief),
) -> Response:
    report = db.get(BuildingReport, report_id)
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="التقرير غير موجود"
        )
    db.delete(report)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
```

- [ ] **Step 4: Run — expect pass**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_routes_building_reports.py -v
```

Expected: `4 passed`.

- [ ] **Step 5: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add backend/app/routes/building.py backend/tests/test_routes_building_reports.py
git commit -m "feat(backend): add CRUD for building reports"
```

---

## Task 7: Phase 4 verification

- [ ] **Step 1: Full backend test suite passes**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest -q
```

Expected: all tests pass (≥ 99: Phase 1–3 + Phase 4).

- [ ] **Step 2: Linters clean**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
ruff check .
black --check .
```

Expected: clean.

- [ ] **Step 3: Smoke test against seed data**

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

echo "--- Building:"
curl -s http://127.0.0.1:8000/api/building -b /tmp/cookies.txt | head -c 400
echo ""
echo "--- Rooms:"
curl -s http://127.0.0.1:8000/api/building/rooms -b /tmp/cookies.txt | python -c "import json, sys; d = json.load(sys.stdin)['data']; print('total:', d['total'])"
echo "--- Inventory:"
curl -s http://127.0.0.1:8000/api/building/inventory -b /tmp/cookies.txt | python -c "import json, sys; d = json.load(sys.stdin)['data']; print('total:', d['total'])"
echo "--- Maintenance:"
curl -s http://127.0.0.1:8000/api/building/maintenance -b /tmp/cookies.txt | python -c "import json, sys; d = json.load(sys.stdin)['data']; print('total:', d['total'])"
echo "--- Reports:"
curl -s http://127.0.0.1:8000/api/building/reports -b /tmp/cookies.txt | python -c "import json, sys; d = json.load(sys.stdin)['data']; print('total:', d['total'])"
```

Expected:
- Building returns the seeded row
- Rooms: 15, Inventory: 30, Maintenance: 5, Reports: 3

Stop the server.

- [ ] **Step 4: Git status clean**

```bash
cd /Users/turkioqab/Projects/Markaz
git status
git log --oneline | head -10
```

Expected: clean tree; ~7 new commits.

---

## Phase 4 exit criteria

1. `pytest -q` passes all backend tests (≥ 99)
2. Every endpoint from the design spec's "Building (+ nested)" section is implemented
3. Every endpoint requires auth
4. GET `/api/building` creates a placeholder row if none exists (so the chief's first visit doesn't 404)
5. `ruff check .` + `black --check .` clean
6. Working tree clean

**Phase 5 (Frontend foundation)** starts the UI work next. The entire backend is complete.
