# Phase 5 — Frontend Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Arabic RTL React shell with routing, an auth context + API client, the first-run setup page, the login page, a protected app layout with sidebar navigation, and empty placeholder pages for employees/vehicles/building. The chief can set up his account, log in, see a dashboard with Arabic RTL nav, and log out.

**Architecture:** React Router v6 for routing. A lightweight `AuthProvider` context holds `{ chief, loading }` state and exposes `login/logout/setup`. A small `api.ts` fetch wrapper sets `credentials: include` and parses the `{ data, error }` response envelope. A small backend addition (`GET /api/auth/status`) tells the frontend whether setup is complete and the chief is authenticated. Protected routes redirect to `/login`; `/login` redirects to `/setup` if the system hasn't been initialized yet.

**Tech Stack:** React 19, Vite 6, TypeScript 5.8, Tailwind 3 + tailwindcss-rtl, react-router-dom 6, sonner (toasts), Vitest + Testing Library (already installed), FastAPI (tiny backend addition for status).

---

## File Structure

```
backend/
└── app/
    └── auth/
        └── routes.py                     # add GET /api/auth/status

frontend/
├── src/
│   ├── api/
│   │   ├── client.ts                     # fetch wrapper with envelope handling
│   │   └── auth.ts                       # login/logout/setup/status functions
│   ├── auth/
│   │   ├── AuthProvider.tsx              # React context + reducer
│   │   └── useAuth.ts                    # hook for components
│   ├── components/
│   │   ├── AppLayout.tsx                 # shell: sidebar + header + main
│   │   ├── Sidebar.tsx                   # Arabic RTL nav
│   │   ├── Header.tsx                    # chief name + logout button
│   │   ├── ProtectedRoute.tsx            # redirects if not authed
│   │   ├── Button.tsx                    # shared button primitive
│   │   └── TextField.tsx                 # shared labeled input
│   ├── pages/
│   │   ├── SetupPage.tsx                 # first-run password creation
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx             # welcome + 3 cards linking to sections
│   │   ├── EmployeesPage.tsx             # placeholder
│   │   ├── VehiclesPage.tsx              # placeholder
│   │   └── BuildingPage.tsx              # placeholder
│   ├── App.tsx                           # router + AuthProvider
│   ├── main.tsx                          # mounts <App /> and <Toaster />
│   ├── index.css                         # Tailwind + Cairo font (exists)
│   └── __tests__/
│       ├── LoginPage.test.tsx
│       └── AppLayout.test.tsx
```

---

## Task 1: Backend — add `GET /api/auth/status` endpoint

**Files:**
- Modify: `backend/app/auth/routes.py`
- Modify: `backend/tests/test_auth_routes.py`

- [ ] **Step 1: Add the failing test**

Append to `backend/tests/test_auth_routes.py`:

```python
def test_status_reports_setup_incomplete_initially():
    client = _client()
    r = client.get("/api/auth/status")
    assert r.status_code == 200
    assert r.json() == {"data": {"setup_complete": False, "authenticated": False}}


def test_status_reports_setup_complete_after_setup():
    client = _client()
    client.post("/api/setup", json={"username": "chief", "password": "StrongPass1!"})
    r = client.get("/api/auth/status")
    assert r.json() == {"data": {"setup_complete": True, "authenticated": False}}


def test_status_reports_authenticated_after_login():
    client = _client()
    client.post("/api/setup", json={"username": "chief", "password": "StrongPass1!"})
    client.post("/api/auth/login", json={"username": "chief", "password": "StrongPass1!"})
    r = client.get("/api/auth/status")
    assert r.json() == {"data": {"setup_complete": True, "authenticated": True}}
```

