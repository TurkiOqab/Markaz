# Phase 8 — Frontend: Building UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the "Building" placeholder with a tabbed UI: main info (singleton edit), rooms, inventory, maintenance, reports. Each nested resource is a list + modal-CRUD. This is the final frontend phase.

**Architecture:** Single `/building` route with a tab layout inside. No separate list/detail pages because the building is a singleton — the page itself IS the detail. Nested tabs reuse the Modal + Button + SelectField pattern established in Phases 6-7.

**Tech Stack:** React 19, react-router-dom 6, Tailwind + RTL, sonner, Vitest.

---

## File Structure

```
frontend/src/
├── types/models.ts                    # extend with Building + nested types
├── constants/enums.ts                 # extend with ROOM_TYPES, ROOM_STATUSES
├── api/building.ts                    # new
├── pages/building/
│   ├── BuildingPage.tsx               # replaces pages/BuildingPage.tsx
│   └── tabs/
│       ├── MainInfoTab.tsx
│       ├── RoomsTab.tsx
│       ├── InventoryTab.tsx
│       ├── MaintenanceTab.tsx
│       └── ReportsTab.tsx
└── __tests__/BuildingPage.test.tsx
```

---

## Task 1: Types, enums, API module

**Files:**
- Modify: `frontend/src/types/models.ts`
- Modify: `frontend/src/constants/enums.ts`
- Create: `frontend/src/api/building.ts`

- [ ] **Step 1: Append building types to `frontend/src/types/models.ts`**

Append to the end:

```typescript
// ---------- Building ----------

export type RoomType = "غرفة نوم" | "مكتب" | "قاعة تدريس" | "مرفق";
export type RoomStatus = "جاهزة" | "صيانة";

export interface Building {
  id: number;
  name: string;
  address: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: number;
  type: RoomType;
  name: string;
  capacity: number;
  status: RoomStatus;
  notes: string | null;
}

export interface InventoryItem {
  id: number;
  item_name: string;
  category: string;
  quantity: number;
  location: string;
  min_threshold: number;
  notes: string | null;
}

export interface BuildingMaintenance {
  id: number;
  date: string;
  description: string;
  cost: number;
  contractor: string;
  status: MaintenanceStatus;
}

export interface BuildingReport {
  id: number;
  date: string;
  title: string;
  summary: string;
  file_path: string | null;
}
```

- [ ] **Step 2: Append enums to `frontend/src/constants/enums.ts`**

Add to the import list at top:

```typescript
import type {
  EquipmentCondition,
  InspectionResult,
  MaintenanceStatus,
  MaritalStatus,
  PhysicalAbility,
  RoomStatus,
  RoomType,
  Shift,
  VehicleStatus,
  VehicleType,
} from "../types/models";
```

And append at the end:

```typescript
export const ROOM_TYPES: RoomType[] = ["غرفة نوم", "مكتب", "قاعة تدريس", "مرفق"];
export const ROOM_STATUSES: RoomStatus[] = ["جاهزة", "صيانة"];
```

- [ ] **Step 3: Create `frontend/src/api/building.ts`**

