# Rabea (Operations Division) Welcome — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a frontend-only "Rabea" (operations division manager) login distinction and a welcome page reusing Injaz's transition choreography, with a mock-data daily-takmeel status card and a "under construction" dashboard placeholder — without touching the backend, the database, or `LoginTransition.tsx`.

**Architecture:** All new code lives under `frontend/src/rabea/`. The Rabea welcome is a full-screen transition overlay that mirrors the Injaz `LoginTransition` choreography by reusing the global Tailwind animation classes (`animate-welcome-reveal`, `animate-gold-sweep`, `animate-fade-slide-*`, `animate-shape-drift-slow`) and duplicating the visual shell (deliberate duplication to keep Injaz untouched). Only two existing files get minimal, guarded edits: a `REB9` early-return branch in `LoginPage.tsx` and provider/route wiring in `App.tsx`. `LoginTransition.tsx` and all backend/DB code are not modified.

**Tech Stack:** React 19, TypeScript, react-router-dom 6, Tailwind (with `tailwindcss-rtl`), Vitest + Testing Library, `lib/clock` (`today()`), existing `injaz-*` color tokens.

---

## File Structure

| File | Responsibility |
|---|---|
| `frontend/src/rabea/rabeaSession.ts` (new) | `REB9` constants + sessionStorage flag helpers |
| `frontend/src/rabea/takmeelMock.ts` (new) | `CenterTakmeel` type + static mock data (future API swap point) |
| `frontend/src/rabea/takmeelView.ts` (new) | Pure `deriveTakmeelView(centers, now)` — all display states |
| `frontend/src/rabea/__tests__/takmeelView.test.ts` (new) | Unit tests for the pure function |
| `frontend/src/rabea/TakmeelStatusCard.tsx` (new) | Presentational card consuming `TakmeelView` |
| `frontend/src/rabea/RabeaWelcomeTransition.tsx` (new) | Provider + overlay + choreography (duplicated visual shell) |
| `frontend/src/rabea/OperationsPlaceholderPage.tsx` (new) | `/operations` "under construction" page (rabea-flag guarded) |
| `frontend/src/rabea/__tests__/rabeaLogin.test.tsx` (new) | Integration smoke: REB9 → Rabea welcome; other user → Injaz path |
| `frontend/src/pages/LoginPage.tsx` (modify) | Guarded `REB9` early-return in `handleSubmit` |
| `frontend/src/App.tsx` (modify) | Mount `RabeaWelcomeTransitionProvider` + add `/operations` route |

---

## Task 1: Session constants and flag helpers

**Files:**
- Create: `frontend/src/rabea/rabeaSession.ts`
- Test: `frontend/src/rabea/__tests__/rabeaSession.test.ts`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/rabea/__tests__/rabeaSession.test.ts`:

```ts
import { afterEach, describe, expect, it } from "vitest";
import {
  RABEA_USERNAME,
  RABEA_PASSWORD,
  isRabeaMode,
  setRabeaMode,
} from "../rabeaSession";