- [ ] **Step 2: Run — expect fail**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_auth_routes.py -v
```

Expected: 3 failures with 404 on `/api/auth/status`.

- [ ] **Step 3: Add handler to `backend/app/auth/routes.py`**

Append to the file:

```python
@router.get("/api/auth/status")
def auth_status(
    db: Session = Depends(get_db),
    session_cookie: Annotated[str | None, Cookie(alias=SESSION_COOKIE_NAME)] = None,
) -> dict:
    chief_count = db.execute(select(func.count()).select_from(Chief)).scalar_one()
    setup_complete = chief_count > 0

    authenticated = False
    if setup_complete and session_cookie:
        from app.auth.session import get_session_chief

        authenticated = get_session_chief(db, session_cookie) is not None

    return {"data": {"setup_complete": setup_complete, "authenticated": authenticated}}
```

- [ ] **Step 4: Run — expect pass**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_auth_routes.py -v
```

Expected: `9 passed`.

- [ ] **Step 5: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add backend/app/auth/routes.py backend/tests/test_auth_routes.py
git commit -m "feat(backend): add GET /api/auth/status for frontend bootstrap"
```

---

## Task 2: Install frontend dependencies

**Files:**
- Modify: `frontend/package.json` (via `npm install`)

- [ ] **Step 1: Install react-router-dom and sonner**

```bash
cd /Users/turkioqab/Projects/Markaz/frontend
npm install react-router-dom@6 sonner
```

Expected: `added N packages`, no errors.

- [ ] **Step 2: Verify installs**

```bash
cd /Users/turkioqab/Projects/Markaz/frontend
node -e "console.log(require('react-router-dom/package.json').version); console.log(require('sonner/package.json').version);"
```

Expected: prints a 6.x version for react-router-dom and some 1.x or 2.x for sonner.

- [ ] **Step 3: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add frontend/package.json frontend/package-lock.json
git commit -m "chore(frontend): add react-router-dom and sonner"
```

---

## Task 3: API client + auth functions

**Files:**
- Create: `frontend/src/api/client.ts`
- Create: `frontend/src/api/auth.ts`

- [ ] **Step 1: Create `frontend/src/api/client.ts`**

```typescript
// Fetch wrapper that:
// - sends cookies (credentials: "include")
// - parses the { data, error } envelope
// - throws with Arabic error messages on non-2xx responses

export interface ApiError {
  code?: string;
  message: string;
  status: number;
}

export class ApiRequestError extends Error implements ApiError {
  code?: string;
  status: number;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {};
  let init: RequestInit = { method, credentials: "include", headers };

  if (body instanceof FormData) {
    init.body = body;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  const response = await fetch(path, init);

  if (response.status === 204) {
    return undefined as T;
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new ApiRequestError("استجابة غير صالحة من الخادم", response.status);
  }

  if (!response.ok) {
    const err = (json as { detail?: string; error?: { code?: string; message?: string } }) ?? {};
    const message =
      err.error?.message ?? err.detail ?? "حدث خطأ غير متوقع";
    throw new ApiRequestError(message, response.status, err.error?.code);
  }

  return ((json as { data: T }).data ?? (json as T));
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  del: <T>(path: string) => request<T>("DELETE", path),
};
```

- [ ] **Step 2: Create `frontend/src/api/auth.ts`**

```typescript
import { api } from "./client";

export interface AuthStatus {
  setup_complete: boolean;
  authenticated: boolean;
}

export function fetchAuthStatus() {
  return api.get<AuthStatus>("/api/auth/status");
}

export function setupChief(username: string, password: string) {
  return api.post<{ ok: boolean }>("/api/setup", { username, password });
}

export function login(username: string, password: string) {
  return api.post<{ ok: boolean }>("/api/auth/login", { username, password });
}

export function logout() {
  return api.post<{ ok: boolean }>("/api/auth/logout");
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add frontend/src/api/
git commit -m "feat(frontend): add API client and auth functions"
```

---

## Task 4: Auth context and hook

**Files:**
- Create: `frontend/src/auth/AuthProvider.tsx`
- Create: `frontend/src/auth/useAuth.ts`

- [ ] **Step 1: Create `frontend/src/auth/AuthProvider.tsx`**