```typescript
import { api } from "./client";
import type {
  Building,
  BuildingMaintenance,
  BuildingReport,
  InventoryItem,
  PagedResponse,
  Room,
} from "../types/models";

// ---------- Singleton ----------

export function getBuilding() {
  return api.get<Building>("/api/building");
}

export type BuildingUpdateInput = Partial<Pick<Building, "name" | "address" | "notes">>;

export function updateBuilding(input: BuildingUpdateInput) {
  return api.patch<Building>("/api/building", input);
}

// ---------- Rooms ----------

export type RoomInput = Omit<Room, "id">;

export function listRooms() {
  return api.get<PagedResponse<Room>>("/api/building/rooms");
}
export function createRoom(input: RoomInput) {
  return api.post<Room>("/api/building/rooms", input);
}
export function updateRoom(id: number, input: Partial<RoomInput>) {
  return api.patch<Room>(`/api/building/rooms/${id}`, input);
}
export function deleteRoom(id: number) {
  return api.del<void>(`/api/building/rooms/${id}`);
}

// ---------- Inventory ----------

export type InventoryInput = Omit<InventoryItem, "id">;

export function listInventory() {
  return api.get<PagedResponse<InventoryItem>>("/api/building/inventory");
}
export function createInventory(input: InventoryInput) {
  return api.post<InventoryItem>("/api/building/inventory", input);
}
export function updateInventory(id: number, input: Partial<InventoryInput>) {
  return api.patch<InventoryItem>(`/api/building/inventory/${id}`, input);
}
export function deleteInventory(id: number) {
  return api.del<void>(`/api/building/inventory/${id}`);
}

// ---------- Maintenance ----------

export type BuildingMaintenanceInput = Omit<BuildingMaintenance, "id">;

export function listBuildingMaintenance() {
  return api.get<PagedResponse<BuildingMaintenance>>("/api/building/maintenance");
}
export function createBuildingMaintenance(input: BuildingMaintenanceInput) {
  return api.post<BuildingMaintenance>("/api/building/maintenance", input);
}
export function updateBuildingMaintenance(
  id: number,
  input: Partial<BuildingMaintenanceInput>,
) {
  return api.patch<BuildingMaintenance>(`/api/building/maintenance/${id}`, input);
}
export function deleteBuildingMaintenance(id: number) {
  return api.del<void>(`/api/building/maintenance/${id}`);
}

// ---------- Reports ----------

export type BuildingReportInput = Omit<BuildingReport, "id">;

export function listBuildingReports() {
  return api.get<PagedResponse<BuildingReport>>("/api/building/reports");
}
export function createBuildingReport(input: BuildingReportInput) {
  return api.post<BuildingReport>("/api/building/reports", input);
}
export function updateBuildingReport(id: number, input: Partial<BuildingReportInput>) {
  return api.patch<BuildingReport>(`/api/building/reports/${id}`, input);
}
export function deleteBuildingReport(id: number) {
  return api.del<void>(`/api/building/reports/${id}`);
}
```

- [ ] **Step 4: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add frontend/src/types/models.ts frontend/src/constants/enums.ts frontend/src/api/building.ts
git commit -m "feat(frontend): add building types, enums, and API module"
```

---

## Task 2: Building page shell + main info tab

**Files:**
- Delete: `frontend/src/pages/BuildingPage.tsx`
- Create: `frontend/src/pages/building/BuildingPage.tsx`
- Create: `frontend/src/pages/building/tabs/MainInfoTab.tsx`
- Modify: `frontend/src/App.tsx` (update import)

- [ ] **Step 1: Create `frontend/src/pages/building/tabs/MainInfoTab.tsx`**

```typescript
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { ApiRequestError } from "../../../api/client";
import { updateBuilding } from "../../../api/building";
import { Button } from "../../../components/Button";
import { TextField } from "../../../components/TextField";
import type { Building } from "../../../types/models";

interface Props {
  building: Building;
  onUpdated: (updated: Building) => void;
}

export function MainInfoTab({ building, onUpdated }: Props) {
  const [form, setForm] = useState<Building>(building);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm(building);
  }, [building]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const updated = await updateBuilding({
        name: form.name,
        address: form.address,
        notes: form.notes || null,
      });
      toast.success("تم الحفظ");
      onUpdated(updated);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "فشل الحفظ");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-slate-200 bg-white p-6"
    >
      <TextField
        label="اسم المبنى"
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        required
      />
      <TextField
        label="العنوان"
        value={form.address}
        onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
        required
      />
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-slate-700">ملاحظات</span>
        <textarea
          className="min-h-28 rounded-md border border-slate-300 bg-white px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-slate-500"
          value={form.notes ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value || null }))}
        />
      </label>
      <div className="flex justify-end">
        <Button type="submit" loading={submitting}>
          حفظ التعديلات
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Create `frontend/src/pages/building/BuildingPage.tsx`**

