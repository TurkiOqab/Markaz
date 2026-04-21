# Phase 7 — Frontend: Vehicles UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the "Vehicles" placeholder with full CRUD UI: list with search + filter by type/status, create, detail page with tabs for main info + maintenance + equipment + inspections, photo upload, delete. Same shape as Phase 6 (employees) but for vehicles.

**Architecture:** Mirrors Phase 6 — API module, types, pages under `pages/vehicles/`, modals for nested CRUD. The one novelty: the `driver_id` field needs a dropdown populated from employees.

**Tech Stack:** React 19, react-router-dom 6, Tailwind + RTL, sonner, Vitest.

---

## File Structure

```
frontend/src/
├── types/models.ts                     # extend with Vehicle types
├── constants/enums.ts                  # extend with VEHICLE_TYPES, VEHICLE_STATUSES, ...
├── api/vehicles.ts                     # new
├── pages/vehicles/
│   ├── VehiclesListPage.tsx            # replaces VehiclesPage.tsx
│   ├── NewVehiclePage.tsx
│   ├── VehicleDetailPage.tsx           # shell + tabs
│   └── tabs/
│       ├── MainInfoTab.tsx
│       ├── MaintenanceTab.tsx
│       ├── EquipmentTab.tsx
│       └── InspectionsTab.tsx
└── __tests__/VehiclesListPage.test.tsx
```

---

## Task 1: Types, enums, API module

**Files:**
- Modify: `frontend/src/types/models.ts`
- Modify: `frontend/src/constants/enums.ts`
- Create: `frontend/src/api/vehicles.ts`

- [ ] **Step 1: Append vehicle types to `frontend/src/types/models.ts`**

Append:

```typescript
// ---------- Vehicles ----------

export type VehicleType = "إطفاء" | "إسعاف" | "سلم" | "قيادة" | "إنقاذ";
export type VehicleStatus = "في الخدمة" | "خارج الخدمة" | "صيانة";
export type MaintenanceStatus = "مكتمل" | "قيد التنفيذ" | "مجدول" | "ملغي";
export type InspectionResult = "ناجح" | "يحتاج صيانة" | "غير صالح";

export interface VehicleMaintenance {
  id: number;
  date: string;
  description: string;
  cost: number;
  contractor: string;
  status: MaintenanceStatus;
}

export interface VehicleOnboardEquipment {
  id: number;
  item_name: string;
  quantity: number;
  condition: EquipmentCondition;
}

export interface VehicleInspection {
  id: number;
  inspection_date: string;
  inspector_name: string;
  result: InspectionResult;
  notes: string | null;
}

export interface VehicleSummary {
  id: number;
  type: VehicleType;
  plate_number: string;
  status: VehicleStatus;
  driver_id: number | null;
  photo_path: string | null;
}

export interface Vehicle {
  id: number;
  type: VehicleType;
  plate_number: string;
  status: VehicleStatus;
  driver_id: number | null;
  photo_path: string | null;
  created_at: string;
  updated_at: string;
  maintenance: VehicleMaintenance[];
  equipment: VehicleOnboardEquipment[];
  inspections: VehicleInspection[];
}
```

- [ ] **Step 2: Append enums to `frontend/src/constants/enums.ts`**

Append:

```typescript
import type {
  InspectionResult,
  MaintenanceStatus,
  VehicleStatus,
  VehicleType,
} from "../types/models";

export const VEHICLE_TYPES: VehicleType[] = ["إطفاء", "إسعاف", "سلم", "قيادة", "إنقاذ"];
export const VEHICLE_STATUSES: VehicleStatus[] = ["في الخدمة", "خارج الخدمة", "صيانة"];
export const MAINTENANCE_STATUSES: MaintenanceStatus[] = [
  "مكتمل",
  "قيد التنفيذ",
  "مجدول",
  "ملغي",
];
export const INSPECTION_RESULTS: InspectionResult[] = ["ناجح", "يحتاج صيانة", "غير صالح"];
```

- [ ] **Step 3: Create `frontend/src/api/vehicles.ts`**

