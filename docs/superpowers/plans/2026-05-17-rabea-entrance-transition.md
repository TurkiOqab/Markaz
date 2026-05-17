# Rabea Login Entrance Transition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make REB9 login play the same choreography as the Injaz welcome — login page blurs/fades out + gold-sweep overlay crosses the screen + the standalone `/operations-welcome` page reveals (blur→scale→fade) — via a new dedicated entrance-transition provider, without touching `LoginTransition.tsx`.

**Architecture:** A new `RabeaEntranceTransitionProvider` (phases `idle`→`sweep`) mounted above `<Routes>` so its gold-sweep overlay survives the route navigation. REB9 login calls its `start()` instead of navigating directly; the provider shows the sweep overlay for `ENTER_MS` then `navigate("/operations-welcome", {replace:true})`. `LoginPage` blurs out during the sweep (reuses the global `animate-login-blur-out` class). `OperationsWelcomePage` reveals on mount via the global `animate-welcome-reveal` class. The Injaz `LoginTransition.tsx` and the retained-dead `RabeaWelcomeTransition.tsx` are not modified.

**Tech Stack:** React 19, react-router-dom v6, TypeScript, Tailwind (global keyframe classes already defined), Vitest + Testing Library, `lib/clock`.

---

## File Structure

| File | Responsibility |
|---|---|
| `frontend/src/rabea/RabeaEntranceTransition.tsx` (new) | provider + `useRabeaEntrance` + gold-sweep overlay (duplicated visual, global classes) |
| `frontend/src/rabea/__tests__/RabeaEntranceTransition.test.tsx` (new) | provider behavior: start → sweep overlay → after timer navigate + idle |
| `frontend/src/rabea/OperationsWelcomePage.tsx` (modify) | add `animate-welcome-reveal will-change-transform` to `<main>` |
| `frontend/src/App.tsx` (modify) | mount `RabeaEntranceTransitionProvider` above `<Routes>` |
| `frontend/src/pages/LoginPage.tsx` (modify) | REB9 → `startRabeaEntrance()`; blur-out during sweep; drop orphaned `useNavigate` |
| `frontend/src/rabea/__tests__/rabeaLogin.test.tsx` (modify) | integration test for the transition flow |

**Commit hygiene:** `App.tsx` carries a pre-existing UNRELATED uncommitted hunk (`import { LeavesPage } from "./pages/LeavesPage";` at line ~19 + `<Route path="/leaves" element={<LeavesPage />} />` at line ~55). `LoginPage.tsx` carries a pre-existing UNRELATED hunk (a brand-aside `<div>` whose working-tree class is `relative z-10 my-auto flex flex-col items-start text-start`, committed/main = `relative z-10 my-auto`). Tasks 3 & 4 commit ONLY the Rabea hunks and restore the pre-existing hunks to the working tree (same split discipline as the phase-1b plan). NEVER `git add -A`. Every commit message ends with a blank line then:
`Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`

**Environment:** Windows/PowerShell. From `c:\Users\Admin\Desktop\Markaz\frontend`: tests `& 'node_modules\.bin\vitest.cmd' run <path>`; typecheck `& 'node_modules\.bin\tsc.cmd' -p tsconfig.app.json --noEmit` (exits non-zero only on pre-existing DashboardPage/RatingsTab errors — care only about NO errors in changed files). Do NOT use `npx`. Do NOT modify `frontend/src/components/LoginTransition.tsx` or `frontend/src/rabea/RabeaWelcomeTransition.tsx`.

---

## Task 1: `RabeaEntranceTransition` provider + test

**Files:**
- Create: `frontend/src/rabea/RabeaEntranceTransition.tsx`
- Test: `frontend/src/rabea/__tests__/RabeaEntranceTransition.test.tsx`

- [ ] **Step 1: Write the failing test** — create `frontend/src/rabea/__tests__/RabeaEntranceTransition.test.tsx`:

