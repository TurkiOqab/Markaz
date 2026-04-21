# Phase 1 — Database & Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full database schema from the design spec, load realistic seed data, encrypt the DB file at rest with SQLCipher, and implement the chief's authentication (first-run setup, login, logout, session, lockout).

**Architecture:** SQLAlchemy 2.x ORM (synchronous — single-user app, no async needed) on top of a SQLCipher-encrypted SQLite file. Alembic manages schema migrations. Auth uses bcrypt-hashed passwords, random session tokens stored in DB + HTTP-only cookies, and a `failed_login_attempts` table for brute-force lockout.

**Tech Stack:** SQLAlchemy 2.x, Alembic, sqlcipher3-binary, passlib[bcrypt], pydantic, FastAPI, pytest.

---

## File Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                      # (existing) — register new routers
│   ├── config.py                    # DB URL, DB key, cookie settings from env
│   ├── db.py                        # engine, SessionLocal, get_db dependency
│   ├── models/
│   │   ├── __init__.py              # re-exports all models
│   │   ├── base.py                  # Base = declarative_base(), timestamp mixin
│   │   ├── auth.py                  # Chief, Session, FailedLoginAttempt
│   │   ├── employees.py             # Team, Employee, Certification, Equipment, MonthlyRating
│   │   ├── vehicles.py              # Vehicle, VehicleMaintenance, VehicleEquipment, VehicleInspection
│   │   └── building.py              # Building, Room, InventoryItem, BuildingMaintenance, BuildingReport
│   ├── auth/
│   │   ├── __init__.py
│   │   ├── password.py              # hash_password, verify_password
│   │   ├── session.py               # create_session, get_session_chief, delete_session
│   │   ├── lockout.py               # record_failed_attempt, is_locked_out, reset_attempts
│   │   └── routes.py                # /api/auth/login, /api/auth/logout, /api/setup
│   └── dependencies.py              # get_current_chief FastAPI dependency
├── alembic/
│   ├── env.py                       # alembic environment config
│   ├── versions/
│   │   └── 0001_initial.py          # initial schema migration (auto-generated)
│   └── script.py.mako
├── alembic.ini
├── scripts/
│   └── seed.py                      # CLI: python -m scripts.seed — loads plan/seed-data/
└── tests/
    ├── conftest.py                  # pytest fixtures (fresh DB per test)
    ├── test_models.py               # basic sanity test: create + read each model
    ├── test_seed.py                 # seed script loads all JSON files correctly
    ├── test_auth_password.py
    ├── test_auth_session.py
    ├── test_auth_lockout.py
    └── test_auth_routes.py          # setup, login, logout, middleware
```

---

## Task 1: Install database and auth dependencies

**Files:**
- Modify: `backend/pyproject.toml`

- [ ] **Step 1: Update `backend/pyproject.toml` dependencies**

Replace the `dependencies` and `dev` lists with:

```toml
dependencies = [
    "fastapi>=0.110",
    "uvicorn[standard]>=0.27",
    "sqlalchemy>=2.0",
    "alembic>=1.13",
    "sqlcipher3-binary>=0.5",
    "passlib[bcrypt]>=1.7",
    "pydantic>=2.6",
    "python-multipart>=0.0.9",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "httpx>=0.27",
    "ruff>=0.3",
    "black>=24.0",
]
```

- [ ] **Step 2: Install the new dependencies**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pip install -e ".[dev]"
```

Expected: output ends with `Successfully installed ...` listing sqlalchemy, alembic, sqlcipher3-binary, passlib, bcrypt, pydantic, python-multipart.

- [ ] **Step 3: Verify the installs**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
python -c "import sqlalchemy; import alembic; import sqlcipher3; import passlib.hash; import pydantic; print('ALL OK')"
```

Expected: `ALL OK`

- [ ] **Step 4: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add backend/pyproject.toml
git commit -m "chore(backend): add SQLAlchemy, Alembic, SQLCipher, passlib, Pydantic"
```

---

## Task 2: Configuration and database engine

**Files:**
- Create: `backend/app/config.py`
- Create: `backend/app/db.py`

- [ ] **Step 1: Create `backend/app/config.py`**

```python
import os
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DB_PATH = BACKEND_DIR / "markaz.db"

# Where the SQLCipher-encrypted SQLite file lives (production default).
DB_PATH = Path(os.environ.get("MARKAZ_DB_PATH", str(DEFAULT_DB_PATH)))

# Key used to encrypt the SQLCipher database. Dev default is fine; the
# production installer generates a random key and writes it to the env file.
DB_KEY = os.environ.get("MARKAZ_DB_KEY", "dev-key-change-me")

# Fully qualified SQLAlchemy URL override. If set, this wins over DB_PATH/DB_KEY.
# Tests set this to a plain sqlite:/// URL to skip the SQLCipher layer.
DB_URL_OVERRIDE = os.environ.get("MARKAZ_DB_URL")


def get_db_url() -> str:
    if DB_URL_OVERRIDE:
        return DB_URL_OVERRIDE
    return f"sqlite+pysqlcipher://:{DB_KEY}@/{DB_PATH}"


# Session cookie settings.
SESSION_COOKIE_NAME = "markaz_session"
SESSION_DAYS = 14

# Lockout settings (brute-force protection for the chief's login).
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_WINDOW_MINUTES = 15
```

