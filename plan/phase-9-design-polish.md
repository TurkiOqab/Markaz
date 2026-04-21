# Phase 9 — Design Polish & Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the functional-but-plain UI into a modern, branded dashboard. Add a brick-red accent color, icons throughout, status pills, and a rich dashboard with 4 stat cards, 4 charts, and an "attention needed" alerts panel. Polish login/setup screens and table interactions.

**Architecture:** One new backend endpoint (`GET /api/dashboard/stats`) aggregates everything the dashboard needs in a single call. Frontend adds two dependencies (`lucide-react` for icons, `recharts` for charts). Visual polish is spread across components (Sidebar, Header, Tables, Modals) without changing their API.

**Tech Stack:** React 19, lucide-react (icons), recharts (charts), Tailwind 3, FastAPI.

**Scope note:** This phase supersedes the "CRUD only" constraint from the original design spec — adding analytics was requested explicitly.

---

## File Structure

```
backend/
├── app/
│   ├── routes/
│   │   └── dashboard.py                # new: GET /api/dashboard/stats
│   ├── schemas/
│   │   └── dashboard.py                # aggregate response shape
│   └── main.py                         # register dashboard router
└── tests/
    └── test_routes_dashboard.py

frontend/
├── package.json                        # add lucide-react, recharts
├── tailwind.config.js                  # extend with brand red
└── src/
    ├── api/
    │   └── dashboard.ts                # fetchDashboardStats
    ├── components/
    │   ├── Badge.tsx                   # status pill component
    │   ├── ConfirmDialog.tsx           # replaces window.confirm
    │   ├── Avatar.tsx                  # initials-based avatar
    │   ├── Sidebar.tsx                 # icons + brand
    │   ├── Header.tsx                  # brand polish
    │   └── StatCard.tsx                # dashboard stat cards
    ├── pages/
    │   ├── DashboardPage.tsx           # rewrite with charts
    │   ├── LoginPage.tsx               # visual polish
    │   └── SetupPage.tsx               # visual polish
    └── types/
        └── dashboard.ts                # DashboardStats type
```

---

## Task 1: Backend — dashboard stats endpoint

**Files:**
- Create: `backend/app/schemas/dashboard.py`
- Create: `backend/app/routes/dashboard.py`
- Create: `backend/tests/test_routes_dashboard.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Create `backend/app/schemas/dashboard.py`**

```python
from pydantic import BaseModel


class ShiftCounts(BaseModel):
    صباحية: int = 0
    مسائية: int = 0
    ليلية: int = 0


class EmployeeStats(BaseModel):
    total: int
    by_shift: dict[str, int]


class VehicleStats(BaseModel):
    total: int
    by_status: dict[str, int]


class RoomStats(BaseModel):
    total: int
    by_status: dict[str, int]


class LowStockItem(BaseModel):
    id: int
    item_name: str
    quantity: int
    min_threshold: int


class InventoryStats(BaseModel):
    total: int
    low_stock: list[LowStockItem]


class MonthlyCost(BaseModel):
    year: int
    month: int
    vehicle: float
    building: float


class MaintenanceStats(BaseModel):
    open_count: int
    monthly_costs: list[MonthlyCost]


class MonthlyAverage(BaseModel):
    year: int
    month: int
    average: float


class RatingStats(BaseModel):
    monthly_average: list[MonthlyAverage]


class VehicleOut(BaseModel):
    id: int
    plate_number: str
    status: str


class ExpiringCertification(BaseModel):
    employee_id: int
    employee_name: str
    cert_name: str
    expiry_date: str
    days_until: int


class AttentionSection(BaseModel):
    vehicles_out: list[VehicleOut]
    expiring_certs: list[ExpiringCertification]
    low_stock: list[LowStockItem]


class DashboardStats(BaseModel):
    employees: EmployeeStats
    vehicles: VehicleStats
    rooms: RoomStats
    inventory: InventoryStats
    maintenance: MaintenanceStats
    ratings: RatingStats
    attention: AttentionSection
```

- [ ] **Step 2: Write failing tests — create `backend/tests/test_routes_dashboard.py`**

```python
from datetime import date, timedelta

from app.db import SessionLocal
from app.models import (
    BuildingMaintenance,
    Certification,
    Employee,
    InventoryItem,
    MonthlyRating,
    Team,
    Vehicle,
    VehicleMaintenance,
)
from fastapi.testclient import TestClient


def _client():
    from app.main import app

    return TestClient(app)


def _auth(client):
    client.post("/api/setup", json={"username": "chief", "password": "StrongPass1!"})
    client.post("/api/auth/login", json={"username": "chief", "password": "StrongPass1!"})


def test_dashboard_requires_auth():
    client = _client()
    r = client.get("/api/dashboard/stats")
    assert r.status_code == 401