```typescript
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ApiRequestError } from "../../api/client";
import { getBuilding } from "../../api/building";
import type { Building } from "../../types/models";
import { InventoryTab } from "./tabs/InventoryTab";
import { MainInfoTab } from "./tabs/MainInfoTab";
import { MaintenanceTab } from "./tabs/MaintenanceTab";
import { ReportsTab } from "./tabs/ReportsTab";
import { RoomsTab } from "./tabs/RoomsTab";

type TabKey = "main" | "rooms" | "inventory" | "maintenance" | "reports";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "main", label: "المعلومات الأساسية" },
  { key: "rooms", label: "الغرف" },
  { key: "inventory", label: "المخزون" },
  { key: "maintenance", label: "الصيانة" },
  { key: "reports", label: "التقارير" },
];

export function BuildingPage() {
  const [building, setBuilding] = useState<Building | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("main");

  useEffect(() => {
    getBuilding()
      .then((b) => {
        setBuilding(b);
        setLoading(false);
      })
      .catch((err) => {
        toast.error(err instanceof ApiRequestError ? err.message : "فشل تحميل المبنى");
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-slate-500">جارِ التحميل...</p>;
  if (!building) return null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">المبنى</h1>
        <p className="mt-1 text-sm text-slate-600">
          {building.name || "—"} {building.address ? `· ${building.address}` : null}
        </p>
      </header>

      <nav className="border-b border-slate-200">
        <ul className="flex gap-6">
          {TABS.map((t) => (
            <li key={t.key}>
              <button
                type="button"
                onClick={() => setTab(t.key)}
                className={`-mb-px border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                  tab === t.key
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {t.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {tab === "main" ? (
        <MainInfoTab building={building} onUpdated={setBuilding} />
      ) : tab === "rooms" ? (
        <RoomsTab />
      ) : tab === "inventory" ? (
        <InventoryTab />
      ) : tab === "maintenance" ? (
        <MaintenanceTab />
      ) : (
        <ReportsTab />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create the four tab stubs so the page compiles**

Create `frontend/src/pages/building/tabs/RoomsTab.tsx`:

```typescript
export function RoomsTab() {
  return <p className="text-slate-500">قريباً...</p>;
}
```

Create `frontend/src/pages/building/tabs/InventoryTab.tsx`:

```typescript
export function InventoryTab() {
  return <p className="text-slate-500">قريباً...</p>;
}
```

Create `frontend/src/pages/building/tabs/MaintenanceTab.tsx`:

```typescript
export function MaintenanceTab() {
  return <p className="text-slate-500">قريباً...</p>;
}
```

Create `frontend/src/pages/building/tabs/ReportsTab.tsx`:

```typescript
export function ReportsTab() {
  return <p className="text-slate-500">قريباً...</p>;
}
```

- [ ] **Step 4: Update `frontend/src/App.tsx`**

Replace the `BuildingPage` import — change:

```typescript
import { BuildingPage } from "./pages/BuildingPage";
```

to:

```typescript
import { BuildingPage } from "./pages/building/BuildingPage";
```

Full file replacement:

```typescript
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { AppLayout } from "./components/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { BuildingPage } from "./pages/building/BuildingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { EmployeeDetailPage } from "./pages/employees/EmployeeDetailPage";
import { EmployeesListPage } from "./pages/employees/EmployeesListPage";
import { NewEmployeePage } from "./pages/employees/NewEmployeePage";
import { LoginPage } from "./pages/LoginPage";
import { SetupPage } from "./pages/SetupPage";
import { NewVehiclePage } from "./pages/vehicles/NewVehiclePage";
import { VehicleDetailPage } from "./pages/vehicles/VehicleDetailPage";
import { VehiclesListPage } from "./pages/vehicles/VehiclesListPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="/employees" element={<EmployeesListPage />} />
            <Route path="/employees/new" element={<NewEmployeePage />} />
            <Route path="/employees/:id" element={<EmployeeDetailPage />} />
            <Route path="/vehicles" element={<VehiclesListPage />} />
            <Route path="/vehicles/new" element={<NewVehiclePage />} />
            <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
            <Route path="/building" element={<BuildingPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

- [ ] **Step 5: Delete the old placeholder**

```bash
rm /Users/turkioqab/Projects/Markaz/frontend/src/pages/BuildingPage.tsx
```

- [ ] **Step 6: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add frontend/src/pages/building/ frontend/src/pages/BuildingPage.tsx frontend/src/App.tsx
git commit -m "feat(frontend): add building page shell + main info tab"
```

---

## Task 3: Rooms tab

**Files:**
- Modify: `frontend/src/pages/building/tabs/RoomsTab.tsx`

- [ ] **Step 1: Replace with full implementation**

```typescript
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { ApiRequestError } from "../../../api/client";
import { createRoom, deleteRoom, listRooms, updateRoom } from "../../../api/building";
import type { RoomInput } from "../../../api/building";
import { Button } from "../../../components/Button";
import { EmptyState } from "../../../components/EmptyState";
import { Modal } from "../../../components/Modal";
import { SelectField } from "../../../components/SelectField";
import { TextField } from "../../../components/TextField";
import { ROOM_STATUSES, ROOM_TYPES } from "../../../constants/enums";
import type { Room } from "../../../types/models";

const EMPTY: RoomInput = {
  type: "غرفة نوم",
  name: "",
  capacity: 1,
  status: "جاهزة",
  notes: null,
};

export function RoomsTab() {
  const [items, setItems] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Room | null>(null);
  const [creating, setCreating] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      const res = await listRooms();
      setItems(res.items);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "فشل التحميل");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleDelete(id: number) {
    if (!window.confirm("هل تريد حذف هذه الغرفة؟")) return;
    try {
      await deleteRoom(id);
      toast.success("تم الحذف");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "فشل الحذف");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)}>إضافة غرفة</Button>
      </div>

      {loading ? (
        <p className="text-slate-500">جارِ التحميل...</p>
      ) : items.length === 0 ? (
        <EmptyState title="لا توجد غرف" description="أضف غرفة للبدء" />
      ) : (
        <table className="w-full rounded-lg border border-slate-200 bg-white text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-start font-medium">الاسم</th>
              <th className="px-4 py-3 text-start font-medium">النوع</th>
              <th className="px-4 py-3 text-start font-medium">السعة</th>
              <th className="px-4 py-3 text-start font-medium">الحالة</th>
              <th className="px-4 py-3 text-end font-medium">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 last:border-b-0">
                <td className="px-4 py-3 font-medium text-slate-900">{r.name}</td>
                <td className="px-4 py-3 text-slate-700">{r.type}</td>
                <td className="px-4 py-3 text-slate-700">{r.capacity}</td>
                <td className="px-4 py-3 text-slate-700">{r.status}</td>
                <td className="px-4 py-3 text-end">
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => setEditing(r)}>
                      تعديل
                    </Button>
                    <Button variant="danger" onClick={() => handleDelete(r.id)}>
                      حذف
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {creating ? (
        <RoomFormModal
          title="إضافة غرفة"
          initial={EMPTY}
          onClose={() => setCreating(false)}
          onSubmit={async (payload) => {
            await createRoom(payload);
            toast.success("تمت الإضافة");
            setCreating(false);
            reload();
          }}
        />
      ) : null}

      {editing ? (
        <RoomFormModal
          title="تعديل الغرفة"
          initial={{
            type: editing.type,
            name: editing.name,
            capacity: editing.capacity,
            status: editing.status,
            notes: editing.notes,
          }}
          onClose={() => setEditing(null)}
          onSubmit={async (payload) => {
            await updateRoom(editing.id, payload);
            toast.success("تم التحديث");
            setEditing(null);
            reload();
          }}
        />
      ) : null}
    </div>
  );
}

function RoomFormModal({
  title,
  initial,
  onClose,
  onSubmit,
}: {
  title: string;
  initial: RoomInput;
  onClose: () => void;
  onSubmit: (payload: RoomInput) => Promise<void>;
}) {
  const [form, setForm] = useState<RoomInput>(initial);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(form);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "فشل الحفظ");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
          <Button form="room-form" type="submit" loading={submitting}>
            حفظ
          </Button>
        </>
      }
    >
      <form id="room-form" onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="الاسم"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
        />
        <SelectField
          label="النوع"
          value={form.type}
          onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as typeof f.type }))}
          options={ROOM_TYPES.map((t) => ({ value: t, label: t }))}
        />
        <TextField
          label="السعة"
          type="number"
          min={0}
          value={form.capacity}
          onChange={(e) => setForm((f) => ({ ...f, capacity: Number(e.target.value) }))}
          required
        />
        <SelectField
          label="الحالة"
          value={form.status}
          onChange={(e) =>
            setForm((f) => ({ ...f, status: e.target.value as typeof f.status }))
          }
          options={ROOM_STATUSES.map((s) => ({ value: s, label: s }))}
        />
        <TextField
          label="ملاحظات"
          value={form.notes ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value || null }))}
        />
      </form>
    </Modal>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add frontend/src/pages/building/tabs/RoomsTab.tsx
git commit -m "feat(frontend): implement rooms tab"
```

---

## Task 4: Inventory tab

**Files:**
- Modify: `frontend/src/pages/building/tabs/InventoryTab.tsx`

- [ ] **Step 1: Replace with full implementation**

```typescript
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { ApiRequestError } from "../../../api/client";
import {
  createInventory,
  deleteInventory,
  listInventory,
  updateInventory,
} from "../../../api/building";
import type { InventoryInput } from "../../../api/building";
import { Button } from "../../../components/Button";
import { EmptyState } from "../../../components/EmptyState";
import { Modal } from "../../../components/Modal";
import { TextField } from "../../../components/TextField";
import type { InventoryItem } from "../../../types/models";

const EMPTY: InventoryInput = {
  item_name: "",
  category: "",
  quantity: 0,
  location: "",
  min_threshold: 0,
  notes: null,
};

export function InventoryTab() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [creating, setCreating] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      const res = await listInventory();
      setItems(res.items);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "فشل التحميل");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleDelete(id: number) {
    if (!window.confirm("هل تريد حذف هذا الصنف؟")) return;
    try {
      await deleteInventory(id);
      toast.success("تم الحذف");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "فشل الحذف");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)}>إضافة صنف</Button>
      </div>

      {loading ? (
        <p className="text-slate-500">جارِ التحميل...</p>
      ) : items.length === 0 ? (
        <EmptyState title="لا توجد أصناف" description="أضف صنفاً للبدء" />
      ) : (
        <table className="w-full rounded-lg border border-slate-200 bg-white text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-start font-medium">الصنف</th>
              <th className="px-4 py-3 text-start font-medium">التصنيف</th>
              <th className="px-4 py-3 text-start font-medium">الكمية</th>
              <th className="px-4 py-3 text-start font-medium">الحد الأدنى</th>
              <th className="px-4 py-3 text-start font-medium">الموقع</th>
              <th className="px-4 py-3 text-end font-medium">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => {
              const lowStock = i.quantity < i.min_threshold;
              return (
                <tr key={i.id} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-4 py-3 font-medium text-slate-900">{i.item_name}</td>
                  <td className="px-4 py-3 text-slate-700">{i.category}</td>
                  <td className={`px-4 py-3 ${lowStock ? "text-red-600 font-semibold" : "text-slate-700"}`}>
                    {i.quantity}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{i.min_threshold}</td>
                  <td className="px-4 py-3 text-slate-700">{i.location}</td>
                  <td className="px-4 py-3 text-end">
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" onClick={() => setEditing(i)}>
                        تعديل
                      </Button>
                      <Button variant="danger" onClick={() => handleDelete(i.id)}>
                        حذف
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {creating ? (
        <InventoryFormModal
          title="إضافة صنف"
          initial={EMPTY}
          onClose={() => setCreating(false)}
          onSubmit={async (payload) => {
            await createInventory(payload);
            toast.success("تمت الإضافة");
            setCreating(false);
            reload();
          }}
        />
      ) : null}

      {editing ? (
        <InventoryFormModal
          title="تعديل الصنف"
          initial={{
            item_name: editing.item_name,
            category: editing.category,
            quantity: editing.quantity,
            location: editing.location,
            min_threshold: editing.min_threshold,
            notes: editing.notes,
          }}
          onClose={() => setEditing(null)}
          onSubmit={async (payload) => {
            await updateInventory(editing.id, payload);
            toast.success("تم التحديث");
            setEditing(null);
            reload();
          }}
        />
      ) : null}
    </div>
  );
}

function InventoryFormModal({
  title,
  initial,
  onClose,
  onSubmit,
}: {
  title: string;
  initial: InventoryInput;
  onClose: () => void;
  onSubmit: (payload: InventoryInput) => Promise<void>;
}) {
  const [form, setForm] = useState<InventoryInput>(initial);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(form);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "فشل الحفظ");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
          <Button form="inv-form" type="submit" loading={submitting}>
            حفظ
          </Button>
        </>
      }
    >
      <form id="inv-form" onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="اسم الصنف"
          value={form.item_name}
          onChange={(e) => setForm((f) => ({ ...f, item_name: e.target.value }))}
          required
        />
        <TextField
          label="التصنيف"
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          required
        />
        <TextField
          label="الكمية"
          type="number"
          min={0}
          value={form.quantity}
          onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
          required
        />
        <TextField
          label="الحد الأدنى"
          type="number"
          min={0}
          value={form.min_threshold}
          onChange={(e) => setForm((f) => ({ ...f, min_threshold: Number(e.target.value) }))}
          required
        />
        <TextField
          label="الموقع"
          value={form.location}
          onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
          required
        />
        <TextField
          label="ملاحظات"
          value={form.notes ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value || null }))}
        />
      </form>
    </Modal>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add frontend/src/pages/building/tabs/InventoryTab.tsx
git commit -m "feat(frontend): implement inventory tab with low-stock highlighting"
```

---

## Task 5: Maintenance tab

**Files:**
- Modify: `frontend/src/pages/building/tabs/MaintenanceTab.tsx`

- [ ] **Step 1: Replace with full implementation**

```typescript
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { ApiRequestError } from "../../../api/client";
import {
  createBuildingMaintenance,
  deleteBuildingMaintenance,
  listBuildingMaintenance,
  updateBuildingMaintenance,
} from "../../../api/building";
import type { BuildingMaintenanceInput } from "../../../api/building";
import { Button } from "../../../components/Button";
import { EmptyState } from "../../../components/EmptyState";
import { Modal } from "../../../components/Modal";
import { SelectField } from "../../../components/SelectField";
import { TextField } from "../../../components/TextField";
import { MAINTENANCE_STATUSES } from "../../../constants/enums";
import type { BuildingMaintenance } from "../../../types/models";

const EMPTY: BuildingMaintenanceInput = {
  date: "",
  description: "",
  cost: 0,
  contractor: "",
  status: "مكتمل",
};

export function MaintenanceTab() {
  const [items, setItems] = useState<BuildingMaintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BuildingMaintenance | null>(null);
  const [creating, setCreating] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      const res = await listBuildingMaintenance();
      setItems(res.items);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "فشل التحميل");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleDelete(id: number) {
    if (!window.confirm("هل تريد حذف سجل الصيانة هذا؟")) return;
    try {
      await deleteBuildingMaintenance(id);
      toast.success("تم الحذف");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "فشل الحذف");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)}>إضافة صيانة</Button>
      </div>

      {loading ? (
        <p className="text-slate-500">جارِ التحميل...</p>
      ) : items.length === 0 ? (
        <EmptyState title="لا توجد سجلات صيانة" description="أضف سجل صيانة للبدء" />
      ) : (
        <table className="w-full rounded-lg border border-slate-200 bg-white text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-start font-medium">التاريخ</th>
              <th className="px-4 py-3 text-start font-medium">الوصف</th>
              <th className="px-4 py-3 text-start font-medium">التكلفة</th>
              <th className="px-4 py-3 text-start font-medium">المقاول</th>
              <th className="px-4 py-3 text-start font-medium">الحالة</th>
              <th className="px-4 py-3 text-end font-medium">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {items.map((m) => (
              <tr key={m.id} className="border-b border-slate-100 last:border-b-0">
                <td className="px-4 py-3 text-slate-700">{m.date}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{m.description}</td>
                <td className="px-4 py-3 text-slate-700">{m.cost}</td>
                <td className="px-4 py-3 text-slate-700">{m.contractor}</td>
                <td className="px-4 py-3 text-slate-700">{m.status}</td>
                <td className="px-4 py-3 text-end">
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => setEditing(m)}>
                      تعديل
                    </Button>
                    <Button variant="danger" onClick={() => handleDelete(m.id)}>
                      حذف
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {creating ? (
        <MaintenanceFormModal
          title="إضافة صيانة"
          initial={EMPTY}
          onClose={() => setCreating(false)}
          onSubmit={async (payload) => {
            await createBuildingMaintenance(payload);
            toast.success("تمت الإضافة");
            setCreating(false);
            reload();
          }}
        />
      ) : null}

      {editing ? (
        <MaintenanceFormModal
          title="تعديل الصيانة"
          initial={{
            date: editing.date,
            description: editing.description,
            cost: editing.cost,
            contractor: editing.contractor,
            status: editing.status,
          }}
          onClose={() => setEditing(null)}
          onSubmit={async (payload) => {
            await updateBuildingMaintenance(editing.id, payload);
            toast.success("تم التحديث");
            setEditing(null);
            reload();
          }}
        />
      ) : null}
    </div>
  );
}

function MaintenanceFormModal({
  title,
  initial,
  onClose,
  onSubmit,
}: {
  title: string;
  initial: BuildingMaintenanceInput;
  onClose: () => void;
  onSubmit: (payload: BuildingMaintenanceInput) => Promise<void>;
}) {
  const [form, setForm] = useState<BuildingMaintenanceInput>(initial);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(form);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "فشل الحفظ");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
          <Button form="bmaint-form" type="submit" loading={submitting}>
            حفظ
          </Button>
        </>
      }
    >
      <form id="bmaint-form" onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="التاريخ"
          type="date"
          value={form.date}
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          required
        />
        <TextField
          label="الوصف"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          required
        />
        <TextField
          label="التكلفة"
          type="number"
          min={0}
          step="0.01"
          value={form.cost}
          onChange={(e) => setForm((f) => ({ ...f, cost: Number(e.target.value) }))}
          required
        />
        <TextField
          label="المقاول"
          value={form.contractor}
          onChange={(e) => setForm((f) => ({ ...f, contractor: e.target.value }))}
          required
        />
        <SelectField
          label="الحالة"
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as typeof f.status }))}
          options={MAINTENANCE_STATUSES.map((s) => ({ value: s, label: s }))}
        />
      </form>
    </Modal>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add frontend/src/pages/building/tabs/MaintenanceTab.tsx
git commit -m "feat(frontend): implement building maintenance tab"
```

---

## Task 6: Reports tab

**Files:**
- Modify: `frontend/src/pages/building/tabs/ReportsTab.tsx`

- [ ] **Step 1: Replace with full implementation**

```typescript
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { ApiRequestError } from "../../../api/client";
import {
  createBuildingReport,
  deleteBuildingReport,
  listBuildingReports,
  updateBuildingReport,
} from "../../../api/building";
import type { BuildingReportInput } from "../../../api/building";
import { Button } from "../../../components/Button";
import { EmptyState } from "../../../components/EmptyState";
import { Modal } from "../../../components/Modal";
import { TextField } from "../../../components/TextField";
import type { BuildingReport } from "../../../types/models";

const EMPTY: BuildingReportInput = {
  date: "",
  title: "",
  summary: "",
  file_path: null,
};

export function ReportsTab() {
  const [items, setItems] = useState<BuildingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BuildingReport | null>(null);
  const [creating, setCreating] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      const res = await listBuildingReports();
      setItems(res.items);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "فشل التحميل");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleDelete(id: number) {
    if (!window.confirm("هل تريد حذف هذا التقرير؟")) return;
    try {
      await deleteBuildingReport(id);
      toast.success("تم الحذف");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "فشل الحذف");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)}>إضافة تقرير</Button>
      </div>

      {loading ? (
        <p className="text-slate-500">جارِ التحميل...</p>
      ) : items.length === 0 ? (
        <EmptyState title="لا توجد تقارير" description="أضف تقريراً للبدء" />
      ) : (
        <div className="space-y-3">
          {items.map((r) => (
            <article key={r.id} className="rounded-lg border border-slate-200 bg-white p-5">
              <header className="mb-2 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{r.title}</h3>
                  <p className="text-xs text-slate-500">{r.date}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setEditing(r)}>
                    تعديل
                  </Button>
                  <Button variant="danger" onClick={() => handleDelete(r.id)}>
                    حذف
                  </Button>
                </div>
              </header>
              <p className="whitespace-pre-line text-sm text-slate-700">{r.summary}</p>
            </article>
          ))}
        </div>
      )}

      {creating ? (
        <ReportFormModal
          title="إضافة تقرير"
          initial={EMPTY}
          onClose={() => setCreating(false)}
          onSubmit={async (payload) => {
            await createBuildingReport(payload);
            toast.success("تمت الإضافة");
            setCreating(false);
            reload();
          }}
        />
      ) : null}

      {editing ? (
        <ReportFormModal
          title="تعديل التقرير"
          initial={{
            date: editing.date,
            title: editing.title,
            summary: editing.summary,
            file_path: editing.file_path,
          }}
          onClose={() => setEditing(null)}
          onSubmit={async (payload) => {
            await updateBuildingReport(editing.id, payload);
            toast.success("تم التحديث");
            setEditing(null);
            reload();
          }}
        />
      ) : null}
    </div>
  );
}

function ReportFormModal({
  title,
  initial,
  onClose,
  onSubmit,
}: {
  title: string;
  initial: BuildingReportInput;
  onClose: () => void;
  onSubmit: (payload: BuildingReportInput) => Promise<void>;
}) {
  const [form, setForm] = useState<BuildingReportInput>(initial);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(form);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "فشل الحفظ");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
          <Button form="rep-form" type="submit" loading={submitting}>
            حفظ
          </Button>
        </>
      }
    >
      <form id="rep-form" onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="التاريخ"
          type="date"
          value={form.date}
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          required
        />
        <TextField
          label="العنوان"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          required
        />
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">الملخص</span>
          <textarea
            className="min-h-28 rounded-md border border-slate-300 bg-white px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-slate-500"
            value={form.summary}
            onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
            required
          />
        </label>
      </form>
    </Modal>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add frontend/src/pages/building/tabs/ReportsTab.tsx
git commit -m "feat(frontend): implement reports tab with card list"
```

---

## Task 7: Integration test

**Files:**
- Create: `frontend/src/__tests__/BuildingPage.test.tsx`

- [ ] **Step 1: Write the test**

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";

type FetchMock = ReturnType<typeof vi.fn>;

function json(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

describe("Building page", () => {
  let fetchMock: FetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    window.history.pushState({}, "", "/building");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    window.history.pushState({}, "", "/");
  });

  it("loads the building and shows the main info tab", async () => {
    fetchMock.mockResolvedValueOnce(
      json({ data: { setup_complete: true, authenticated: true } }),
    );
    fetchMock.mockResolvedValueOnce(
      json({
        data: {
          id: 1,
          name: "مركز الدفاع المدني الرئيسي",
          address: "شارع الملك فهد",
          notes: null,
          created_at: "2026-01-01T00:00:00",
          updated_at: "2026-01-01T00:00:00",
        },
      }),
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "المبنى" })).toBeInTheDocument();
    });

    // The main info tab loads automatically — name field should be pre-filled.
    await waitFor(() => {
      expect(screen.getByLabelText("اسم المبنى")).toHaveValue("مركز الدفاع المدني الرئيسي");
    });
  });
});
```

- [ ] **Step 2: Run tests**

```bash
cd /Users/turkioqab/Projects/Markaz/frontend
npm run test
```

Expected: 5 passed (existing 4 + new 1).

- [ ] **Step 3: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add frontend/src/__tests__/BuildingPage.test.tsx
git commit -m "test(frontend): integration test for building page"
```