- [ ] **Step 2: Create `backend/app/db.py`**

```python
from collections.abc import Iterator

from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker

from app.config import get_db_url

engine = create_engine(
    get_db_url(),
    future=True,
    connect_args={"check_same_thread": False},
)


# SQLite needs FK enforcement turned on per connection.
@event.listens_for(engine, "connect")
def _enable_fk(dbapi_conn, _):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def get_db() -> Iterator[Session]:
    """FastAPI dependency that yields a DB session and closes it afterwards."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
```

- [ ] **Step 3: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add backend/app/config.py backend/app/db.py
git commit -m "feat(backend): add config module and SQLCipher-aware engine/session"
```

---

## Task 3: Base model class and timestamp mixin

**Files:**
- Create: `backend/app/models/__init__.py`
- Create: `backend/app/models/base.py`

- [ ] **Step 1: Create `backend/app/models/base.py`**

```python
from datetime import datetime

from sqlalchemy import DateTime, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Root declarative base for all ORM models."""


class TimestampMixin:
    """Adds created_at and updated_at columns maintained by the DB."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )
```

- [ ] **Step 2: Create `backend/app/models/__init__.py`**

```python
from app.models.base import Base, TimestampMixin  # noqa: F401
```

(We'll add model re-exports to this file as we create each model module.)

- [ ] **Step 3: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add backend/app/models/__init__.py backend/app/models/base.py
git commit -m "feat(backend): add Base declarative class and TimestampMixin"
```

---

## Task 4: Employee-side ORM models

**Files:**
- Create: `backend/app/models/employees.py`
- Modify: `backend/app/models/__init__.py`

- [ ] **Step 1: Create `backend/app/models/employees.py`**

```python
from datetime import date
from typing import Optional

from sqlalchemy import Date, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Team(Base, TimestampMixin):
    __tablename__ = "teams"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(500))

    employees: Mapped[list["Employee"]] = relationship(back_populates="team")


class Employee(Base, TimestampMixin):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    rank: Mapped[str] = mapped_column(String(50), nullable=False)
    specialty: Mapped[str] = mapped_column(String(100), nullable=False)
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    marital_status: Mapped[str] = mapped_column(String(20), nullable=False)
    physical_ability: Mapped[str] = mapped_column(String(20), nullable=False)
    national_id: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    photo_path: Mapped[Optional[str]] = mapped_column(String(500))
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(200))
    team_id: Mapped[int] = mapped_column(ForeignKey("teams.id"), nullable=False)
    shift: Mapped[str] = mapped_column(String(20), nullable=False)

    team: Mapped[Team] = relationship(back_populates="employees")
    certifications: Mapped[list["Certification"]] = relationship(
        back_populates="employee", cascade="all, delete-orphan"
    )
    equipment: Mapped[list["Equipment"]] = relationship(
        back_populates="employee", cascade="all, delete-orphan"
    )
    monthly_ratings: Mapped[list["MonthlyRating"]] = relationship(
        back_populates="employee", cascade="all, delete-orphan"
    )


class Certification(Base, TimestampMixin):
    __tablename__ = "certifications"

    id: Mapped[int] = mapped_column(primary_key=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    issuing_authority: Mapped[str] = mapped_column(String(200), nullable=False)
    issue_date: Mapped[date] = mapped_column(Date, nullable=False)
    expiry_date: Mapped[date] = mapped_column(Date, nullable=False)

    employee: Mapped[Employee] = relationship(back_populates="certifications")


class Equipment(Base, TimestampMixin):
    __tablename__ = "equipment"

    id: Mapped[int] = mapped_column(primary_key=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False)
    item_name: Mapped[str] = mapped_column(String(200), nullable=False)
    serial_number: Mapped[Optional[str]] = mapped_column(String(100))
    assigned_date: Mapped[date] = mapped_column(Date, nullable=False)
    condition: Mapped[str] = mapped_column(String(20), nullable=False)

    employee: Mapped[Employee] = relationship(back_populates="equipment")


class MonthlyRating(Base, TimestampMixin):
    __tablename__ = "monthly_ratings"
    __table_args__ = (UniqueConstraint("employee_id", "year", "month"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False)
    year: Mapped[int] = mapped_column(nullable=False)
    month: Mapped[int] = mapped_column(nullable=False)
    rating: Mapped[float] = mapped_column(Numeric(3, 2), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(String(500))

    employee: Mapped[Employee] = relationship(back_populates="monthly_ratings")
```

- [ ] **Step 2: Re-export in `backend/app/models/__init__.py`**

Replace the file with:

```python
from app.models.base import Base, TimestampMixin  # noqa: F401
from app.models.employees import (  # noqa: F401
    Certification,
    Employee,
    Equipment,
    MonthlyRating,
    Team,
)
```

- [ ] **Step 3: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add backend/app/models/employees.py backend/app/models/__init__.py
git commit -m "feat(backend): add Team, Employee, Certification, Equipment, MonthlyRating models"
```

---

## Task 5: Vehicle-side ORM models

**Files:**
- Create: `backend/app/models/vehicles.py`
- Modify: `backend/app/models/__init__.py`

- [ ] **Step 1: Create `backend/app/models/vehicles.py`**

```python
from datetime import date
from typing import Optional

