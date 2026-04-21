# Phase 2 — Backend: Employees API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full CRUD API for employees plus nested resources (certifications, equipment, monthly ratings), a photo upload endpoint, and a teams lookup endpoint. All endpoints require an authenticated chief session.

**Architecture:** FastAPI router per concern (employees, teams). Pydantic v2 schemas in `app/schemas/` validate input and shape output (Arabic enums via `Literal`). A tiny `app/services/uploads.py` handles photo storage. Every endpoint takes a `db: Session` and a `chief: Chief = Depends(get_current_chief)` to enforce auth. All error messages are Arabic.

**Tech Stack:** FastAPI, Pydantic 2.x, SQLAlchemy 2.x, pytest, Pillow (for image validation).

---

## File Structure

```
backend/
├── app/
│   ├── main.py                       # (existing) — register the new routers
│   ├── uploads/                      # runtime-only; gitignored
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── common.py                 # ListResponse, enum Literals
│   │   ├── teams.py                  # TeamOut
│   │   └── employees.py              # EmployeeCreate/Update/Summary/Read, nested schemas
│   ├── services/
│   │   ├── __init__.py
│   │   └── uploads.py                # save_photo, photo_url_for, delete_photo
│   └── routes/
│       ├── __init__.py
│       ├── teams.py                  # GET /api/teams
│       └── employees.py              # /api/employees[/...]
└── tests/
    ├── helpers/
    │   ├── __init__.py
    │   └── auth.py                   # make_authed_client fixture helper
    ├── test_routes_teams.py
    ├── test_routes_employees.py      # main CRUD
    ├── test_routes_employee_photo.py
    ├── test_routes_employee_certifications.py
    ├── test_routes_employee_equipment.py
    └── test_routes_employee_ratings.py
```

---

## Task 1: Upload folder, Pillow dependency, and `uploads.py` service

**Files:**
- Modify: `backend/pyproject.toml`
- Modify: `backend/.gitignore`
- Create: `backend/app/services/__init__.py` (empty)
- Create: `backend/app/services/uploads.py`

- [ ] **Step 1: Add Pillow dependency**

Edit `backend/pyproject.toml` `dependencies`:

```toml
dependencies = [
    "fastapi>=0.110",
    "uvicorn[standard]>=0.27",
    "sqlalchemy>=2.0",
    "alembic>=1.13",
    "bcrypt>=4.0",
    "pydantic>=2.6",
    "python-multipart>=0.0.9",
    "Pillow>=10.0",
]
```

- [ ] **Step 2: Install**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pip install -e ".[dev]"
```

Expected: `Successfully installed Pillow-...`

- [ ] **Step 3: Add uploads folder ignore**

Append to `backend/.gitignore`:

```gitignore
uploads/
```

- [ ] **Step 4: Create the uploads service**

```bash
mkdir -p /Users/turkioqab/Projects/Markaz/backend/app/services
touch /Users/turkioqab/Projects/Markaz/backend/app/services/__init__.py
```

Create `backend/app/services/uploads.py`:

```python
"""Photo upload service: save, delete, resolve URL."""
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from PIL import Image, UnidentifiedImageError

from app.config import BACKEND_DIR

UPLOADS_DIR = BACKEND_DIR / "uploads"
PHOTOS_DIR = UPLOADS_DIR / "employees"
MAX_PHOTO_BYTES = 5 * 1024 * 1024  # 5 MB
ALLOWED_PHOTO_EXT = {"jpg", "jpeg", "png", "webp"}


def _extension(filename: str) -> str:
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


def save_employee_photo(employee_id: int, upload: UploadFile) -> str:
    """Save the upload, return the relative path stored in DB (photo_path)."""
    ext = _extension(upload.filename or "")
    if ext not in ALLOWED_PHOTO_EXT:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="نوع الملف غير مدعوم، استخدم JPG أو PNG أو WebP",
        )

    # Read and size-check
    data = upload.file.read()
    if len(data) > MAX_PHOTO_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="حجم الملف كبير جداً (الحد الأقصى 5 ميجابايت)",
        )

    # Verify actual image content (not just extension)
    try:
        from io import BytesIO

        Image.open(BytesIO(data)).verify()
    except (UnidentifiedImageError, Exception) as err:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="الملف ليس صورة صالحة",
        ) from err

    PHOTOS_DIR.mkdir(parents=True, exist_ok=True)
    target = PHOTOS_DIR / f"{employee_id}.{ext}"
    # Remove any older photo with a different extension.
    for candidate in PHOTOS_DIR.glob(f"{employee_id}.*"):
        if candidate != target:
            candidate.unlink()
    target.write_bytes(data)
    return f"/uploads/employees/{target.name}"


def delete_employee_photo(employee_id: int) -> None:
    if not PHOTOS_DIR.exists():
        return
    for candidate in PHOTOS_DIR.glob(f"{employee_id}.*"):
        candidate.unlink()
```

- [ ] **Step 5: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add backend/pyproject.toml backend/.gitignore backend/app/services/
git commit -m "chore(backend): add Pillow and uploads service"
```

---

## Task 2: Shared schemas (enums + list response)

**Files:**
- Create: `backend/app/schemas/__init__.py` (empty)
- Create: `backend/app/schemas/common.py`

- [ ] **Step 1: Create the schemas package**

```bash
mkdir -p /Users/turkioqab/Projects/Markaz/backend/app/schemas
touch /Users/turkioqab/Projects/Markaz/backend/app/schemas/__init__.py
```

- [ ] **Step 2: Create `backend/app/schemas/common.py`**

```python
from typing import Generic, Literal, TypeVar

from pydantic import BaseModel, ConfigDict

MaritalStatus = Literal["أعزب", "متزوج", "مطلق", "أرمل"]
PhysicalAbility = Literal["ممتاز", "جيد جداً", "جيد", "مقبول"]
Shift = Literal["صباحية", "مسائية", "ليلية"]
EquipmentCondition = Literal["ممتاز", "جيد", "متوسط", "تالف"]

T = TypeVar("T")


class OrmBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class ListResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
```

