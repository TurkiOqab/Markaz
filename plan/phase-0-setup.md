# Phase 0 — Project Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Markaz project so both the backend and frontend run a "hello world" health-check, with linting, formatting, testing, and Arabic/RTL basics in place.

**Architecture:** Two sibling folders — `backend/` (Python 3.11+ / FastAPI / pytest) and `frontend/` (Node 20+ / Vite / React + TypeScript / Tailwind with RTL plugin). No database, no auth, no real features in Phase 0 — just the skeleton that later phases build on.

**Tech Stack:** Python 3.11+, FastAPI, uvicorn, pytest, ruff, black, httpx · Node 20+, Vite, React 18, TypeScript, Tailwind CSS, `tailwindcss-rtl`, Vitest, ESLint, Prettier · Git.

---

## File Structure

Files that will be created in Phase 0:

```
Markaz/
├── .gitignore                     # project-wide ignores
├── README.md                      # root overview pointing to plan/
├── backend/
│   ├── pyproject.toml             # deps + tool config (ruff, black, pytest)
│   ├── .gitignore                 # Python-specific ignores
│   ├── app/
│   │   ├── __init__.py
│   │   └── main.py                # FastAPI app, /api/health endpoint
│   └── tests/
│       ├── __init__.py
│       └── test_health.py         # pytest for /api/health
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── tsconfig.node.json
    ├── vite.config.ts
    ├── tailwind.config.js         # with RTL plugin
    ├── postcss.config.js
    ├── .eslintrc.cjs
    ├── .prettierrc
    ├── .gitignore                 # Node-specific ignores
    ├── index.html                 # dir="rtl", lang="ar"
    ├── public/
    │   └── fonts/
    │       └── Cairo-Variable.ttf # Arabic font
    └── src/
        ├── main.tsx
        ├── App.tsx                # Arabic "مرحبا" + /api/health call
        ├── index.css              # Tailwind directives + font-face
        └── __tests__/
            └── App.test.tsx       # Vitest component test
```

---

## Task 1: Initialize the root repository and scaffolding files

**Files:**
- Create: `/Users/turkioqab/Projects/Markaz/.gitignore`
- Create: `/Users/turkioqab/Projects/Markaz/README.md`

- [ ] **Step 1: Initialize git**

```bash
cd /Users/turkioqab/Projects/Markaz
git init
```

Expected: `Initialized empty Git repository in /Users/turkioqab/Projects/Markaz/.git/`

- [ ] **Step 2: Create the root `.gitignore`**

Create `/Users/turkioqab/Projects/Markaz/.gitignore` with:

```gitignore
# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/

# Env files
.env
.env.local

# Backend (Python)
backend/.venv/
backend/__pycache__/
backend/**/__pycache__/
backend/*.egg-info/
backend/.pytest_cache/
backend/.ruff_cache/

# Frontend (Node)
frontend/node_modules/
frontend/dist/
frontend/coverage/
frontend/.vite/

# Uploads and data (never committed)
uploads/
*.db
*.db-journal
*.sqlite
*.sqlite3

# Logs
logs/
*.log
```

- [ ] **Step 3: Create the root `README.md`**

Create `/Users/turkioqab/Projects/Markaz/README.md` with:

```markdown
# Markaz

Self-hosted fire-station dashboard. Single-user, Arabic UI (RTL), no cloud.

See [`plan/`](plan/) for the full design spec and phase-by-phase implementation plans.

## Layout

- `backend/` — FastAPI + SQLite (SQLCipher)
- `frontend/` — React + Vite + Tailwind (RTL)
- `plan/` — design spec, seed data, phase plans
```

- [ ] **Step 4: First commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add .gitignore README.md CLAUDE.md plan/
git commit -m "chore: initialize project with design spec and seed data"
```

Expected: commit succeeds with ~8 files tracked (the plan/ contents + .gitignore + README.md + CLAUDE.md).

---

## Task 2: Backend scaffolding — pyproject.toml and virtual environment

**Files:**
- Create: `backend/pyproject.toml`
- Create: `backend/.gitignore`
- Create: `backend/app/__init__.py` (empty)
- Create: `backend/tests/__init__.py` (empty)

- [ ] **Step 1: Create backend directory structure**

```bash
cd /Users/turkioqab/Projects/Markaz
mkdir -p backend/app backend/tests
touch backend/app/__init__.py backend/tests/__init__.py
```

- [ ] **Step 2: Create `backend/pyproject.toml`**

```toml
[project]
name = "markaz-backend"
version = "0.1.0"
description = "Markaz fire-station dashboard backend"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.110",
    "uvicorn[standard]>=0.27",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "httpx>=0.27",
    "ruff>=0.3",
    "black>=24.0",
]

