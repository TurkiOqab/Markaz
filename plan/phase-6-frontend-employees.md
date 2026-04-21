# Phase 6 — Frontend: Employees UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the empty "Employees" placeholder with a full CRUD UI: list with search/filter/pagination, create form, detail page with tabs for main info + certifications + equipment + monthly ratings, photo upload, and delete (with driver-check error surfaced in Arabic).

**Architecture:** One API module per backend surface (employees, teams, nested resources). Small data hooks (`useEmployees`, `useEmployee`, etc.) wrap `api.get` with loading/error state. Pages live under `pages/employees/`. Shared UI primitives (`SelectField`, `Modal`, `DataTable`) get added as we need them. Native React state for forms (no extra form library). Photo upload is a simple file input on the detail page.

**Tech Stack:** React 19, react-router-dom 6, Tailwind + RTL, sonner toasts, Vitest + Testing Library (all already installed).

---

## File Structure

```
frontend/src/
├── api/
│   ├── employees.ts                  # list/get/create/update/delete + nested
│   └── teams.ts                      # list teams
├── types/
│   └── models.ts                     # Employee, Team, Certification, Equipment, MonthlyRating
├── constants/
│   └── enums.ts                      # MARITAL_STATUSES, PHYSICAL_ABILITIES, SHIFTS, EQUIPMENT_CONDITIONS, RATING_MIN/MAX
├── components/
│   ├── SelectField.tsx               # labeled <select> (mirrors TextField)
│   ├── Modal.tsx                     # dialog with overlay
│   └── EmptyState.tsx                # shared "no data" block
├── pages/employees/
│   ├── EmployeesListPage.tsx         # (replaces current EmployeesPage)
│   ├── NewEmployeePage.tsx
│   ├── EmployeeDetailPage.tsx        # shell w/ tabs
│   ├── tabs/
│   │   ├── MainInfoTab.tsx           # edit form + photo upload + delete button
│   │   ├── CertificationsTab.tsx
│   │   ├── EquipmentTab.tsx
│   │   └── RatingsTab.tsx
└── __tests__/
    └── EmployeesListPage.test.tsx    # integration test for list + search + navigation
```

The existing `src/pages/EmployeesPage.tsx` is replaced by the router pointing at the new pages.

---

## Task 1: Types, constants, and API modules

**Files:**
- Create: `frontend/src/types/models.ts`
- Create: `frontend/src/constants/enums.ts`
- Create: `frontend/src/api/teams.ts`
- Create: `frontend/src/api/employees.ts`

- [ ] **Step 1: Create `frontend/src/types/models.ts`**

```typescript
// Shape mirrors the backend Pydantic `*Out` schemas.

export interface Team {
  id: number;
  name: string;
  description: string | null;
}

export type MaritalStatus = "أعزب" | "متزوج" | "مطلق" | "أرمل";
export type PhysicalAbility = "ممتاز" | "جيد جداً" | "جيد" | "مقبول";
export type Shift = "صباحية" | "مسائية" | "ليلية";
export type EquipmentCondition = "ممتاز" | "جيد" | "متوسط" | "تالف";

export interface Certification {
  id: number;
  name: string;
  issuing_authority: string;
  issue_date: string; // ISO date
  expiry_date: string;
}

export interface Equipment {
  id: number;
  item_name: string;
  serial_number: string | null;
  assigned_date: string;
  condition: EquipmentCondition;
}

export interface MonthlyRating {
  id: number;
  year: number;
  month: number;
  rating: number;
  notes: string | null;
}

export interface EmployeeSummary {
  id: number;
  name: string;
  rank: string;
  specialty: string;
  national_id: string;
  photo_path: string | null;
  team_id: number;
  shift: Shift;
}

export interface Employee {
  id: number;
  name: string;
  rank: string;
  specialty: string;
  date_of_birth: string; // ISO date
  marital_status: MaritalStatus;
  physical_ability: PhysicalAbility;
  national_id: string;
  photo_path: string | null;
  phone: string;
  email: string | null;
  team_id: number;
  shift: Shift;
  created_at: string;
  updated_at: string;
  certifications: Certification[];
  equipment: Equipment[];
  monthly_ratings: MonthlyRating[];
}

export interface PagedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}
```

- [ ] **Step 2: Create `frontend/src/constants/enums.ts`**

```typescript
import type {
  EquipmentCondition,
  MaritalStatus,
  PhysicalAbility,
  Shift,
} from "../types/models";

export const MARITAL_STATUSES: MaritalStatus[] = ["أعزب", "متزوج", "مطلق", "أرمل"];
export const PHYSICAL_ABILITIES: PhysicalAbility[] = ["ممتاز", "جيد جداً", "جيد", "مقبول"];
export const SHIFTS: Shift[] = ["صباحية", "مسائية", "ليلية"];
export const EQUIPMENT_CONDITIONS: EquipmentCondition[] = ["ممتاز", "جيد", "متوسط", "تالف"];

export const RATING_MIN = 0;
export const RATING_MAX = 5;
```

- [ ] **Step 3: Create `frontend/src/api/teams.ts`**

```typescript
import { api } from "./client";
import type { PagedResponse, Team } from "../types/models";

export function listTeams() {
  return api.get<PagedResponse<Team>>("/api/teams");
}
```

- [ ] **Step 4: Create `frontend/src/api/employees.ts`**