describe("rabeaSession", () => {
  afterEach(() => {
    setRabeaMode(false);
  });

  it("exposes the fixed REB9 credentials", () => {
    expect(RABEA_USERNAME).toBe("REB9");
    expect(RABEA_PASSWORD).toBe("1234567891");
  });

  it("defaults to not-in-rabea-mode", () => {
    expect(isRabeaMode()).toBe(false);
  });

  it("round-trips the rabea flag", () => {
    setRabeaMode(true);
    expect(isRabeaMode()).toBe(true);
    setRabeaMode(false);
    expect(isRabeaMode()).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/rabea/__tests__/rabeaSession.test.ts`
Expected: FAIL — `Cannot find module '../rabeaSession'`.

- [ ] **Step 3: Write the implementation**

Create `frontend/src/rabea/rabeaSession.ts`:

```ts
// Phase-1 Rabea (operations division) gate. Frontend-only: REB9 is NOT a real
// backend account. The password living in source is an accepted phase-1
// tradeoff for a local single-user app (see design spec 2026-05-17).

export const RABEA_USERNAME = "REB9";
export const RABEA_PASSWORD = "1234567891";

const FLAG_KEY = "injaz_rabea_mode";

export function setRabeaMode(on: boolean): void {
  try {
    if (on) sessionStorage.setItem(FLAG_KEY, "1");
    else sessionStorage.removeItem(FLAG_KEY);
  } catch {
    // sessionStorage unavailable (private mode / SSR) — gate is best-effort.
  }
}

export function isRabeaMode(): boolean {
  try {
    return sessionStorage.getItem(FLAG_KEY) === "1";
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/rabea/__tests__/rabeaSession.test.ts`
Expected: PASS — 3 passed.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/rabea/rabeaSession.ts frontend/src/rabea/__tests__/rabeaSession.test.ts
git commit -m "feat(rabea): session constants and flag helpers"
```

---

## Task 2: Mock takmeel data and type

**Files:**
- Create: `frontend/src/rabea/takmeelMock.ts`

- [ ] **Step 1: Write the implementation** (no test — pure data; exercised via Task 3)

Create `frontend/src/rabea/takmeelMock.ts`:

```ts
// Static phase-1 takmeel data for Rabea's two centers. This is the single
// swap point for a future real API call (design spec 2026-05-17, §5).
// `submittedAt` is local 24h "HH:MM" or null when the center has not submitted.

export interface CenterTakmeel {
  id: string;
  submittedAt: string | null;
}

export function getTodayTakmeel(): CenterTakmeel[] {
  return [
    { id: "م22", submittedAt: "07:32" },
    { id: "م23", submittedAt: null },
  ];
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/rabea/takmeelMock.ts
git commit -m "feat(rabea): static mock takmeel data + CenterTakmeel type"
```

---

## Task 3: Pure `deriveTakmeelView` (TDD)

**Files:**
- Create: `frontend/src/rabea/takmeelView.ts`
- Test: `frontend/src/rabea/__tests__/takmeelView.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/rabea/__tests__/takmeelView.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { deriveTakmeelView } from "../takmeelView";
import type { CenterTakmeel } from "../takmeelMock";

// Local-time Date helper: year, month(0-based), day, hour, minute.
function at(h: number, m: number): Date {
  return new Date(2026, 4, 17, h, m, 0, 0);
}

const BOTH_NULL: CenterTakmeel[] = [
  { id: "م22", submittedAt: null },
  { id: "م23", submittedAt: null },
];

describe("deriveTakmeelView", () => {
  it("empty center list -> state 'empty'", () => {
    const v = deriveTakmeelView([], at(10, 0));
    expect(v.state).toBe("empty");
    expect(v.headline).toBe("لا توجد مراكز مرتبطة بحسابك");
    expect(v.centers).toHaveLength(0);
  });

  it("before 09:00, none submitted -> pending, 0/2, no late labels", () => {
    const v = deriveTakmeelView(BOTH_NULL, at(8, 0));
    expect(v.state).toBe("pending");
    expect(v.beforeDeadline).toBe(true);
    expect(v.submittedCount).toBe(0);
    expect(v.total).toBe(2);
    expect(v.percent).toBe(0);
    expect(v.headline).toBe("بانتظار وقت رفع التكميل (٩:٠٠ ص)");
    expect(v.centers.every((c) => c.lateLabel === null)).toBe(true);
    expect(v.centers.every((c) => c.fastest === false)).toBe(true);
  });

  it("before 09:00 with an early submission -> pending but counts it, no judgment", () => {
    const centers: CenterTakmeel[] = [
      { id: "م22", submittedAt: "07:32" },
      { id: "م23", submittedAt: null },
    ];
    const v = deriveTakmeelView(centers, at(8, 0));
    expect(v.state).toBe("pending");
    expect(v.submittedCount).toBe(1);
    expect(v.percent).toBe(50);
    const m22 = v.centers.find((c) => c.id === "م22")!;
    expect(m22.submitted).toBe(true);
    expect(m22.fastest).toBe(false);
    const m23 = v.centers.find((c) => c.id === "م23")!;
    expect(m23.lateLabel).toBeNull();
  });

  it("after 09:00, both submitted -> complete, fastest = earliest", () => {
    const centers: CenterTakmeel[] = [
      { id: "م22", submittedAt: "07:51" },
      { id: "م23", submittedAt: "07:32" },
    ];
    const v = deriveTakmeelView(centers, at(10, 0));
    expect(v.state).toBe("complete");
    expect(v.submittedCount).toBe(2);
    expect(v.percent).toBe(100);
    expect(v.headline).toBe("اكتمل التكميل اليوم ✅");
    expect(v.centers.find((c) => c.id === "م23")!.fastest).toBe(true);
    expect(v.centers.find((c) => c.id === "م22")!.fastest).toBe(false);
  });

  it("after 09:00, one missing 23 min late -> partial, yellow tier", () => {
    const centers: CenterTakmeel[] = [
      { id: "م22", submittedAt: "07:32" },
      { id: "م23", submittedAt: null },
    ];
    const v = deriveTakmeelView(centers, at(9, 23));
    expect(v.state).toBe("partial");
    expect(v.submittedCount).toBe(1);
    expect(v.headline).toBe("بانتظار مركز واحد");
    const m23 = v.centers.find((c) => c.id === "م23")!;
    expect(m23.lateMinutes).toBe(23);
    expect(m23.lateTier).toBe("yellow");
    expect(m23.lateLabel).toBe("متأخر ٢٣ دقيقة");
  });

  it("after 09:00, none submitted 45 min late -> none, orange tier", () => {
    const v = deriveTakmeelView(BOTH_NULL, at(9, 45));
    expect(v.state).toBe("none");
    expect(v.headline).toBe("لم يرفع أي مركز التكميل");
    expect(v.centers[0].lateTier).toBe("orange");
  });

  it("late tier boundaries: 29=yellow, 30=orange, 60=orange, 61=red", () => {
    expect(deriveTakmeelView(BOTH_NULL, at(9, 29)).centers[0].lateTier).toBe("yellow");
    expect(deriveTakmeelView(BOTH_NULL, at(9, 30)).centers[0].lateTier).toBe("orange");
    expect(deriveTakmeelView(BOTH_NULL, at(10, 0)).centers[0].lateTier).toBe("orange");
    expect(deriveTakmeelView(BOTH_NULL, at(10, 1)).centers[0].lateTier).toBe("red");
  });

  it("formats a long late label with hours and minutes", () => {
    const v = deriveTakmeelView(BOTH_NULL, at(10, 15));
    expect(v.centers[0].lateLabel).toBe("متأخر ساعة و ١٥ دقيقة");
  });

  it("formats submitted time as arabic-digit 12h", () => {
    const centers: CenterTakmeel[] = [{ id: "م22", submittedAt: "07:32" }];
    const v = deriveTakmeelView(centers, at(10, 0));
    expect(v.centers[0].submittedLabel).toBe("٧:٣٢ ص");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run src/rabea/__tests__/takmeelView.test.ts`
Expected: FAIL — `Cannot find module '../takmeelView'`.

- [ ] **Step 3: Write the implementation**

Create `frontend/src/rabea/takmeelView.ts`:

```ts
import type { CenterTakmeel } from "./takmeelMock";

// Official daily deadline: 09:00 local. Judgment (late/complete) only applies
// once the clock passes this; before it the card is neutral "pending".
export const DEADLINE_HOUR = 9;

export type OverallState = "empty" | "pending" | "none" | "partial" | "complete";
export type LateTier = "yellow" | "orange" | "red";

export interface CenterView {
  id: string;
  submitted: boolean;
  submittedLabel: string | null;
  fastest: boolean;
  lateMinutes: number | null;
  lateLabel: string | null;
  lateTier: LateTier | null;
}

export interface TakmeelView {
  state: OverallState;
  submittedCount: number;
  total: number;
  percent: number;
  headline: string;
  beforeDeadline: boolean;
  centers: CenterView[];
}

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

function toArabicDigits(input: string): string {
  return input.replace(/\d/g, (d) => AR_DIGITS[Number(d)]);
}

function parseHHMM(hhmm: string): { h: number; m: number } {
  const [h, m] = hhmm.split(":").map((n) => Number(n));
  return { h, m };
}

function format12h(h: number, m: number): string {
  const suffix = h >= 12 ? "م" : "ص";
  const hh = h % 12 || 12;
  return `${toArabicDigits(String(hh))}:${toArabicDigits(
    String(m).padStart(2, "0"),
  )} ${suffix}`;
}

function lateLabel(minutes: number): string {
  if (minutes < 60) {
    return `متأخر ${toArabicDigits(String(minutes))} دقيقة`;
  }
  const h = Math.floor(minutes / 60);
  const r = minutes % 60;
  const hourWord = h === 1 ? "ساعة" : h === 2 ? "ساعتان" : `${toArabicDigits(String(h))} ساعات`;
  if (r === 0) return `متأخر ${hourWord}`;
  return `متأخر ${hourWord} و ${toArabicDigits(String(r))} دقيقة`;
}

function lateTier(minutes: number): LateTier {
  if (minutes < 30) return "yellow";
  if (minutes <= 60) return "orange";
  return "red";
}

export function deriveTakmeelView(
  centers: CenterTakmeel[],
  now: Date,
): TakmeelView {
  const total = centers.length;

  if (total === 0) {
    return {
      state: "empty",
      submittedCount: 0,
      total: 0,
      percent: 0,
      headline: "لا توجد مراكز مرتبطة بحسابك",
      beforeDeadline: false,
      centers: [],
    };
  }

  const deadline = new Date(now);
  deadline.setHours(DEADLINE_HOUR, 0, 0, 0);
  const beforeDeadline = now < deadline;
  const lateMinutesNow = Math.max(
    0,
    Math.floor((now.getTime() - deadline.getTime()) / 60000),
  );

  const submittedCount = centers.filter((c) => c.submittedAt !== null).length;
  const percent = Math.round((submittedCount / total) * 100);

  // Earliest submitter (only used to mark "fastest" when complete).
  let fastestId: string | null = null;
  let fastestMins = Number.POSITIVE_INFINITY;
  for (const c of centers) {
    if (c.submittedAt === null) continue;
    const { h, m } = parseHHMM(c.submittedAt);
    const mins = h * 60 + m;
    if (mins < fastestMins) {
      fastestMins = mins;
      fastestId = c.id;
    }
  }

  let state: OverallState;
  let headline: string;
  if (beforeDeadline) {
    state = "pending";
    headline = "بانتظار وقت رفع التكميل (٩:٠٠ ص)";
  } else if (submittedCount === total) {
    state = "complete";
    headline = "اكتمل التكميل اليوم ✅";
  } else if (submittedCount === 0) {
    state = "none";
    headline = "لم يرفع أي مركز التكميل";
  } else {
    state = "partial";
    const missing = total - submittedCount;
    headline =
      missing === 1 ? "بانتظار مركز واحد" : `بانتظار ${toArabicDigits(String(missing))} مراكز`;
  }

  const isComplete = state === "complete";

  const centerViews: CenterView[] = centers.map((c) => {
    const submitted = c.submittedAt !== null;
    let submittedLabel: string | null = null;
    if (submitted) {
      const { h, m } = parseHHMM(c.submittedAt as string);
      submittedLabel = format12h(h, m);
    }
    const showLate = !submitted && !beforeDeadline;
    return {
      id: c.id,
      submitted,
      submittedLabel,
      fastest: isComplete && c.id === fastestId,
      lateMinutes: showLate ? lateMinutesNow : null,
      lateLabel: showLate ? lateLabel(lateMinutesNow) : null,
      lateTier: showLate ? lateTier(lateMinutesNow) : null,
    };
  });

  return {
    state,
    submittedCount,
    total,
    percent,
    headline,
    beforeDeadline,
    centers: centerViews,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npx vitest run src/rabea/__tests__/takmeelView.test.ts`
Expected: PASS — 9 passed.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/rabea/takmeelView.ts frontend/src/rabea/__tests__/takmeelView.test.ts
git commit -m "feat(rabea): pure deriveTakmeelView with full state coverage"
```

---

## Task 4: `TakmeelStatusCard` component

**Files:**
- Create: `frontend/src/rabea/TakmeelStatusCard.tsx`
- Test: `frontend/src/rabea/__tests__/TakmeelStatusCard.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/rabea/__tests__/TakmeelStatusCard.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TakmeelStatusCard } from "../TakmeelStatusCard";
import { deriveTakmeelView } from "../takmeelView";

function at(h: number, m: number): Date {
  return new Date(2026, 4, 17, h, m, 0, 0);
}

describe("TakmeelStatusCard", () => {
  it("renders the title and X / total", () => {
    const view = deriveTakmeelView(
      [
        { id: "م22", submittedAt: "07:32" },
        { id: "م23", submittedAt: null },
      ],
      at(9, 23),
    );
    render(<TakmeelStatusCard view={view} />);
    expect(screen.getByText("حالة التكميل اليومي")).toBeInTheDocument();
    expect(screen.getByText("١ / ٢")).toBeInTheDocument();
    expect(screen.getByText("بانتظار مركز واحد")).toBeInTheDocument();
    expect(screen.getByText("متأخر ٢٣ دقيقة")).toBeInTheDocument();
  });

  it("renders the empty state message", () => {
    const view = deriveTakmeelView([], at(10, 0));
    render(<TakmeelStatusCard view={view} />);
    expect(screen.getByText("لا توجد مراكز مرتبطة بحسابك")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/rabea/__tests__/TakmeelStatusCard.test.tsx`
Expected: FAIL — `Cannot find module '../TakmeelStatusCard'`.

- [ ] **Step 3: Write the implementation**

Create `frontend/src/rabea/TakmeelStatusCard.tsx`:

```tsx
import { Clipboard } from "lucide-react";
import type { LateTier, OverallState, TakmeelView } from "./takmeelView";

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const toArabicDigits = (input: string): string =>
  input.replace(/\d/g, (d) => AR_DIGITS[Number(d)]);

const BAR_COLOR: Record<OverallState, string> = {
  empty: "bg-white/20",
  pending: "bg-white/25",
  none: "bg-[#e56050]",
  partial: "bg-[#e89e40]",
  complete: "bg-injaz-green-400",
};

const TIER_TEXT: Record<LateTier, string> = {
  yellow: "text-[#f3b566]",
  orange: "text-[#f0a04b]",
  red: "text-[#ff8a7a]",
};

export function TakmeelStatusCard({ view }: { view: TakmeelView }) {
  if (view.state === "empty") {
    return (
      <Shell>
        <p className="text-center text-sm leading-relaxed opacity-85">
          {view.headline}
          <br />
          <span className="opacity-70">الرجاء التواصل مع مدير النظام</span>
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mb-5 flex items-center gap-2.5 text-[13px] font-medium uppercase tracking-[0.16em] opacity-70">
        <Clipboard size={16} />
        حالة التكميل اليومي
      </div>

      <div className="mb-1 text-center font-display text-[56px] font-extrabold leading-none tabular-nums">
        {toArabicDigits(String(view.submittedCount))} / {toArabicDigits(String(view.total))}
      </div>

      <div className="mx-auto mb-2 mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-500 ${BAR_COLOR[view.state]}`}
          style={{ width: `${view.percent}%` }}
        />
      </div>
      <div className="mb-5 text-center text-sm font-semibold opacity-85">
        {view.headline}
      </div>

      <div className="space-y-2 border-t border-white/10 pt-4">
        {view.centers.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="flex items-center gap-2">
              <span aria-hidden>{c.submitted ? "✅" : "⏳"}</span>
              <span className="opacity-90">مركز {c.id}</span>
              {c.fastest ? (
                <span className="text-injaz-gold-soft">⚡ (الأسرع)</span>
              ) : null}
            </span>
            <span className="tabular-nums opacity-80">
              {c.submitted ? (
                c.submittedLabel
              ) : c.lateLabel ? (
                <span className={c.lateTier ? TIER_TEXT[c.lateTier] : undefined}>
                  {c.lateLabel}
                </span>
              ) : (
                <span className="opacity-50">—</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-[18px] border border-white/10 bg-white/[0.05] px-7 py-6 text-white backdrop-blur-md">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.05), transparent 50%)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/rabea/__tests__/TakmeelStatusCard.test.tsx`
Expected: PASS — 2 passed.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/rabea/TakmeelStatusCard.tsx frontend/src/rabea/__tests__/TakmeelStatusCard.test.tsx
git commit -m "feat(rabea): TakmeelStatusCard presentational component"
```

---

## Task 5: `RabeaWelcomeTransition` provider + overlay

**Files:**
- Create: `frontend/src/rabea/RabeaWelcomeTransition.tsx`

This mirrors `LoginTransition.tsx`'s phase machine (idle → enter → hold → exit) and reuses the global animation classes. It does NOT import or modify `LoginTransition.tsx`. No automated test here (presentational + timers); it is exercised by the integration test in Task 8.

- [ ] **Step 1: Write the implementation**

Create `frontend/src/rabea/RabeaWelcomeTransition.tsx`:

```tsx
import { ArrowLeft } from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { today } from "../lib/clock";
import { getTodayTakmeel } from "./takmeelMock";
import { deriveTakmeelView } from "./takmeelView";
import { TakmeelStatusCard } from "./TakmeelStatusCard";

const ENTER_MS = 1000;
const EXIT_MS = 500;

export type RabeaPhase = "idle" | "enter" | "hold" | "exit";

interface ContextValue {
  phase: RabeaPhase;
  start: () => void;
}

const RabeaWelcomeContext = createContext<ContextValue>({
  phase: "idle",
  start: () => {},
});

export function useRabeaWelcome(): ContextValue {
  return useContext(RabeaWelcomeContext);
}

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const toArabicDigits = (input: string): string =>
  input.replace(/\d/g, (d) => AR_DIGITS[Number(d)]);

function formatLongArabicDate(d: Date): string {
  const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const months = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
  ];
  return `${days[d.getDay()]}، ${toArabicDigits(String(d.getDate()))} ${months[d.getMonth()]} ${toArabicDigits(String(d.getFullYear()))}`;
}

function formatClock(d: Date): string {
  const h = d.getHours() % 12 || 12;
  const m = d.getMinutes();
  const suffix = d.getHours() >= 12 ? "م" : "ص";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${toArabicDigits(pad(h))}:${toArabicDigits(pad(m))} ${suffix}`;
}

export function RabeaWelcomeTransitionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [phase, setPhase] = useState<RabeaPhase>("idle");
  const navigate = useNavigate();
  const timers = useRef<number[]>([]);

  function clearTimers() {
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
  }

  function start() {
    if (phase !== "idle") return;
    clearTimers();
    setPhase("enter");
    timers.current.push(window.setTimeout(() => setPhase("hold"), ENTER_MS));
  }

  function proceed() {
    if (phase !== "hold") return;
    clearTimers();
    setPhase("exit");
    navigate("/operations", { replace: true });
    timers.current.push(window.setTimeout(() => setPhase("idle"), EXIT_MS));
  }

  useEffect(() => () => clearTimers(), []);

  return (
    <RabeaWelcomeContext.Provider value={{ phase, start }}>
      {children}
      {phase !== "idle" ? (
        <RabeaWelcomeOverlay phase={phase} onProceed={proceed} />
      ) : null}
    </RabeaWelcomeContext.Provider>
  );
}

function RabeaWelcomeOverlay({
  phase,
  onProceed,
}: {
  phase: RabeaPhase;
  onProceed: () => void;
}) {
  const [now, setNow] = useState(() => today());

  useEffect(() => {
    // Recompute every 60s so the takmeel card's deadline/late logic and the
    // header clock stay live without flicker (only `now` changes).
    const id = window.setInterval(() => setNow(today()), 60000);
    return () => window.clearInterval(id);
  }, []);

  const view = deriveTakmeelView(getTodayTakmeel(), now);
  const dateLabel = formatLongArabicDate(now);
  const clockLabel = formatClock(now);

  const animationClass =
    phase === "enter"
      ? "animate-welcome-reveal will-change-transform"
      : phase === "exit"
        ? "animate-welcome-leave will-change-transform"
        : "";

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[100] overflow-hidden"
      role="status"
      aria-live="polite"
    >
      <div
        className={`pointer-events-auto absolute inset-0 flex flex-col overflow-hidden bg-gradient-to-b from-[#0a2818] via-[#0d3a24] to-[#14502f] px-8 pb-9 pt-10 text-white md:px-14 ${animationClass}`}
      >
        <BrandShapeBackdrop />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 1200px 800px at 50% 50%, transparent 0%, rgba(10,40,24,0.4) 100%)",
          }}
        />

        <header className="relative z-10 flex flex-wrap items-center justify-between gap-4 opacity-0 animate-fade-slide-1">
          <div className="flex items-center gap-3.5">
            <img
              src="/logo.png"
              alt="إنجاز"
              className="h-12 w-12 rounded-xl object-contain"
            />
            <div className="text-[13px] leading-snug opacity-85">
              <b className="block text-sm font-semibold opacity-100">نظام إنجاز</b>
              لوحة شعبة العمليات
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/85">
            <span className="h-1.5 w-1.5 rounded-full bg-injaz-gold-soft" />
            <span className="tabular-nums">{clockLabel}</span>
          </div>
        </header>

        <div className="relative z-10 my-auto grid grid-cols-1 items-center gap-12 md:grid-cols-[0.9fr_1.1fr]">
          {/* Card first in DOM -> lands on the visual left in RTL, and stacks
              on top on mobile (design spec §4 responsive rule). */}
          <div className="opacity-0 animate-fade-slide-3">
            <TakmeelStatusCard view={view} />
          </div>

          <div className="max-w-[640px]">
            <p className="mb-5 text-xs uppercase tracking-[0.24em] opacity-55 animate-fade-slide-2">
              INJAZ · OPERATIONS CENTER
            </p>
            <h1 className="mb-4 font-display text-[64px] font-extrabold leading-[1.05] tracking-tight opacity-0 animate-fade-slide-2 md:text-[72px]">
              مرحباً بعودتك
              <br />
              <em className="font-extrabold not-italic text-injaz-gold-soft">
                إنجاز ٩.
              </em>
            </h1>
            <div className="mb-8 flex flex-wrap items-center gap-3 text-base opacity-75 animate-fade-slide-3">
              <span>{dateLabel}</span>
              <span className="h-1 w-1 rounded-full bg-white/40" />
              <span>ربيع - مدير شعبة العمليات</span>
            </div>

            <div className="opacity-0 animate-fade-slide-4">
              <button
                type="button"
                onClick={onProceed}
                disabled={phase !== "hold"}
                className="group inline-flex items-center gap-3.5 rounded-full bg-injaz-gold-soft px-8 py-[18px] text-[15px] font-semibold tracking-wide text-[#0d3a24] shadow-[0_12px_32px_rgba(232,217,184,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_44px_rgba(232,217,184,0.28)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span>الانتقال إلى لوحة التحكم</span>
                <ArrowLeft
                  size={18}
                  className="transition-transform duration-200 group-hover:-translate-x-1.5"
                />
              </button>
            </div>
          </div>
        </div>

        <footer className="relative z-10 mt-5 flex items-center justify-between border-t border-white/10 pt-[18px] text-[11px] tracking-wide opacity-55 animate-fade-slide-5">
          <span>نظام إنجاز · شعبة العمليات</span>
          <span>الإصدار ٢٢.٤.١</span>
        </footer>
      </div>
    </div>
  );
}

function BrandShapeBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.18]"
    >
      <div
        className="relative w-[78%] max-w-[1100px] animate-shape-drift-slow"
        style={{ filter: "drop-shadow(0 30px 80px rgba(0,0,0,0.4))" }}
      >
        <img src="/shape.webp" alt="" className="block h-auto w-full" />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check the new file**

Run: `cd frontend && npx tsc -p tsconfig.app.json --noEmit 2>&1 | grep RabeaWelcomeTransition || echo "no RabeaWelcomeTransition errors"`
Expected: `no RabeaWelcomeTransition errors`.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/rabea/RabeaWelcomeTransition.tsx
git commit -m "feat(rabea): welcome transition provider + overlay (reused choreography)"
```

---

## Task 6: `OperationsPlaceholderPage`

**Files:**
- Create: `frontend/src/rabea/OperationsPlaceholderPage.tsx`
- Test: `frontend/src/rabea/__tests__/OperationsPlaceholderPage.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/rabea/__tests__/OperationsPlaceholderPage.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { OperationsPlaceholderPage } from "../OperationsPlaceholderPage";
import { setRabeaMode } from "../rabeaSession";

describe("OperationsPlaceholderPage", () => {
  afterEach(() => setRabeaMode(false));

  it("shows the under-construction message when in rabea mode", () => {
    setRabeaMode(true);
    render(
      <MemoryRouter>
        <OperationsPlaceholderPage />
      </MemoryRouter>,
    );
    expect(
      screen.getByText("لوحة شعبة العمليات — قيد التطوير"),
    ).toBeInTheDocument();
  });

  it("redirects away when not in rabea mode", () => {
    setRabeaMode(false);
    render(
      <MemoryRouter initialEntries={["/operations"]}>
        <OperationsPlaceholderPage />
      </MemoryRouter>,
    );
    expect(
      screen.queryByText("لوحة شعبة العمليات — قيد التطوير"),
    ).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/rabea/__tests__/OperationsPlaceholderPage.test.tsx`
Expected: FAIL — `Cannot find module '../OperationsPlaceholderPage'`.

- [ ] **Step 3: Write the implementation**

Create `frontend/src/rabea/OperationsPlaceholderPage.tsx`:

```tsx
import { Construction } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { isRabeaMode } from "./rabeaSession";

export function OperationsPlaceholderPage() {
  const navigate = useNavigate();

  if (!isRabeaMode()) {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#0a2818] via-[#0d3a24] to-[#14502f] px-8 text-center text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.15]"
      >
        <img
          src="/shape.webp"
          alt=""
          className="w-[70%] max-w-[900px] animate-shape-drift-slow"
        />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-5">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-injaz-gold-soft/25 bg-injaz-gold-soft/10 text-injaz-gold-soft">
          <Construction size={32} strokeWidth={1.7} />
        </span>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          لوحة شعبة العمليات — قيد التطوير
        </h1>
        <p className="max-w-[420px] text-sm leading-relaxed opacity-75">
          هذه اللوحة قيد الإنشاء وستتوفر في تحديث قادم.
        </p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold transition-colors hover:bg-white/10"
        >
          العودة للصفحة الترحيبية
        </button>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/rabea/__tests__/OperationsPlaceholderPage.test.tsx`
Expected: PASS — 2 passed.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/rabea/OperationsPlaceholderPage.tsx frontend/src/rabea/__tests__/OperationsPlaceholderPage.test.tsx
git commit -m "feat(rabea): /operations under-construction placeholder page"
```

---

## Task 7: Guarded `REB9` branch in `LoginPage`

**Files:**
- Modify: `frontend/src/pages/LoginPage.tsx`

The only edit: an early-return at the top of `handleSubmit`, before the backend `login()` call. The Injaz branch is unchanged.

- [ ] **Step 1: Add the import**

In `frontend/src/pages/LoginPage.tsx`, the existing import block (lines 1-8) ends with:

```tsx
import { useLoginTransition } from "../components/LoginTransition";
```

Add immediately after it:

```tsx
import { useRabeaWelcome } from "../rabea/RabeaWelcomeTransition";
import { RABEA_PASSWORD, RABEA_USERNAME, setRabeaMode } from "../rabea/rabeaSession";
```

- [ ] **Step 2: Read the Rabea transition hook in the component body**

Find this existing line:

```tsx
  const { phase, start } = useLoginTransition();
```

Add immediately after it:

```tsx
  const { start: startRabea } = useRabeaWelcome();
```

- [ ] **Step 3: Add the guarded early-return in `handleSubmit`**

Find this existing block:

```tsx
    if (!username || !password) {
      setError("الحقول مطلوبة لإكمال تسجيل الدخول");
      return;
    }
    setSubmitting(true);
```

Replace it with (adds ONLY the REB9 branch between the empty-check and `setSubmitting`):

```tsx
    if (!username || !password) {
      setError("الحقول مطلوبة لإكمال تسجيل الدخول");
      return;
    }
    if (username === RABEA_USERNAME && password === RABEA_PASSWORD) {
      // Frontend-only Rabea gate: never hits the backend (REB9 is not a real
      // account). Injaz path below is unchanged for every other user.
      setRabeaMode(true);
      startRabea();
      return;
    }
    setSubmitting(true);
```

- [ ] **Step 4: Type-check**

Run: `cd frontend && npx tsc -p tsconfig.app.json --noEmit 2>&1 | grep LoginPage || echo "no LoginPage errors"`
Expected: `no LoginPage errors`.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/LoginPage.tsx
git commit -m "feat(rabea): guarded REB9 early-return in LoginPage handleSubmit"
```

---

## Task 8: Wire provider + route in `App.tsx` and integration smoke test

**Files:**
- Modify: `frontend/src/App.tsx`
- Test: `frontend/src/rabea/__tests__/rabeaLogin.test.tsx`

- [ ] **Step 1: Write the failing integration test**

Create `frontend/src/rabea/__tests__/rabeaLogin.test.tsx`:

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

  beforeEach(() => {
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

  it("REB9 opens the Rabea welcome without calling the login API", async () => {
    render(<App />);
    const user = userEvent.setup();

    await screen.findByText("تسجيل الدخول");
    await user.type(screen.getByPlaceholderText("اسم المستخدم"), "REB9");
    await user.type(screen.getByPlaceholderText("••••••••••"), "1234567891");
    await user.click(screen.getByRole("button", { name: "تسجيل الدخول" }));

    await screen.findByText("ربيع - مدير شعبة العمليات");
    expect(screen.getByText("حالة التكميل اليومي")).toBeInTheDocument();

    const loginCalls = fetchMock.mock.calls.filter((c) =>
      String(c[0]).includes("/api/auth/login"),
    );
    expect(loginCalls).toHaveLength(0);
  });

  it("a non-REB9 user still goes through the backend login (Injaz path)", async () => {
    render(<App />);
    const user = userEvent.setup();

    await screen.findByText("تسجيل الدخول");
    await user.type(screen.getByPlaceholderText("اسم المستخدم"), "somechief");
    await user.type(screen.getByPlaceholderText("••••••••••"), "passwordlong");
    await user.click(screen.getByRole("button", { name: "تسجيل الدخول" }));

    await waitFor(() => {
      const loginCalls = fetchMock.mock.calls.filter((c) =>
        String(c[0]).includes("/api/auth/login"),
      );
      expect(loginCalls.length).toBeGreaterThan(0);
    });
    expect(
      screen.queryByText("ربيع - مدير شعبة العمليات"),
    ).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/rabea/__tests__/rabeaLogin.test.tsx`
Expected: FAIL — `useRabeaWelcome` context default (no provider) means clicking does nothing; "ربيع - مدير شعبة العمليات" never appears.

- [ ] **Step 3: Modify `App.tsx` — imports**

In `frontend/src/App.tsx`, after this existing line:

```tsx
import { LoginTransitionProvider } from "./components/LoginTransition";
```

add:

```tsx
import { OperationsPlaceholderPage } from "./rabea/OperationsPlaceholderPage";
import { RabeaWelcomeTransitionProvider } from "./rabea/RabeaWelcomeTransition";
```

- [ ] **Step 4: Modify `App.tsx` — wrap provider + add route**

Find this existing block:

```tsx
        <LoginTransitionProvider>
        <Routes>
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/login" element={<LoginPage />} />
```

Replace it with:

```tsx
        <LoginTransitionProvider>
        <RabeaWelcomeTransitionProvider>
        <Routes>
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/operations" element={<OperationsPlaceholderPage />} />
```

Then find the existing closing block:

```tsx
        </Routes>
        </LoginTransitionProvider>
```

Replace it with:

```tsx
        </Routes>
        </RabeaWelcomeTransitionProvider>
        </LoginTransitionProvider>
```

- [ ] **Step 5: Run the integration test to verify it passes**

Run: `cd frontend && npx vitest run src/rabea/__tests__/rabeaLogin.test.tsx`
Expected: PASS — 2 passed.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/App.tsx frontend/src/rabea/__tests__/rabeaLogin.test.tsx
git commit -m "feat(rabea): wire RabeaWelcome provider + /operations route + integration test"
```

---

## Task 9: Full regression + Injaz untouched guard

**Files:** none (verification only)

- [ ] **Step 1: Confirm `LoginTransition.tsx` was never modified**

Run: `git log --oneline -- frontend/src/components/LoginTransition.tsx | head -1` and `git diff main -- frontend/src/components/LoginTransition.tsx`
Expected: `git diff` prints nothing (no changes to the Injaz transition on this branch vs `main`).

- [ ] **Step 2: Run the full frontend test suite**

Run: `cd frontend && npx vitest run`
Expected: PASS — all suites pass, including the pre-existing Injaz/employees/vehicles/building tests (no regressions) and the new `rabea/` suites.

- [ ] **Step 3: Type-check the whole frontend**

Run: `cd frontend && npx tsc -p tsconfig.app.json --noEmit 2>&1 | grep -E "rabea/|LoginPage|App.tsx" || echo "no errors in changed files"`
Expected: `no errors in changed files`. (Pre-existing unrelated errors in `DashboardPage.tsx`/`RatingsTab.tsx` are out of scope and must not be "fixed" here.)

- [ ] **Step 4: Lint the changed files**

Run: `cd frontend && npx eslint src/rabea src/pages/LoginPage.tsx src/App.tsx`
Expected: no errors.

- [ ] **Step 5: Manual smoke (dev server)**

With backend on `:8443` and `npm run dev` running, open `http://localhost:5173/login`:
1. Login with `REB9` / `1234567891` → Rabea welcome overlay appears (green identity, "إنجاز ٩.", "ربيع - مدير شعبة العمليات", takmeel card for م22/م23). The login API is NOT called.
2. Click "الانتقال إلى لوحة التحكم" → navigates to `/operations` "قيد التطوير" page.
3. Open a fresh tab at `/operations` directly (no rabea flag) → redirected to `/login`.
4. Login with the real Injaz chief account → existing Injaz welcome + dashboard, completely unchanged.

- [ ] **Step 6: Final commit (if any lint/format fixups were needed)**

```bash
git add -A frontend/src/rabea frontend/src/pages/LoginPage.tsx frontend/src/App.tsx
git commit -m "chore(rabea): lint/format fixups" --allow-empty
```

---

## Self-Review

**1. Spec coverage:**
- Spec §0/§1 scope (no backend/DB, frontend-only) → Tasks 1-8 touch only frontend; Task 9 Step 1 guards Injaz untouched. ✓
- Spec §2 (safe "B": shared CSS, duplicated shell, `LoginTransition.tsx` untouched) → Task 5 duplicates the shell using global `animate-*` classes; Task 9 Step 1 verifies no diff. ✓
- Spec §2 two minimal edits → Task 7 (`LoginPage`), Task 8 (`App.tsx`). ✓
- Spec §3 (REB9 constants, sessionStorage flag, early-return, deviation: overlay not `/operations-welcome`, `/operations` guarded) → Tasks 1, 6, 7, 8. ✓
- Spec §4 (header w/o alert pills, "إنجاز ٩.", dynamic date, "ربيع - مدير شعبة العمليات", always-enabled CTA, responsive card-first) → Task 5. ✓
- Spec §5 (📋 title, X/2, colored bar, per-center rows, mock data, real 09:00 logic, all states, fastest ⚡, late tiers, empty, 60s refresh, before-deadline counts-but-no-judgment) → Tasks 2, 3, 4 + Task 5 60s interval. ✓
- Spec §6 (`/operations` placeholder, brand shell, back button, flag guard) → Task 6. ✓
- Spec §7 (unit tests all states, smoke REB9 vs other, Injaz regression guard, tsc+test clean) → Tasks 3, 8, 9. ✓
- Spec §8 file list → matches the File Structure table exactly. ✓

**2. Placeholder scan:** No "TBD"/"TODO"/"add error handling"/"similar to Task N". Task 8 deliberately writes a broken test then overwrites it with the full corrected file in Step 5 (complete code shown in both steps). ✓

**3. Type consistency:** `CenterTakmeel { id, submittedAt }` (Task 2) used identically in Tasks 3, 5. `TakmeelView`/`CenterView`/`OverallState`/`LateTier` defined in Task 3 and consumed with matching field names in Task 4 (`view.state`, `view.percent`, `c.lateTier`, `c.submittedLabel`, `c.fastest`, `c.lateLabel`). `useRabeaWelcome`/`RabeaWelcomeTransitionProvider` defined in Task 5, imported in Tasks 7/8 with exact names. `setRabeaMode`/`isRabeaMode`/`RABEA_USERNAME`/`RABEA_PASSWORD` defined in Task 1, used in Tasks 6/7/8. ✓