[build-system]
requires = ["setuptools>=68"]
build-backend = "setuptools.build_meta"

[tool.setuptools.packages.find]
include = ["app*"]

[tool.ruff]
line-length = 100
target-version = "py311"

[tool.ruff.lint]
select = ["E", "F", "I", "W", "UP", "B"]

[tool.black]
line-length = 100
target-version = ["py311"]

[tool.pytest.ini_options]
testpaths = ["tests"]
pythonpath = ["."]
```

- [ ] **Step 3: Create `backend/.gitignore`**

```gitignore
.venv/
__pycache__/
**/__pycache__/
*.egg-info/
.pytest_cache/
.ruff_cache/
.coverage
htmlcov/
```

- [ ] **Step 4: Create and activate virtual environment, install dependencies**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -e ".[dev]"
```

Expected: `pip install` output ends with `Successfully installed fastapi-... uvicorn-... pytest-... httpx-... ruff-... black-...`

- [ ] **Step 5: Verify the venv works**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
python -c "import fastapi; print(fastapi.__version__)"
pytest --version
ruff --version
black --version
```

Expected: version numbers printed for all four tools.

- [ ] **Step 6: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add backend/pyproject.toml backend/.gitignore backend/app/__init__.py backend/tests/__init__.py
git commit -m "chore(backend): scaffold pyproject.toml and empty app/tests packages"
```

---

## Task 3: Backend health endpoint (TDD)

**Files:**
- Create: `backend/tests/test_health.py`
- Create: `backend/app/main.py`

- [ ] **Step 1: Write the failing test**

Create `backend/tests/test_health.py`:

```python
from fastapi.testclient import TestClient

from app.main import app


def test_health_endpoint_returns_ok():
    client = TestClient(app)
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"data": {"status": "ok"}}
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_health.py -v
```

Expected: `ERROR` or `FAIL` — `ModuleNotFoundError: No module named 'app.main'` (because `main.py` doesn't exist yet).

- [ ] **Step 3: Write the minimal implementation**

Create `backend/app/main.py`:

```python
from fastapi import FastAPI

app = FastAPI(title="Markaz", version="0.1.0")


@app.get("/api/health")
def health() -> dict:
    return {"data": {"status": "ok"}}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest tests/test_health.py -v
```

Expected: `1 passed`.

- [ ] **Step 5: Run the dev server manually to sanity-check**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

In a second terminal:

```bash
curl http://127.0.0.1:8000/api/health
```

Expected output: `{"data":{"status":"ok"}}`

Stop the server with Ctrl+C.

- [ ] **Step 6: Run linting + formatting**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
ruff check .
black --check .
```

Expected: both commands exit cleanly (no issues, or `black --check .` says `All done!`).

- [ ] **Step 7: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add backend/app/main.py backend/tests/test_health.py
git commit -m "feat(backend): add /api/health endpoint with test"
```

---

## Task 4: Frontend scaffolding — Vite + React + TypeScript

**Files:**
- Create: everything under `frontend/` via `npm create vite@latest`, then modify.

- [ ] **Step 1: Scaffold with Vite**

```bash
cd /Users/turkioqab/Projects/Markaz
npm create vite@latest frontend -- --template react-ts
```

Expected: `frontend/` directory created with React + TypeScript template files.

- [ ] **Step 2: Install dependencies**

```bash
cd /Users/turkioqab/Projects/Markaz/frontend
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 3: Verify the default dev server boots**

```bash
cd /Users/turkioqab/Projects/Markaz/frontend
npm run dev
```

Expected: server starts on `http://localhost:5173/` with the default Vite+React page. Stop with Ctrl+C.

- [ ] **Step 4: Append Node-specific entries to `frontend/.gitignore`**

Open `frontend/.gitignore` (Vite already created one) and ensure it contains at minimum:

```gitignore
node_modules/
dist/
dist-ssr/
coverage/
.vite/
*.local
.DS_Store
```

- [ ] **Step 5: Commit the Vite scaffold**

```bash
cd /Users/turkioqab/Projects/Markaz
git add frontend/
git commit -m "chore(frontend): scaffold Vite React + TypeScript project"
```

---

## Task 5: Frontend Tailwind + RTL setup

**Files:**
- Modify: `frontend/package.json` (via `npm install`)
- Create: `frontend/tailwind.config.js`
- Create: `frontend/postcss.config.js`
- Modify: `frontend/src/index.css`
- Modify: `frontend/index.html`

- [ ] **Step 1: Install Tailwind, PostCSS, and the RTL plugin**

```bash
cd /Users/turkioqab/Projects/Markaz/frontend
npm install -D tailwindcss postcss autoprefixer tailwindcss-rtl
npx tailwindcss init -p
```

Expected: `tailwind.config.js` and `postcss.config.js` created.

- [ ] **Step 2: Configure `frontend/tailwind.config.js`**

Replace the contents with:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Cairo', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require('tailwindcss-rtl')],
};
```

- [ ] **Step 3: Replace `frontend/src/index.css` with Tailwind directives**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@font-face {
  font-family: 'Cairo';
  src: url('/fonts/Cairo-Variable.ttf') format('truetype-variations');
  font-weight: 200 1000;
  font-display: swap;
}

html,
body {
  font-family: 'Cairo', system-ui, sans-serif;
}
```