def test_dashboard_returns_counts():
    with SessionLocal() as db:
        team = Team(name="الفريق أ")
        db.add(team)
        db.commit()
        db.add_all(
            [
                Employee(
                    name="A",
                    rank="ج",
                    specialty="ح",
                    date_of_birth=date(1990, 1, 1),
                    marital_status="أعزب",
                    physical_ability="جيد",
                    national_id="1" * 10,
                    phone="0500000001",
                    team_id=team.id,
                    shift="صباحية",
                ),
                Employee(
                    name="B",
                    rank="ج",
                    specialty="ح",
                    date_of_birth=date(1990, 1, 1),
                    marital_status="أعزب",
                    physical_ability="جيد",
                    national_id="2" * 10,
                    phone="0500000002",
                    team_id=team.id,
                    shift="ليلية",
                ),
                Vehicle(type="إطفاء", plate_number="V-1", status="في الخدمة"),
                Vehicle(type="إطفاء", plate_number="V-2", status="خارج الخدمة"),
            ]
        )
        db.commit()

    client = _client()
    _auth(client)
    r = client.get("/api/dashboard/stats")
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["employees"]["total"] == 2
    assert data["employees"]["by_shift"]["صباحية"] == 1
    assert data["employees"]["by_shift"]["ليلية"] == 1
    assert data["vehicles"]["total"] == 2
    assert data["vehicles"]["by_status"]["في الخدمة"] == 1
    assert data["vehicles"]["by_status"]["خارج الخدمة"] == 1


def test_dashboard_surfaces_attention_items():
    today = date.today()
    with SessionLocal() as db:
        team = Team(name="الفريق أ")
        db.add(team)
        db.commit()
        emp = Employee(
            name="علي",
            rank="ج",
            specialty="ح",
            date_of_birth=date(1990, 1, 1),
            marital_status="أعزب",
            physical_ability="جيد",
            national_id="3" * 10,
            phone="0500000003",
            team_id=team.id,
            shift="صباحية",
        )
        db.add(emp)
        db.commit()
        db.add_all(
            [
                Vehicle(type="إطفاء", plate_number="V-9", status="خارج الخدمة"),
                Certification(
                    employee_id=emp.id,
                    name="شهادة قريبة من الانتهاء",
                    issuing_authority="جهة",
                    issue_date=date(2020, 1, 1),
                    expiry_date=today + timedelta(days=10),
                ),
                InventoryItem(
                    item_name="صنف منخفض",
                    category="معدات",
                    quantity=1,
                    location="مخزن",
                    min_threshold=5,
                ),
            ]
        )
        db.commit()

    client = _client()
    _auth(client)
    r = client.get("/api/dashboard/stats")
    attention = r.json()["data"]["attention"]
    assert any(v["plate_number"] == "V-9" for v in attention["vehicles_out"])
    assert any(c["cert_name"] == "شهادة قريبة من الانتهاء" for c in attention["expiring_certs"])
    assert any(i["item_name"] == "صنف منخفض" for i in attention["low_stock"])


def test_dashboard_includes_monthly_rating_trend():
    with SessionLocal() as db:
        team = Team(name="الفريق أ")
        db.add(team)
        db.commit()
        emp = Employee(
            name="محمد",
            rank="ج",
            specialty="ح",
            date_of_birth=date(1990, 1, 1),
            marital_status="أعزب",
            physical_ability="جيد",
            national_id="5" * 10,
            phone="0500000005",
            team_id=team.id,
            shift="صباحية",
        )
        db.add(emp)
        db.commit()
        db.add_all(
            [
                MonthlyRating(employee_id=emp.id, year=2026, month=1, rating=4.0),
                MonthlyRating(employee_id=emp.id, year=2026, month=2, rating=4.5),
                MonthlyRating(employee_id=emp.id, year=2026, month=3, rating=5.0),
            ]
        )
        db.commit()

    client = _client()
    _auth(client)
    data = client.get("/api/dashboard/stats").json()["data"]
    trend = data["ratings"]["monthly_average"]
    # Sorted oldest-first, covers at least the 3 we added
    by_month = {(r["year"], r["month"]): r["average"] for r in trend}
    assert by_month[(2026, 1)] == 4.0
    assert by_month[(2026, 2)] == 4.5
    assert by_month[(2026, 3)] == 5.0


def test_dashboard_includes_maintenance_costs():
    with SessionLocal() as db:
        v = Vehicle(type="إطفاء", plate_number="V-C", status="في الخدمة")
        db.add(v)
        db.commit()
        db.add_all(
            [
                VehicleMaintenance(
                    vehicle_id=v.id,
                    date=date(2026, 1, 15),
                    description="oil",
                    cost=1000,
                    contractor="c",
                    status="مكتمل",
                ),
                BuildingMaintenance(
                    date=date(2026, 1, 20),
                    description="paint",
                    cost=2000,
                    contractor="c",
                    status="مكتمل",
                ),
            ]
        )
        db.commit()

    client = _client()
    _auth(client)
    data = client.get("/api/dashboard/stats").json()["data"]
    by_month = {(m["year"], m["month"]): m for m in data["maintenance"]["monthly_costs"]}
    assert by_month[(2026, 1)]["vehicle"] == 1000
    assert by_month[(2026, 1)]["building"] == 2000
```

- [ ] **Step 3: Run — expect fail (404)**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_routes_dashboard.py -v
```

- [ ] **Step 4: Create `backend/app/routes/dashboard.py`**