```typescript
import { api } from "./client";
import type {
  PagedResponse,
  Vehicle,
  VehicleInspection,
  VehicleMaintenance,
  VehicleOnboardEquipment,
  VehicleStatus,
  VehicleSummary,
  VehicleType,
} from "../types/models";

export interface VehicleListParams {
  q?: string;
  type?: VehicleType;
  status?: VehicleStatus;
  page?: number;
  page_size?: number;
}

function queryString(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (entries.length === 0) return "";
  const qs = entries
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return `?${qs}`;
}

export function listVehicles(params: VehicleListParams = {}) {
  return api.get<PagedResponse<VehicleSummary>>(`/api/vehicles${queryString({ ...params })}`);
}

export function getVehicle(id: number) {
  return api.get<Vehicle>(`/api/vehicles/${id}`);
}

export type VehicleCreateInput = Pick<
  Vehicle,
  "type" | "plate_number" | "status" | "driver_id"
>;

export function createVehicle(input: VehicleCreateInput) {
  return api.post<Vehicle>("/api/vehicles", input);
}

export function updateVehicle(id: number, input: Partial<VehicleCreateInput>) {
  return api.patch<Vehicle>(`/api/vehicles/${id}`, input);
}

export function deleteVehicle(id: number) {
  return api.del<void>(`/api/vehicles/${id}`);
}

export async function uploadVehiclePhoto(id: number, file: File): Promise<Vehicle> {
  const form = new FormData();
  form.append("file", file);
  return api.post<Vehicle>(`/api/vehicles/${id}/photo`, form);
}

// ---------- Maintenance ----------

export type MaintenanceInput = Omit<VehicleMaintenance, "id">;

export function listMaintenance(vehicleId: number) {
  return api.get<PagedResponse<VehicleMaintenance>>(
    `/api/vehicles/${vehicleId}/maintenance`,
  );
}
export function createMaintenance(vehicleId: number, input: MaintenanceInput) {
  return api.post<VehicleMaintenance>(`/api/vehicles/${vehicleId}/maintenance`, input);
}
export function updateMaintenance(
  vehicleId: number,
  maintenanceId: number,
  input: Partial<MaintenanceInput>,
) {
  return api.patch<VehicleMaintenance>(
    `/api/vehicles/${vehicleId}/maintenance/${maintenanceId}`,
    input,
  );
}
export function deleteMaintenance(vehicleId: number, maintenanceId: number) {
  return api.del<void>(`/api/vehicles/${vehicleId}/maintenance/${maintenanceId}`);
}

// ---------- Onboard equipment ----------

export type VehicleEquipmentInput = Omit<VehicleOnboardEquipment, "id">;

export function listVehicleEquipment(vehicleId: number) {
  return api.get<PagedResponse<VehicleOnboardEquipment>>(`/api/vehicles/${vehicleId}/equipment`);
}
export function createVehicleEquipment(vehicleId: number, input: VehicleEquipmentInput) {
  return api.post<VehicleOnboardEquipment>(`/api/vehicles/${vehicleId}/equipment`, input);
}
export function updateVehicleEquipment(
  vehicleId: number,
  equipmentId: number,
  input: Partial<VehicleEquipmentInput>,
) {
  return api.patch<VehicleOnboardEquipment>(
    `/api/vehicles/${vehicleId}/equipment/${equipmentId}`,
    input,
  );
}
export function deleteVehicleEquipment(vehicleId: number, equipmentId: number) {
  return api.del<void>(`/api/vehicles/${vehicleId}/equipment/${equipmentId}`);
}

// ---------- Inspections ----------

export type InspectionInput = Omit<VehicleInspection, "id">;

export function listInspections(vehicleId: number) {
  return api.get<PagedResponse<VehicleInspection>>(
    `/api/vehicles/${vehicleId}/inspections`,
  );
}
export function createInspection(vehicleId: number, input: InspectionInput) {
  return api.post<VehicleInspection>(`/api/vehicles/${vehicleId}/inspections`, input);
}
export function updateInspection(
  vehicleId: number,
  inspectionId: number,
  input: Partial<InspectionInput>,
) {
  return api.patch<VehicleInspection>(
    `/api/vehicles/${vehicleId}/inspections/${inspectionId}`,
    input,
  );
}
export function deleteInspection(vehicleId: number, inspectionId: number) {
  return api.del<void>(`/api/vehicles/${vehicleId}/inspections/${inspectionId}`);
}
```

- [ ] **Step 4: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add frontend/src/types/models.ts frontend/src/constants/enums.ts frontend/src/api/vehicles.ts
git commit -m "feat(frontend): add vehicle types, enums, and API module"
```

---

## Task 2: Vehicles list page

**Files:**
- Create: `frontend/src/pages/vehicles/VehiclesListPage.tsx`
- Modify: `frontend/src/App.tsx` (swap import)
- Delete: `frontend/src/pages/VehiclesPage.tsx`

- [ ] **Step 1: Create `frontend/src/pages/vehicles/VehiclesListPage.tsx`**

```typescript
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ApiRequestError } from "../../api/client";
import { listEmployees } from "../../api/employees";
import { listVehicles } from "../../api/vehicles";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { SelectField } from "../../components/SelectField";
import { TextField } from "../../components/TextField";
import { VEHICLE_STATUSES, VEHICLE_TYPES } from "../../constants/enums";
import type { EmployeeSummary, VehicleSummary } from "../../types/models";

const PAGE_SIZE = 20;