```typescript
import { createContext, useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { fetchAuthStatus, login as apiLogin, logout as apiLogout, setupChief } from "../api/auth";

export interface AuthState {
  loading: boolean;
  setupComplete: boolean;
  authenticated: boolean;
}

interface AuthContextValue extends AuthState {
  refresh: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setup: (username: string, password: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    loading: true,
    setupComplete: false,
    authenticated: false,
  });

  const refresh = useCallback(async () => {
    try {
      const status = await fetchAuthStatus();
      setState({
        loading: false,
        setupComplete: status.setup_complete,
        authenticated: status.authenticated,
      });
    } catch {
      setState({ loading: false, setupComplete: false, authenticated: false });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value: AuthContextValue = {
    ...state,
    refresh,
    login: async (username, password) => {
      await apiLogin(username, password);
      await refresh();
    },
    logout: async () => {
      await apiLogout();
      await refresh();
    },
    setup: async (username, password) => {
      await setupChief(username, password);
      await refresh();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

- [ ] **Step 2: Create `frontend/src/auth/useAuth.ts`**

```typescript
import { useContext } from "react";
import { AuthContext } from "./AuthProvider";

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add frontend/src/auth/
git commit -m "feat(frontend): add AuthProvider context and useAuth hook"
```

---

## Task 5: Shared UI primitives (Button, TextField)

**Files:**
- Create: `frontend/src/components/Button.tsx`
- Create: `frontend/src/components/TextField.tsx`

- [ ] **Step 1: Create `frontend/src/components/Button.tsx`**

```typescript
import type { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
}

const variants = {
  primary: "bg-slate-900 text-white hover:bg-slate-700 disabled:bg-slate-400",
  secondary:
    "bg-white text-slate-900 border border-slate-300 hover:bg-slate-50 disabled:text-slate-400",
  danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300",
};

export function Button({
  variant = "primary",
  loading = false,
  disabled,
  className = "",
  children,
  ...rest
}: Props) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...rest}
    >
      {loading ? "..." : children}
    </button>
  );
}
```

- [ ] **Step 2: Create `frontend/src/components/TextField.tsx`**

```typescript
import type { InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function TextField({ label, error, id, className = "", ...rest }: Props) {
  const inputId = id ?? label;
  return (
    <label htmlFor={inputId} className="flex flex-col gap-1">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        id={inputId}
        className={`rounded-md border px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-slate-500 ${
          error ? "border-red-400" : "border-slate-300"
        } ${className}`}
        {...rest}
      />
      {error ? <span className="text-sm text-red-600">{error}</span> : null}
    </label>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add frontend/src/components/
git commit -m "feat(frontend): add Button and TextField primitives"
```

---

## Task 6: Setup page (first-run)

**Files:**
- Create: `frontend/src/pages/SetupPage.tsx`

- [ ] **Step 1: Create `frontend/src/pages/SetupPage.tsx`**

```typescript
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ApiRequestError } from "../api/client";
import { useAuth } from "../auth/useAuth";
import { Button } from "../components/Button";
import { TextField } from "../components/TextField";

export function SetupPage() {
  const { loading, setupComplete, setup } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return <FullPageLoader />;
  }
  if (setupComplete) {
    return <Navigate to="/login" replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("كلمتا المرور غير متطابقتين");
      return;
    }
    if (password.length < 10) {
      toast.error("يجب أن تكون كلمة المرور 10 أحرف على الأقل");
      return;
    }
    setSubmitting(true);
    try {
      await setup(username, password);
      toast.success("تم إنشاء الحساب");
      navigate("/", { replace: true });
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : "فشل الإعداد";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg bg-white p-8 shadow-sm border border-slate-200 space-y-5"
      >
        <header>
          <h1 className="text-2xl font-bold text-slate-900">مرحباً بك في مركز</h1>
          <p className="mt-2 text-sm text-slate-600">
            قم بإنشاء حساب القائد لأول مرة
          </p>
        </header>

        <TextField
          label="اسم المستخدم"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoComplete="username"
        />
        <TextField
          label="كلمة المرور"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
        <TextField
          label="تأكيد كلمة المرور"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          autoComplete="new-password"
        />

        <Button type="submit" loading={submitting} className="w-full">
          إنشاء الحساب
        </Button>
      </form>
    </main>
  );
}

function FullPageLoader() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-slate-500">جارِ التحميل...</p>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add frontend/src/pages/SetupPage.tsx
git commit -m "feat(frontend): add first-run setup page"
```

---

## Task 7: Login page

**Files:**
- Create: `frontend/src/pages/LoginPage.tsx`

- [ ] **Step 1: Create `frontend/src/pages/LoginPage.tsx`**

```typescript
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ApiRequestError } from "../api/client";
import { useAuth } from "../auth/useAuth";
import { Button } from "../components/Button";
import { TextField } from "../components/TextField";