```python
from collections import defaultdict
from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_chief
from app.models import (
    BuildingMaintenance,
    Certification,
    Chief,
    Employee,
    InventoryItem,
    MonthlyRating,
    Room,
    Vehicle,
    VehicleMaintenance,
)

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


def _group_count(rows, getter: str) -> dict[str, int]:
    buckets: dict[str, int] = defaultdict(int)
    for row in rows:
        buckets[getattr(row, getter)] += 1
    return dict(buckets)


@router.get("/stats")
def dashboard_stats(
    db: Session = Depends(get_db),
    _chief: Chief = Depends(get_current_chief),
) -> dict:
    employees = db.execute(select(Employee)).scalars().all()
    vehicles = db.execute(select(Vehicle)).scalars().all()
    rooms = db.execute(select(Room)).scalars().all()
    inventory = db.execute(select(InventoryItem)).scalars().all()

    low_stock = [
        {
            "id": i.id,
            "item_name": i.item_name,
            "quantity": i.quantity,
            "min_threshold": i.min_threshold,
        }
        for i in inventory
        if i.quantity < i.min_threshold
    ]

    # Open maintenance count (vehicle + building)
    open_vehicle = [m for m in db.execute(select(VehicleMaintenance)).scalars().all()
                    if m.status in ("قيد التنفيذ", "مجدول")]
    open_building = [m for m in db.execute(select(BuildingMaintenance)).scalars().all()
                     if m.status in ("قيد التنفيذ", "مجدول")]

    # Monthly costs for last 6 months
    vmaints = db.execute(select(VehicleMaintenance)).scalars().all()
    bmaints = db.execute(select(BuildingMaintenance)).scalars().all()
    costs_by_month: dict[tuple[int, int], dict[str, float]] = defaultdict(
        lambda: {"vehicle": 0.0, "building": 0.0}
    )
    for m in vmaints:
        costs_by_month[(m.date.year, m.date.month)]["vehicle"] += float(m.cost)
    for m in bmaints:
        costs_by_month[(m.date.year, m.date.month)]["building"] += float(m.cost)
    monthly_costs = [
        {"year": y, "month": mo, "vehicle": v["vehicle"], "building": v["building"]}
        for (y, mo), v in sorted(costs_by_month.items())
    ]

    # Monthly rating averages
    ratings = db.execute(select(MonthlyRating)).scalars().all()
    rating_bucket: dict[tuple[int, int], list[float]] = defaultdict(list)
    for r in ratings:
        rating_bucket[(r.year, r.month)].append(float(r.rating))
    monthly_avg = [
        {"year": y, "month": m, "average": round(sum(vs) / len(vs), 2)}
        for (y, m), vs in sorted(rating_bucket.items())
    ]

    # Attention: vehicles out of service
    vehicles_out = [
        {"id": v.id, "plate_number": v.plate_number, "status": v.status}
        for v in vehicles
        if v.status != "في الخدمة"
    ]

    # Attention: certifications expiring in next 60 days
    today = date.today()
    cutoff = today + timedelta(days=60)
    certs = db.execute(select(Certification)).scalars().all()
    emp_by_id = {e.id: e.name for e in employees}
    expiring = [
        {
            "employee_id": c.employee_id,
            "employee_name": emp_by_id.get(c.employee_id, "—"),
            "cert_name": c.name,
            "expiry_date": c.expiry_date.isoformat(),
            "days_until": (c.expiry_date - today).days,
        }
        for c in certs
        if today <= c.expiry_date <= cutoff
    ]
    expiring.sort(key=lambda c: c["days_until"])

    return {
        "data": {
            "employees": {
                "total": len(employees),
                "by_shift": _group_count(employees, "shift"),
            },
            "vehicles": {
                "total": len(vehicles),
                "by_status": _group_count(vehicles, "status"),
            },
            "rooms": {
                "total": len(rooms),
                "by_status": _group_count(rooms, "status"),
            },
            "inventory": {
                "total": len(inventory),
                "low_stock": low_stock,
            },
            "maintenance": {
                "open_count": len(open_vehicle) + len(open_building),
                "monthly_costs": monthly_costs,
            },
            "ratings": {"monthly_average": monthly_avg},
            "attention": {
                "vehicles_out": vehicles_out,
                "expiring_certs": expiring,
                "low_stock": low_stock,
            },
        }
    }
```

- [ ] **Step 5: Register the router in `backend/app/main.py`**

Add to imports:

```python
from app.routes.dashboard import router as dashboard_router
```

And include it:

```python
app.include_router(dashboard_router)
```

- [ ] **Step 6: Run — expect pass**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_routes_dashboard.py -v
```

Expected: `5 passed`.

- [ ] **Step 7: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add backend/app/routes/dashboard.py backend/app/schemas/dashboard.py backend/app/main.py backend/tests/test_routes_dashboard.py
git commit -m "feat(backend): add GET /api/dashboard/stats aggregate endpoint"
```

---

## Task 2: Frontend — install deps + brand color

**Files:**
- Modify: `frontend/package.json` (via npm install)
- Modify: `frontend/tailwind.config.js`

- [ ] **Step 1: Install lucide-react and recharts**

```bash
cd /Users/turkioqab/Projects/Markaz/frontend
npm install lucide-react recharts
```

Expected: `added N packages`, no errors.