from sqlalchemy import Date, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin
from app.models.employees import Employee


class Vehicle(Base, TimestampMixin):
    __tablename__ = "vehicles"

    id: Mapped[int] = mapped_column(primary_key=True)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    plate_number: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    driver_id: Mapped[Optional[int]] = mapped_column(ForeignKey("employees.id"))
    photo_path: Mapped[Optional[str]] = mapped_column(String(500))

    driver: Mapped[Optional[Employee]] = relationship()
    maintenance: Mapped[list["VehicleMaintenance"]] = relationship(
        back_populates="vehicle", cascade="all, delete-orphan"
    )
    equipment: Mapped[list["VehicleEquipment"]] = relationship(
        back_populates="vehicle", cascade="all, delete-orphan"
    )
    inspections: Mapped[list["VehicleInspection"]] = relationship(
        back_populates="vehicle", cascade="all, delete-orphan"
    )


class VehicleMaintenance(Base, TimestampMixin):
    __tablename__ = "vehicle_maintenance"

    id: Mapped[int] = mapped_column(primary_key=True)
    vehicle_id: Mapped[int] = mapped_column(ForeignKey("vehicles.id"), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    cost: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    contractor: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False)

    vehicle: Mapped[Vehicle] = relationship(back_populates="maintenance")


class VehicleEquipment(Base, TimestampMixin):
    __tablename__ = "vehicle_equipment"

    id: Mapped[int] = mapped_column(primary_key=True)
    vehicle_id: Mapped[int] = mapped_column(ForeignKey("vehicles.id"), nullable=False)
    item_name: Mapped[str] = mapped_column(String(200), nullable=False)
    quantity: Mapped[int] = mapped_column(nullable=False)
    condition: Mapped[str] = mapped_column(String(20), nullable=False)

    vehicle: Mapped[Vehicle] = relationship(back_populates="equipment")


class VehicleInspection(Base, TimestampMixin):
    __tablename__ = "vehicle_inspections"

    id: Mapped[int] = mapped_column(primary_key=True)
    vehicle_id: Mapped[int] = mapped_column(ForeignKey("vehicles.id"), nullable=False)
    inspection_date: Mapped[date] = mapped_column(Date, nullable=False)
    inspector_name: Mapped[str] = mapped_column(String(200), nullable=False)
    result: Mapped[str] = mapped_column(String(30), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(String(1000))

    vehicle: Mapped[Vehicle] = relationship(back_populates="inspections")
```

- [ ] **Step 2: Update `backend/app/models/__init__.py`**

Replace the file with:

```python
from app.models.base import Base, TimestampMixin  # noqa: F401
from app.models.employees import (  # noqa: F401
    Certification,
    Employee,
    Equipment,
    MonthlyRating,
    Team,
)
from app.models.vehicles import (  # noqa: F401
    Vehicle,
    VehicleEquipment,
    VehicleInspection,
    VehicleMaintenance,
)
```

- [ ] **Step 3: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add backend/app/models/vehicles.py backend/app/models/__init__.py
git commit -m "feat(backend): add Vehicle and nested maintenance/equipment/inspection models"
```

---

## Task 6: Building-side ORM models

**Files:**
- Create: `backend/app/models/building.py`
- Modify: `backend/app/models/__init__.py`

- [ ] **Step 1: Create `backend/app/models/building.py`**

```python
from datetime import date
from typing import Optional

from sqlalchemy import Date, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Building(Base, TimestampMixin):
    __tablename__ = "building"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    address: Mapped[str] = mapped_column(String(500), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(String(1000))


class Room(Base, TimestampMixin):
    __tablename__ = "rooms"

    id: Mapped[int] = mapped_column(primary_key=True)
    type: Mapped[str] = mapped_column(String(30), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    capacity: Mapped[int] = mapped_column(nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(String(500))


class InventoryItem(Base, TimestampMixin):
    __tablename__ = "inventory"

    id: Mapped[int] = mapped_column(primary_key=True)
    item_name: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    quantity: Mapped[int] = mapped_column(nullable=False)
    location: Mapped[str] = mapped_column(String(200), nullable=False)
    min_threshold: Mapped[int] = mapped_column(nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(String(500))


class BuildingMaintenance(Base, TimestampMixin):
    __tablename__ = "building_maintenance"

    id: Mapped[int] = mapped_column(primary_key=True)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    cost: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    contractor: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False)


class BuildingReport(Base, TimestampMixin):
    __tablename__ = "building_reports"

    id: Mapped[int] = mapped_column(primary_key=True)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    summary: Mapped[str] = mapped_column(String(5000), nullable=False)
    file_path: Mapped[Optional[str]] = mapped_column(String(500))
```

- [ ] **Step 2: Update `backend/app/models/__init__.py`**

Replace the file with:

```python
from app.models.base import Base, TimestampMixin  # noqa: F401
from app.models.building import (  # noqa: F401
    Building,
    BuildingMaintenance,
    BuildingReport,
    InventoryItem,
    Room,
)
from app.models.employees import (  # noqa: F401
    Certification,
    Employee,
    Equipment,
    MonthlyRating,
    Team,
)
from app.models.vehicles import (  # noqa: F401
    Vehicle,
    VehicleEquipment,
    VehicleInspection,
    VehicleMaintenance,
)
```

- [ ] **Step 3: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add backend/app/models/building.py backend/app/models/__init__.py
git commit -m "feat(backend): add Building, Room, Inventory, Maintenance, Report models"
```

---

## Task 7: Auth ORM models

**Files:**
- Create: `backend/app/models/auth.py`
- Modify: `backend/app/models/__init__.py`

- [ ] **Step 1: Create `backend/app/models/auth.py`**

```python
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Chief(Base, TimestampMixin):
    __tablename__ = "chiefs"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(200), nullable=False)


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    chief_id: Mapped[int] = mapped_column(ForeignKey("chiefs.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    chief: Mapped[Chief] = relationship()


class FailedLoginAttempt(Base):
    __tablename__ = "failed_login_attempts"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    attempted_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45))