- [ ] **Step 4: Set RTL + Arabic language on the HTML root**

Replace `frontend/index.html` with:

```html
<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>مركز</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add frontend/package.json frontend/package-lock.json frontend/tailwind.config.js frontend/postcss.config.js frontend/src/index.css frontend/index.html
git commit -m "feat(frontend): add Tailwind CSS with RTL plugin and Cairo font setup"
```

---

## Task 6: Add the Arabic font file

**Files:**
- Create: `frontend/public/fonts/Cairo-Variable.ttf`

- [ ] **Step 1: Create the fonts directory**

```bash
mkdir -p /Users/turkioqab/Projects/Markaz/frontend/public/fonts
```

- [ ] **Step 2: Download the Cairo variable font from Google Fonts**

```bash
cd /Users/turkioqab/Projects/Markaz/frontend/public/fonts
curl -L -o Cairo-Variable.ttf "https://github.com/google/fonts/raw/main/ofl/cairo/Cairo%5Bslnt%2Cwght%5D.ttf"
```

Expected: file `Cairo-Variable.ttf` exists and is at least 100 KB.

Verify:

```bash
ls -lh /Users/turkioqab/Projects/Markaz/frontend/public/fonts/Cairo-Variable.ttf
```

Expected: file listed with a size ≥ 100 KB.

- [ ] **Step 3: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add frontend/public/fonts/Cairo-Variable.ttf
git commit -m "chore(frontend): add Cairo variable Arabic font"
```

---

## Task 7: Frontend hello-world RTL component with test (TDD)

**Files:**
- Modify: `frontend/package.json` (via `npm install` for Vitest + Testing Library)
- Create: `frontend/vitest.config.ts`
- Create: `frontend/src/__tests__/App.test.tsx`
- Modify: `frontend/src/App.tsx`
- Create: `frontend/src/test-setup.ts`

- [ ] **Step 1: Install Vitest and Testing Library**

```bash
cd /Users/turkioqab/Projects/Markaz/frontend
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 2: Create `frontend/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
});
```

- [ ] **Step 3: Create `frontend/src/test-setup.ts`**

```typescript
import '@testing-library/jest-dom/vitest';

document.documentElement.setAttribute('lang', 'ar');
document.documentElement.setAttribute('dir', 'rtl');
```

- [ ] **Step 4: Add the test script to `frontend/package.json`**

In `frontend/package.json`, update the `"scripts"` section to include a `test` entry:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest run"
  }
}
```

(Keep whatever other scripts Vite generated; add `"test"` if missing.)

- [ ] **Step 5: Write the failing test**

Create `frontend/src/__tests__/App.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';