export function LoginPage() {
  const { loading, setupComplete, authenticated, login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">جارِ التحميل...</p>
      </main>
    );
  }
  if (!setupComplete) {
    return <Navigate to="/setup" replace />;
  }
  if (authenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(username, password);
      navigate("/", { replace: true });
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : "فشل تسجيل الدخول";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg bg-white p-8 shadow-sm border border-slate-200 space-y-5"
      >
        <header>
          <h1 className="text-2xl font-bold text-slate-900">تسجيل الدخول</h1>
          <p className="mt-2 text-sm text-slate-600">مرحباً مجدداً في مركز</p>
        </header>

        <TextField
          label="اسم المستخدم"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoComplete="username"
        />
        <TextField
          label="كلمة المرور"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        <Button type="submit" loading={submitting} className="w-full">
          تسجيل الدخول
        </Button>
      </form>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add frontend/src/pages/LoginPage.tsx
git commit -m "feat(frontend): add login page"
```

---

## Task 8: ProtectedRoute + shell (Sidebar, Header, AppLayout)

**Files:**
- Create: `frontend/src/components/ProtectedRoute.tsx`
- Create: `frontend/src/components/Sidebar.tsx`
- Create: `frontend/src/components/Header.tsx`
- Create: `frontend/src/components/AppLayout.tsx`

- [ ] **Step 1: Create `frontend/src/components/ProtectedRoute.tsx`**

```typescript
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { loading, setupComplete, authenticated } = useAuth();

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">جارِ التحميل...</p>
      </main>
    );
  }
  if (!setupComplete) {
    return <Navigate to="/setup" replace />;
  }
  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
```

- [ ] **Step 2: Create `frontend/src/components/Sidebar.tsx`**

```typescript
import { NavLink } from "react-router-dom";

const LINKS: Array<{ to: string; label: string }> = [
  { to: "/", label: "الرئيسية" },
  { to: "/employees", label: "الموظفون" },
  { to: "/vehicles", label: "المركبات" },
  { to: "/building", label: "المبنى" },
];