```

- [ ] **Step 2: Update `backend/app/models/__init__.py`**

Replace the file with:

```python
from app.models.auth import Chief, FailedLoginAttempt, Session  # noqa: F401
from app.models.base import Base, TimestampMixin  # noqa: F401
from app.models.building import (  # noqa: F401
    Building,
    BuildingMaintenance,
    BuildingReport,
    InventoryItem,
    Room,
)
from app.models.employees import (  # noqa: F401
    Certification,
    Employee,
    Equipment,
    MonthlyRating,
    Team,
)
from app.models.vehicles import (  # noqa: F401
    Vehicle,
    VehicleEquipment,
    VehicleInspection,
    VehicleMaintenance,
)
```

- [ ] **Step 3: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add backend/app/models/auth.py backend/app/models/__init__.py
git commit -m "feat(backend): add Chief, Session, and FailedLoginAttempt models"
```

---

## Task 8: Alembic initialization and initial migration

**Files:**
- Create: `backend/alembic.ini`
- Create: `backend/alembic/env.py`
- Create: `backend/alembic/script.py.mako`
- Create: `backend/alembic/versions/` (empty directory, + `.gitkeep`)
- Auto-generated: `backend/alembic/versions/0001_initial.py`

- [ ] **Step 1: Initialize alembic**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
alembic init alembic
```

Expected: creates `alembic.ini` + `alembic/` directory with `env.py`, `script.py.mako`, empty `versions/`.

- [ ] **Step 2: Edit `backend/alembic.ini`**

Find the line `sqlalchemy.url = driver://user:pass@localhost/dbname` and replace it with:

```ini
sqlalchemy.url =
```