```tsx
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  RabeaEntranceTransitionProvider,
  useRabeaEntrance,
} from "../RabeaEntranceTransition";

function Starter() {
  const { start } = useRabeaEntrance();
  return (
    <button type="button" onClick={start}>
      go
    </button>
  );
}

function renderProvider() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <RabeaEntranceTransitionProvider>
        <Routes>
          <Route path="/login" element={<Starter />} />
          <Route
            path="/operations-welcome"
            element={<div>صفحة ربيع</div>}
          />
        </Routes>
      </RabeaEntranceTransitionProvider>
    </MemoryRouter>,
  );
}

describe("RabeaEntranceTransition", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("shows the sweep overlay on start, then navigates to /operations-welcome and clears", () => {
    renderProvider();
    expect(screen.queryByTestId("rabea-sweep")).not.toBeInTheDocument();
    expect(screen.queryByText("صفحة ربيع")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "go" }));

    // During sweep: overlay present, not yet navigated.
    expect(screen.getByTestId("rabea-sweep")).toBeInTheDocument();
    expect(screen.queryByText("صفحة ربيع")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // After ENTER_MS: navigated, overlay gone (phase back to idle).
    expect(screen.getByText("صفحة ربيع")).toBeInTheDocument();
    expect(screen.queryByTestId("rabea-sweep")).not.toBeInTheDocument();
  });

  it("ignores a second start while already sweeping", () => {
    renderProvider();
    fireEvent.click(screen.getByRole("button", { name: "go" }));
    fireEvent.click(screen.getByRole("button", { name: "go" }));
    expect(screen.getAllByTestId("rabea-sweep")).toHaveLength(1);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText("صفحة ربيع")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test — expect FAIL** (`Cannot find module '../RabeaEntranceTransition'`)

Run: `& 'node_modules\.bin\vitest.cmd' run src/rabea/__tests__/RabeaEntranceTransition.test.tsx`

- [ ] **Step 3: Create `frontend/src/rabea/RabeaEntranceTransition.tsx`** with EXACTLY:

```tsx
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

// Matches Injaz LoginTransition ENTER_MS so the choreography feels identical.
const ENTER_MS = 1000;

export type RabeaEntrancePhase = "idle" | "sweep";

interface ContextValue {
  phase: RabeaEntrancePhase;
  start: () => void;
}

const RabeaEntranceContext = createContext<ContextValue>({
  phase: "idle",
  start: () => {},
});

export function useRabeaEntrance(): ContextValue {
  return useContext(RabeaEntranceContext);
}

export function RabeaEntranceTransitionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [phase, setPhase] = useState<RabeaEntrancePhase>("idle");
  const navigate = useNavigate();
  const timers = useRef<number[]>([]);

  function clearTimers() {
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
  }

  function start() {
    if (phase !== "idle") return;
    clearTimers();
    setPhase("sweep");
    timers.current.push(
      window.setTimeout(() => {
        navigate("/operations-welcome", { replace: true });
        setPhase("idle");
      }, ENTER_MS),
    );
  }

  useEffect(() => () => clearTimers(), []);

  return (
    <RabeaEntranceContext.Provider value={{ phase, start }}>
      {children}
      {phase === "sweep" ? <RabeaGoldSweepOverlay /> : null}
    </RabeaEntranceContext.Provider>
  );
}

// Visual duplicate of Injaz's GoldSweepOverlay (LoginTransition.tsx) — kept
// independent so the Injaz file is never touched. Adds a dark-green backdrop
// because the destination page mounts only after the navigate.
function RabeaGoldSweepOverlay() {
  return (
    <div
      aria-hidden
      data-testid="rabea-sweep"
      className="pointer-events-none fixed inset-0 z-[110] overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a2818] via-[#0d3a24] to-[#14502f]" />
      <div
        className="absolute inset-0 animate-veil-sweep will-change-transform"
        style={{
          background:
            "linear-gradient(270deg, rgba(13,58,36,0) 0%, rgba(13,58,36,0.18) 60%, rgba(10,40,24,0.35) 100%)",
        }}
      />
      <GoldLine top="28%" thickness="0.5px" opacity={0.28} />
      <GoldLine top="50%" thickness="1px" opacity={0.45} />
      <GoldLine top="72%" thickness="0.5px" opacity={0.28} />
    </div>
  );
}