- [ ] **Step 3: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add backend/app/schemas/
git commit -m "feat(backend): add shared Pydantic schemas (enums, ListResponse)"
```

---

## Task 3: Team lookup endpoint `GET /api/teams` (TDD)

**Files:**
- Create: `backend/app/schemas/teams.py`
- Create: `backend/app/routes/__init__.py` (empty)
- Create: `backend/app/routes/teams.py`
- Create: `backend/tests/helpers/__init__.py` (empty)
- Create: `backend/tests/helpers/auth.py`
- Create: `backend/tests/test_routes_teams.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Create the routes package**

```bash
mkdir -p /Users/turkioqab/Projects/Markaz/backend/app/routes
touch /Users/turkioqab/Projects/Markaz/backend/app/routes/__init__.py
mkdir -p /Users/turkioqab/Projects/Markaz/backend/tests/helpers
touch /Users/turkioqab/Projects/Markaz/backend/tests/helpers/__init__.py
```

- [ ] **Step 2: Create the authed-client helper `tests/helpers/auth.py`**

```python
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
```

- [ ] **Step 3: Write the failing test**

Create `backend/tests/test_routes_teams.py`:

```python
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
```

- [ ] **Step 4: Run the test — expect fail**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_routes_teams.py -v
```

Expected: `ModuleNotFoundError: No module named 'app.routes.teams'` (or similar).

- [ ] **Step 5: Create `backend/app/schemas/teams.py`**

```python
from app.schemas.common import OrmBase


class TeamOut(OrmBase):
    id: int
    name: str
    description: str | None = None
```

- [ ] **Step 6: Create `backend/app/routes/teams.py`**

```python
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_chief
from app.models import Chief, Team
from app.schemas.common import ListResponse
from app.schemas.teams import TeamOut

router = APIRouter()