```typescript
import { api } from "./client";
import type {
  Certification,
  Employee,
  EmployeeSummary,
  Equipment,
  MonthlyRating,
  PagedResponse,
  Shift,
} from "../types/models";

export interface EmployeeListParams {
  q?: string;
  team_id?: number;
  shift?: Shift;
  page?: number;
  page_size?: number;
}

function queryString(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (entries.length === 0) return "";
  const qs = entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join("&");
  return `?${qs}`;
}

export function listEmployees(params: EmployeeListParams = {}) {
  return api.get<PagedResponse<EmployeeSummary>>(`/api/employees${queryString(params)}`);
}

export function getEmployee(id: number) {
  return api.get<Employee>(`/api/employees/${id}`);
}

export type EmployeeCreateInput = Omit<
  Employee,
  "id" | "photo_path" | "created_at" | "updated_at" | "certifications" | "equipment" | "monthly_ratings"
>;

export function createEmployee(input: EmployeeCreateInput) {
  return api.post<Employee>("/api/employees", input);
}

export function updateEmployee(id: number, input: Partial<EmployeeCreateInput>) {
  return api.patch<Employee>(`/api/employees/${id}`, input);
}

export function deleteEmployee(id: number) {
  return api.del<void>(`/api/employees/${id}`);
}

export async function uploadEmployeePhoto(id: number, file: File): Promise<Employee> {
  const form = new FormData();
  form.append("file", file);
  return api.post<Employee>(`/api/employees/${id}/photo`, form);
}

// ---------- Nested: certifications ----------

export type CertificationInput = Omit<Certification, "id">;

export function listCertifications(employeeId: number) {
  return api.get<PagedResponse<Certification>>(`/api/employees/${employeeId}/certifications`);
}
export function createCertification(employeeId: number, input: CertificationInput) {
  return api.post<Certification>(`/api/employees/${employeeId}/certifications`, input);
}
export function updateCertification(employeeId: number, certId: number, input: Partial<CertificationInput>) {
  return api.patch<Certification>(`/api/employees/${employeeId}/certifications/${certId}`, input);
}
export function deleteCertification(employeeId: number, certId: number) {
  return api.del<void>(`/api/employees/${employeeId}/certifications/${certId}`);
}

// ---------- Nested: equipment ----------

export type EquipmentInput = Omit<Equipment, "id">;

export function listEmployeeEquipment(employeeId: number) {
  return api.get<PagedResponse<Equipment>>(`/api/employees/${employeeId}/equipment`);
}
export function createEmployeeEquipment(employeeId: number, input: EquipmentInput) {
  return api.post<Equipment>(`/api/employees/${employeeId}/equipment`, input);
}
export function updateEmployeeEquipment(employeeId: number, eqId: number, input: Partial<EquipmentInput>) {
  return api.patch<Equipment>(`/api/employees/${employeeId}/equipment/${eqId}`, input);
}
export function deleteEmployeeEquipment(employeeId: number, eqId: number) {
  return api.del<void>(`/api/employees/${employeeId}/equipment/${eqId}`);
}

// ---------- Nested: monthly ratings ----------

export type RatingInput = Omit<MonthlyRating, "id">;

export function listRatings(employeeId: number) {
  return api.get<PagedResponse<MonthlyRating>>(`/api/employees/${employeeId}/ratings`);
}
export function createRating(employeeId: number, input: RatingInput) {
  return api.post<MonthlyRating>(`/api/employees/${employeeId}/ratings`, input);
}
export function updateRating(employeeId: number, ratingId: number, input: Partial<RatingInput>) {
  return api.patch<MonthlyRating>(`/api/employees/${employeeId}/ratings/${ratingId}`, input);
}
export function deleteRating(employeeId: number, ratingId: number) {
  return api.del<void>(`/api/employees/${employeeId}/ratings/${ratingId}`);
}
```

- [ ] **Step 5: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add frontend/src/types/ frontend/src/constants/ frontend/src/api/teams.ts frontend/src/api/employees.ts
git commit -m "feat(frontend): add Employee/Team types, enums, and API modules"
```

---

## Task 2: Shared primitives — SelectField, Modal, EmptyState

**Files:**
- Create: `frontend/src/components/SelectField.tsx`
- Create: `frontend/src/components/Modal.tsx`
- Create: `frontend/src/components/EmptyState.tsx`

- [ ] **Step 1: Create `frontend/src/components/SelectField.tsx`**

```typescript
import { useId } from "react";
import type { SelectHTMLAttributes } from "react";

interface Props extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label: string;
  error?: string;
  options: Array<{ value: string | number; label: string }>;
  placeholder?: string;
}