export function Sidebar() {
  return (
    <nav className="h-full w-60 shrink-0 border-l border-slate-200 bg-white p-4">
      <div className="mb-8 px-2">
        <span className="text-xl font-bold text-slate-900">مركز</span>
      </div>
      <ul className="space-y-1">
        {LINKS.map((link) => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

- [ ] **Step 3: Create `frontend/src/components/Header.tsx`**

```typescript
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
      <h2 className="text-sm text-slate-600">لوحة تحكم القائد</h2>
      <Button variant="secondary" onClick={handleLogout}>
        تسجيل الخروج
      </Button>
    </header>
  );
}
```

- [ ] **Step 4: Create `frontend/src/components/AppLayout.tsx`**

```typescript
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export function AppLayout() {
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add frontend/src/components/
git commit -m "feat(frontend): add ProtectedRoute, Sidebar, Header, AppLayout"
```

---

## Task 9: Dashboard + placeholder section pages

**Files:**
- Create: `frontend/src/pages/DashboardPage.tsx`
- Create: `frontend/src/pages/EmployeesPage.tsx`
- Create: `frontend/src/pages/VehiclesPage.tsx`
- Create: `frontend/src/pages/BuildingPage.tsx`

- [ ] **Step 1: Create `frontend/src/pages/DashboardPage.tsx`**

```typescript
import { Link } from "react-router-dom";

const CARDS = [
  {
    to: "/employees",
    title: "الموظفون",
    description: "إدارة الموظفين والشهادات والتجهيزات والتقييمات",
  },
  {
    to: "/vehicles",
    title: "المركبات",
    description: "إدارة المركبات والصيانة والمعدات والفحوصات",
  },
  {
    to: "/building",
    title: "المبنى",
    description: "إدارة الغرف والمخزون والصيانة والتقارير",
  },
];

export function DashboardPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">أهلاً وسهلاً</h1>
        <p className="mt-2 text-slate-600">اختر أحد الأقسام للبدء</p>
      </header>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {CARDS.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-400 hover:shadow-md"
          >
            <h2 className="text-lg font-semibold text-slate-900">{card.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `frontend/src/pages/EmployeesPage.tsx`**

```typescript
export function EmployeesPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold text-slate-900">الموظفون</h1>
      <p className="mt-2 text-slate-600">قريباً…</p>
    </section>
  );
}
```

- [ ] **Step 3: Create `frontend/src/pages/VehiclesPage.tsx`**

```typescript
export function VehiclesPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold text-slate-900">المركبات</h1>
      <p className="mt-2 text-slate-600">قريباً…</p>
    </section>
  );
}
```

- [ ] **Step 4: Create `frontend/src/pages/BuildingPage.tsx`**

```typescript
export function BuildingPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold text-slate-900">المبنى</h1>
      <p className="mt-2 text-slate-600">قريباً…</p>
    </section>
  );
}
```

- [ ] **Step 5: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add frontend/src/pages/
git commit -m "feat(frontend): add dashboard and placeholder section pages"
```

---

## Task 10: Router + App + main.tsx

**Files:**
- Create: `frontend/src/App.tsx` (replace existing)
- Modify: `frontend/src/main.tsx`
- Delete: `frontend/src/__tests__/App.test.tsx` (no longer applies; Phase 0 test)

- [ ] **Step 1: Replace `frontend/src/App.tsx`**

```typescript
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { AppLayout } from "./components/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { BuildingPage } from "./pages/BuildingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { EmployeesPage } from "./pages/EmployeesPage";
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
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/vehicles" element={<VehiclesPage />} />
            <Route path="/building" element={<BuildingPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

- [ ] **Step 2: Replace `frontend/src/main.tsx`**

```typescript
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import App from "./App";
import "./index.css";

document.documentElement.setAttribute("lang", "ar");
document.documentElement.setAttribute("dir", "rtl");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <Toaster position="top-center" richColors />
  </StrictMode>,
);
```

- [ ] **Step 3: Delete the Phase 0 App test**

```bash
rm /Users/turkioqab/Projects/Markaz/frontend/src/__tests__/App.test.tsx
```

(That test asserted the old "مرحباً بك في مركز" string which only appeared in the Phase 0 App.tsx. The new App routes to pages.)

- [ ] **Step 4: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add frontend/src/App.tsx frontend/src/main.tsx frontend/src/__tests__/
git commit -m "feat(frontend): wire router with auth-aware routing to pages"
```

---

## Task 11: Integration test — login → dashboard

**Files:**
- Create: `frontend/src/__tests__/LoginFlow.test.tsx`

- [ ] **Step 1: Write the integration test**

Create `frontend/src/__tests__/LoginFlow.test.tsx`:

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";

type FetchMock = ReturnType<typeof vi.fn>;