- [ ] **Step 2: Extend `frontend/tailwind.config.js` with brand palette**

Replace with:

```javascript
import tailwindcssRtl from 'tailwindcss-rtl';

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Cairo', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          400: '#f87171',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
      },
    },
  },
  plugins: [tailwindcssRtl],
};
```

- [ ] **Step 3: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add frontend/package.json frontend/package-lock.json frontend/tailwind.config.js
git commit -m "chore(frontend): add lucide-react + recharts; extend Tailwind with brand red"
```

---

## Task 3: Shared components — Badge, ConfirmDialog, Avatar

**Files:**
- Create: `frontend/src/components/Badge.tsx`
- Create: `frontend/src/components/ConfirmDialog.tsx`
- Create: `frontend/src/components/Avatar.tsx`

- [ ] **Step 1: Create `frontend/src/components/Badge.tsx`**

```typescript
import type { ReactNode } from "react";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const tones: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  danger: "bg-red-50 text-red-700 ring-red-200",
  info: "bg-blue-50 text-blue-700 ring-blue-200",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

// Helpers that map backend enums to tones
export function vehicleStatusTone(status: string): Tone {
  if (status === "في الخدمة") return "success";
  if (status === "صيانة") return "warning";
  if (status === "خارج الخدمة") return "danger";
  return "neutral";
}

export function roomStatusTone(status: string): Tone {
  if (status === "جاهزة") return "success";
  if (status === "صيانة") return "warning";
  return "neutral";
}

export function maintenanceStatusTone(status: string): Tone {
  if (status === "مكتمل") return "success";
  if (status === "قيد التنفيذ") return "info";
  if (status === "مجدول") return "neutral";
  if (status === "ملغي") return "danger";
  return "neutral";
}

export function inspectionResultTone(result: string): Tone {
  if (result === "ناجح") return "success";
  if (result === "يحتاج صيانة") return "warning";
  if (result === "غير صالح") return "danger";
  return "neutral";
}

export function conditionTone(condition: string): Tone {
  if (condition === "ممتاز") return "success";
  if (condition === "جيد") return "info";
  if (condition === "متوسط") return "warning";
  if (condition === "تالف") return "danger";
  return "neutral";
}
```

- [ ] **Step 2: Create `frontend/src/components/ConfirmDialog.tsx`**

```typescript
import { Button } from "./Button";
import { Modal } from "./Modal";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "تأكيد",
  cancelLabel = "إلغاء",
  destructive = false,
  onConfirm,
  onCancel,
  loading = false,
}: Props) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "danger" : "primary"}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-700">{message}</p>
    </Modal>
  );
}
```

- [ ] **Step 3: Create `frontend/src/components/Avatar.tsx`**

```typescript
interface Props {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
}

const sizes = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-24 w-24 text-2xl" };

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "؟";
  if (parts.length === 1) return parts[0][0];
  return parts[0][0] + parts[parts.length - 1][0];
}

export function Avatar({ name, src, size = "md" }: Props) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizes[size]} rounded-full border border-slate-200 object-cover`}
      />
    );
  }
  return (
    <div
      className={`${sizes[size]} flex items-center justify-center rounded-full bg-slate-200 font-semibold text-slate-600`}
      aria-label={name}
    >
      {initials(name)}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add frontend/src/components/Badge.tsx frontend/src/components/ConfirmDialog.tsx frontend/src/components/Avatar.tsx
git commit -m "feat(frontend): add Badge, ConfirmDialog, Avatar primitives"
```

---

## Task 4: Sidebar + Header polish with icons + brand

**Files:**
- Modify: `frontend/src/components/Sidebar.tsx`
- Modify: `frontend/src/components/Header.tsx`
- Modify: `frontend/src/components/Button.tsx`

- [ ] **Step 1: Update Button to use brand color for primary**

Replace `variants.primary` in `frontend/src/components/Button.tsx`:

```typescript
const variants = {
  primary: "bg-brand-700 text-white hover:bg-brand-800 disabled:bg-brand-400",
  secondary:
    "bg-white text-slate-900 border border-slate-300 hover:bg-slate-50 disabled:text-slate-400",
  danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300",
};
```

- [ ] **Step 2: Replace `frontend/src/components/Sidebar.tsx`**

```typescript
import {
  Building2,
  Home,
  Truck,
  Users,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import type { ComponentType } from "react";

const LINKS: Array<{ to: string; label: string; icon: ComponentType<{ size?: number }> }> = [
  { to: "/", label: "الرئيسية", icon: Home },
  { to: "/employees", label: "الموظفون", icon: Users },
  { to: "/vehicles", label: "المركبات", icon: Truck },
  { to: "/building", label: "المبنى", icon: Building2 },
];

export function Sidebar() {
  return (
    <nav className="h-full w-60 shrink-0 border-l border-slate-200 bg-white px-4 py-6">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-700 text-white font-bold">
          م
        </div>
        <div>
          <div className="text-base font-bold text-slate-900 leading-tight">مركز</div>
          <div className="text-xs text-slate-500">لوحة تحكم القائد</div>
        </div>
      </div>
      <ul className="space-y-1">
        {LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-brand-50 text-brand-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`
                }
              >
                <Icon size={18} />
                <span>{link.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```

- [ ] **Step 3: Replace `frontend/src/components/Header.tsx`**

```typescript
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../auth/useAuth";
import { Button } from "./Button";

export function Header() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      toast.success("تم تسجيل الخروج");
      navigate("/login", { replace: true });
    } catch {
      toast.error("تعذر تسجيل الخروج");
    }
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
      <span className="text-sm text-slate-500">مركز الدفاع المدني</span>
      <Button variant="secondary" onClick={handleLogout}>
        <LogOut size={16} />
        تسجيل الخروج
      </Button>
    </header>
  );
}
```

- [ ] **Step 4: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add frontend/src/components/Sidebar.tsx frontend/src/components/Header.tsx frontend/src/components/Button.tsx
git commit -m "feat(frontend): add icons and brand accent to sidebar, header, buttons"
```