@router.get("/api/teams")
def list_teams(
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    rows = db.execute(select(Team).order_by(Team.id)).scalars().all()
    items = [TeamOut.model_validate(t) for t in rows]
    return {
        "data": ListResponse[TeamOut](
            items=items, total=len(items), page=1, page_size=len(items) or 1
        ).model_dump()
    }
```

- [ ] **Step 7: Register the router in `backend/app/main.py`**

Replace the file with:

```python
from fastapi import FastAPI

from app.auth.routes import router as auth_router
from app.routes.teams import router as teams_router

app = FastAPI(title="Markaz", version="0.1.0")
app.include_router(auth_router)
app.include_router(teams_router)


@app.get("/api/health")
def health() -> dict:
    return {"data": {"status": "ok"}}
```

- [ ] **Step 8: Run the test — expect pass**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_routes_teams.py -v
```

Expected: `2 passed`.

- [ ] **Step 9: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add backend/app/schemas/teams.py backend/app/routes/ backend/app/main.py backend/tests/helpers/ backend/tests/test_routes_teams.py
git commit -m "feat(backend): add GET /api/teams lookup endpoint"
```

---

## Task 4: Employee schemas

**Files:**
- Create: `backend/app/schemas/employees.py`

- [ ] **Step 1: Create `backend/app/schemas/employees.py`**

```python
from datetime import date, datetime

from pydantic import BaseModel, Field

from app.schemas.common import (
    EquipmentCondition,
    MaritalStatus,
    OrmBase,
    PhysicalAbility,
    Shift,
)

# ---------- Certifications ----------


class CertificationBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    issuing_authority: str = Field(min_length=1, max_length=200)
    issue_date: date
    expiry_date: date


class CertificationCreate(CertificationBase):
    pass


class CertificationUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    issuing_authority: str | None = Field(default=None, min_length=1, max_length=200)
    issue_date: date | None = None
    expiry_date: date | None = None


class CertificationOut(OrmBase):
    id: int
    name: str
    issuing_authority: str
    issue_date: date
    expiry_date: date


# ---------- Equipment (assigned to employee) ----------


class EquipmentBase(BaseModel):
    item_name: str = Field(min_length=1, max_length=200)
    serial_number: str | None = Field(default=None, max_length=100)
    assigned_date: date
    condition: EquipmentCondition


class EquipmentCreate(EquipmentBase):
    pass


class EquipmentUpdate(BaseModel):
    item_name: str | None = Field(default=None, min_length=1, max_length=200)
    serial_number: str | None = Field(default=None, max_length=100)
    assigned_date: date | None = None
    condition: EquipmentCondition | None = None


class EquipmentOut(OrmBase):
    id: int
    item_name: str
    serial_number: str | None = None
    assigned_date: date
    condition: EquipmentCondition


# ---------- Monthly ratings ----------


class MonthlyRatingBase(BaseModel):
    year: int = Field(ge=2000, le=2100)
    month: int = Field(ge=1, le=12)
    rating: float = Field(ge=0, le=5)
    notes: str | None = Field(default=None, max_length=500)


class MonthlyRatingCreate(MonthlyRatingBase):
    pass


class MonthlyRatingUpdate(BaseModel):
    rating: float | None = Field(default=None, ge=0, le=5)
    notes: str | None = Field(default=None, max_length=500)


class MonthlyRatingOut(OrmBase):
    id: int
    year: int
    month: int
    rating: float
    notes: str | None = None


# ---------- Employees ----------


class EmployeeBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    rank: str = Field(min_length=1, max_length=50)
    specialty: str = Field(min_length=1, max_length=100)
    date_of_birth: date
    marital_status: MaritalStatus
    physical_ability: PhysicalAbility
    national_id: str = Field(min_length=5, max_length=20)
    phone: str = Field(min_length=5, max_length=20)
    email: str | None = Field(default=None, max_length=200)
    team_id: int
    shift: Shift


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    rank: str | None = Field(default=None, min_length=1, max_length=50)
    specialty: str | None = Field(default=None, min_length=1, max_length=100)
    date_of_birth: date | None = None
    marital_status: MaritalStatus | None = None
    physical_ability: PhysicalAbility | None = None
    national_id: str | None = Field(default=None, min_length=5, max_length=20)
    phone: str | None = Field(default=None, min_length=5, max_length=20)
    email: str | None = Field(default=None, max_length=200)
    team_id: int | None = None
    shift: Shift | None = None


class EmployeeSummary(OrmBase):
    """Used in list views — no nested relations."""

    id: int
    name: str
    rank: str
    specialty: str
    national_id: str
    photo_path: str | None = None
    team_id: int
    shift: Shift


class EmployeeRead(OrmBase):
    """Full read including nested resources."""

    id: int
    name: str
    rank: str
    specialty: str
    date_of_birth: date
    marital_status: MaritalStatus
    physical_ability: PhysicalAbility
    national_id: str
    photo_path: str | None = None
    phone: str
    email: str | None = None
    team_id: int
    shift: Shift
    created_at: datetime
    updated_at: datetime
    certifications: list[CertificationOut] = []
    equipment: list[EquipmentOut] = []
    monthly_ratings: list[MonthlyRatingOut] = []
```

- [ ] **Step 2: Check it imports**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
python -c "from app.schemas.employees import EmployeeCreate, EmployeeRead, EmployeeSummary; print('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add backend/app/schemas/employees.py
git commit -m "feat(backend): add employee Pydantic schemas (create/update/read/nested)"
```

---

## Task 5: Employees list endpoint `GET /api/employees` (TDD)

**Files:**
- Create: `backend/app/routes/employees.py`
- Create: `backend/tests/test_routes_employees.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Write the failing test**

Create `backend/tests/test_routes_employees.py`:

```python
from datetime import date

from app.db import SessionLocal
from app.models import Employee, Team
from tests.helpers.auth import make_authed_client


def _seed_one_team() -> int:
    with SessionLocal() as db:
        team = Team(name="الفريق أ", description="")
        db.add(team)
        db.commit()
        return team.id


def _add_employees(team_id: int, count: int) -> None:
    with SessionLocal() as db:
        for i in range(count):
            db.add(
                Employee(
                    name=f"موظف رقم {i}",
                    rank="جندي",
                    specialty="مكافحة حرائق",
                    date_of_birth=date(1990, 1, 1),
                    marital_status="أعزب",
                    physical_ability="جيد",
                    national_id=f"100000000{i}",
                    phone=f"05000000{i:02d}",
                    team_id=team_id,
                    shift="صباحية",
                )
            )
        db.commit()


def test_list_employees_returns_empty_initially():
    _seed_one_team()
    client = make_authed_client()
    r = client.get("/api/employees")
    assert r.status_code == 200
    assert r.json()["data"]["total"] == 0
    assert r.json()["data"]["items"] == []


def test_list_employees_paginates():
    team_id = _seed_one_team()
    _add_employees(team_id, count=25)
    client = make_authed_client()

    r = client.get("/api/employees?page=1&page_size=10")
    body = r.json()["data"]
    assert body["total"] == 25
    assert body["page"] == 1
    assert body["page_size"] == 10
    assert len(body["items"]) == 10

    r2 = client.get("/api/employees?page=3&page_size=10")
    assert len(r2.json()["data"]["items"]) == 5


def test_list_employees_filters_by_shift():
    team_id = _seed_one_team()
    with SessionLocal() as db:
        db.add_all(
            [
                Employee(
                    name="أ",
                    rank="ج",
                    specialty="ح",
                    date_of_birth=date(1990, 1, 1),
                    marital_status="أعزب",
                    physical_ability="جيد",
                    national_id="1000000001",
                    phone="0500000001",
                    team_id=team_id,
                    shift="صباحية",
                ),
                Employee(
                    name="ب",
                    rank="ج",
                    specialty="ح",
                    date_of_birth=date(1990, 1, 1),
                    marital_status="أعزب",
                    physical_ability="جيد",
                    national_id="1000000002",
                    phone="0500000002",
                    team_id=team_id,
                    shift="ليلية",
                ),
            ]
        )
        db.commit()

    client = make_authed_client()
    r = client.get("/api/employees?shift=صباحية")
    items = r.json()["data"]["items"]
    assert len(items) == 1
    assert items[0]["name"] == "أ"


def test_list_employees_searches_by_name():
    team_id = _seed_one_team()
    with SessionLocal() as db:
        db.add_all(
            [
                Employee(
                    name="محمد",
                    rank="ج",
                    specialty="ح",
                    date_of_birth=date(1990, 1, 1),
                    marital_status="أعزب",
                    physical_ability="جيد",
                    national_id="1000000001",
                    phone="0500000001",
                    team_id=team_id,
                    shift="صباحية",
                ),
                Employee(
                    name="أحمد",
                    rank="ج",
                    specialty="ح",
                    date_of_birth=date(1990, 1, 1),
                    marital_status="أعزب",
                    physical_ability="جيد",
                    national_id="1000000002",
                    phone="0500000002",
                    team_id=team_id,
                    shift="صباحية",
                ),
            ]
        )
        db.commit()

    client = make_authed_client()
    r = client.get("/api/employees?q=محمد")
    items = r.json()["data"]["items"]
    assert len(items) == 1
    assert items[0]["name"] == "محمد"


def test_list_employees_requires_auth():
    from fastapi.testclient import TestClient

    from app.main import app

    client = TestClient(app)
    r = client.get("/api/employees")
    assert r.status_code == 401
```

- [ ] **Step 2: Run the test — expect fail**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_routes_employees.py -v
```

Expected: 404s because `/api/employees` doesn't exist yet.

- [ ] **Step 3: Create `backend/app/routes/employees.py`**

```python
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_chief
from app.models import Chief, Employee
from app.schemas.common import ListResponse, Shift
from app.schemas.employees import EmployeeSummary

router = APIRouter(prefix="/api/employees", tags=["employees"])


@router.get("")
def list_employees(
    q: str | None = Query(default=None, description="Search by name"),
    team_id: int | None = None,
    shift: Shift | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=200),
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    stmt = select(Employee)
    filters = []
    if q:
        like = f"%{q}%"
        filters.append(or_(Employee.name.like(like), Employee.national_id.like(like)))
    if team_id is not None:
        filters.append(Employee.team_id == team_id)
    if shift is not None:
        filters.append(Employee.shift == shift)
    if filters:
        stmt = stmt.where(*filters)

    total = db.execute(
        select(func.count()).select_from(stmt.subquery())
    ).scalar_one()

    rows = (
        db.execute(
            stmt.order_by(Employee.id).offset((page - 1) * page_size).limit(page_size)
        )
        .scalars()
        .all()
    )

    items = [EmployeeSummary.model_validate(e) for e in rows]
    return {
        "data": ListResponse[EmployeeSummary](
            items=items, total=total, page=page, page_size=page_size
        ).model_dump()
    }
```

- [ ] **Step 4: Register the router in `backend/app/main.py`**

Replace with:

```python
from fastapi import FastAPI

from app.auth.routes import router as auth_router
from app.routes.employees import router as employees_router
from app.routes.teams import router as teams_router

app = FastAPI(title="Markaz", version="0.1.0")
app.include_router(auth_router)
app.include_router(teams_router)
app.include_router(employees_router)


@app.get("/api/health")
def health() -> dict:
    return {"data": {"status": "ok"}}
```

- [ ] **Step 5: Run the test — expect pass**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_routes_employees.py -v
```

Expected: `5 passed`.

- [ ] **Step 6: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add backend/app/routes/employees.py backend/app/main.py backend/tests/test_routes_employees.py
git commit -m "feat(backend): add GET /api/employees with pagination, search, filters"
```

---

## Task 6: Employee get-by-id `GET /api/employees/{id}` (TDD)

**Files:**
- Modify: `backend/app/routes/employees.py`
- Modify: `backend/tests/test_routes_employees.py`

- [ ] **Step 1: Add the failing test** — append to `tests/test_routes_employees.py`:

```python
def test_get_employee_returns_full_record_with_nested():
    team_id = _seed_one_team()
    with SessionLocal() as db:
        emp = Employee(
            name="محمد",
            rank="رائد",
            specialty="مكافحة حرائق",
            date_of_birth=date(1980, 3, 1),
            marital_status="متزوج",
            physical_ability="ممتاز",
            national_id="1111111111",
            phone="0500000000",
            team_id=team_id,
            shift="صباحية",
        )
        db.add(emp)
        db.commit()
        emp_id = emp.id

    client = make_authed_client()
    r = client.get(f"/api/employees/{emp_id}")
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["name"] == "محمد"
    assert data["certifications"] == []
    assert data["equipment"] == []
    assert data["monthly_ratings"] == []


def test_get_employee_returns_404_for_unknown():
    client = make_authed_client()
    r = client.get("/api/employees/99999")
    assert r.status_code == 404
```

- [ ] **Step 2: Run — expect fail**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_routes_employees.py::test_get_employee_returns_full_record_with_nested -v
```

Expected: 404 because `GET /api/employees/{id}` not implemented.

- [ ] **Step 3: Add the handler to `app/routes/employees.py`**

Add these imports near the top:

```python
from fastapi import HTTPException, status
from app.schemas.employees import EmployeeRead
```

Append to the file:

```python
@router.get("/{employee_id}")
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    emp = db.get(Employee, employee_id)
    if emp is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الموظف غير موجود")
    return {"data": EmployeeRead.model_validate(emp).model_dump(mode="json")}
```

- [ ] **Step 4: Run — expect pass**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_routes_employees.py -v
```

Expected: `7 passed`.

- [ ] **Step 5: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add backend/app/routes/employees.py backend/tests/test_routes_employees.py
git commit -m "feat(backend): add GET /api/employees/{id} with nested relations"
```

---

## Task 7: Create employee `POST /api/employees` (TDD)

**Files:**
- Modify: `backend/app/routes/employees.py`
- Modify: `backend/tests/test_routes_employees.py`

- [ ] **Step 1: Add tests** — append:

```python
def _new_payload(team_id: int) -> dict:
    return {
        "name": "موظف جديد",
        "rank": "نقيب",
        "specialty": "إنقاذ",
        "date_of_birth": "1990-05-10",
        "marital_status": "متزوج",
        "physical_ability": "ممتاز",
        "national_id": "9999999999",
        "phone": "0500000099",
        "email": "new@markaz.gov.sa",
        "team_id": team_id,
        "shift": "صباحية",
    }


def test_create_employee_returns_201_with_new_record():
    team_id = _seed_one_team()
    client = make_authed_client()
    r = client.post("/api/employees", json=_new_payload(team_id))
    assert r.status_code == 201, r.text
    data = r.json()["data"]
    assert data["name"] == "موظف جديد"
    assert isinstance(data["id"], int)


def test_create_employee_rejects_duplicate_national_id():
    team_id = _seed_one_team()
    client = make_authed_client()
    client.post("/api/employees", json=_new_payload(team_id))
    r = client.post("/api/employees", json=_new_payload(team_id))
    assert r.status_code == 409


def test_create_employee_rejects_invalid_enum():
    team_id = _seed_one_team()
    payload = _new_payload(team_id)
    payload["shift"] = "مساء"  # invalid enum value
    client = make_authed_client()
    r = client.post("/api/employees", json=payload)
    assert r.status_code == 422
```

- [ ] **Step 2: Run — expect fail**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_routes_employees.py::test_create_employee_returns_201_with_new_record -v
```

Expected: 404 or 405 (POST not implemented).

- [ ] **Step 3: Add the handler to `app/routes/employees.py`**

Add import:

```python
from sqlalchemy.exc import IntegrityError
from app.schemas.employees import EmployeeCreate
```

Append:

```python
@router.post("", status_code=status.HTTP_201_CREATED)
def create_employee(
    payload: EmployeeCreate,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    emp = Employee(**payload.model_dump())
    db.add(emp)
    try:
        db.commit()
    except IntegrityError as err:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="الرقم الوطني مستخدم مسبقاً",
        ) from err
    db.refresh(emp)
    return {"data": EmployeeRead.model_validate(emp).model_dump(mode="json")}
```

- [ ] **Step 4: Run — expect pass**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_routes_employees.py -v
```

Expected: `10 passed`.

- [ ] **Step 5: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add backend/app/routes/employees.py backend/tests/test_routes_employees.py
git commit -m "feat(backend): add POST /api/employees with duplicate + enum validation"
```

---

## Task 8: Update employee `PATCH /api/employees/{id}` (TDD)

**Files:**
- Modify: `backend/app/routes/employees.py`
- Modify: `backend/tests/test_routes_employees.py`

- [ ] **Step 1: Add tests** — append:

```python
def test_patch_employee_updates_fields():
    team_id = _seed_one_team()
    client = make_authed_client()
    created = client.post("/api/employees", json=_new_payload(team_id)).json()["data"]
    emp_id = created["id"]

    r = client.patch(
        f"/api/employees/{emp_id}",
        json={"rank": "رائد", "shift": "ليلية"},
    )
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["rank"] == "رائد"
    assert data["shift"] == "ليلية"
    # Unchanged fields remain
    assert data["name"] == "موظف جديد"


def test_patch_employee_returns_404_for_unknown():
    client = make_authed_client()
    r = client.patch("/api/employees/99999", json={"rank": "رائد"})
    assert r.status_code == 404
```

- [ ] **Step 2: Run — expect fail**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_routes_employees.py::test_patch_employee_updates_fields -v
```

Expected: 405 (PATCH not implemented).

- [ ] **Step 3: Add the handler to `app/routes/employees.py`**

Add import:

```python
from app.schemas.employees import EmployeeUpdate
```

Append:

```python
@router.patch("/{employee_id}")
def update_employee(
    employee_id: int,
    payload: EmployeeUpdate,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    emp = db.get(Employee, employee_id)
    if emp is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الموظف غير موجود")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(emp, field, value)
    try:
        db.commit()
    except IntegrityError as err:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="الرقم الوطني مستخدم مسبقاً",
        ) from err
    db.refresh(emp)
    return {"data": EmployeeRead.model_validate(emp).model_dump(mode="json")}
```

- [ ] **Step 4: Run — expect pass**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_routes_employees.py -v
```

Expected: `12 passed`.

- [ ] **Step 5: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add backend/app/routes/employees.py backend/tests/test_routes_employees.py
git commit -m "feat(backend): add PATCH /api/employees/{id}"
```

---

## Task 9: Delete employee `DELETE /api/employees/{id}` (TDD, with driver-check)

**Files:**
- Modify: `backend/app/routes/employees.py`
- Modify: `backend/tests/test_routes_employees.py`

- [ ] **Step 1: Add tests** — append:

```python
def test_delete_employee_removes_record():
    team_id = _seed_one_team()
    client = make_authed_client()
    created = client.post("/api/employees", json=_new_payload(team_id)).json()["data"]
    emp_id = created["id"]

    r = client.delete(f"/api/employees/{emp_id}")
    assert r.status_code == 204
    assert client.get(f"/api/employees/{emp_id}").status_code == 404


def test_delete_employee_blocked_when_driver():
    from app.models import Vehicle

    team_id = _seed_one_team()
    client = make_authed_client()
    created = client.post("/api/employees", json=_new_payload(team_id)).json()["data"]
    emp_id = created["id"]

    with SessionLocal() as db:
        db.add(
            Vehicle(
                type="إطفاء",
                plate_number="TEST-1",
                status="في الخدمة",
                driver_id=emp_id,
            )
        )
        db.commit()

    r = client.delete(f"/api/employees/{emp_id}")
    assert r.status_code == 409


def test_delete_employee_returns_404_for_unknown():
    client = make_authed_client()
    r = client.delete("/api/employees/99999")
    assert r.status_code == 404
```

- [ ] **Step 2: Run — expect fail**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_routes_employees.py::test_delete_employee_removes_record -v
```

Expected: 405 (DELETE not implemented).

- [ ] **Step 3: Add the handler to `app/routes/employees.py`**

Add imports:

```python
from fastapi import Response
from app.models import Vehicle
```

Append:

```python
@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> Response:
    emp = db.get(Employee, employee_id)
    if emp is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الموظف غير موجود")
    driven = db.execute(
        select(Vehicle).where(Vehicle.driver_id == employee_id)
    ).scalars().first()
    if driven is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="لا يمكن حذف الموظف لأنه سائق لمركبة، أعد تعيين السائق أولاً",
        )
    db.delete(emp)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
```

- [ ] **Step 4: Run — expect pass**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_routes_employees.py -v
```

Expected: `15 passed`.

- [ ] **Step 5: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add backend/app/routes/employees.py backend/tests/test_routes_employees.py
git commit -m "feat(backend): add DELETE /api/employees/{id} (blocked when driver)"
```

---

## Task 10: Photo upload `POST /api/employees/{id}/photo` + static serving (TDD)

**Files:**
- Modify: `backend/app/routes/employees.py`
- Modify: `backend/app/main.py`
- Create: `backend/tests/test_routes_employee_photo.py`

- [ ] **Step 1: Write the failing test**

Create `backend/tests/test_routes_employee_photo.py`:

```python
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

    big = BytesIO()
    Image.new("RGB", (8000, 8000), color="blue").save(big, format="PNG")
    if big.getbuffer().nbytes <= 5 * 1024 * 1024:
        # Make it bigger by repeating, since an 8000x8000 PNG compresses too well.
        raw = big.getvalue() + (b"x" * (5 * 1024 * 1024 + 1))
    else:
        raw = big.getvalue()

    r = client.post(
        f"/api/employees/{emp_id}/photo",
        files={"file": ("big.png", raw, "image/png")},
    )
    assert r.status_code in (413, 400)  # size or image-verify failure
```

- [ ] **Step 2: Run — expect fail**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_routes_employee_photo.py -v
```

Expected: 405 or 404.

- [ ] **Step 3: Add imports in `app/routes/employees.py`**

```python
from fastapi import UploadFile, File
from app.services.uploads import save_employee_photo
```

Append:

```python
@router.post("/{employee_id}/photo")
def upload_photo(
    employee_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    emp = db.get(Employee, employee_id)
    if emp is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الموظف غير موجود")
    emp.photo_path = save_employee_photo(employee_id, file)
    db.commit()
    db.refresh(emp)
    return {"data": EmployeeRead.model_validate(emp).model_dump(mode="json")}
```

- [ ] **Step 4: Mount static serving of `/uploads/*` in `app/main.py`**

Replace with:

```python
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.auth.routes import router as auth_router
from app.config import BACKEND_DIR
from app.routes.employees import router as employees_router
from app.routes.teams import router as teams_router

app = FastAPI(title="Markaz", version="0.1.0")
app.include_router(auth_router)
app.include_router(teams_router)
app.include_router(employees_router)

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
pytest tests/test_routes_employee_photo.py -v
```

Expected: `3 passed`.

- [ ] **Step 6: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add backend/app/routes/employees.py backend/app/main.py backend/tests/test_routes_employee_photo.py
git commit -m "feat(backend): add photo upload endpoint and /uploads static mount"
```

---

## Task 11: Certifications CRUD (TDD)

**Files:**
- Modify: `backend/app/routes/employees.py`
- Create: `backend/tests/test_routes_employee_certifications.py`

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/test_routes_employee_certifications.py`:

```python
from datetime import date

from app.db import SessionLocal
from app.models import Employee, Team
from tests.helpers.auth import make_authed_client


def _seed_employee() -> int:
    with SessionLocal() as db:
        team = Team(name="الفريق أ")
        db.add(team)
        db.commit()
        emp = Employee(
            name="م",
            rank="ج",
            specialty="ح",
            date_of_birth=date(1990, 1, 1),
            marital_status="أعزب",
            physical_ability="جيد",
            national_id="5555555555",
            phone="0500000000",
            team_id=team.id,
            shift="صباحية",
        )
        db.add(emp)
        db.commit()
        return emp.id


def _payload() -> dict:
    return {
        "name": "شهادة الإنقاذ",
        "issuing_authority": "معهد الدفاع المدني",
        "issue_date": "2024-01-15",
        "expiry_date": "2029-01-15",
    }


def test_create_and_list_certifications():
    emp_id = _seed_employee()
    client = make_authed_client()

    r = client.post(f"/api/employees/{emp_id}/certifications", json=_payload())
    assert r.status_code == 201
    assert r.json()["data"]["name"] == "شهادة الإنقاذ"

    r = client.get(f"/api/employees/{emp_id}/certifications")
    assert r.status_code == 200
    assert r.json()["data"]["total"] == 1


def test_update_certification():
    emp_id = _seed_employee()
    client = make_authed_client()
    cid = client.post(
        f"/api/employees/{emp_id}/certifications", json=_payload()
    ).json()["data"]["id"]

    r = client.patch(
        f"/api/employees/{emp_id}/certifications/{cid}",
        json={"issuing_authority": "الهيئة السعودية"},
    )
    assert r.status_code == 200
    assert r.json()["data"]["issuing_authority"] == "الهيئة السعودية"


def test_delete_certification():
    emp_id = _seed_employee()
    client = make_authed_client()
    cid = client.post(
        f"/api/employees/{emp_id}/certifications", json=_payload()
    ).json()["data"]["id"]

    r = client.delete(f"/api/employees/{emp_id}/certifications/{cid}")
    assert r.status_code == 204
    assert client.get(f"/api/employees/{emp_id}/certifications").json()["data"]["total"] == 0


def test_create_cert_for_missing_employee_returns_404():
    client = make_authed_client()
    r = client.post("/api/employees/99999/certifications", json=_payload())
    assert r.status_code == 404
```

- [ ] **Step 2: Run — expect fail**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_routes_employee_certifications.py -v
```

- [ ] **Step 3: Add imports and handlers to `app/routes/employees.py`**

Add imports:

```python
from app.models import Certification
from app.schemas.employees import (
    CertificationCreate,
    CertificationOut,
    CertificationUpdate,
)
```

Append:

```python
def _get_employee_or_404(db: Session, employee_id: int) -> Employee:
    emp = db.get(Employee, employee_id)
    if emp is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الموظف غير موجود")
    return emp


@router.get("/{employee_id}/certifications")
def list_certifications(
    employee_id: int,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    _get_employee_or_404(db, employee_id)
    rows = (
        db.execute(
            select(Certification).where(Certification.employee_id == employee_id)
        )
        .scalars()
        .all()
    )
    items = [CertificationOut.model_validate(c) for c in rows]
    return {
        "data": ListResponse[CertificationOut](
            items=items, total=len(items), page=1, page_size=len(items) or 1
        ).model_dump(mode="json")
    }


@router.post("/{employee_id}/certifications", status_code=status.HTTP_201_CREATED)
def create_certification(
    employee_id: int,
    payload: CertificationCreate,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    _get_employee_or_404(db, employee_id)
    cert = Certification(employee_id=employee_id, **payload.model_dump())
    db.add(cert)
    db.commit()
    db.refresh(cert)
    return {"data": CertificationOut.model_validate(cert).model_dump(mode="json")}


@router.patch("/{employee_id}/certifications/{certification_id}")
def update_certification(
    employee_id: int,
    certification_id: int,
    payload: CertificationUpdate,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    _get_employee_or_404(db, employee_id)
    cert = db.get(Certification, certification_id)
    if cert is None or cert.employee_id != employee_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="الشهادة غير موجودة"
        )
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(cert, field, value)
    db.commit()
    db.refresh(cert)
    return {"data": CertificationOut.model_validate(cert).model_dump(mode="json")}


@router.delete(
    "/{employee_id}/certifications/{certification_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_certification(
    employee_id: int,
    certification_id: int,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> Response:
    _get_employee_or_404(db, employee_id)
    cert = db.get(Certification, certification_id)
    if cert is None or cert.employee_id != employee_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="الشهادة غير موجودة"
        )
    db.delete(cert)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
```

- [ ] **Step 4: Run — expect pass**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_routes_employee_certifications.py -v
```

Expected: `4 passed`.

- [ ] **Step 5: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add backend/app/routes/employees.py backend/tests/test_routes_employee_certifications.py
git commit -m "feat(backend): add CRUD for employee certifications"
```

---

## Task 12: Equipment CRUD (TDD)

**Files:**
- Modify: `backend/app/routes/employees.py`
- Create: `backend/tests/test_routes_employee_equipment.py`

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/test_routes_employee_equipment.py`:

```python
from datetime import date

from app.db import SessionLocal
from app.models import Employee, Team
from tests.helpers.auth import make_authed_client


def _seed_employee() -> int:
    with SessionLocal() as db:
        team = Team(name="الفريق أ")
        db.add(team)
        db.commit()
        emp = Employee(
            name="م",
            rank="ج",
            specialty="ح",
            date_of_birth=date(1990, 1, 1),
            marital_status="أعزب",
            physical_ability="جيد",
            national_id="6666666666",
            phone="0500000000",
            team_id=team.id,
            shift="صباحية",
        )
        db.add(emp)
        db.commit()
        return emp.id


def _payload() -> dict:
    return {
        "item_name": "بدلة إطفاء",
        "serial_number": "UF-123",
        "assigned_date": "2024-03-10",
        "condition": "ممتاز",
    }


def test_create_list_equipment():
    emp_id = _seed_employee()
    client = make_authed_client()
    r = client.post(f"/api/employees/{emp_id}/equipment", json=_payload())
    assert r.status_code == 201
    r = client.get(f"/api/employees/{emp_id}/equipment")
    assert r.json()["data"]["total"] == 1


def test_update_equipment():
    emp_id = _seed_employee()
    client = make_authed_client()
    eid = client.post(
        f"/api/employees/{emp_id}/equipment", json=_payload()
    ).json()["data"]["id"]
    r = client.patch(
        f"/api/employees/{emp_id}/equipment/{eid}", json={"condition": "متوسط"}
    )
    assert r.json()["data"]["condition"] == "متوسط"


def test_delete_equipment():
    emp_id = _seed_employee()
    client = make_authed_client()
    eid = client.post(
        f"/api/employees/{emp_id}/equipment", json=_payload()
    ).json()["data"]["id"]
    r = client.delete(f"/api/employees/{emp_id}/equipment/{eid}")
    assert r.status_code == 204
```

- [ ] **Step 2: Run — expect fail**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_routes_employee_equipment.py -v
```

- [ ] **Step 3: Add to `app/routes/employees.py`**

Add imports:

```python
from app.models import Equipment
from app.schemas.employees import EquipmentCreate, EquipmentOut, EquipmentUpdate
```

Append:

```python
@router.get("/{employee_id}/equipment")
def list_equipment(
    employee_id: int,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    _get_employee_or_404(db, employee_id)
    rows = (
        db.execute(select(Equipment).where(Equipment.employee_id == employee_id))
        .scalars()
        .all()
    )
    items = [EquipmentOut.model_validate(e) for e in rows]
    return {
        "data": ListResponse[EquipmentOut](
            items=items, total=len(items), page=1, page_size=len(items) or 1
        ).model_dump(mode="json")
    }


@router.post("/{employee_id}/equipment", status_code=status.HTTP_201_CREATED)
def create_equipment(
    employee_id: int,
    payload: EquipmentCreate,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    _get_employee_or_404(db, employee_id)
    eq = Equipment(employee_id=employee_id, **payload.model_dump())
    db.add(eq)
    db.commit()
    db.refresh(eq)
    return {"data": EquipmentOut.model_validate(eq).model_dump(mode="json")}


@router.patch("/{employee_id}/equipment/{equipment_id}")
def update_equipment(
    employee_id: int,
    equipment_id: int,
    payload: EquipmentUpdate,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    _get_employee_or_404(db, employee_id)
    eq = db.get(Equipment, equipment_id)
    if eq is None or eq.employee_id != employee_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="التجهيز غير موجود"
        )
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(eq, field, value)
    db.commit()
    db.refresh(eq)
    return {"data": EquipmentOut.model_validate(eq).model_dump(mode="json")}


@router.delete(
    "/{employee_id}/equipment/{equipment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_equipment(
    employee_id: int,
    equipment_id: int,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> Response:
    _get_employee_or_404(db, employee_id)
    eq = db.get(Equipment, equipment_id)
    if eq is None or eq.employee_id != employee_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="التجهيز غير موجود"
        )
    db.delete(eq)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
```

- [ ] **Step 4: Run — expect pass**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_routes_employee_equipment.py -v
```

Expected: `3 passed`.

- [ ] **Step 5: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add backend/app/routes/employees.py backend/tests/test_routes_employee_equipment.py
git commit -m "feat(backend): add CRUD for employee equipment"
```

---

## Task 13: Monthly ratings CRUD (TDD)

**Files:**
- Modify: `backend/app/routes/employees.py`
- Create: `backend/tests/test_routes_employee_ratings.py`

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/test_routes_employee_ratings.py`:

```python
from datetime import date

from app.db import SessionLocal
from app.models import Employee, Team
from tests.helpers.auth import make_authed_client


def _seed_employee() -> int:
    with SessionLocal() as db:
        team = Team(name="الفريق أ")
        db.add(team)
        db.commit()
        emp = Employee(
            name="م",
            rank="ج",
            specialty="ح",
            date_of_birth=date(1990, 1, 1),
            marital_status="أعزب",
            physical_ability="جيد",
            national_id="7777777777",
            phone="0500000000",
            team_id=team.id,
            shift="صباحية",
        )
        db.add(emp)
        db.commit()
        return emp.id


def test_create_and_list_ratings():
    emp_id = _seed_employee()
    client = make_authed_client()
    r = client.post(
        f"/api/employees/{emp_id}/ratings",
        json={"year": 2026, "month": 3, "rating": 4.5, "notes": ""},
    )
    assert r.status_code == 201
    r = client.get(f"/api/employees/{emp_id}/ratings")
    assert r.json()["data"]["total"] == 1


def test_duplicate_month_rejected():
    emp_id = _seed_employee()
    client = make_authed_client()
    p = {"year": 2026, "month": 3, "rating": 4.5, "notes": ""}
    assert client.post(f"/api/employees/{emp_id}/ratings", json=p).status_code == 201
    r = client.post(f"/api/employees/{emp_id}/ratings", json=p)
    assert r.status_code == 409


def test_update_rating():
    emp_id = _seed_employee()
    client = make_authed_client()
    rid = client.post(
        f"/api/employees/{emp_id}/ratings",
        json={"year": 2026, "month": 3, "rating": 4.0, "notes": ""},
    ).json()["data"]["id"]
    r = client.patch(
        f"/api/employees/{emp_id}/ratings/{rid}", json={"rating": 4.8}
    )
    assert r.json()["data"]["rating"] == 4.8


def test_delete_rating():
    emp_id = _seed_employee()
    client = make_authed_client()
    rid = client.post(
        f"/api/employees/{emp_id}/ratings",
        json={"year": 2026, "month": 3, "rating": 4.0, "notes": ""},
    ).json()["data"]["id"]
    r = client.delete(f"/api/employees/{emp_id}/ratings/{rid}")
    assert r.status_code == 204
```

- [ ] **Step 2: Run — expect fail**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_routes_employee_ratings.py -v
```

- [ ] **Step 3: Add to `app/routes/employees.py`**

Add imports:

```python
from app.models import MonthlyRating
from app.schemas.employees import (
    MonthlyRatingCreate,
    MonthlyRatingOut,
    MonthlyRatingUpdate,
)
```

Append:

```python
@router.get("/{employee_id}/ratings")
def list_ratings(
    employee_id: int,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    _get_employee_or_404(db, employee_id)
    rows = (
        db.execute(
            select(MonthlyRating)
            .where(MonthlyRating.employee_id == employee_id)
            .order_by(MonthlyRating.year.desc(), MonthlyRating.month.desc())
        )
        .scalars()
        .all()
    )
    items = [MonthlyRatingOut.model_validate(r) for r in rows]
    return {
        "data": ListResponse[MonthlyRatingOut](
            items=items, total=len(items), page=1, page_size=len(items) or 1
        ).model_dump(mode="json")
    }


@router.post("/{employee_id}/ratings", status_code=status.HTTP_201_CREATED)
def create_rating(
    employee_id: int,
    payload: MonthlyRatingCreate,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    _get_employee_or_404(db, employee_id)
    rating = MonthlyRating(employee_id=employee_id, **payload.model_dump())
    db.add(rating)
    try:
        db.commit()
    except IntegrityError as err:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="يوجد تقييم مسبق لهذا الشهر",
        ) from err
    db.refresh(rating)
    return {"data": MonthlyRatingOut.model_validate(rating).model_dump(mode="json")}


@router.patch("/{employee_id}/ratings/{rating_id}")
def update_rating(
    employee_id: int,
    rating_id: int,
    payload: MonthlyRatingUpdate,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    _get_employee_or_404(db, employee_id)
    rating = db.get(MonthlyRating, rating_id)
    if rating is None or rating.employee_id != employee_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="التقييم غير موجود"
        )
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(rating, field, value)
    db.commit()
    db.refresh(rating)
    return {"data": MonthlyRatingOut.model_validate(rating).model_dump(mode="json")}


@router.delete(
    "/{employee_id}/ratings/{rating_id}", status_code=status.HTTP_204_NO_CONTENT
)
def delete_rating(
    employee_id: int,
    rating_id: int,
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> Response:
    _get_employee_or_404(db, employee_id)
    rating = db.get(MonthlyRating, rating_id)
    if rating is None or rating.employee_id != employee_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="التقييم غير موجود"
        )
    db.delete(rating)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
```

- [ ] **Step 4: Run — expect pass**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_routes_employee_ratings.py -v
```

Expected: `4 passed`.

- [ ] **Step 5: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add backend/app/routes/employees.py backend/tests/test_routes_employee_ratings.py
git commit -m "feat(backend): add CRUD for employee monthly ratings"
```

---

## Task 14: Phase 2 verification

- [ ] **Step 1: Full backend test suite passes**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest -v
```

Expected: all Phase 1 + Phase 2 tests pass (≥ 45 tests).

- [ ] **Step 2: Linters clean**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
ruff check .
black --check .
```

Expected: both clean.

- [ ] **Step 3: Smoke test the live API**

Reset the dev DB and seed:

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
rm -f markaz.db
alembic upgrade head
python -m scripts.seed
```

Start the server:

```bash
uvicorn app.main:app --port 8000
```

In a second terminal:

```bash
# Auth
curl -sX POST http://127.0.0.1:8000/api/setup \
  -H 'Content-Type: application/json' \
  -c /tmp/cookies.txt \
  -d '{"username":"chief","password":"StrongPass1!"}'

curl -sX POST http://127.0.0.1:8000/api/auth/login \
  -H 'Content-Type: application/json' \
  -c /tmp/cookies.txt \
  -d '{"username":"chief","password":"StrongPass1!"}'

# Read one of the seeded employees
curl -s http://127.0.0.1:8000/api/employees?page=1 -b /tmp/cookies.txt | head -c 500
echo ""

curl -s http://127.0.0.1:8000/api/employees/1 -b /tmp/cookies.txt | head -c 500
echo ""
```

Expected:
- First request returns a JSON payload with `items` containing the 20 seeded employees (paginated to 20)
- Second request returns employee #1 with nested certifications, equipment, and ratings populated

Stop the server with Ctrl+C.

- [ ] **Step 4: Git status clean**

```bash
cd /Users/turkioqab/Projects/Markaz
git status
git log --oneline | head -25
```

Expected: clean tree; ~14 new commits.

---

## Phase 2 exit criteria

1. `pytest -v` passes all backend tests (≥ 45)
2. Every endpoint in the design spec's "Employees (+ nested resources)" section is implemented
3. Every endpoint requires auth — unauthenticated requests return 401
4. Photo upload validates extension + size + actual image bytes; saves under `uploads/employees/{id}.{ext}`; path returned in `photo_path`
5. Deleting an employee who drives a vehicle returns 409 with an Arabic message
6. `ruff check .` + `black --check .` clean
7. Working tree clean and all commits pushed-ready

Phase 3 (Backend: Vehicles API) starts next, following the same pattern.