function json(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

describe("Login flow", () => {
  let fetchMock: FetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the login form when setup is complete and user is not authed, then navigates to dashboard on success", async () => {
    // First status call: setup complete, not authed
    fetchMock.mockResolvedValueOnce(
      json({ data: { setup_complete: true, authenticated: false } }),
    );
    // Login call succeeds
    fetchMock.mockResolvedValueOnce(json({ data: { ok: true } }));
    // Refresh status after login: now authed
    fetchMock.mockResolvedValueOnce(
      json({ data: { setup_complete: true, authenticated: true } }),
    );

    render(<App />);

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "تسجيل الدخول" })).toBeInTheDocument(),
    );

    await userEvent.type(screen.getByLabelText("اسم المستخدم"), "chief");
    await userEvent.type(screen.getByLabelText("كلمة المرور"), "StrongPass1!");
    await userEvent.click(screen.getByRole("button", { name: "تسجيل الدخول" }));

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "أهلاً وسهلاً" })).toBeInTheDocument(),
    );
  });

  it("redirects to setup when system is not initialized", async () => {
    fetchMock.mockResolvedValueOnce(
      json({ data: { setup_complete: false, authenticated: false } }),
    );
    render(<App />);

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "مرحباً بك في مركز" })).toBeInTheDocument(),
    );
  });
});
```

- [ ] **Step 2: Run the test — expect pass**

```bash
cd /Users/turkioqab/Projects/Markaz/frontend
npm run test
```

Expected: `2 passed`. (The old Phase 0 `App.test.tsx` was removed in Task 10.)

- [ ] **Step 3: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add frontend/src/__tests__/LoginFlow.test.tsx
git commit -m "test(frontend): integration test for login flow"
```

---

## Task 12: Phase 5 verification

- [ ] **Step 1: All frontend tests pass**

```bash
cd /Users/turkioqab/Projects/Markaz/frontend
npm run test
```

Expected: all tests pass.

- [ ] **Step 2: All backend tests still pass (after Task 1 addition)**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest -q
```

Expected: 102 passed (99 before + 3 new status tests).

- [ ] **Step 3: Frontend lint clean**

```bash
cd /Users/turkioqab/Projects/Markaz/frontend
npm run lint
```

Expected: no errors.

- [ ] **Step 4: End-to-end smoke test in the browser**

Terminal A — start backend with a fresh DB:

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
rm -f markaz.db
alembic upgrade head
python -m scripts.seed
uvicorn app.main:app --port 8000
```

Terminal B — start frontend:

```bash
cd /Users/turkioqab/Projects/Markaz/frontend
npm run dev
```

Open `http://localhost:5173` in a browser:

1. First load should redirect to `/setup` (chief not yet created).
   → Wait, seed data doesn't create a chief. So you land on `/setup`.
2. Fill in username `chief`, password `StrongPass1!`, confirm → click "إنشاء الحساب".
3. Toast: "تم إنشاء الحساب". Redirects to `/`.
4. Dashboard shows "أهلاً وسهلاً" + 3 cards (الموظفون، المركبات، المبنى).
5. Sidebar on the right (RTL) with 4 nav links. Header on top with logout.
6. Click "تسجيل الخروج" → toast "تم تسجيل الخروج" → redirect to `/login`.
7. Log in again with the credentials → dashboard appears.
8. Click each sidebar link → placeholder pages show "قريباً…".

Stop both servers.

- [ ] **Step 5: Git status clean**

```bash
cd /Users/turkioqab/Projects/Markaz
git status
git log --oneline | head -15
```

Expected: clean, ~11 new commits.

---

## Phase 5 exit criteria

1. `npm run test` passes in frontend (≥ 2 integration tests)
2. Backend `pytest -q` still passes (≥ 102 tests)
3. Manual browser walkthrough above completes with no errors: setup → dashboard → logout → login → dashboard → nav
4. RTL layout is correct (sidebar on the right, text right-aligned)
5. Arabic Cairo font renders cleanly
6. `npm run lint` clean
7. Working tree clean

Phase 6 (Frontend: Employees UI) builds full CRUD screens for employees on top of this shell.