export function VehiclesListPage() {
  const [vehicles, setVehicles] = useState<VehicleSummary[]>([]);
  const [drivers, setDrivers] = useState<EmployeeSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listEmployees({ page: 1, page_size: 200 })
      .then((res) => setDrivers(res.items))
      .catch(() => toast.error("تعذر تحميل الموظفين"));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listVehicles({
        q: q || undefined,
        type: (type || undefined) as VehicleSummary["type"] | undefined,
        status: (status || undefined) as VehicleSummary["status"] | undefined,
        page,
        page_size: PAGE_SIZE,
      });
      setVehicles(res.items);
      setTotal(res.total);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "تعذر تحميل المركبات");
    } finally {
      setLoading(false);
    }
  }, [q, type, status, page]);

  useEffect(() => {
    load();
  }, [load]);

  const driverById = useMemo(() => new Map(drivers.map((d) => [d.id, d.name])), [drivers]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">المركبات</h1>
          <p className="mt-1 text-sm text-slate-600">إدارة المركبات والصيانة والفحوصات</p>
        </div>
        <Link to="/vehicles/new">
          <Button>إضافة مركبة</Button>
        </Link>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <TextField
            label="بحث برقم اللوحة"
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
            placeholder="..."
          />
          <SelectField
            label="النوع"
            value={type}
            onChange={(e) => {
              setPage(1);
              setType(e.target.value);
            }}
            placeholder="كل الأنواع"
            options={VEHICLE_TYPES.map((t) => ({ value: t, label: t }))}
          />
          <SelectField
            label="الحالة"
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
            placeholder="كل الحالات"
            options={VEHICLE_STATUSES.map((s) => ({ value: s, label: s }))}
          />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white">
        {loading ? (
          <div className="p-8 text-center text-slate-500">جارِ التحميل...</div>
        ) : vehicles.length === 0 ? (
          <EmptyState
            title="لا توجد مركبات"
            description="لم يتم العثور على نتائج، أو لم يتم إضافة مركبة بعد."
            action={
              <Link to="/vehicles/new">
                <Button>إضافة أول مركبة</Button>
              </Link>
            }
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-start font-medium">رقم اللوحة</th>
                <th className="px-4 py-3 text-start font-medium">النوع</th>
                <th className="px-4 py-3 text-start font-medium">الحالة</th>
                <th className="px-4 py-3 text-start font-medium">السائق</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      to={`/vehicles/${v.id}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {v.plate_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{v.type}</td>
                  <td className="px-4 py-3 text-slate-700">{v.status}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {v.driver_id ? driverById.get(v.driver_id) ?? "—" : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {total > PAGE_SIZE ? (
        <footer className="flex items-center justify-between">
          <p className="text-sm text-slate-600">
            صفحة {page} من {totalPages} — إجمالي {total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              السابق
            </Button>
            <Button
              variant="secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              التالي
            </Button>
          </div>
        </footer>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Update `frontend/src/App.tsx`**

Replace the `VehiclesPage` import with the new list page:

```typescript
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { AppLayout } from "./components/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { BuildingPage } from "./pages/BuildingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { EmployeeDetailPage } from "./pages/employees/EmployeeDetailPage";
import { EmployeesListPage } from "./pages/employees/EmployeesListPage";
import { NewEmployeePage } from "./pages/employees/NewEmployeePage";
import { LoginPage } from "./pages/LoginPage";
import { SetupPage } from "./pages/SetupPage";
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
            <Route path="/building" element={<BuildingPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

- [ ] **Step 3: Delete the old placeholder**

```bash
rm /Users/turkioqab/Projects/Markaz/frontend/src/pages/VehiclesPage.tsx
```

- [ ] **Step 4: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add frontend/src/pages/vehicles/ frontend/src/pages/VehiclesPage.tsx frontend/src/App.tsx
git commit -m "feat(frontend): add vehicles list page with search + filters"
```

---

## Task 3: New vehicle page

**Files:**
- Create: `frontend/src/pages/vehicles/NewVehiclePage.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Create `frontend/src/pages/vehicles/NewVehiclePage.tsx`**

```typescript
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ApiRequestError } from "../../api/client";
import { listEmployees } from "../../api/employees";
import { createVehicle } from "../../api/vehicles";
import type { VehicleCreateInput } from "../../api/vehicles";
import { Button } from "../../components/Button";
import { SelectField } from "../../components/SelectField";
import { TextField } from "../../components/TextField";
import { VEHICLE_STATUSES, VEHICLE_TYPES } from "../../constants/enums";
import type { EmployeeSummary } from "../../types/models";

const EMPTY: VehicleCreateInput = {
  type: "إطفاء",
  plate_number: "",
  status: "في الخدمة",
  driver_id: null,
};

export function NewVehiclePage() {
  const [form, setForm] = useState<VehicleCreateInput>(EMPTY);
  const [drivers, setDrivers] = useState<EmployeeSummary[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    listEmployees({ page: 1, page_size: 200 })
      .then((res) => setDrivers(res.items))
      .catch(() => toast.error("تعذر تحميل الموظفين"));
  }, []);

  function update<K extends keyof VehicleCreateInput>(key: K, value: VehicleCreateInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created = await createVehicle(form);
      toast.success("تم إنشاء المركبة");
      navigate(`/vehicles/${created.id}`, { replace: true });
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "فشل إنشاء المركبة");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">إضافة مركبة</h1>
      </header>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-white p-6 md:grid-cols-2"
      >
        <SelectField
          label="النوع"
          value={form.type}
          onChange={(e) => update("type", e.target.value as typeof form.type)}
          options={VEHICLE_TYPES.map((t) => ({ value: t, label: t }))}
        />
        <TextField
          label="رقم اللوحة"
          value={form.plate_number}
          onChange={(e) => update("plate_number", e.target.value)}
          required
        />
        <SelectField
          label="الحالة"
          value={form.status}
          onChange={(e) => update("status", e.target.value as typeof form.status)}
          options={VEHICLE_STATUSES.map((s) => ({ value: s, label: s }))}
        />
        <SelectField
          label="السائق"
          value={form.driver_id ? String(form.driver_id) : ""}
          onChange={(e) => update("driver_id", e.target.value ? Number(e.target.value) : null)}
          placeholder="بدون سائق"
          options={drivers.map((d) => ({ value: d.id, label: d.name }))}
        />

        <div className="flex justify-end gap-2 md:col-span-2">
          <Button variant="secondary" type="button" onClick={() => navigate(-1)}>
            إلغاء
          </Button>
          <Button type="submit" loading={submitting}>
            حفظ
          </Button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Add route in `frontend/src/App.tsx`**

Add the import + route:

```typescript
import { NewVehiclePage } from "./pages/vehicles/NewVehiclePage";

// inside Routes:
<Route path="/vehicles/new" element={<NewVehiclePage />} />
```

Full file replacement:

```typescript
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { AppLayout } from "./components/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { BuildingPage } from "./pages/BuildingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { EmployeeDetailPage } from "./pages/employees/EmployeeDetailPage";
import { EmployeesListPage } from "./pages/employees/EmployeesListPage";
import { NewEmployeePage } from "./pages/employees/NewEmployeePage";
import { LoginPage } from "./pages/LoginPage";
import { SetupPage } from "./pages/SetupPage";
import { NewVehiclePage } from "./pages/vehicles/NewVehiclePage";
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
            <Route path="/building" element={<BuildingPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add frontend/src/pages/vehicles/NewVehiclePage.tsx frontend/src/App.tsx
git commit -m "feat(frontend): add new vehicle page"
```

---

## Task 4: Vehicle detail page shell + main info tab

**Files:**
- Create: `frontend/src/pages/vehicles/VehicleDetailPage.tsx`
- Create: `frontend/src/pages/vehicles/tabs/MainInfoTab.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Create `frontend/src/pages/vehicles/tabs/MainInfoTab.tsx`**

```typescript
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ApiRequestError } from "../../../api/client";
import { listEmployees } from "../../../api/employees";
import { deleteVehicle, updateVehicle, uploadVehiclePhoto } from "../../../api/vehicles";
import { Button } from "../../../components/Button";
import { SelectField } from "../../../components/SelectField";
import { TextField } from "../../../components/TextField";
import { VEHICLE_STATUSES, VEHICLE_TYPES } from "../../../constants/enums";
import type { EmployeeSummary, Vehicle } from "../../../types/models";

interface Props {
  vehicle: Vehicle;
  onUpdated: (updated: Vehicle) => void;
}

export function MainInfoTab({ vehicle, onUpdated }: Props) {
  const [form, setForm] = useState<Vehicle>(vehicle);
  const [drivers, setDrivers] = useState<EmployeeSummary[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    listEmployees({ page: 1, page_size: 200 })
      .then((res) => setDrivers(res.items))
      .catch(() => toast.error("تعذر تحميل الموظفين"));
  }, []);

  useEffect(() => {
    setForm(vehicle);
  }, [vehicle]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const updated = await updateVehicle(vehicle.id, {
        type: form.type,
        plate_number: form.plate_number,
        status: form.status,
        driver_id: form.driver_id,
      });
      toast.success("تم الحفظ");
      onUpdated(updated);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "فشل الحفظ");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePhotoSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const updated = await uploadVehiclePhoto(vehicle.id, file);
      toast.success("تم رفع الصورة");
      onUpdated(updated);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "فشل رفع الصورة");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleDelete() {
    if (!window.confirm(`هل أنت متأكد من حذف المركبة ${vehicle.plate_number}؟`)) return;
    try {
      await deleteVehicle(vehicle.id);
      toast.success("تم الحذف");
      navigate("/vehicles", { replace: true });
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "فشل الحذف");
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">الصورة</h2>
        <div className="flex items-center gap-6">
          <div className="h-24 w-32 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
            {vehicle.photo_path ? (
              <img
                src={vehicle.photo_path}
                alt={vehicle.plate_number}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl text-slate-400">
                🚒
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoSelect}
              className="hidden"
            />
            <Button
              variant="secondary"
              type="button"
              onClick={() => fileRef.current?.click()}
              loading={uploading}
            >
              {vehicle.photo_path ? "تغيير الصورة" : "رفع صورة"}
            </Button>
            <p className="text-xs text-slate-500">JPG, PNG, WebP — الحد الأقصى 5 ميجابايت</p>
          </div>
        </div>
      </section>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-white p-6 md:grid-cols-2"
      >
        <SelectField
          label="النوع"
          value={form.type}
          onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as typeof f.type }))}
          options={VEHICLE_TYPES.map((t) => ({ value: t, label: t }))}
        />
        <TextField
          label="رقم اللوحة"
          value={form.plate_number}
          onChange={(e) => setForm((f) => ({ ...f, plate_number: e.target.value }))}
          required
        />
        <SelectField
          label="الحالة"
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as typeof f.status }))}
          options={VEHICLE_STATUSES.map((s) => ({ value: s, label: s }))}
        />
        <SelectField
          label="السائق"
          value={form.driver_id ? String(form.driver_id) : ""}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              driver_id: e.target.value ? Number(e.target.value) : null,
            }))
          }
          placeholder="بدون سائق"
          options={drivers.map((d) => ({ value: d.id, label: d.name }))}
        />

        <div className="flex justify-between gap-2 md:col-span-2">
          <Button variant="danger" type="button" onClick={handleDelete}>
            حذف المركبة
          </Button>
          <Button type="submit" loading={submitting}>
            حفظ التعديلات
          </Button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Create the three tab stubs so the detail page compiles**

Create `frontend/src/pages/vehicles/tabs/MaintenanceTab.tsx`:

```typescript
export function MaintenanceTab({ vehicleId: _vehicleId }: { vehicleId: number }) {
  return <p className="text-slate-500">قريباً...</p>;
}
```

Create `frontend/src/pages/vehicles/tabs/EquipmentTab.tsx`:

```typescript
export function EquipmentTab({ vehicleId: _vehicleId }: { vehicleId: number }) {
  return <p className="text-slate-500">قريباً...</p>;
}
```

Create `frontend/src/pages/vehicles/tabs/InspectionsTab.tsx`:

```typescript
export function InspectionsTab({ vehicleId: _vehicleId }: { vehicleId: number }) {
  return <p className="text-slate-500">قريباً...</p>;
}
```

- [ ] **Step 3: Create `frontend/src/pages/vehicles/VehicleDetailPage.tsx`**

```typescript
import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ApiRequestError } from "../../api/client";
import { getVehicle } from "../../api/vehicles";
import type { Vehicle } from "../../types/models";
import { EquipmentTab } from "./tabs/EquipmentTab";
import { InspectionsTab } from "./tabs/InspectionsTab";
import { MainInfoTab } from "./tabs/MainInfoTab";
import { MaintenanceTab } from "./tabs/MaintenanceTab";

type TabKey = "main" | "maintenance" | "equipment" | "inspections";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "main", label: "المعلومات الأساسية" },
  { key: "maintenance", label: "الصيانة" },
  { key: "equipment", label: "المعدات" },
  { key: "inspections", label: "الفحوصات" },
];

export function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const vehicleId = id ? Number(id) : NaN;
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<TabKey>("main");

  useEffect(() => {
    if (Number.isNaN(vehicleId)) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    getVehicle(vehicleId)
      .then((v) => {
        setVehicle(v);
        setLoading(false);
      })
      .catch((err) => {
        if (err instanceof ApiRequestError && err.status === 404) {
          setNotFound(true);
        } else {
          toast.error(err instanceof ApiRequestError ? err.message : "فشل تحميل المركبة");
        }
        setLoading(false);
      });
  }, [vehicleId]);

  if (loading) return <p className="text-slate-500">جارِ التحميل...</p>;
  if (notFound) return <Navigate to="/vehicles" replace />;
  if (!vehicle) return null;

  return (
    <div className="space-y-6">
      <header>
        <Link to="/vehicles" className="text-sm text-slate-600 hover:underline">
          ← الرجوع إلى القائمة
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{vehicle.plate_number}</h1>
        <p className="text-sm text-slate-600">
          {vehicle.type} · {vehicle.status}
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
        <MainInfoTab vehicle={vehicle} onUpdated={setVehicle} />
      ) : tab === "maintenance" ? (
        <MaintenanceTab vehicleId={vehicle.id} />
      ) : tab === "equipment" ? (
        <EquipmentTab vehicleId={vehicle.id} />
      ) : (
        <InspectionsTab vehicleId={vehicle.id} />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Add route in `frontend/src/App.tsx`**

Add the import + route. Full replacement:

```typescript
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { AppLayout } from "./components/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { BuildingPage } from "./pages/BuildingPage";
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

- [ ] **Step 5: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add frontend/src/pages/vehicles/ frontend/src/App.tsx
git commit -m "feat(frontend): add vehicle detail page with tab shell and main info tab"
```

---

## Task 5: Maintenance tab

**Files:**
- Modify: `frontend/src/pages/vehicles/tabs/MaintenanceTab.tsx`

- [ ] **Step 1: Replace with full implementation**

```typescript
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { ApiRequestError } from "../../../api/client";
import {
  createMaintenance,
  deleteMaintenance,
  listMaintenance,
  updateMaintenance,
} from "../../../api/vehicles";
import type { MaintenanceInput } from "../../../api/vehicles";
import { Button } from "../../../components/Button";
import { EmptyState } from "../../../components/EmptyState";
import { Modal } from "../../../components/Modal";
import { SelectField } from "../../../components/SelectField";
import { TextField } from "../../../components/TextField";
import { MAINTENANCE_STATUSES } from "../../../constants/enums";
import type { VehicleMaintenance } from "../../../types/models";

const EMPTY: MaintenanceInput = {
  date: "",
  description: "",
  cost: 0,
  contractor: "",
  status: "مكتمل",
};

export function MaintenanceTab({ vehicleId }: { vehicleId: number }) {
  const [items, setItems] = useState<VehicleMaintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<VehicleMaintenance | null>(null);
  const [creating, setCreating] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      const res = await listMaintenance(vehicleId);
      setItems(res.items);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "فشل التحميل");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId]);

  async function handleDelete(id: number) {
    if (!window.confirm("هل تريد حذف سجل الصيانة هذا؟")) return;
    try {
      await deleteMaintenance(vehicleId, id);
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
            await createMaintenance(vehicleId, payload);
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
            await updateMaintenance(vehicleId, editing.id, payload);
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
  initial: MaintenanceInput;
  onClose: () => void;
  onSubmit: (payload: MaintenanceInput) => Promise<void>;
}) {
  const [form, setForm] = useState<MaintenanceInput>(initial);
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
          <Button form="maint-form" type="submit" loading={submitting}>
            حفظ
          </Button>
        </>
      }
    >
      <form id="maint-form" onSubmit={handleSubmit} className="space-y-4">
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
git add frontend/src/pages/vehicles/tabs/MaintenanceTab.tsx
git commit -m "feat(frontend): implement vehicle maintenance tab"
```

---

## Task 6: Onboard equipment tab

**Files:**
- Modify: `frontend/src/pages/vehicles/tabs/EquipmentTab.tsx`

- [ ] **Step 1: Replace with full implementation**

```typescript
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { ApiRequestError } from "../../../api/client";
import {
  createVehicleEquipment,
  deleteVehicleEquipment,
  listVehicleEquipment,
  updateVehicleEquipment,
} from "../../../api/vehicles";
import type { VehicleEquipmentInput } from "../../../api/vehicles";
import { Button } from "../../../components/Button";
import { EmptyState } from "../../../components/EmptyState";
import { Modal } from "../../../components/Modal";
import { SelectField } from "../../../components/SelectField";
import { TextField } from "../../../components/TextField";
import { EQUIPMENT_CONDITIONS } from "../../../constants/enums";
import type { VehicleOnboardEquipment } from "../../../types/models";

const EMPTY: VehicleEquipmentInput = {
  item_name: "",
  quantity: 1,
  condition: "جيد",
};

export function EquipmentTab({ vehicleId }: { vehicleId: number }) {
  const [items, setItems] = useState<VehicleOnboardEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<VehicleOnboardEquipment | null>(null);
  const [creating, setCreating] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      const res = await listVehicleEquipment(vehicleId);
      setItems(res.items);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "فشل التحميل");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId]);

  async function handleDelete(id: number) {
    if (!window.confirm("هل تريد حذف هذا التجهيز؟")) return;
    try {
      await deleteVehicleEquipment(vehicleId, id);
      toast.success("تم الحذف");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "فشل الحذف");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)}>إضافة تجهيز</Button>
      </div>

      {loading ? (
        <p className="text-slate-500">جارِ التحميل...</p>
      ) : items.length === 0 ? (
        <EmptyState title="لا توجد تجهيزات على المركبة" description="أضف تجهيزاً للبدء" />
      ) : (
        <table className="w-full rounded-lg border border-slate-200 bg-white text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-start font-medium">الاسم</th>
              <th className="px-4 py-3 text-start font-medium">الكمية</th>
              <th className="px-4 py-3 text-start font-medium">الحالة</th>
              <th className="px-4 py-3 text-end font-medium">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {items.map((eq) => (
              <tr key={eq.id} className="border-b border-slate-100 last:border-b-0">
                <td className="px-4 py-3 font-medium text-slate-900">{eq.item_name}</td>
                <td className="px-4 py-3 text-slate-700">{eq.quantity}</td>
                <td className="px-4 py-3 text-slate-700">{eq.condition}</td>
                <td className="px-4 py-3 text-end">
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => setEditing(eq)}>
                      تعديل
                    </Button>
                    <Button variant="danger" onClick={() => handleDelete(eq.id)}>
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
        <EquipmentFormModal
          title="إضافة تجهيز"
          initial={EMPTY}
          onClose={() => setCreating(false)}
          onSubmit={async (payload) => {
            await createVehicleEquipment(vehicleId, payload);
            toast.success("تمت الإضافة");
            setCreating(false);
            reload();
          }}
        />
      ) : null}

      {editing ? (
        <EquipmentFormModal
          title="تعديل التجهيز"
          initial={{
            item_name: editing.item_name,
            quantity: editing.quantity,
            condition: editing.condition,
          }}
          onClose={() => setEditing(null)}
          onSubmit={async (payload) => {
            await updateVehicleEquipment(vehicleId, editing.id, payload);
            toast.success("تم التحديث");
            setEditing(null);
            reload();
          }}
        />
      ) : null}
    </div>
  );
}

function EquipmentFormModal({
  title,
  initial,
  onClose,
  onSubmit,
}: {
  title: string;
  initial: VehicleEquipmentInput;
  onClose: () => void;
  onSubmit: (payload: VehicleEquipmentInput) => Promise<void>;
}) {
  const [form, setForm] = useState<VehicleEquipmentInput>(initial);
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
          <Button form="veq-form" type="submit" loading={submitting}>
            حفظ
          </Button>
        </>
      }
    >
      <form id="veq-form" onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="اسم التجهيز"
          value={form.item_name}
          onChange={(e) => setForm((f) => ({ ...f, item_name: e.target.value }))}
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
        <SelectField
          label="الحالة"
          value={form.condition}
          onChange={(e) =>
            setForm((f) => ({ ...f, condition: e.target.value as typeof f.condition }))
          }
          options={EQUIPMENT_CONDITIONS.map((c) => ({ value: c, label: c }))}
        />
      </form>
    </Modal>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add frontend/src/pages/vehicles/tabs/EquipmentTab.tsx
git commit -m "feat(frontend): implement vehicle onboard equipment tab"
```

---

## Task 7: Inspections tab

**Files:**
- Modify: `frontend/src/pages/vehicles/tabs/InspectionsTab.tsx`

- [ ] **Step 1: Replace with full implementation**

```typescript
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { ApiRequestError } from "../../../api/client";
import {
  createInspection,
  deleteInspection,
  listInspections,
  updateInspection,
} from "../../../api/vehicles";
import type { InspectionInput } from "../../../api/vehicles";
import { Button } from "../../../components/Button";
import { EmptyState } from "../../../components/EmptyState";
import { Modal } from "../../../components/Modal";
import { SelectField } from "../../../components/SelectField";
import { TextField } from "../../../components/TextField";
import { INSPECTION_RESULTS } from "../../../constants/enums";
import type { VehicleInspection } from "../../../types/models";

const EMPTY: InspectionInput = {
  inspection_date: "",
  inspector_name: "",
  result: "ناجح",
  notes: null,
};

export function InspectionsTab({ vehicleId }: { vehicleId: number }) {
  const [items, setItems] = useState<VehicleInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<VehicleInspection | null>(null);
  const [creating, setCreating] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      const res = await listInspections(vehicleId);
      setItems(res.items);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "فشل التحميل");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId]);

  async function handleDelete(id: number) {
    if (!window.confirm("هل تريد حذف هذا الفحص؟")) return;
    try {
      await deleteInspection(vehicleId, id);
      toast.success("تم الحذف");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "فشل الحذف");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)}>إضافة فحص</Button>
      </div>

      {loading ? (
        <p className="text-slate-500">جارِ التحميل...</p>
      ) : items.length === 0 ? (
        <EmptyState title="لا توجد فحوصات" description="أضف فحصاً للبدء" />
      ) : (
        <table className="w-full rounded-lg border border-slate-200 bg-white text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-start font-medium">التاريخ</th>
              <th className="px-4 py-3 text-start font-medium">المفتش</th>
              <th className="px-4 py-3 text-start font-medium">النتيجة</th>
              <th className="px-4 py-3 text-start font-medium">ملاحظات</th>
              <th className="px-4 py-3 text-end font-medium">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-b border-slate-100 last:border-b-0">
                <td className="px-4 py-3 text-slate-700">{i.inspection_date}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{i.inspector_name}</td>
                <td className="px-4 py-3 text-slate-700">{i.result}</td>
                <td className="px-4 py-3 text-slate-600">{i.notes ?? "—"}</td>
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
            ))}
          </tbody>
        </table>
      )}

      {creating ? (
        <InspectionFormModal
          title="إضافة فحص"
          initial={EMPTY}
          onClose={() => setCreating(false)}
          onSubmit={async (payload) => {
            await createInspection(vehicleId, payload);
            toast.success("تمت الإضافة");
            setCreating(false);
            reload();
          }}
        />
      ) : null}

      {editing ? (
        <InspectionFormModal
          title="تعديل الفحص"
          initial={{
            inspection_date: editing.inspection_date,
            inspector_name: editing.inspector_name,
            result: editing.result,
            notes: editing.notes,
          }}
          onClose={() => setEditing(null)}
          onSubmit={async (payload) => {
            await updateInspection(vehicleId, editing.id, payload);
            toast.success("تم التحديث");
            setEditing(null);
            reload();
          }}
        />
      ) : null}
    </div>
  );
}

function InspectionFormModal({
  title,
  initial,
  onClose,
  onSubmit,
}: {
  title: string;
  initial: InspectionInput;
  onClose: () => void;
  onSubmit: (payload: InspectionInput) => Promise<void>;
}) {
  const [form, setForm] = useState<InspectionInput>(initial);
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
          <Button form="insp-form" type="submit" loading={submitting}>
            حفظ
          </Button>
        </>
      }
    >
      <form id="insp-form" onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="تاريخ الفحص"
          type="date"
          value={form.inspection_date}
          onChange={(e) => setForm((f) => ({ ...f, inspection_date: e.target.value }))}
          required
        />
        <TextField
          label="اسم المفتش"
          value={form.inspector_name}
          onChange={(e) => setForm((f) => ({ ...f, inspector_name: e.target.value }))}
          required
        />
        <SelectField
          label="النتيجة"
          value={form.result}
          onChange={(e) => setForm((f) => ({ ...f, result: e.target.value as typeof f.result }))}
          options={INSPECTION_RESULTS.map((r) => ({ value: r, label: r }))}
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
git add frontend/src/pages/vehicles/tabs/InspectionsTab.tsx
git commit -m "feat(frontend): implement vehicle inspections tab"
```

---

## Task 8: Integration test

**Files:**
- Create: `frontend/src/__tests__/VehiclesListPage.test.tsx`

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

describe("Vehicles list page", () => {
  let fetchMock: FetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    window.history.pushState({}, "", "/vehicles");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    window.history.pushState({}, "", "/");
  });

  it("renders seeded vehicles", async () => {
    fetchMock.mockResolvedValueOnce(
      json({ data: { setup_complete: true, authenticated: true } }),
    );
    // Drivers (employees) — for display only
    fetchMock.mockResolvedValueOnce(
      json({ data: { items: [], total: 0, page: 1, page_size: 200 } }),
    );
    // Vehicles
    fetchMock.mockResolvedValueOnce(
      json({
        data: {
          items: [
            {
              id: 1,
              type: "إطفاء",
              plate_number: "أ ب ج 1234",
              status: "في الخدمة",
              driver_id: null,
              photo_path: null,
            },
          ],
          total: 1,
          page: 1,
          page_size: 20,
        },
      }),
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "المركبات" })).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "أ ب ج 1234" })).toBeInTheDocument();
    });
    expect(screen.getByText("إطفاء")).toBeInTheDocument();
    expect(screen.getByText("في الخدمة")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests**

```bash
cd /Users/turkioqab/Projects/Markaz/frontend
npm run test
```

Expected: 4 passed total.

- [ ] **Step 3: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add frontend/src/__tests__/VehiclesListPage.test.tsx
git commit -m "test(frontend): integration test for vehicles list page"
```

---

## Task 9: Phase 7 verification

- [ ] **Step 1: All tests pass**

```bash
cd /Users/turkioqab/Projects/Markaz/frontend
npm run test
```

Expected: 4 tests.

- [ ] **Step 2: Lint + type check clean**

```bash
cd /Users/turkioqab/Projects/Markaz/frontend
npm run lint
npx tsc -b --noEmit
```

Expected: no errors.

- [ ] **Step 3: Manual smoke test**

Start both servers. Navigate to http://localhost:5173 → log in → click "المركبات":

1. List shows 8 seeded vehicles.
2. Search by plate number works.
3. Filter by type/status works.
4. Click a vehicle → detail page with 4 tabs.
5. Main info tab: edit, save, change driver, upload photo.
6. Maintenance tab: add/edit/delete.
7. Equipment tab: add/edit/delete.
8. Inspections tab: add/edit/delete.
9. Delete a vehicle → redirects to list.
10. Create a new vehicle via "إضافة مركبة".

- [ ] **Step 4: Git status clean**

```bash
cd /Users/turkioqab/Projects/Markaz
git status
git log --oneline | head -12
```

Expected: clean, ~8 new commits.

---

## Phase 7 exit criteria

1. Frontend `npm run test` passes (≥ 4 tests)
2. `npm run lint` + `npx tsc -b --noEmit` clean
3. List page: loads, searches by plate, filters by type/status, paginates, shows driver name
4. Create, edit, delete flows work
5. Detail page: 4 tabs (main, maintenance, equipment, inspections) with full CRUD
6. Photo upload works for vehicles
7. Working tree clean

Phase 8 (Frontend: Building UI) is the last frontend phase.