---

## Task 8: Phase 8 verification

- [ ] **Step 1: All tests pass**

```bash
cd /Users/turkioqab/Projects/Markaz/frontend
npm run test
```

Expected: 5 tests pass.

- [ ] **Step 2: Lint + type check clean**

```bash
cd /Users/turkioqab/Projects/Markaz/frontend
npm run lint
npx tsc -b --noEmit
```

Expected: no errors.

- [ ] **Step 3: Manual smoke test**

Start both servers. Navigate to /building → should see the singleton form.

1. Main info tab: edit the name/address/notes, save.
2. Rooms tab: 15 seeded rooms visible. Add/edit/delete works via modal.
3. Inventory tab: 30 seeded items. Items below `min_threshold` show quantity in red.
4. Maintenance tab: 5 seeded records. Add/edit/delete works.
5. Reports tab: 3 seeded reports as cards. Add/edit/delete works.

- [ ] **Step 4: Git status clean**

```bash
cd /Users/turkioqab/Projects/Markaz
git status
git log --oneline | head -10
```

Expected: clean, ~7 new commits.

---

## Phase 8 exit criteria

1. Frontend `npm run test` passes (≥ 5 tests)
2. `npm run lint` + `npx tsc -b --noEmit` clean
3. Building page has 5 tabs: main, rooms, inventory, maintenance, reports
4. Each nested tab has list + add/edit/delete via modal
5. Inventory tab highlights low-stock items
6. Reports render as readable cards
7. Working tree clean

**The full frontend is done.** Phase 9 (Deployment & installer) and Phase 10 (Handover) remain.