function GoldLine({
  top,
  thickness,
  opacity,
}: {
  top: string;
  thickness: string;
  opacity: number;
}) {
  return (
    <div
      className="absolute -end-[40%] w-[60%] animate-gold-sweep will-change-transform"
      style={{
        top,
        height: thickness,
        opacity,
        background:
          "linear-gradient(270deg, rgba(232,217,184,0) 0%, rgba(232,217,184,0.6) 30%, rgba(255,236,196,0.85) 50%, rgba(232,217,184,0.6) 70%, rgba(232,217,184,0) 100%)",
        filter:
          "drop-shadow(0 0 4px rgba(232,217,184,0.45)) drop-shadow(0 0 10px rgba(232,217,184,0.18))",
      }}
    />
  );
}
```

- [ ] **Step 4: Run test — expect PASS** (2 passed)

Run: `& 'node_modules\.bin\vitest.cmd' run src/rabea/__tests__/RabeaEntranceTransition.test.tsx`

- [ ] **Step 5: Typecheck**

Run: `& 'node_modules\.bin\tsc.cmd' -p tsconfig.app.json --noEmit 2>&1 | Select-String -Pattern "RabeaEntranceTransition"`
Expected: no output.

- [ ] **Step 6: Commit**

```
git add frontend/src/rabea/RabeaEntranceTransition.tsx frontend/src/rabea/__tests__/RabeaEntranceTransition.test.tsx
git commit -m "feat(rabea): entrance transition provider + gold-sweep overlay

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: `OperationsWelcomePage` reveal on mount

**Files:**
- Modify: `frontend/src/rabea/OperationsWelcomePage.tsx`

- [ ] **Step 1: Edit the `<main>` className.** Find exactly:

```
      className="relative grid min-h-screen grid-rows-[auto_1fr_auto] gap-[22px] overflow-hidden bg-[#061a10] px-7 py-[22px] text-[#f5f1e6] max-[560px]:px-4"
```
Replace with exactly:
```
      className="relative grid min-h-screen grid-rows-[auto_1fr_auto] gap-[22px] overflow-hidden bg-[#061a10] px-7 py-[22px] text-[#f5f1e6] max-[560px]:px-4 animate-welcome-reveal will-change-transform"
```
(If the anchor is not found verbatim, STOP/BLOCKED.)