describe('App', () => {
  it('renders the Arabic greeting', () => {
    render(<App />);
    expect(screen.getByText('مرحباً بك في مركز')).toBeInTheDocument();
  });

  it('renders inside an RTL document', () => {
    render(<App />);
    // The html element is outside the render scope, but we can inspect it directly
    expect(document.documentElement.getAttribute('dir')).toBe('rtl');
    expect(document.documentElement.getAttribute('lang')).toBe('ar');
  });
});
```

- [ ] **Step 6: Run the test to verify it fails**

```bash
cd /Users/turkioqab/Projects/Markaz/frontend
npm run test
```

Expected: test fails because the default Vite-generated `App.tsx` doesn't contain `"مرحباً بك في مركز"`.

- [ ] **Step 7: Replace `frontend/src/App.tsx` with the RTL hello-world component**

```typescript
import { useEffect, useState } from 'react';

export default function App() {
  const [healthStatus, setHealthStatus] = useState<string>('...');

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((json) => setHealthStatus(json?.data?.status ?? 'unknown'))
      .catch(() => setHealthStatus('offline'));
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 text-slate-900">
      <h1 className="text-4xl font-bold">مرحباً بك في مركز</h1>
      <p className="text-lg text-slate-600">
        حالة الخادم: <span className="font-semibold">{healthStatus}</span>
      </p>
    </main>
  );
}
```

The `dir="rtl"` / `lang="ar"` attributes are already set on the HTML element in `index.html` (Task 5) and in `src/test-setup.ts` (Step 3 above), so no change to `main.tsx` is needed — leave it as Vite scaffolded it.

- [ ] **Step 8: Run the test to verify it passes**

```bash
cd /Users/turkioqab/Projects/Markaz/frontend
npm run test
```

Expected: both tests pass.

- [ ] **Step 9: Configure Vite dev server proxy so the frontend can reach the backend**

Modify `frontend/vite.config.ts` to add a proxy:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8000',
    },
  },
});
```

- [ ] **Step 10: End-to-end sanity check**

Terminal A:

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Terminal B:

```bash
cd /Users/turkioqab/Projects/Markaz/frontend
npm run dev
```

Open `http://localhost:5173` in a browser.

Expected:
- The heading `مرحباً بك في مركز` appears, right-to-left
- Underneath it: `حالة الخادم: ok`
- The page uses the Cairo font

Stop both servers with Ctrl+C.

- [ ] **Step 11: Run linting + formatting on the frontend**

```bash
cd /Users/turkioqab/Projects/Markaz/frontend
npm run lint
```

Expected: no errors (Vite scaffolds ESLint by default). If there are errors, fix them before committing.

- [ ] **Step 12: Commit**

```bash
cd /Users/turkioqab/Projects/Markaz
git add frontend/
git commit -m "feat(frontend): add Arabic RTL hello-world with backend health check and tests"
```

---

## Task 8: Phase 0 verification checklist

- [ ] **Step 1: Backend test suite passes**

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
pytest -v
```

Expected: all tests pass.

- [ ] **Step 2: Frontend test suite passes**

```bash
cd /Users/turkioqab/Projects/Markaz/frontend
npm run test
```

Expected: all tests pass.

- [ ] **Step 3: Both dev servers boot without errors**

Terminal A:

```bash
cd /Users/turkioqab/Projects/Markaz/backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Terminal B:

```bash
cd /Users/turkioqab/Projects/Markaz/frontend
npm run dev
```

Browser: `http://localhost:5173` shows the Arabic RTL hello-world with `حالة الخادم: ok`.

- [ ] **Step 4: `git status` is clean**

```bash
cd /Users/turkioqab/Projects/Markaz
git status
```

Expected: `nothing to commit, working tree clean`.

- [ ] **Step 5: Review git log**

```bash
cd /Users/turkioqab/Projects/Markaz
git log --oneline
```

Expected: roughly 7 commits from this phase, each with a clear message.

---

## Phase 0 exit criteria

All of the following must be true before moving to Phase 1:

1. Backend: `pytest -v` passes (at least one test: `test_health_endpoint_returns_ok`)
2. Frontend: `npm run test` passes (at least two tests in `App.test.tsx`)
3. Running both dev servers and visiting `http://localhost:5173` shows the Arabic RTL greeting with the backend health status `ok`
4. `ruff check .` and `black --check .` pass in `backend/`
5. `npm run lint` passes in `frontend/`
6. `git status` is clean and all work is committed

Once those are green, Phase 1 (Database & Auth) gets its own plan file.