---

## Task 5: Apply Badge component throughout tables

**Files:**
- Modify: all `*Tab.tsx` files that render status/condition/result strings

- [ ] **Step 1: Update employee list page to show shift badge**

In `frontend/src/pages/employees/EmployeesListPage.tsx`, replace:

```typescript
<td className="px-4 py-3 text-slate-700">{emp.shift}</td>
```

with:

```typescript
<td className="px-4 py-3"><Badge tone="info">{emp.shift}</Badge></td>
```

And add the import at the top:

```typescript
import { Badge } from "../../components/Badge";
```

- [ ] **Step 2: Update vehicle list page**

In `frontend/src/pages/vehicles/VehiclesListPage.tsx`, replace the status cell:

```typescript
<td className="px-4 py-3 text-slate-700">{v.status}</td>
```

with:

```typescript
<td className="px-4 py-3"><Badge tone={vehicleStatusTone(v.status)}>{v.status}</Badge></td>
```

And add imports:

```typescript
import { Badge, vehicleStatusTone } from "../../components/Badge";
```

- [ ] **Step 3: Update vehicle maintenance tab**

In `frontend/src/pages/vehicles/tabs/MaintenanceTab.tsx`, replace:

```typescript
<td className="px-4 py-3 text-slate-700">{m.status}</td>
```

with:

```typescript
<td className="px-4 py-3"><Badge tone={maintenanceStatusTone(m.status)}>{m.status}</Badge></td>
```

Add import:

```typescript
import { Badge, maintenanceStatusTone } from "../../../components/Badge";
```

- [ ] **Step 4: Update vehicle inspections tab**

In `frontend/src/pages/vehicles/tabs/InspectionsTab.tsx`, replace:

```typescript
<td className="px-4 py-3 text-slate-700">{i.result}</td>
```

with:

```typescript
<td className="px-4 py-3"><Badge tone={inspectionResultTone(i.result)}>{i.result}</Badge></td>
```

Add import:

```typescript
import { Badge, inspectionResultTone } from "../../../components/Badge";
```

- [ ] **Step 5: Update vehicle onboard equipment tab**

In `frontend/src/pages/vehicles/tabs/EquipmentTab.tsx`, replace:

```typescript
<td className="px-4 py-3 text-slate-700">{eq.condition}</td>
```

with:

```typescript
<td className="px-4 py-3"><Badge tone={conditionTone(eq.condition)}>{eq.condition}</Badge></td>
```

Add import:

```typescript
import { Badge, conditionTone } from "../../../components/Badge";
```

- [ ] **Step 6: Update employee equipment tab**

In `frontend/src/pages/employees/tabs/EquipmentTab.tsx`, replace:

```typescript
<td className="px-4 py-3 text-slate-700">{eq.condition}</td>
```

with:

```typescript
<td className="px-4 py-3"><Badge tone={conditionTone(eq.condition)}>{eq.condition}</Badge></td>
```

Add import:

```typescript
import { Badge, conditionTone } from "../../../components/Badge";
```

- [ ] **Step 7: Update building rooms tab**

In `frontend/src/pages/building/tabs/RoomsTab.tsx`, replace:

```typescript
<td className="px-4 py-3 text-slate-700">{r.status}</td>
```

with:

```typescript
<td className="px-4 py-3"><Badge tone={roomStatusTone(r.status)}>{r.status}</Badge></td>
```

Add import:

```typescript
import { Badge, roomStatusTone } from "../../../components/Badge";
```

- [ ] **Step 8: Update building maintenance tab**

In `frontend/src/pages/building/tabs/MaintenanceTab.tsx`, replace:

```typescript
<td className="px-4 py-3 text-slate-700">{m.status}</td>
```

with:

```typescript
<td className="px-4 py-3"><Badge tone={maintenanceStatusTone(m.status)}>{m.status}</Badge></td>
```

Add import:

```typescript
import { Badge, maintenanceStatusTone } from "../../../components/Badge";
```

- [ ] **Step 9: Run tests and type check**

```bash
cd /Users/turkioqab/Projects/Markaz/frontend
npm run test
npx tsc -b --noEmit
```

Expected: all tests pass, no TS errors.