- [ ] **Step 2: Run the existing page test — must still pass** (the reveal class doesn't change rendered text)

Run: `& 'node_modules\.bin\vitest.cmd' run src/rabea/__tests__/OperationsWelcomePage.test.tsx`
Expected: PASS — 2 passed.

- [ ] **Step 3: Typecheck**

Run: `& 'node_modules\.bin\tsc.cmd' -p tsconfig.app.json --noEmit 2>&1 | Select-String -Pattern "OperationsWelcomePage"`
Expected: no output.

- [ ] **Step 4: Commit**

```
git add frontend/src/rabea/OperationsWelcomePage.tsx
git commit -m "feat(rabea): OperationsWelcomePage reveals on mount (animate-welcome-reveal)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Mount the provider in `App.tsx` (commit-hygiene split)

**Files:**
- Modify: `frontend/src/App.tsx`

`App.tsx` working tree has a pre-existing UNRELATED hunk: `import { LeavesPage } from "./pages/LeavesPage";` and `<Route path="/leaves" element={<LeavesPage />} />`. The commit must contain ONLY the Rabea provider wiring; restore the leaves lines afterward.

- [ ] **Step 1: Add the import.** Immediately AFTER the line:
```
import { OperationsWelcomePage } from "./rabea/OperationsWelcomePage";
```
add:
```
import { RabeaEntranceTransitionProvider } from "./rabea/RabeaEntranceTransition";
```

- [ ] **Step 2: Wrap the provider — opening.** Replace exactly:
```
        <LoginTransitionProvider>
        <Routes>
```
with:
```
        <LoginTransitionProvider>
        <RabeaEntranceTransitionProvider>
        <Routes>
```

- [ ] **Step 3: Wrap the provider — closing.** Replace exactly:
```
        </Routes>
        </LoginTransitionProvider>
```
with:
```
        </Routes>
        </RabeaEntranceTransitionProvider>
        </LoginTransitionProvider>
```

- [ ] **Step 4: Typecheck**

Run: `& 'node_modules\.bin\tsc.cmd' -p tsconfig.app.json --noEmit 2>&1 | Select-String -Pattern "App.tsx"`
Expected: no output.

- [ ] **Step 5: Commit-hygiene split.**
  1. Edit tool — temporarily remove the two pre-existing leaves lines: delete the line `import { LeavesPage } from "./pages/LeavesPage";` and the line `            <Route path="/leaves" element={<LeavesPage />} />`. (If either exact line is absent, STOP/BLOCKED.)
  2. `git diff -- frontend/src/App.tsx` → confirm ONLY the 3 Rabea hunks (provider import, opening wrap, closing wrap); NO LeavesPage hunk. If a leaves hunk remains, STOP/BLOCKED.
  3. `git add frontend/src/App.tsx`; `git diff --cached -- frontend/src/App.tsx` → only Rabea hunks staged.
  4. Commit:
     ```
     git commit -m "feat(rabea): mount RabeaEntranceTransitionProvider above Routes

     Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
     ```
  5. Restore the two leaves lines to the WORKING TREE (Edit tool): re-add `import { LeavesPage } from "./pages/LeavesPage";` immediately BEFORE `import { LoginPage } from "./pages/LoginPage";`, and re-add `            <Route path="/leaves" element={<LeavesPage />} />` immediately BEFORE `            <Route path="/employees" element={<EmployeesListPage />} />`.

- [ ] **Step 6: Final verify**

`git show HEAD -- frontend/src/App.tsx` → only the 3 Rabea hunks (no LeavesPage).
`git diff -- frontend/src/App.tsx` → only the 2 restored leaves lines (unstaged).
`git show --stat HEAD` → exactly 1 file.

---

## Task 4: Rewire `LoginPage` REB9 → entrance transition (commit-hygiene split)

**Files:**
- Modify: `frontend/src/pages/LoginPage.tsx`

`LoginPage.tsx` working tree has a pre-existing UNRELATED hunk: a brand-aside `<div>` whose class is `relative z-10 my-auto flex flex-col items-start text-start` (committed/main = `relative z-10 my-auto`). Commit ONLY the Rabea hunks; restore that hunk afterward.

- [ ] **Step 1: Imports.** Replace exactly:
```
import { Navigate, useNavigate } from "react-router-dom";
```
with:
```
import { Navigate } from "react-router-dom";
```
Then, immediately AFTER the line:
```
import { useLoginTransition } from "../components/LoginTransition";
```
add:
```
import { useRabeaEntrance } from "../rabea/RabeaEntranceTransition";
```

- [ ] **Step 2: Hooks.** Replace exactly:
```
  const { phase, start } = useLoginTransition();
  const navigate = useNavigate();
```
with:
```
  const { phase, start } = useLoginTransition();
  const { phase: rabeaPhase, start: startRabeaEntrance } = useRabeaEntrance();
```

- [ ] **Step 3: REB9 branch.** Replace exactly:
```
    if (username === RABEA_USERNAME && password === RABEA_PASSWORD) {
      // Frontend-only Rabea gate: never hits the backend (REB9 is not a real
      // account). Navigates to the standalone welcome page. Injaz path below
      // is unchanged for every other user.
      setRabeaMode(true);
      navigate("/operations-welcome", { replace: true });
      return;
    }
```
with:
```
    if (username === RABEA_USERNAME && password === RABEA_PASSWORD) {
      // Frontend-only Rabea gate: never hits the backend (REB9 is not a real
      // account). Plays the entrance choreography, then the provider navigates
      // to the standalone welcome page. Injaz path below is unchanged.
      setRabeaMode(true);
      startRabeaEntrance();
      return;
    }
```

- [ ] **Step 4: `pageSlideClass`.** Replace exactly:
```
  const pageSlideClass =
    phase === "enter"
      ? "animate-login-blur-out"
      : phase === "hold" || phase === "exit"
        ? "opacity-0"
        : "";
```
with:
```
  const pageSlideClass =
    phase === "enter" || rabeaPhase === "sweep"
      ? "animate-login-blur-out"
      : phase === "hold" || phase === "exit"
        ? "opacity-0"
        : "";
```

- [ ] **Step 5: Typecheck (confirms no orphaned `useNavigate`/`navigate`)**

Run: `& 'node_modules\.bin\tsc.cmd' -p tsconfig.app.json --noEmit 2>&1 | Select-String -Pattern "LoginPage"`
Expected: no output. (If it reports `'navigate' is declared but never read` or `'useNavigate' ... never used`, you missed Step 1/2 — fix so neither `useNavigate` nor `navigate` remains.)

- [ ] **Step 6: Commit-hygiene split.**
  1. Edit tool — temporarily revert the pre-existing layout hunk: replace
     `        <div className="relative z-10 my-auto flex flex-col items-start text-start">`
     with
     `        <div className="relative z-10 my-auto">`.
     (If that exact line is absent, STOP/BLOCKED.)
  2. `git diff -- frontend/src/pages/LoginPage.tsx` → confirm ONLY the Rabea hunks (import line change, added rabea import, hooks line change, REB9 block, pageSlideClass) and NO `flex flex-col items-start text-start` hunk. If a layout hunk remains, STOP/BLOCKED.
  3. `git add frontend/src/pages/LoginPage.tsx`; `git diff --cached -- frontend/src/pages/LoginPage.tsx` → only Rabea hunks.
  4. Commit:
     ```
     git commit -m "feat(rabea): LoginPage plays entrance transition for REB9

     Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
     ```
  5. Restore the pre-existing hunk to the WORKING TREE (Edit tool): replace
     `        <div className="relative z-10 my-auto">`
     back with
     `        <div className="relative z-10 my-auto flex flex-col items-start text-start">`.

- [ ] **Step 7: Final verify**

`git show HEAD -- frontend/src/pages/LoginPage.tsx` → only the Rabea hunks (no layout-class hunk).
`git diff -- frontend/src/pages/LoginPage.tsx` → only the restored layout line (unstaged).
`git show --stat HEAD` → exactly 1 file.

---

## Task 5: Update the integration test for the transition flow

**Files:**
- Modify: `frontend/src/rabea/__tests__/rabeaLogin.test.tsx`

The provider navigates after a real 1000ms `setTimeout`, so the REB9 test must (a) assert the sweep overlay appears right after submit, and (b) wait (real timers, extended `findBy` timeout) for the post-navigation page. The non-REB9 (Injaz) test is unchanged.

- [ ] **Step 1: Overwrite `frontend/src/rabea/__tests__/rabeaLogin.test.tsx`** with EXACTLY:

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../../App";
import { setRabeaMode } from "../rabeaSession";

type FetchMock = ReturnType<typeof vi.fn>;

function json(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

describe("Rabea login distinction", () => {
  let fetchMock: FetchMock;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    fetchMock = vi.fn((input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/api/auth/status")) {
        return Promise.resolve(
          json({ data: { setup_complete: true, authenticated: false } }),
        );
      }
      if (url.includes("/api/auth/login")) {
        return Promise.resolve(
          json({ detail: "بيانات الدخول غير صحيحة" }, { status: 401 }),
        );
      }
      return Promise.resolve(json({ data: {} }));
    });
    vi.stubGlobal("fetch", fetchMock);
    window.history.pushState({}, "", "/login");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    setRabeaMode(false);
    window.history.pushState({}, "", "/");
  });

  it("REB9 plays the entrance sweep then lands on the Rabea welcome page, no login API", async () => {
    render(<App />);

    await screen.findByRole("heading", { name: "تسجيل الدخول" });
    await user.type(screen.getByLabelText("اسم المستخدم"), "REB9");
    await user.type(screen.getByLabelText("كلمة المرور"), "1234567891");
    await user.click(screen.getByRole("button", { name: "تسجيل الدخول" }));

    // Sweep overlay appears immediately (before the ~1000ms navigate).
    expect(screen.getByTestId("rabea-sweep")).toBeInTheDocument();

    // After the real ENTER_MS timer the provider navigates and the page reveals.
    await screen.findByText("ربيع ٩.", {}, { timeout: 3000 });
    expect(screen.getByText("حالة التكميل اليومي")).toBeInTheDocument();
    expect(screen.queryByTestId("rabea-sweep")).not.toBeInTheDocument();

    const loginCalls = fetchMock.mock.calls.filter((c) =>
      String(c[0]).includes("/api/auth/login"),
    );
    expect(loginCalls).toHaveLength(0);
  });

  it("a non-REB9 user still goes through the backend login (Injaz path)", async () => {
    render(<App />);

    await screen.findByRole("heading", { name: "تسجيل الدخول" });
    await user.type(screen.getByLabelText("اسم المستخدم"), "somechief");
    await user.type(screen.getByLabelText("كلمة المرور"), "passwordlong");
    await user.click(screen.getByRole("button", { name: "تسجيل الدخول" }));

    await waitFor(() => {
      const loginCalls = fetchMock.mock.calls.filter((c) =>
        String(c[0]).includes("/api/auth/login"),
      );
      expect(loginCalls.length).toBeGreaterThan(0);
    });
    expect(screen.queryByText("ربيع ٩.")).not.toBeInTheDocument();
    expect(screen.queryByTestId("rabea-sweep")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test — expect PASS** (2 passed)

Run: `& 'node_modules\.bin\vitest.cmd' run src/rabea/__tests__/rabeaLogin.test.tsx`
(If the REB9 test flakes on timing, the `findByText(..., { timeout: 3000 })` covers the 1000ms provider timer with margin; do NOT shorten ENTER_MS or weaken assertions — investigate honestly and report.)

- [ ] **Step 3: Commit**

```
git add frontend/src/rabea/__tests__/rabeaLogin.test.tsx
git commit -m "test(rabea): integration test for the entrance-transition flow

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Full regression + Injaz-untouched verification

**Files:** none (verification only — no code changes, no commits).

- [ ] **Step 1: Injaz untouched by branch commits**

Run: `git log --oneline main..HEAD -- frontend/src/components/LoginTransition.tsx` (MUST be empty) and `git diff main...HEAD -- frontend/src/components/LoginTransition.tsx` (MUST be empty). Also `git diff main...HEAD -- frontend/src/rabea/RabeaWelcomeTransition.tsx` MUST be empty (retained dead code untouched).

- [ ] **Step 2: Branch commits touched only expected files**

Run: `git diff main...HEAD --stat`. The phase-1c additions must be only: `docs/superpowers/**`, `frontend/src/rabea/RabeaEntranceTransition.tsx` (+test), and Rabea-only hunks in `OperationsWelcomePage.tsx`, `App.tsx`, `LoginPage.tsx`, `rabeaLogin.test.tsx`. Confirm `git diff main...HEAD -- frontend/src/App.tsx` has NO `LeavesPage` hunk and `git diff main...HEAD -- frontend/src/pages/LoginPage.tsx` has NO `flex flex-col items-start text-start` hunk.

- [ ] **Step 3: Full Rabea suite**

Run: `& 'node_modules\.bin\vitest.cmd' run src/rabea`
Expected: all Rabea suites pass (including the new `RabeaEntranceTransition` suite and the updated `rabeaLogin`).

- [ ] **Step 4: Whole suite — classify failures**

Run: `& 'node_modules\.bin\vitest.cmd' run`. The known pre-existing failing `<App/>` suites (`__tests__/BuildingPage.test.tsx`, `__tests__/EmployeesListPage.test.tsx`, `__tests__/VehiclesListPage.test.tsx`, `__tests__/LoginFlow.test.tsx`) must still fail for the SAME pre-existing reasons (the user's separate uncommitted work; they don't use REB9; adding a passthrough provider above Routes and the LoginPage REB9-only changes cannot affect them). Confirm no NEW failures attributable to this change.

- [ ] **Step 5: Typecheck**

Run: `& 'node_modules\.bin\tsc.cmd' -p tsconfig.app.json --noEmit 2>&1 | Select-String -Pattern "rabea/|LoginPage|App.tsx"`
Expected: no output. (Only the pre-existing `DashboardPage.tsx`/`RatingsTab.tsx` errors remain — out of scope.)

- [ ] **Step 6: Lint changed files**

Run: `& 'node_modules\.bin\eslint.cmd' src/rabea src/pages/LoginPage.tsx src/App.tsx`
Expected: 0 errors (the pre-existing `react-refresh/only-export-components` advisory on retained `RabeaWelcomeTransition.tsx` is unrelated/acceptable; note if `RabeaEntranceTransition.tsx` raises the same advisory — it exports a hook + components like the Injaz pattern; advisory-only, acceptable, not a blocker).

- [ ] **Step 7: Report** Status PASS/PASS_WITH_NOTES with evidence that LoginTransition.tsx/RabeaWelcomeTransition.tsx are untouched and no new regression.

---

## Self-Review

**1. Spec coverage:**
- §0/§2.1 new provider (phases idle→sweep, ENTER_MS=1000, gold-sweep+veil+green backdrop, faithful GoldLine duplication) → Task 1. ✓
- §2.2 App provider mount + hygiene → Task 3. ✓
- §2.3 LoginPage REB9→startRabeaEntrance, pageSlideClass adds `rabeaPhase==="sweep"`, definitive removal of orphaned `useNavigate`/`navigate`, hygiene → Task 4 (Step 1 removes `useNavigate`, Step 2 removes `const navigate`, Step 5 typecheck guards orphan). ✓
- §2.4 OperationsWelcomePage `animate-welcome-reveal will-change-transform` on `<main>` → Task 2. ✓
- §3 timing (ENTER_MS=1000) → Task 1 constant. ✓
- §4 testing (provider unit test w/ fake timers + sentinel; rabeaLogin updated for sweep+real-timer navigate; other component tests stay green; regression guard) → Tasks 1, 5, 6. ✓
- §5 file list → matches the File Structure table; LoginTransition.tsx & RabeaWelcomeTransition.tsx untouched (Task 6 verifies). ✓

**2. Placeholder scan:** No TBD/TODO/"similar to". Every code step has complete code; commands explicit. ✓

**3. Type consistency:** `RabeaEntrancePhase`/`useRabeaEntrance`/`RabeaEntranceTransitionProvider` defined in Task 1, imported with exact names in Tasks 3 (`RabeaEntranceTransitionProvider`) and 4 (`useRabeaEntrance`, destructured `phase: rabeaPhase, start: startRabeaEntrance`). `data-testid="rabea-sweep"` defined in Task 1 overlay, asserted in Tasks 1 & 5. Route `/operations-welcome` consistent (provider navigates there; App route already exists from phase-1b). `animate-login-blur-out`/`animate-welcome-reveal`/`animate-veil-sweep`/`animate-gold-sweep` are pre-existing global Tailwind classes (verified present in tailwind.config.js during phase-1b). ✓