(We'll set the URL programmatically in `env.py`.)

- [ ] **Step 3: Replace `backend/alembic/env.py` contents**

```python
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool

from alembic import context
from app.db import engine
from app.models import Base

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = str(engine.url)
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    with engine.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

- [ ] **Step 4: Generate the initial migration**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
alembic revision --autogenerate -m "initial schema" --rev-id=0001
```

Expected: creates `alembic/versions/0001_initial.py` with CREATE TABLE statements for every model.

- [ ] **Step 5: Apply the migration**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
alembic upgrade head
```

Expected: output mentions `Running upgrade -> 0001, initial schema`. A `markaz.db` file is created.

- [ ] **Step 6: Verify tables exist**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
python -c "
from sqlalchemy import inspect
from app.db import engine
tables = sorted(inspect(engine).get_table_names())
print('tables:', tables)
"
```

Expected: `tables: ['alembic_version', 'building', 'building_maintenance', 'building_reports', 'certifications', 'chiefs', 'employees', 'equipment', 'failed_login_attempts', 'inventory', 'monthly_ratings', 'rooms', 'sessions', 'teams', 'vehicle_equipment', 'vehicle_inspections', 'vehicle_maintenance', 'vehicles']`

- [ ] **Step 7: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add backend/alembic.ini backend/alembic/ backend/.gitignore
git commit -m "feat(backend): add alembic with initial schema migration"
```

(`markaz.db` is already in the root `.gitignore` via `*.db`.)

---

## Task 9: Seed script

**Files:**
- Create: `backend/scripts/__init__.py` (empty)
- Create: `backend/scripts/seed.py`
- Create: `backend/tests/test_seed.py`

- [ ] **Step 1: Create `backend/scripts/__init__.py`** (empty)

```bash
mkdir -p /Users/turkioqab/Projects/Markaz/backend/scripts
touch /Users/turkioqab/Projects/Markaz/backend/scripts/__init__.py
```

- [ ] **Step 2: Create `backend/scripts/seed.py`**

```python
"""Load plan/seed-data/*.json into the database.

Usage:
    python -m scripts.seed

The script is idempotent: it deletes all existing rows before inserting.
"""
import json
from datetime import date
from pathlib import Path

from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.models import (
    Building,
    BuildingMaintenance,
    BuildingReport,
    Certification,
    Employee,
    Equipment,
    InventoryItem,
    MonthlyRating,
    Room,
    Team,
    Vehicle,
    VehicleEquipment,
    VehicleInspection,
    VehicleMaintenance,
)

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
SEED_DIR = PROJECT_ROOT / "plan" / "seed-data"


def _parse_date(value: str) -> date:
    return date.fromisoformat(value)


def _load_json(name: str):
    with (SEED_DIR / name).open(encoding="utf-8") as f:
        return json.load(f)


def _clear_all(session: Session) -> None:
    # Order matters: children before parents.
    for model in (
        Certification,
        Equipment,
        MonthlyRating,
        VehicleMaintenance,
        VehicleEquipment,
        VehicleInspection,
        BuildingMaintenance,
        BuildingReport,
        Room,
        InventoryItem,
        Vehicle,
        Employee,
        Team,
        Building,
    ):
        session.query(model).delete()


def seed(session: Session) -> None:
    _clear_all(session)

    for row in _load_json("teams.json"):
        session.add(Team(**row))

    for emp in _load_json("employees.json"):
        certs = emp.pop("certifications", [])
        equip = emp.pop("equipment", [])
        ratings = emp.pop("monthly_ratings", [])
        emp["date_of_birth"] = _parse_date(emp["date_of_birth"])
        employee = Employee(**emp)
        for c in certs:
            c["issue_date"] = _parse_date(c["issue_date"])
            c["expiry_date"] = _parse_date(c["expiry_date"])
            employee.certifications.append(Certification(**c))
        for e in equip:
            e["assigned_date"] = _parse_date(e["assigned_date"])
            employee.equipment.append(Equipment(**e))
        for r in ratings:
            employee.monthly_ratings.append(MonthlyRating(**r))
        session.add(employee)

    for veh in _load_json("vehicles.json"):
        maint = veh.pop("maintenance", [])
        eq = veh.pop("equipment", [])
        insp = veh.pop("inspections", [])
        vehicle = Vehicle(**veh)
        for m in maint:
            m["date"] = _parse_date(m["date"])
            vehicle.maintenance.append(VehicleMaintenance(**m))
        for e in eq:
            vehicle.equipment.append(VehicleEquipment(**e))
        for i in insp:
            i["inspection_date"] = _parse_date(i["inspection_date"])
            vehicle.inspections.append(VehicleInspection(**i))
        session.add(vehicle)

    building_data = _load_json("building.json")
    session.add(Building(**building_data["building"]))
    for r in building_data["rooms"]:
        session.add(Room(**r))
    for i in building_data["inventory"]:
        session.add(InventoryItem(**i))
    for m in building_data["maintenance"]:
        m["date"] = _parse_date(m["date"])
        session.add(BuildingMaintenance(**m))
    for r in building_data["reports"]:
        r["date"] = _parse_date(r["date"])
        session.add(BuildingReport(**r))

    session.commit()


def main() -> None:
    with SessionLocal() as session:
        seed(session)
    print("Seed data loaded.")


if __name__ == "__main__":
    main()
```

- [ ] **Step 3: Create `backend/tests/conftest.py`** (shared fixtures)

```python
"""Test configuration: force a plain SQLite URL BEFORE any app module is imported.

pytest loads conftest.py before test modules, so setting the env var here
means `app.db` will see the test URL on first import.
"""
import os
import tempfile
from pathlib import Path

import pytest

# Module-level setup runs before any test imports `app.*`.
_TEST_DIR = Path(tempfile.mkdtemp(prefix="markaz-test-"))
_TEST_DB_FILE = _TEST_DIR / "markaz-test.db"
os.environ["MARKAZ_DB_URL"] = f"sqlite:///{_TEST_DB_FILE}"
os.environ["MARKAZ_DB_KEY"] = "test-key"


@pytest.fixture(autouse=True)
def fresh_db():
    """Before each test, drop and recreate all tables for isolation."""
    from app import models
    from app.db import engine

    models.Base.metadata.drop_all(engine)
    models.Base.metadata.create_all(engine)
    yield
```

- [ ] **Step 4: Write the seed test `backend/tests/test_seed.py`**

```python
from app.db import SessionLocal
from app.models import Building, Employee, Room, Team, Vehicle
from scripts.seed import seed


def test_seed_loads_all_entities():
    with SessionLocal() as session:
        seed(session)

    with SessionLocal() as session:
        assert session.query(Team).count() == 3
        assert session.query(Employee).count() == 20
        assert session.query(Vehicle).count() == 8
        assert session.query(Building).count() == 1
        assert session.query(Room).count() == 15
```

- [ ] **Step 5: Run the seed test**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_seed.py -v
```

Expected: `PASSED`.

- [ ] **Step 6: Run the seed script against the real dev DB for a sanity check**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
python -m scripts.seed
```

Expected: `Seed data loaded.`

- [ ] **Step 7: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add backend/scripts/ backend/tests/conftest.py backend/tests/test_seed.py
git commit -m "feat(backend): add seed script that loads plan/seed-data into the DB"
```

---

## Task 10: Password hashing utilities (TDD)

**Files:**
- Create: `backend/app/auth/__init__.py` (empty)
- Create: `backend/app/auth/password.py`
- Create: `backend/tests/test_auth_password.py`

- [ ] **Step 1: Create the package**

```bash
mkdir -p /Users/turkioqab/Projects/Markaz/backend/app/auth
touch /Users/turkioqab/Projects/Markaz/backend/app/auth/__init__.py
```

- [ ] **Step 2: Write the failing test**

Create `backend/tests/test_auth_password.py`:

```python
from app.auth.password import hash_password, verify_password


def test_hash_password_returns_non_trivial_string():
    hashed = hash_password("CorrectHorse1!")
    assert hashed != "CorrectHorse1!"
    assert len(hashed) > 40


def test_verify_password_accepts_correct_password():
    hashed = hash_password("CorrectHorse1!")
    assert verify_password("CorrectHorse1!", hashed) is True


def test_verify_password_rejects_wrong_password():
    hashed = hash_password("CorrectHorse1!")
    assert verify_password("wrong", hashed) is False
```

- [ ] **Step 3: Run the test — expect ImportError failure**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_auth_password.py -v
```

Expected: `ModuleNotFoundError: No module named 'app.auth.password'`.

- [ ] **Step 4: Implement `backend/app/auth/password.py`**

```python
from passlib.hash import bcrypt


def hash_password(plaintext: str) -> str:
    return bcrypt.using(rounds=12).hash(plaintext)


def verify_password(plaintext: str, hashed: str) -> bool:
    try:
        return bcrypt.verify(plaintext, hashed)
    except ValueError:
        return False
```

- [ ] **Step 5: Run the test — expect pass**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_auth_password.py -v
```

Expected: `3 passed`.

- [ ] **Step 6: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add backend/app/auth/__init__.py backend/app/auth/password.py backend/tests/test_auth_password.py
git commit -m "feat(backend): add bcrypt password hashing utilities"
```

---

## Task 11: Session utilities (TDD)

**Files:**
- Create: `backend/app/auth/session.py`
- Create: `backend/tests/test_auth_session.py`

- [ ] **Step 1: Write the failing test**

Create `backend/tests/test_auth_session.py`:

```python
from datetime import datetime, timedelta

from app.auth.password import hash_password
from app.auth.session import (
    create_session,
    delete_session,
    get_session_chief,
)
from app.db import SessionLocal
from app.models import Chief


def _make_chief() -> int:
    with SessionLocal() as db:
        chief = Chief(username="chief", password_hash=hash_password("pw"))
        db.add(chief)
        db.commit()
        return chief.id


def test_create_and_read_session():
    chief_id = _make_chief()
    with SessionLocal() as db:
        token = create_session(db, chief_id)
        assert isinstance(token, str) and len(token) >= 32
    with SessionLocal() as db:
        chief = get_session_chief(db, token)
        assert chief is not None
        assert chief.id == chief_id


def test_get_session_chief_returns_none_for_unknown_token():
    with SessionLocal() as db:
        assert get_session_chief(db, "nope") is None


def test_get_session_chief_returns_none_for_expired_session():
    chief_id = _make_chief()
    with SessionLocal() as db:
        token = create_session(db, chief_id, expires_at=datetime.utcnow() - timedelta(seconds=1))
    with SessionLocal() as db:
        assert get_session_chief(db, token) is None


def test_delete_session():
    chief_id = _make_chief()
    with SessionLocal() as db:
        token = create_session(db, chief_id)
    with SessionLocal() as db:
        delete_session(db, token)
    with SessionLocal() as db:
        assert get_session_chief(db, token) is None
```

- [ ] **Step 2: Run the test — expect fail**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_auth_session.py -v
```

Expected: `ModuleNotFoundError: No module named 'app.auth.session'`.

- [ ] **Step 3: Implement `backend/app/auth/session.py`**

```python
from datetime import datetime, timedelta
from secrets import token_urlsafe
from typing import Optional

from sqlalchemy.orm import Session as SA_Session

from app.config import SESSION_DAYS
from app.models import Chief, Session as SessionModel


def create_session(
    db: SA_Session,
    chief_id: int,
    *,
    expires_at: Optional[datetime] = None,
) -> str:
    now = datetime.utcnow()
    if expires_at is None:
        expires_at = now + timedelta(days=SESSION_DAYS)
    token = token_urlsafe(32)
    db.add(SessionModel(id=token, chief_id=chief_id, created_at=now, expires_at=expires_at))
    db.commit()
    return token


def get_session_chief(db: SA_Session, token: str) -> Optional[Chief]:
    row = db.get(SessionModel, token)
    if row is None:
        return None
    if row.expires_at < datetime.utcnow():
        return None
    return row.chief


def delete_session(db: SA_Session, token: str) -> None:
    row = db.get(SessionModel, token)
    if row is not None:
        db.delete(row)
        db.commit()
```

- [ ] **Step 4: Run the test — expect pass**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_auth_session.py -v
```

Expected: `4 passed`.

- [ ] **Step 5: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add backend/app/auth/session.py backend/tests/test_auth_session.py
git commit -m "feat(backend): add session create/read/delete helpers"
```

---

## Task 12: Lockout tracking (TDD)

**Files:**
- Create: `backend/app/auth/lockout.py`
- Create: `backend/tests/test_auth_lockout.py`

- [ ] **Step 1: Write the failing test**

Create `backend/tests/test_auth_lockout.py`:

```python
from datetime import datetime, timedelta

from app.auth.lockout import is_locked_out, record_failed_attempt, reset_attempts
from app.db import SessionLocal


def test_not_locked_out_initially():
    with SessionLocal() as db:
        assert is_locked_out(db, "chief") is False


def test_locked_out_after_five_failed_attempts():
    with SessionLocal() as db:
        for _ in range(5):
            record_failed_attempt(db, "chief")
        assert is_locked_out(db, "chief") is True


def test_old_attempts_do_not_count():
    with SessionLocal() as db:
        old = datetime.utcnow() - timedelta(minutes=30)
        for _ in range(5):
            record_failed_attempt(db, "chief", at=old)
        assert is_locked_out(db, "chief") is False


def test_reset_attempts_clears_lockout():
    with SessionLocal() as db:
        for _ in range(5):
            record_failed_attempt(db, "chief")
        reset_attempts(db, "chief")
        assert is_locked_out(db, "chief") is False
```

- [ ] **Step 2: Run the test — expect fail**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_auth_lockout.py -v
```

Expected: `ModuleNotFoundError`.

- [ ] **Step 3: Implement `backend/app/auth/lockout.py`**

```python
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.config import LOCKOUT_WINDOW_MINUTES, MAX_FAILED_ATTEMPTS
from app.models import FailedLoginAttempt


def record_failed_attempt(
    db: Session,
    username: str,
    *,
    at: Optional[datetime] = None,
    ip_address: Optional[str] = None,
) -> None:
    attempted_at = at or datetime.utcnow()
    db.add(
        FailedLoginAttempt(
            username=username, attempted_at=attempted_at, ip_address=ip_address
        )
    )
    db.commit()


def is_locked_out(db: Session, username: str) -> bool:
    cutoff = datetime.utcnow() - timedelta(minutes=LOCKOUT_WINDOW_MINUTES)
    stmt = select(FailedLoginAttempt).where(
        FailedLoginAttempt.username == username,
        FailedLoginAttempt.attempted_at >= cutoff,
    )
    count = len(db.execute(stmt).scalars().all())
    return count >= MAX_FAILED_ATTEMPTS


def reset_attempts(db: Session, username: str) -> None:
    db.execute(
        delete(FailedLoginAttempt).where(FailedLoginAttempt.username == username)
    )
    db.commit()
```

- [ ] **Step 4: Run the test — expect pass**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_auth_lockout.py -v
```

Expected: `4 passed`.

- [ ] **Step 5: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add backend/app/auth/lockout.py backend/tests/test_auth_lockout.py
git commit -m "feat(backend): add failed-login tracking and lockout helpers"
```

---

## Task 13: Auth routes — first-run setup, login, logout (TDD)

**Files:**
- Create: `backend/app/auth/routes.py`
- Create: `backend/app/dependencies.py`
- Modify: `backend/app/main.py`
- Create: `backend/tests/test_auth_routes.py`

- [ ] **Step 1: Write the failing test**

Create `backend/tests/test_auth_routes.py`:

```python
from fastapi.testclient import TestClient


def _client():
    # Import inside the function so that the tmp_db fixture's env patches
    # take effect before FastAPI wires routes.
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

    r = client.post(
        "/api/auth/login", json={"username": "chief", "password": "StrongPass1!"}
    )
    assert r.status_code == 200
    assert r.json() == {"data": {"ok": True}}
    assert "markaz_session" in r.cookies


def test_login_with_wrong_password_returns_401():
    client = _client()
    client.post("/api/setup", json={"username": "chief", "password": "StrongPass1!"})
    r = client.post(
        "/api/auth/login", json={"username": "chief", "password": "nope"}
    )
    assert r.status_code == 401


def test_lockout_after_five_failed_attempts():
    client = _client()
    client.post("/api/setup", json={"username": "chief", "password": "StrongPass1!"})
    for _ in range(5):
        client.post(
            "/api/auth/login", json={"username": "chief", "password": "nope"}
        )
    r = client.post(
        "/api/auth/login", json={"username": "chief", "password": "StrongPass1!"}
    )
    assert r.status_code == 429


def test_logout_clears_cookie():
    client = _client()
    client.post("/api/setup", json={"username": "chief", "password": "StrongPass1!"})
    client.post(
        "/api/auth/login", json={"username": "chief", "password": "StrongPass1!"}
    )
    r = client.post("/api/auth/logout")
    assert r.status_code == 200
    # After logout the cookie should be cleared; subsequent protected calls would 401.
```

- [ ] **Step 2: Run the test — expect fail**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_auth_routes.py -v
```

Expected: 404s / ModuleNotFoundError.

- [ ] **Step 3: Create `backend/app/dependencies.py`**

```python
from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.session import get_session_chief
from app.config import SESSION_COOKIE_NAME
from app.db import get_db
from app.models import Chief


def get_current_chief(
    session_cookie: Annotated[str | None, Cookie(alias=SESSION_COOKIE_NAME)] = None,
    db: Session = Depends(get_db),
) -> Chief:
    if session_cookie is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="غير مصرح")
    chief = get_session_chief(db, session_cookie)
    if chief is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="غير مصرح")
    return chief
```

- [ ] **Step 4: Create `backend/app/auth/routes.py`**

```python
from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth.lockout import is_locked_out, record_failed_attempt, reset_attempts
from app.auth.password import hash_password, verify_password
from app.auth.session import create_session, delete_session
from app.config import SESSION_COOKIE_NAME, SESSION_DAYS
from app.db import get_db
from app.models import Chief

router = APIRouter()


class Credentials(BaseModel):
    username: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=10, max_length=200)


@router.post("/api/setup", status_code=status.HTTP_201_CREATED)
def setup(payload: Credentials, db: Session = Depends(get_db)) -> dict:
    existing = db.execute(select(func.count()).select_from(Chief)).scalar_one()
    if existing > 0:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="تم الإعداد مسبقاً")
    chief = Chief(username=payload.username, password_hash=hash_password(payload.password))
    db.add(chief)
    db.commit()
    return {"data": {"ok": True}}


@router.post("/api/auth/login")
def login(payload: Credentials, response: Response, db: Session = Depends(get_db)) -> dict:
    if is_locked_out(db, payload.username):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="تم حظر تسجيل الدخول مؤقتاً، حاول لاحقاً",
        )
    chief = db.execute(
        select(Chief).where(Chief.username == payload.username)
    ).scalar_one_or_none()
    if chief is None or not verify_password(payload.password, chief.password_hash):
        record_failed_attempt(db, payload.username)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="بيانات الدخول غير صحيحة",
        )
    reset_attempts(db, payload.username)
    token = create_session(db, chief.id)
    response.set_cookie(
        SESSION_COOKIE_NAME,
        token,
        httponly=True,
        samesite="lax",
        max_age=SESSION_DAYS * 24 * 60 * 60,
    )
    return {"data": {"ok": True}}


@router.post("/api/auth/logout")
def logout(
    response: Response,
    db: Session = Depends(get_db),
    session_cookie: Annotated[str | None, Cookie(alias=SESSION_COOKIE_NAME)] = None,
) -> dict:
    if session_cookie:
        delete_session(db, session_cookie)
    response.delete_cookie(SESSION_COOKIE_NAME)
    return {"data": {"ok": True}}
```

- [ ] **Step 5: Register the router in `backend/app/main.py`**

Replace `backend/app/main.py` with:

```python
from fastapi import FastAPI

from app.auth.routes import router as auth_router

app = FastAPI(title="Markaz", version="0.1.0")
app.include_router(auth_router)


@app.get("/api/health")
def health() -> dict:
    return {"data": {"status": "ok"}}
```

- [ ] **Step 6: Run the auth-routes tests — expect pass**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_auth_routes.py -v
```

Expected: `6 passed`.

- [ ] **Step 7: Run the whole backend test suite**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest -v
```

Expected: all Phase 1 tests pass (health + password + session + lockout + seed + auth-routes).

- [ ] **Step 8: Run linters**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
ruff check .
black --check .
```

Expected: clean.

- [ ] **Step 9: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add backend/app/auth/routes.py backend/app/dependencies.py backend/app/main.py backend/tests/test_auth_routes.py
git commit -m "feat(backend): add /api/setup, /api/auth/login, /api/auth/logout with lockout"
```

---

## Task 14: Phase 1 verification checklist

- [ ] **Step 1: Full backend test suite passes**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest -v
```

Expected: all tests pass.

- [ ] **Step 2: Alembic migration applies cleanly to a fresh DB**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
rm -f markaz.db
alembic upgrade head
python -m scripts.seed
```

Expected: migration runs, seed prints `Seed data loaded.`

- [ ] **Step 3: Setup → login flow works end-to-end against the real server**

Terminal A:

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Terminal B:

```bash
curl -sX POST http://127.0.0.1:8000/api/setup \
  -H 'Content-Type: application/json' \
  -d '{"username":"chief","password":"StrongPass1!"}'

curl -sX POST http://127.0.0.1:8000/api/auth/login \
  -H 'Content-Type: application/json' \
  -c cookies.txt \
  -d '{"username":"chief","password":"StrongPass1!"}'

cat cookies.txt  # should contain markaz_session

curl -sX POST http://127.0.0.1:8000/api/auth/logout -b cookies.txt
```

Expected: setup → `{"data":{"ok":true}}`, login → `{"data":{"ok":true}}`, cookies.txt contains a `markaz_session` entry, logout → `{"data":{"ok":true}}`.

Stop the server with Ctrl+C.

- [ ] **Step 4: Git status clean, ~14 new commits since Phase 0**

```bash
cd /Users/turkioqab/Projects/Markaz
git status
git log --oneline
```

Expected: clean working tree; the new commits make sense read top-to-bottom.

---

## Phase 1 exit criteria

1. `pytest -v` passes in backend (≥ 17 tests)
2. `alembic upgrade head` on an empty DB produces all tables from the design spec
3. `python -m scripts.seed` populates: 3 teams, 20 employees, 8 vehicles, 1 building, 15 rooms, 30 inventory items
4. `curl` sequence (setup → login → logout) works end-to-end
5. `ruff check .` + `black --check .` clean
6. Working tree clean and committed

Phase 2 (Backend: Employees API) starts next, building CRUD endpoints on top of the data layer from this phase.