- [ ] **Step 10: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add frontend/src/pages/
git commit -m "feat(frontend): replace plain status text with colored Badge pills"
```

---

## Task 6: Avatar in employees list + detail

**Files:**
- Modify: `frontend/src/pages/employees/EmployeesListPage.tsx`
- Modify: `frontend/src/pages/employees/tabs/MainInfoTab.tsx`

- [ ] **Step 1: Add avatar column to employees list**

In `frontend/src/pages/employees/EmployeesListPage.tsx`, add a new column at the start of each row. Replace the `<tr>` inside the `map`:

```typescript
{employees.map((emp) => (
  <tr
    key={emp.id}
    className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
  >
    <td className="px-4 py-3 w-12">
      <Avatar name={emp.name} src={emp.photo_path} size="sm" />
    </td>
    <td className="px-4 py-3">
      <Link
        to={`/employees/${emp.id}`}
        className="font-medium text-slate-900 hover:underline"
      >
        {emp.name}
      </Link>
    </td>
    <td className="px-4 py-3 text-slate-700">{emp.rank}</td>
    <td className="px-4 py-3 text-slate-700">{emp.specialty}</td>
    <td className="px-4 py-3 text-slate-700">{teamById.get(emp.team_id) ?? "—"}</td>
    <td className="px-4 py-3"><Badge tone="info">{emp.shift}</Badge></td>
    <td className="px-4 py-3 text-slate-500">{emp.national_id}</td>
  </tr>
))}
```

Add an empty `<th>` at the start of the header row:

```typescript
<tr>
  <th className="w-12"></th>
  <th className="px-4 py-3 text-start font-medium">الاسم</th>
  ...
</tr>
```

Add import:

```typescript
import { Avatar } from "../../components/Avatar";
```

- [ ] **Step 2: Update MainInfoTab photo placeholder to use Avatar**

In `frontend/src/pages/employees/tabs/MainInfoTab.tsx`, replace the photo placeholder div with:

```typescript
<Avatar name={employee.name} src={employee.photo_path} size="lg" />
```

Add import:

```typescript
import { Avatar } from "../../../components/Avatar";
```

(The old div + `؟` fallback can be removed since `Avatar` handles both cases.)

- [ ] **Step 3: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add frontend/src/pages/employees/
git commit -m "feat(frontend): use Avatar component in employees list and detail"
```

---

## Task 7: Dashboard page — stats, charts, alerts

**Files:**
- Create: `frontend/src/types/dashboard.ts`
- Create: `frontend/src/api/dashboard.ts`
- Create: `frontend/src/components/StatCard.tsx`
- Replace: `frontend/src/pages/DashboardPage.tsx`

- [ ] **Step 1: Create `frontend/src/types/dashboard.ts`**

```typescript
export interface LowStockItem {
  id: number;
  item_name: string;
  quantity: number;
  min_threshold: number;
}

export interface VehicleOutItem {
  id: number;
  plate_number: string;
  status: string;
}

export interface ExpiringCert {
  employee_id: number;
  employee_name: string;
  cert_name: string;
  expiry_date: string;
  days_until: number;
}

export interface MonthlyCost {
  year: number;
  month: number;
  vehicle: number;
  building: number;
}

export interface MonthlyAverage {
  year: number;
  month: number;
  average: number;
}

export interface DashboardStats {
  employees: { total: number; by_shift: Record<string, number> };
  vehicles: { total: number; by_status: Record<string, number> };
  rooms: { total: number; by_status: Record<string, number> };
  inventory: { total: number; low_stock: LowStockItem[] };
  maintenance: { open_count: number; monthly_costs: MonthlyCost[] };
  ratings: { monthly_average: MonthlyAverage[] };
  attention: {
    vehicles_out: VehicleOutItem[];
    expiring_certs: ExpiringCert[];
    low_stock: LowStockItem[];
  };
}
```

- [ ] **Step 2: Create `frontend/src/api/dashboard.ts`**

```typescript
import { api } from "./client";
import type { DashboardStats } from "../types/dashboard";

export function fetchDashboardStats() {
  return api.get<DashboardStats>("/api/dashboard/stats");
}
```

- [ ] **Step 3: Create `frontend/src/components/StatCard.tsx`**