export function SelectField({
  label,
  error,
  options,
  placeholder,
  id,
  className = "",
  ...rest
}: Props) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  return (
    <label htmlFor={selectId} className="flex flex-col gap-1">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select
        id={selectId}
        className={`rounded-md border bg-white px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-slate-500 ${
          error ? "border-red-400" : "border-slate-300"
        } ${className}`}
        {...rest}
      >
        {placeholder !== undefined ? (
          <option value="">{placeholder}</option>
        ) : null}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error ? <span className="text-sm text-red-600">{error}</span> : null}
    </label>
  );
}
```

- [ ] **Step 2: Create `frontend/src/components/Modal.tsx`**

```typescript
import type { ReactNode } from "react";
import { useEffect } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, onClose, title, children, footer }: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-lg bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        </header>
        <div className="px-6 py-4">{children}</div>
        {footer ? (
          <footer className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-3">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `frontend/src/components/EmptyState.tsx`**

```typescript
import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add frontend/src/components/SelectField.tsx frontend/src/components/Modal.tsx frontend/src/components/EmptyState.tsx
git commit -m "feat(frontend): add SelectField, Modal, EmptyState primitives"
```

---

## Task 3: Employees list page (table + search + filter + pagination)

**Files:**
- Create: `frontend/src/pages/employees/EmployeesListPage.tsx`
- Modify: `frontend/src/App.tsx` (replace the import)
- Delete: `frontend/src/pages/EmployeesPage.tsx`

- [ ] **Step 1: Create `frontend/src/pages/employees/EmployeesListPage.tsx`**

```typescript
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { listEmployees } from "../../api/employees";
import { listTeams } from "../../api/teams";
import { ApiRequestError } from "../../api/client";
import { SHIFTS } from "../../constants/enums";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { SelectField } from "../../components/SelectField";
import { TextField } from "../../components/TextField";
import type { EmployeeSummary, Team } from "../../types/models";

const PAGE_SIZE = 20;

export function EmployeesListPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [q, setQ] = useState("");
  const [teamId, setTeamId] = useState("");
  const [shift, setShift] = useState("");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listTeams()
      .then((res) => setTeams(res.items))
      .catch(() => toast.error("تعذر تحميل الفرق"));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        q: q || undefined,
        team_id: teamId ? Number(teamId) : undefined,
        shift: (shift || undefined) as EmployeeSummary["shift"] | undefined,
        page,
        page_size: PAGE_SIZE,
      };
      const res = await listEmployees(params);
      setEmployees(res.items);
      setTotal(res.total);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "تعذر تحميل الموظفين");
    } finally {
      setLoading(false);
    }
  }, [q, teamId, shift, page]);

  useEffect(() => {
    load();
  }, [load]);

  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t.name])), [teams]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">الموظفون</h1>
          <p className="mt-1 text-sm text-slate-600">إدارة الموظفين والشهادات والتجهيزات</p>
        </div>
        <Link to="/employees/new">
          <Button>إضافة موظف</Button>
        </Link>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <TextField
            label="بحث بالاسم أو الرقم الوطني"
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
            placeholder="..."
          />
          <SelectField
            label="الفريق"
            value={teamId}
            onChange={(e) => {
              setPage(1);
              setTeamId(e.target.value);
            }}
            placeholder="كل الفرق"
            options={teams.map((t) => ({ value: t.id, label: t.name }))}
          />
          <SelectField
            label="الوردية"
            value={shift}
            onChange={(e) => {
              setPage(1);
              setShift(e.target.value);
            }}
            placeholder="كل الورديات"
            options={SHIFTS.map((s) => ({ value: s, label: s }))}
          />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white">
        {loading ? (
          <div className="p-8 text-center text-slate-500">جارِ التحميل...</div>
        ) : employees.length === 0 ? (
          <EmptyState
            title="لا يوجد موظفون"
            description="لم يتم العثور على نتائج مطابقة، أو لم يتم إضافة أي موظف بعد."
            action={
              <Link to="/employees/new">
                <Button>إضافة أول موظف</Button>
              </Link>
            }
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-start font-medium">الاسم</th>
                <th className="px-4 py-3 text-start font-medium">الرتبة</th>
                <th className="px-4 py-3 text-start font-medium">التخصص</th>
                <th className="px-4 py-3 text-start font-medium">الفريق</th>
                <th className="px-4 py-3 text-start font-medium">الوردية</th>
                <th className="px-4 py-3 text-start font-medium">الرقم الوطني</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link to={`/employees/${emp.id}`} className="font-medium text-slate-900 hover:underline">
                      {emp.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{emp.rank}</td>
                  <td className="px-4 py-3 text-slate-700">{emp.specialty}</td>
                  <td className="px-4 py-3 text-slate-700">{teamById.get(emp.team_id) ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-700">{emp.shift}</td>
                  <td className="px-4 py-3 text-slate-500">{emp.national_id}</td>
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

Replace the `EmployeesPage` import and usage with the new list page:

```typescript
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { AppLayout } from "./components/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { BuildingPage } from "./pages/BuildingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { EmployeesListPage } from "./pages/employees/EmployeesListPage";
import { LoginPage } from "./pages/LoginPage";
import { SetupPage } from "./pages/SetupPage";
import { VehiclesPage } from "./pages/VehiclesPage";

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
            <Route path="/vehicles" element={<VehiclesPage />} />
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
rm /Users/turkioqab/Projects/Markaz/frontend/src/pages/EmployeesPage.tsx
```

- [ ] **Step 4: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add frontend/src/pages/employees/ frontend/src/pages/EmployeesPage.tsx frontend/src/App.tsx
git commit -m "feat(frontend): add employees list page with search, filter, pagination"
```

---

## Task 4: New employee page (create form)

**Files:**
- Create: `frontend/src/pages/employees/NewEmployeePage.tsx`
- Modify: `frontend/src/App.tsx` (add `/employees/new` route)

- [ ] **Step 1: Create `frontend/src/pages/employees/NewEmployeePage.tsx`**

```typescript
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ApiRequestError } from "../../api/client";
import { createEmployee } from "../../api/employees";
import type { EmployeeCreateInput } from "../../api/employees";
import { listTeams } from "../../api/teams";
import { Button } from "../../components/Button";
import { SelectField } from "../../components/SelectField";
import { TextField } from "../../components/TextField";
import {
  MARITAL_STATUSES,
  PHYSICAL_ABILITIES,
  SHIFTS,
} from "../../constants/enums";
import type { Team } from "../../types/models";

const EMPTY: EmployeeCreateInput = {
  name: "",
  rank: "",
  specialty: "",
  date_of_birth: "",
  marital_status: "أعزب",
  physical_ability: "جيد",
  national_id: "",
  phone: "",
  email: null,
  team_id: 0,
  shift: "صباحية",
};

export function NewEmployeePage() {
  const [form, setForm] = useState<EmployeeCreateInput>(EMPTY);
  const [teams, setTeams] = useState<Team[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    listTeams()
      .then((res) => {
        setTeams(res.items);
        if (res.items.length > 0) {
          setForm((f) => ({ ...f, team_id: res.items[0].id }));
        }
      })
      .catch(() => toast.error("تعذر تحميل الفرق"));
  }, []);

  function update<K extends keyof EmployeeCreateInput>(key: K, value: EmployeeCreateInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created = await createEmployee({
        ...form,
        email: form.email || null,
      });
      toast.success("تم إنشاء الموظف");
      navigate(`/employees/${created.id}`, { replace: true });
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "فشل إنشاء الموظف");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">إضافة موظف</h1>
      </header>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-white p-6 md:grid-cols-2"
      >
        <TextField label="الاسم" value={form.name} onChange={(e) => update("name", e.target.value)} required />
        <TextField label="الرتبة" value={form.rank} onChange={(e) => update("rank", e.target.value)} required />
        <TextField
          label="التخصص"
          value={form.specialty}
          onChange={(e) => update("specialty", e.target.value)}
          required
        />
        <TextField
          label="الرقم الوطني"
          value={form.national_id}
          onChange={(e) => update("national_id", e.target.value)}
          required
        />
        <TextField
          label="تاريخ الميلاد"
          type="date"
          value={form.date_of_birth}
          onChange={(e) => update("date_of_birth", e.target.value)}
          required
        />
        <TextField
          label="الهاتف"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          required
        />
        <TextField
          label="البريد الإلكتروني"
          type="email"
          value={form.email ?? ""}
          onChange={(e) => update("email", e.target.value || null)}
        />
        <SelectField
          label="الحالة الاجتماعية"
          value={form.marital_status}
          onChange={(e) => update("marital_status", e.target.value as typeof form.marital_status)}
          options={MARITAL_STATUSES.map((s) => ({ value: s, label: s }))}
        />
        <SelectField
          label="القدرة البدنية"
          value={form.physical_ability}
          onChange={(e) => update("physical_ability", e.target.value as typeof form.physical_ability)}
          options={PHYSICAL_ABILITIES.map((s) => ({ value: s, label: s }))}
        />
        <SelectField
          label="الفريق"
          value={String(form.team_id)}
          onChange={(e) => update("team_id", Number(e.target.value))}
          options={teams.map((t) => ({ value: t.id, label: t.name }))}
        />
        <SelectField
          label="الوردية"
          value={form.shift}
          onChange={(e) => update("shift", e.target.value as typeof form.shift)}
          options={SHIFTS.map((s) => ({ value: s, label: s }))}
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

Replace the file with:

```typescript
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { AppLayout } from "./components/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { BuildingPage } from "./pages/BuildingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { EmployeesListPage } from "./pages/employees/EmployeesListPage";
import { NewEmployeePage } from "./pages/employees/NewEmployeePage";
import { LoginPage } from "./pages/LoginPage";
import { SetupPage } from "./pages/SetupPage";
import { VehiclesPage } from "./pages/VehiclesPage";

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
            <Route path="/vehicles" element={<VehiclesPage />} />
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
git add frontend/src/pages/employees/NewEmployeePage.tsx frontend/src/App.tsx
git commit -m "feat(frontend): add employee create page"
```

---

## Task 5: Employee detail page shell + main info tab

**Files:**
- Create: `frontend/src/pages/employees/EmployeeDetailPage.tsx`
- Create: `frontend/src/pages/employees/tabs/MainInfoTab.tsx`
- Modify: `frontend/src/App.tsx` (add `/employees/:id` route)

- [ ] **Step 1: Create `frontend/src/pages/employees/tabs/MainInfoTab.tsx`**

```typescript
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ApiRequestError } from "../../../api/client";
import {
  deleteEmployee,
  updateEmployee,
  uploadEmployeePhoto,
} from "../../../api/employees";
import { listTeams } from "../../../api/teams";
import { Button } from "../../../components/Button";
import { SelectField } from "../../../components/SelectField";
import { TextField } from "../../../components/TextField";
import {
  MARITAL_STATUSES,
  PHYSICAL_ABILITIES,
  SHIFTS,
} from "../../../constants/enums";
import type { Employee, Team } from "../../../types/models";

interface Props {
  employee: Employee;
  onUpdated: (updated: Employee) => void;
}

export function MainInfoTab({ employee, onUpdated }: Props) {
  const [form, setForm] = useState<Employee>(employee);
  const [teams, setTeams] = useState<Team[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    listTeams()
      .then((res) => setTeams(res.items))
      .catch(() => toast.error("تعذر تحميل الفرق"));
  }, []);

  useEffect(() => {
    setForm(employee);
  }, [employee]);

  function update<K extends keyof Employee>(key: K, value: Employee[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const updated = await updateEmployee(employee.id, {
        name: form.name,
        rank: form.rank,
        specialty: form.specialty,
        date_of_birth: form.date_of_birth,
        marital_status: form.marital_status,
        physical_ability: form.physical_ability,
        national_id: form.national_id,
        phone: form.phone,
        email: form.email || null,
        team_id: form.team_id,
        shift: form.shift,
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
      const updated = await uploadEmployeePhoto(employee.id, file);
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
    if (!window.confirm(`هل أنت متأكد من حذف الموظف ${employee.name}؟`)) return;
    try {
      await deleteEmployee(employee.id);
      toast.success("تم الحذف");
      navigate("/employees", { replace: true });
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "فشل الحذف");
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">الصورة</h2>
        <div className="flex items-center gap-6">
          <div className="h-24 w-24 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
            {employee.photo_path ? (
              <img src={employee.photo_path} alt={employee.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl text-slate-400">؟</div>
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
              {employee.photo_path ? "تغيير الصورة" : "رفع صورة"}
            </Button>
            <p className="text-xs text-slate-500">JPG, PNG, WebP — الحد الأقصى 5 ميجابايت</p>
          </div>
        </div>
      </section>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-white p-6 md:grid-cols-2"
      >
        <TextField label="الاسم" value={form.name} onChange={(e) => update("name", e.target.value)} required />
        <TextField label="الرتبة" value={form.rank} onChange={(e) => update("rank", e.target.value)} required />
        <TextField
          label="التخصص"
          value={form.specialty}
          onChange={(e) => update("specialty", e.target.value)}
          required
        />
        <TextField
          label="الرقم الوطني"
          value={form.national_id}
          onChange={(e) => update("national_id", e.target.value)}
          required
        />
        <TextField
          label="تاريخ الميلاد"
          type="date"
          value={form.date_of_birth}
          onChange={(e) => update("date_of_birth", e.target.value)}
          required
        />
        <TextField label="الهاتف" value={form.phone} onChange={(e) => update("phone", e.target.value)} required />
        <TextField
          label="البريد الإلكتروني"
          type="email"
          value={form.email ?? ""}
          onChange={(e) => update("email", e.target.value || null)}
        />
        <SelectField
          label="الحالة الاجتماعية"
          value={form.marital_status}
          onChange={(e) => update("marital_status", e.target.value as typeof form.marital_status)}
          options={MARITAL_STATUSES.map((s) => ({ value: s, label: s }))}
        />
        <SelectField
          label="القدرة البدنية"
          value={form.physical_ability}
          onChange={(e) => update("physical_ability", e.target.value as typeof form.physical_ability)}
          options={PHYSICAL_ABILITIES.map((s) => ({ value: s, label: s }))}
        />
        <SelectField
          label="الفريق"
          value={String(form.team_id)}
          onChange={(e) => update("team_id", Number(e.target.value))}
          options={teams.map((t) => ({ value: t.id, label: t.name }))}
        />
        <SelectField
          label="الوردية"
          value={form.shift}
          onChange={(e) => update("shift", e.target.value as typeof form.shift)}
          options={SHIFTS.map((s) => ({ value: s, label: s }))}
        />

        <div className="flex justify-between gap-2 md:col-span-2">
          <Button variant="danger" type="button" onClick={handleDelete}>
            حذف الموظف
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

- [ ] **Step 2: Create `frontend/src/pages/employees/EmployeeDetailPage.tsx`**

```typescript
import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ApiRequestError } from "../../api/client";
import { getEmployee } from "../../api/employees";
import type { Employee } from "../../types/models";
import { CertificationsTab } from "./tabs/CertificationsTab";
import { EquipmentTab } from "./tabs/EquipmentTab";
import { MainInfoTab } from "./tabs/MainInfoTab";
import { RatingsTab } from "./tabs/RatingsTab";

type TabKey = "main" | "certs" | "equipment" | "ratings";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "main", label: "المعلومات الأساسية" },
  { key: "certs", label: "الشهادات" },
  { key: "equipment", label: "التجهيزات" },
  { key: "ratings", label: "التقييمات الشهرية" },
];

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const employeeId = id ? Number(id) : NaN;
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<TabKey>("main");

  useEffect(() => {
    if (Number.isNaN(employeeId)) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    getEmployee(employeeId)
      .then((emp) => {
        setEmployee(emp);
        setLoading(false);
      })
      .catch((err) => {
        if (err instanceof ApiRequestError && err.status === 404) {
          setNotFound(true);
        } else {
          toast.error(err instanceof ApiRequestError ? err.message : "فشل تحميل الموظف");
        }
        setLoading(false);
      });
  }, [employeeId]);

  if (loading) {
    return <p className="text-slate-500">جارِ التحميل...</p>;
  }
  if (notFound) {
    return <Navigate to="/employees" replace />;
  }
  if (!employee) return null;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <Link to="/employees" className="text-sm text-slate-600 hover:underline">
            ← الرجوع إلى القائمة
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{employee.name}</h1>
          <p className="text-sm text-slate-600">
            {employee.rank} · {employee.specialty}
          </p>
        </div>
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
        <MainInfoTab employee={employee} onUpdated={setEmployee} />
      ) : tab === "certs" ? (
        <CertificationsTab employeeId={employee.id} />
      ) : tab === "equipment" ? (
        <EquipmentTab employeeId={employee.id} />
      ) : (
        <RatingsTab employeeId={employee.id} />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Add route in `frontend/src/App.tsx`**

Add the import and route (replace the file):

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
import { VehiclesPage } from "./pages/VehiclesPage";

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
            <Route path="/vehicles" element={<VehiclesPage />} />
            <Route path="/building" element={<BuildingPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

Note: the tab components are referenced — they're created in Tasks 6-8 below. If you run `npm run build` between tasks, expect failures until all three tabs exist. For `npm run test` and `npm run dev`, imports are resolved lazily enough that you can proceed.

- [ ] **Step 4: Create the three tab stub files so the page compiles**

Create `frontend/src/pages/employees/tabs/CertificationsTab.tsx`:

```typescript
export function CertificationsTab({ employeeId: _employeeId }: { employeeId: number }) {
  return <p className="text-slate-500">قريباً...</p>;
}
```

Create `frontend/src/pages/employees/tabs/EquipmentTab.tsx`:

```typescript
export function EquipmentTab({ employeeId: _employeeId }: { employeeId: number }) {
  return <p className="text-slate-500">قريباً...</p>;
}
```

Create `frontend/src/pages/employees/tabs/RatingsTab.tsx`:

```typescript
export function RatingsTab({ employeeId: _employeeId }: { employeeId: number }) {
  return <p className="text-slate-500">قريباً...</p>;
}
```

- [ ] **Step 5: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add frontend/src/pages/employees/EmployeeDetailPage.tsx frontend/src/pages/employees/tabs/ frontend/src/App.tsx
git commit -m "feat(frontend): add employee detail page with tab shell and main info tab"
```

---

## Task 6: Certifications tab

**Files:**
- Modify: `frontend/src/pages/employees/tabs/CertificationsTab.tsx`

- [ ] **Step 1: Replace `frontend/src/pages/employees/tabs/CertificationsTab.tsx`**

```typescript
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { ApiRequestError } from "../../../api/client";
import {
  createCertification,
  deleteCertification,
  listCertifications,
  updateCertification,
} from "../../../api/employees";
import type { CertificationInput } from "../../../api/employees";
import { Button } from "../../../components/Button";
import { EmptyState } from "../../../components/EmptyState";
import { Modal } from "../../../components/Modal";
import { TextField } from "../../../components/TextField";
import type { Certification } from "../../../types/models";

const EMPTY: CertificationInput = {
  name: "",
  issuing_authority: "",
  issue_date: "",
  expiry_date: "",
};

export function CertificationsTab({ employeeId }: { employeeId: number }) {
  const [items, setItems] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Certification | null>(null);
  const [creating, setCreating] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      const res = await listCertifications(employeeId);
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
  }, [employeeId]);

  async function handleDelete(id: number) {
    if (!window.confirm("هل تريد حذف هذه الشهادة؟")) return;
    try {
      await deleteCertification(employeeId, id);
      toast.success("تم الحذف");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "فشل الحذف");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)}>إضافة شهادة</Button>
      </div>

      {loading ? (
        <p className="text-slate-500">جارِ التحميل...</p>
      ) : items.length === 0 ? (
        <EmptyState title="لا توجد شهادات" description="أضف شهادة جديدة للبدء" />
      ) : (
        <table className="w-full rounded-lg border border-slate-200 bg-white text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-start font-medium">الاسم</th>
              <th className="px-4 py-3 text-start font-medium">جهة الإصدار</th>
              <th className="px-4 py-3 text-start font-medium">تاريخ الإصدار</th>
              <th className="px-4 py-3 text-start font-medium">تاريخ الانتهاء</th>
              <th className="px-4 py-3 text-end font-medium">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-b border-slate-100 last:border-b-0">
                <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                <td className="px-4 py-3 text-slate-700">{c.issuing_authority}</td>
                <td className="px-4 py-3 text-slate-700">{c.issue_date}</td>
                <td className="px-4 py-3 text-slate-700">{c.expiry_date}</td>
                <td className="px-4 py-3 text-end">
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => setEditing(c)}>
                      تعديل
                    </Button>
                    <Button variant="danger" onClick={() => handleDelete(c.id)}>
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
        <CertificationFormModal
          title="إضافة شهادة"
          initial={EMPTY}
          onClose={() => setCreating(false)}
          onSubmit={async (payload) => {
            await createCertification(employeeId, payload);
            toast.success("تمت الإضافة");
            setCreating(false);
            reload();
          }}
        />
      ) : null}

      {editing ? (
        <CertificationFormModal
          title="تعديل الشهادة"
          initial={{
            name: editing.name,
            issuing_authority: editing.issuing_authority,
            issue_date: editing.issue_date,
            expiry_date: editing.expiry_date,
          }}
          onClose={() => setEditing(null)}
          onSubmit={async (payload) => {
            await updateCertification(employeeId, editing.id, payload);
            toast.success("تم التحديث");
            setEditing(null);
            reload();
          }}
        />
      ) : null}
    </div>
  );
}

function CertificationFormModal({
  title,
  initial,
  onClose,
  onSubmit,
}: {
  title: string;
  initial: CertificationInput;
  onClose: () => void;
  onSubmit: (payload: CertificationInput) => Promise<void>;
}) {
  const [form, setForm] = useState<CertificationInput>(initial);
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
          <Button form="cert-form" type="submit" loading={submitting}>
            حفظ
          </Button>
        </>
      }
    >
      <form id="cert-form" onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="اسم الشهادة"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
        />
        <TextField
          label="جهة الإصدار"
          value={form.issuing_authority}
          onChange={(e) => setForm((f) => ({ ...f, issuing_authority: e.target.value }))}
          required
        />
        <TextField
          label="تاريخ الإصدار"
          type="date"
          value={form.issue_date}
          onChange={(e) => setForm((f) => ({ ...f, issue_date: e.target.value }))}
          required
        />
        <TextField
          label="تاريخ الانتهاء"
          type="date"
          value={form.expiry_date}
          onChange={(e) => setForm((f) => ({ ...f, expiry_date: e.target.value }))}
          required
        />
      </form>
    </Modal>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add frontend/src/pages/employees/tabs/CertificationsTab.tsx
git commit -m "feat(frontend): implement certifications tab with modal CRUD"
```

---

## Task 7: Equipment tab

**Files:**
- Modify: `frontend/src/pages/employees/tabs/EquipmentTab.tsx`

- [ ] **Step 1: Replace `frontend/src/pages/employees/tabs/EquipmentTab.tsx`**

```typescript
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { ApiRequestError } from "../../../api/client";
import {
  createEmployeeEquipment,
  deleteEmployeeEquipment,
  listEmployeeEquipment,
  updateEmployeeEquipment,
} from "../../../api/employees";
import type { EquipmentInput } from "../../../api/employees";
import { Button } from "../../../components/Button";
import { EmptyState } from "../../../components/EmptyState";
import { Modal } from "../../../components/Modal";
import { SelectField } from "../../../components/SelectField";
import { TextField } from "../../../components/TextField";
import { EQUIPMENT_CONDITIONS } from "../../../constants/enums";
import type { Equipment } from "../../../types/models";

const EMPTY: EquipmentInput = {
  item_name: "",
  serial_number: null,
  assigned_date: "",
  condition: "جيد",
};

export function EquipmentTab({ employeeId }: { employeeId: number }) {
  const [items, setItems] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Equipment | null>(null);
  const [creating, setCreating] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      const res = await listEmployeeEquipment(employeeId);
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
  }, [employeeId]);

  async function handleDelete(id: number) {
    if (!window.confirm("هل تريد حذف هذا التجهيز؟")) return;
    try {
      await deleteEmployeeEquipment(employeeId, id);
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
        <EmptyState title="لا توجد تجهيزات" description="أضف تجهيزاً للبدء" />
      ) : (
        <table className="w-full rounded-lg border border-slate-200 bg-white text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-start font-medium">الاسم</th>
              <th className="px-4 py-3 text-start font-medium">الرقم التسلسلي</th>
              <th className="px-4 py-3 text-start font-medium">تاريخ التسليم</th>
              <th className="px-4 py-3 text-start font-medium">الحالة</th>
              <th className="px-4 py-3 text-end font-medium">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {items.map((eq) => (
              <tr key={eq.id} className="border-b border-slate-100 last:border-b-0">
                <td className="px-4 py-3 font-medium text-slate-900">{eq.item_name}</td>
                <td className="px-4 py-3 text-slate-700">{eq.serial_number ?? "—"}</td>
                <td className="px-4 py-3 text-slate-700">{eq.assigned_date}</td>
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
            await createEmployeeEquipment(employeeId, payload);
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
            serial_number: editing.serial_number,
            assigned_date: editing.assigned_date,
            condition: editing.condition,
          }}
          onClose={() => setEditing(null)}
          onSubmit={async (payload) => {
            await updateEmployeeEquipment(employeeId, editing.id, payload);
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
  initial: EquipmentInput;
  onClose: () => void;
  onSubmit: (payload: EquipmentInput) => Promise<void>;
}) {
  const [form, setForm] = useState<EquipmentInput>(initial);
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
          <Button form="eq-form" type="submit" loading={submitting}>
            حفظ
          </Button>
        </>
      }
    >
      <form id="eq-form" onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="اسم التجهيز"
          value={form.item_name}
          onChange={(e) => setForm((f) => ({ ...f, item_name: e.target.value }))}
          required
        />
        <TextField
          label="الرقم التسلسلي"
          value={form.serial_number ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, serial_number: e.target.value || null }))}
        />
        <TextField
          label="تاريخ التسليم"
          type="date"
          value={form.assigned_date}
          onChange={(e) => setForm((f) => ({ ...f, assigned_date: e.target.value }))}
          required
        />
        <SelectField
          label="الحالة"
          value={form.condition}
          onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value as typeof f.condition }))}
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
git add frontend/src/pages/employees/tabs/EquipmentTab.tsx
git commit -m "feat(frontend): implement equipment tab with modal CRUD"
```

---

## Task 8: Ratings tab

**Files:**
- Modify: `frontend/src/pages/employees/tabs/RatingsTab.tsx`

- [ ] **Step 1: Replace `frontend/src/pages/employees/tabs/RatingsTab.tsx`**

```typescript
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { ApiRequestError } from "../../../api/client";
import {
  createRating,
  deleteRating,
  listRatings,
  updateRating,
} from "../../../api/employees";
import type { RatingInput } from "../../../api/employees";
import { Button } from "../../../components/Button";
import { EmptyState } from "../../../components/EmptyState";
import { Modal } from "../../../components/Modal";
import { TextField } from "../../../components/TextField";
import { RATING_MAX, RATING_MIN } from "../../../constants/enums";
import type { MonthlyRating } from "../../../types/models";

const NOW = new Date();
const EMPTY: RatingInput = {
  year: NOW.getFullYear(),
  month: NOW.getMonth() + 1,
  rating: 4,
  notes: null,
};

export function RatingsTab({ employeeId }: { employeeId: number }) {
  const [items, setItems] = useState<MonthlyRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<MonthlyRating | null>(null);
  const [creating, setCreating] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      const res = await listRatings(employeeId);
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
  }, [employeeId]);

  async function handleDelete(id: number) {
    if (!window.confirm("هل تريد حذف هذا التقييم؟")) return;
    try {
      await deleteRating(employeeId, id);
      toast.success("تم الحذف");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "فشل الحذف");
    }
  }

  const average = items.length
    ? (items.reduce((sum, r) => sum + r.rating, 0) / items.length).toFixed(2)
    : "—";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          المتوسط: <span className="font-semibold text-slate-900">{average}</span>
        </p>
        <Button onClick={() => setCreating(true)}>إضافة تقييم</Button>
      </div>

      {loading ? (
        <p className="text-slate-500">جارِ التحميل...</p>
      ) : items.length === 0 ? (
        <EmptyState title="لا توجد تقييمات" description="أضف تقييماً شهرياً للبدء" />
      ) : (
        <table className="w-full rounded-lg border border-slate-200 bg-white text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-start font-medium">السنة</th>
              <th className="px-4 py-3 text-start font-medium">الشهر</th>
              <th className="px-4 py-3 text-start font-medium">التقييم</th>
              <th className="px-4 py-3 text-start font-medium">ملاحظات</th>
              <th className="px-4 py-3 text-end font-medium">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 last:border-b-0">
                <td className="px-4 py-3 text-slate-700">{r.year}</td>
                <td className="px-4 py-3 text-slate-700">{r.month}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{r.rating}</td>
                <td className="px-4 py-3 text-slate-600">{r.notes ?? "—"}</td>
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
        <RatingFormModal
          title="إضافة تقييم"
          initial={EMPTY}
          allowEditPeriod
          onClose={() => setCreating(false)}
          onSubmit={async (payload) => {
            await createRating(employeeId, payload);
            toast.success("تمت الإضافة");
            setCreating(false);
            reload();
          }}
        />
      ) : null}

      {editing ? (
        <RatingFormModal
          title="تعديل التقييم"
          initial={{
            year: editing.year,
            month: editing.month,
            rating: editing.rating,
            notes: editing.notes,
          }}
          allowEditPeriod={false}
          onClose={() => setEditing(null)}
          onSubmit={async (payload) => {
            await updateRating(employeeId, editing.id, {
              rating: payload.rating,
              notes: payload.notes,
            });
            toast.success("تم التحديث");
            setEditing(null);
            reload();
          }}
        />
      ) : null}
    </div>
  );
}

function RatingFormModal({
  title,
  initial,
  allowEditPeriod,
  onClose,
  onSubmit,
}: {
  title: string;
  initial: RatingInput;
  allowEditPeriod: boolean;
  onClose: () => void;
  onSubmit: (payload: RatingInput) => Promise<void>;
}) {
  const [form, setForm] = useState<RatingInput>(initial);
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
          <Button form="rating-form" type="submit" loading={submitting}>
            حفظ
          </Button>
        </>
      }
    >
      <form id="rating-form" onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="السنة"
          type="number"
          min={2000}
          max={2100}
          value={form.year}
          onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) }))}
          disabled={!allowEditPeriod}
          required
        />
        <TextField
          label="الشهر (1-12)"
          type="number"
          min={1}
          max={12}
          value={form.month}
          onChange={(e) => setForm((f) => ({ ...f, month: Number(e.target.value) }))}
          disabled={!allowEditPeriod}
          required
        />
        <TextField
          label={`التقييم (${RATING_MIN}-${RATING_MAX})`}
          type="number"
          step="0.1"
          min={RATING_MIN}
          max={RATING_MAX}
          value={form.rating}
          onChange={(e) => setForm((f) => ({ ...f, rating: Number(e.target.value) }))}
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
git add frontend/src/pages/employees/tabs/RatingsTab.tsx
git commit -m "feat(frontend): implement monthly ratings tab with average + modal CRUD"
```

---

## Task 9: Integration test (list page loads + renders employees)

**Files:**
- Create: `frontend/src/__tests__/EmployeesListPage.test.tsx`

- [ ] **Step 1: Write the test**

Create `frontend/src/__tests__/EmployeesListPage.test.tsx`:

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

describe("Employees list page", () => {
  let fetchMock: FetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    window.history.pushState({}, "", "/employees");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    window.history.pushState({}, "", "/");
  });

  it("loads teams + employees and renders a row per employee", async () => {
    // Auth status: complete + authed
    fetchMock.mockResolvedValueOnce(
      json({ data: { setup_complete: true, authenticated: true } }),
    );
    // Teams (called by list page)
    fetchMock.mockResolvedValueOnce(
      json({ data: { items: [{ id: 1, name: "الفريق أ", description: null }], total: 1, page: 1, page_size: 1 } }),
    );
    // Employees list
    fetchMock.mockResolvedValueOnce(
      json({
        data: {
          items: [
            {
              id: 10,
              name: "أحمد محمد",
              rank: "رائد",
              specialty: "إنقاذ",
              national_id: "1000000001",
              photo_path: null,
              team_id: 1,
              shift: "صباحية",
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
      expect(screen.getByRole("heading", { name: "الموظفون" })).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "أحمد محمد" })).toBeInTheDocument();
    });
    expect(screen.getByText("رائد")).toBeInTheDocument();
    expect(screen.getByText("إنقاذ")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test**

```bash
cd /Users/turkioqab/Projects/Markaz/frontend
npm run test
```

Expected: `3 passed` total (2 from LoginFlow + 1 new).

- [ ] **Step 3: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add frontend/src/__tests__/EmployeesListPage.test.tsx
git commit -m "test(frontend): integration test for employees list page"
```

---

## Task 10: Phase 6 verification

- [ ] **Step 1: All tests pass**

```bash
cd /Users/turkioqab/Projects/Markaz/frontend
npm run test
```

Expected: 3 passing.

- [ ] **Step 2: Lint clean**

```bash
cd /Users/turkioqab/Projects/Markaz/frontend
npm run lint
```

Expected: no errors.

- [ ] **Step 3: Type check — ensure the app builds**

```bash
cd /Users/turkioqab/Projects/Markaz/frontend
npx tsc -b --noEmit
```

Expected: no TypeScript errors.

- [ ] **Step 4: Manual smoke test in the browser**

Terminal A — backend with seed data + existing chief:

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
uvicorn app.main:app --port 8000
```

Terminal B — frontend:

```bash
cd /Users/turkioqab/Projects/Markaz/frontend
npm run dev
```

Open `http://localhost:5173`:

1. Log in (chief / StrongPass1!).
2. Click "الموظفون" in the sidebar → list shows 20 seeded employees.
3. Search "محمد" — results filter live. Clear the field.
4. Change "الفريق" dropdown → list filters. Reset.
5. Click an employee name → detail page loads. Header shows name + rank + specialty.
6. Click each tab:
   - **المعلومات الأساسية**: form shows current values. Photo placeholder. Try uploading a small PNG → photo appears, toast "تم رفع الصورة".
   - **الشهادات**: shows existing certs (seed data has some). Click "إضافة شهادة" → modal opens → fill → save → appears in list. Edit one, delete one.
   - **التجهيزات**: same flow.
   - **التقييمات الشهرية**: shows ratings + average. Add a new rating for this/next month, edit the rating/notes, delete one.
7. Back to list, click "إضافة موظف" → create a new employee. Fill all fields → save → redirects to detail page.
8. On detail page → "حذف الموظف" → confirm → returns to list, employee is gone.
9. Try deleting an employee who drives a vehicle (e.g. seeded employee #2 is driver of vehicle #1) → toast shows the Arabic "لا يمكن حذف الموظف لأنه سائق لمركبة..." message.

Stop both servers.

- [ ] **Step 5: Git status clean**

```bash
cd /Users/turkioqab/Projects/Markaz
git status
git log --oneline | head -15
```

Expected: clean, ~9 new commits.

---

## Phase 6 exit criteria

1. Frontend `npm run test` passes (≥ 3 tests)
2. `npm run lint` clean
3. `npx tsc -b --noEmit` clean
4. List page: loads, searches by name, filters by team/shift, paginates
5. Create page: full form with all enums, posts to backend, redirects to detail on success
6. Detail page: 4 tabs (main, certs, equipment, ratings), main tab edits in place, photo upload works, delete works (and is blocked with Arabic error for drivers)
7. Certifications/Equipment/Ratings tabs: list + add modal + edit modal + delete
8. All errors surface as Arabic toasts
9. Working tree clean

Phase 7 (Frontend: Vehicles UI) repeats this pattern for vehicles.