```typescript
import type { ComponentType, ReactNode } from "react";

interface Props {
  label: string;
  value: ReactNode;
  sublabel?: ReactNode;
  icon: ComponentType<{ size?: number }>;
  tone?: "neutral" | "brand" | "warning" | "danger";
}

const tones = {
  neutral: { bg: "bg-slate-100", fg: "text-slate-700" },
  brand: { bg: "bg-brand-100", fg: "text-brand-700" },
  warning: { bg: "bg-amber-100", fg: "text-amber-700" },
  danger: { bg: "bg-red-100", fg: "text-red-700" },
};

export function StatCard({ label, value, sublabel, icon: Icon, tone = "neutral" }: Props) {
  const t = tones[tone];
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-600">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          {sublabel ? <p className="mt-1 text-xs text-slate-500">{sublabel}</p> : null}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${t.bg}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Replace `frontend/src/pages/DashboardPage.tsx`**

```typescript
import {
  AlertTriangle,
  Package,
  Truck,
  Users,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { ApiRequestError } from "../api/client";
import { fetchDashboardStats } from "../api/dashboard";
import { Badge, vehicleStatusTone } from "../components/Badge";
import { StatCard } from "../components/StatCard";
import type { DashboardStats } from "../types/dashboard";

const STATUS_COLORS: Record<string, string> = {
  "في الخدمة": "#10b981", // emerald-500
  "صيانة": "#f59e0b",    // amber-500
  "خارج الخدمة": "#dc2626", // red-600
};

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats()
      .then((s) => {
        setStats(s);
        setLoading(false);
      })
      .catch((err) => {
        toast.error(err instanceof ApiRequestError ? err.message : "فشل تحميل الإحصائيات");
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-slate-500">جارِ التحميل...</p>;
  if (!stats) return null;

  const inServiceCount = stats.vehicles.by_status["في الخدمة"] ?? 0;
  const readyRoomsCount = stats.rooms.by_status["جاهزة"] ?? 0;

  const vehicleData = Object.entries(stats.vehicles.by_status).map(([name, value]) => ({
    name,
    value,
  }));

  const shiftData = Object.entries(stats.employees.by_shift).map(([name, value]) => ({
    name,
    value,
  }));

  const monthlyAvg = stats.ratings.monthly_average.slice(-6).map((r) => ({
    period: `${r.year}/${String(r.month).padStart(2, "0")}`,
    average: r.average,
  }));

  const monthlyCosts = stats.maintenance.monthly_costs.slice(-6).map((c) => ({
    period: `${c.year}/${String(c.month).padStart(2, "0")}`,
    "مركبات": c.vehicle,
    "مبنى": c.building,
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">لوحة التحكم</h1>
        <p className="mt-1 text-sm text-slate-600">نظرة سريعة على حالة المركز</p>
      </header>

      {/* Stat cards */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="الموظفون"
          value={stats.employees.total}
          sublabel="إجمالي الموظفين"
          icon={Users}
          tone="brand"
        />
        <StatCard
          label="المركبات في الخدمة"
          value={`${inServiceCount} / ${stats.vehicles.total}`}
          sublabel="جاهزة للاستخدام"
          icon={Truck}
          tone="brand"
        />
        <StatCard
          label="صيانة مفتوحة"
          value={stats.maintenance.open_count}
          sublabel="قيد التنفيذ أو مجدولة"
          icon={Wrench}
          tone="warning"
        />
        <StatCard
          label="أصناف منخفضة المخزون"
          value={stats.inventory.low_stock.length}
          sublabel={`من أصل ${stats.inventory.total} صنفاً`}
          icon={Package}
          tone={stats.inventory.low_stock.length > 0 ? "danger" : "neutral"}
        />
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="حالة المركبات">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={vehicleData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
              >
                {vehicleData.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "#94a3b8"} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="الموظفون حسب الوردية">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={shiftData} layout="vertical" margin={{ left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" />
              <Tooltip />
              <Bar dataKey="value" fill="#b91c1c" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="متوسط التقييمات الشهري">
          {monthlyAvg.length === 0 ? (
            <EmptyChart message="لا توجد تقييمات بعد" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={monthlyAvg}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="period" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Line type="monotone" dataKey="average" stroke="#b91c1c" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="تكاليف الصيانة (6 أشهر)">
          {monthlyCosts.length === 0 ? (
            <EmptyChart message="لا توجد بيانات صيانة" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthlyCosts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="مركبات"
                  stackId="1"
                  stroke="#b91c1c"
                  fill="#b91c1c"
                  fillOpacity={0.4}
                />
                <Area
                  type="monotone"
                  dataKey="مبنى"
                  stackId="1"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.4}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </section>

      {/* Attention */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <AttentionCard title="مركبات خارج الخدمة" empty="كل المركبات في الخدمة">
          {stats.attention.vehicles_out.map((v) => (
            <li key={v.id} className="flex items-center justify-between py-2">
              <Link
                to={`/vehicles/${v.id}`}
                className="font-medium text-slate-900 hover:underline"
              >
                {v.plate_number}
              </Link>
              <Badge tone={vehicleStatusTone(v.status)}>{v.status}</Badge>
            </li>
          ))}
        </AttentionCard>

        <AttentionCard title="شهادات تنتهي قريباً" empty="لا شهادات تنتهي خلال 60 يوماً">
          {stats.attention.expiring_certs.slice(0, 5).map((c, i) => (
            <li key={i} className="flex items-center justify-between py-2 gap-3">
              <div className="min-w-0 flex-1">
                <Link
                  to={`/employees/${c.employee_id}`}
                  className="block truncate font-medium text-slate-900 hover:underline"
                >
                  {c.employee_name}
                </Link>
                <p className="truncate text-xs text-slate-500">{c.cert_name}</p>
              </div>
              <Badge tone={c.days_until <= 15 ? "danger" : "warning"}>
                {c.days_until} يوم
              </Badge>
            </li>
          ))}
        </AttentionCard>

        <AttentionCard title="مخزون منخفض" empty="كل الأصناف فوق الحد الأدنى">
          {stats.attention.low_stock.slice(0, 5).map((i) => (
            <li key={i.id} className="flex items-center justify-between py-2">
              <span className="truncate text-sm text-slate-900">{i.item_name}</span>
              <span className="text-xs text-slate-500">
                <span className="font-semibold text-red-600">{i.quantity}</span>
                {" / "}
                {i.min_threshold}
              </span>
            </li>
          ))}
        </AttentionCard>
      </section>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <h3 className="mb-3 text-sm font-semibold text-slate-700">{title}</h3>
      {children}
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[240px] items-center justify-center text-sm text-slate-500">
      {message}
    </div>
  );
}

function AttentionCard({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <header className="mb-2 flex items-center gap-2">
        <AlertTriangle size={16} className="text-amber-500" />
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      </header>
      {items.length === 0 ? (
        <p className="py-3 text-sm text-slate-500">{empty}</p>
      ) : (
        <ul className="divide-y divide-slate-100">{children}</ul>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add frontend/src/types/dashboard.ts frontend/src/api/dashboard.ts frontend/src/components/StatCard.tsx frontend/src/pages/DashboardPage.tsx
git commit -m "feat(frontend): rebuild dashboard with stats, charts, alerts"
```

---

## Task 8: Login + setup page polish

**Files:**
- Modify: `frontend/src/pages/LoginPage.tsx`
- Modify: `frontend/src/pages/SetupPage.tsx`

- [ ] **Step 1: Add a branded header band to both pages**

In `frontend/src/pages/LoginPage.tsx`, replace the existing `<header>` inside the form with:

```typescript
<header className="flex flex-col items-center text-center">
  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-700 text-2xl font-bold text-white">
    م
  </div>
  <h1 className="text-2xl font-bold text-slate-900">تسجيل الدخول</h1>
  <p className="mt-1 text-sm text-slate-600">مرحباً مجدداً في مركز</p>
</header>
```

Also change the form background gradient:

```typescript
<main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
```

- [ ] **Step 2: Same treatment in `frontend/src/pages/SetupPage.tsx`**

Replace the `<header>` inside the form with:

```typescript
<header className="flex flex-col items-center text-center">
  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-700 text-2xl font-bold text-white">
    م
  </div>
  <h1 className="text-2xl font-bold text-slate-900">مرحباً بك في مركز</h1>
  <p className="mt-1 text-sm text-slate-600">قم بإنشاء حساب القائد لأول مرة</p>
</header>
```

Same gradient background on `<main>`.

- [ ] **Step 3: Run tests (the existing assertions still pass since they look for heading text, which is unchanged)**

```bash
cd /Users/turkioqab/Projects/Markaz/frontend
npm run test
```

Expected: 5 passed.

- [ ] **Step 4: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add frontend/src/pages/LoginPage.tsx frontend/src/pages/SetupPage.tsx
git commit -m "feat(frontend): polish login and setup pages with brand header"
```

---

## Task 9: Phase 9 verification

- [ ] **Step 1: Run backend tests**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest -q
```

Expected: ≥ 127 passed (99 from Phase 4 + 3 Phase 5 auth status + 20 Phase 4 building + 5 new dashboard = up to you; just count up).

- [ ] **Step 2: Run frontend tests + lint + types**

```bash
cd /Users/turkioqab/Projects/Markaz/frontend
npm run test
npm run lint
npx tsc -b --noEmit
```

Expected: all clean.

- [ ] **Step 3: Manual browser test**

Start both servers (seed data already loaded):

```bash
# backend
cd /Users/turkioqab/Projects/Markaz/backend && source .venv/bin/activate && uvicorn app.main:app --port 8000

# frontend
cd /Users/turkioqab/Projects/Markaz/frontend && npm run dev
```

Navigate to http://localhost:5173 and verify:

1. **Brand presence** — red accent throughout sidebar (active link highlighted), logo pill, header button
2. **Dashboard** — 4 stat cards top, 4 charts in a 2-column grid, 3 attention cards at the bottom
3. **Charts are interactive** — hover shows tooltips, pie chart colors match statuses (green / amber / red)
4. **Status pills** — vehicles list shows colored status pills, employees list shows shift pills, rooms/maintenance/inspections all have pills
5. **Avatars** — employees list shows initials for those without photos, photos for those with photos
6. **Login + setup pages** — have the brand pill, subtle gradient background
7. **Attention panel** — if seed data has any vehicles out of service / low stock / expiring certs, they show up; otherwise "empty" messages appear

- [ ] **Step 4: Git status clean**

```bash
cd /Users/turkioqab/Projects/Markaz
git status
git log --oneline | head -15
```

Expected: clean, ~9 new commits.

---

## Phase 9 exit criteria

1. Backend `pytest -q` passes (≥ ~104 tests; 5 new dashboard tests)
2. Frontend `npm run test` passes (5 tests)
3. `npm run lint` + `npx tsc -b --noEmit` clean
4. Dashboard shows 4 stat cards, 4 interactive charts, 3 attention cards with seeded data
5. Brand red (#b91c1c) appears in sidebar active state, primary buttons, login/setup headers
6. Every status/condition/result text in tables is rendered as a colored Badge
7. Sidebar has icons (Home, Users, Truck, Building2)
8. Employees list + detail use the Avatar component
9. Working tree clean

Phase 10 (Deployment) and Phase 11 (Handover) remain.
