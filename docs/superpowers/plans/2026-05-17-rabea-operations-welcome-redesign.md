# Rabea Operations Welcome — Redesign From Handoff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Rabea welcome transition-overlay with a standalone `/operations-welcome` page that faithfully reproduces `design_handoff_welcome_page_rabe/welcome.html` (top bar + greeting + completion panel with SVG ring + centers list + footer), wired to mock data with live time logic, frontend-only.

**Architecture:** New standalone page + focused presentational subcomponents under `frontend/src/rabea/welcome/`. The pure logic in `takmeelView.ts` is extended (still pure, `now` injected) to derive ring/percent/counts/summary/per-center display fields. REB9 login navigates to the new route instead of starting the overlay; the old overlay files are kept as retained dead code (user decision). `LoginTransition.tsx` and all backend/DB are untouched. Design tokens are applied via Tailwind arbitrary values; IBM Plex Mono is added to the existing Google Fonts link.

**Tech Stack:** React 19, TypeScript, react-router-dom v6, Tailwind (RTL), lucide-react, Vitest + Testing Library, `lib/clock` `today()`.

---

## File Structure

| File | Responsibility |
|---|---|
| `frontend/index.html` (modify) | add IBM Plex Mono to existing Google Fonts `<link>` |
| `frontend/tailwind.config.js` (modify) | add `fontFamily.mono` |
| `frontend/src/rabea/takmeelMock.ts` (modify) | add `region` + `responsible` to `CenterTakmeel` + data |
| `frontend/src/rabea/takmeelView.ts` (modify) | extend `TakmeelView`/`CenterView` with ring/percent/counts/summary/display fields |
| `frontend/src/rabea/__tests__/takmeelView.test.ts` (modify) | extend unit tests for new derivations |
| `frontend/src/rabea/welcome/CountRing.tsx` (new) | SVG progress ring + center label |
| `frontend/src/rabea/welcome/CentersList.tsx` (new) | centers detail rows |
| `frontend/src/rabea/welcome/CompletionPanel.tsx` (new) | panel head + ring + side stats + CentersList + empty/all-complete |
| `frontend/src/rabea/welcome/WelcomeTopBar.tsx` (new) | brand + alert pill + date pill + bell |
| `frontend/src/rabea/welcome/WelcomeGreeting.tsx` (new) | eyebrow + h1 + role chip + summary + 2 buttons |
| `frontend/src/rabea/welcome/WelcomeFooter.tsx` (new) | footer line |
| `frontend/src/rabea/OperationsWelcomePage.tsx` (new) | page: bg + grid + guard + 60s tick + composes the above |
| `frontend/src/rabea/__tests__/OperationsWelcomePage.test.tsx` (new) | page render + guard test |
| `frontend/src/pages/LoginPage.tsx` (modify) | REB9 branch → `navigate("/operations-welcome")` |
| `frontend/src/App.tsx` (modify) | remove provider wrap, add `/operations-welcome` route |
| `frontend/src/rabea/__tests__/rabeaLogin.test.tsx` (modify) | integration test for the new navigation flow |

**Commit hygiene:** `LoginPage.tsx` and `App.tsx` carry pre-existing UNRELATED uncommitted hunks (a `LeavesPage` import + `/leaves` route in App.tsx; a brand-aside `flex flex-col items-start text-start` class on a `<div>` in LoginPage.tsx). Tasks 14–15 commit ONLY the Rabea hunks and restore the pre-existing hunks to the working tree, exactly as done in the phase-1 plan. NEVER `git add -A`. Every commit message ends with a blank line then:
`Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`

**Environment:** Windows/PowerShell. From `c:\Users\Admin\Desktop\Markaz\frontend`: tests `& 'node_modules\.bin\vitest.cmd' run <path>`; typecheck `& 'node_modules\.bin\tsc.cmd' -p tsconfig.app.json --noEmit` (exits non-zero on pre-existing DashboardPage/RatingsTab errors — only care about NO errors in changed files). Do NOT use `npx`. Do NOT modify `frontend/src/components/LoginTransition.tsx`.

---

## Task 1: Add IBM Plex Mono font

**Files:**
- Modify: `frontend/index.html`
- Modify: `frontend/tailwind.config.js`

- [ ] **Step 1: Edit `frontend/index.html`** — replace exactly:

```
      href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Tajawal:wght@300;400;500;700;800&display=swap"
```
with:
```
      href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Tajawal:wght@300;400;500;700;800&display=swap"
```

- [ ] **Step 2: Edit `frontend/tailwind.config.js`** — find:

```js
        sans: ['"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
        display: ['Tajawal', '"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
```
Replace with (adds the `mono` line, keeps the others byte-for-byte):
```js
        sans: ['"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
        display: ['Tajawal', '"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
```

- [ ] **Step 3: Typecheck sanity**

Run: `& 'node_modules\.bin\tsc.cmd' -p tsconfig.app.json --noEmit 2>&1 | Select-String -Pattern "index.html|tailwind.config"`
Expected: no output (config/html aren't typechecked; this just confirms nothing broke).

- [ ] **Step 4: Commit**

```
git add frontend/index.html frontend/tailwind.config.js
git commit -m "feat(rabea): add IBM Plex Mono font for numerals

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Extend the mock data

**Files:**
- Modify: `frontend/src/rabea/takmeelMock.ts`

- [ ] **Step 1: Overwrite `frontend/src/rabea/takmeelMock.ts`** with:

```ts
// Static phase-1 takmeel data for Rabea's centers. Single swap point for a
// future real API (design spec 2026-05-17). `submittedAt` is local 24h
// "HH:MM" or null when the center has not submitted. `id` is rendered with
// Arabic-Indic digits by the view layer.

export interface CenterTakmeel {
  id: string;
  region: string;
  responsible: string;
  submittedAt: string | null;
}

export function getTodayTakmeel(): CenterTakmeel[] {
  return [
    { id: "م22", region: "جازان", responsible: "عبدالله الزهراني", submittedAt: "07:32" },
    { id: "م23", region: "صبيا", responsible: "سامي القرني", submittedAt: null },
  ];
}
```

- [ ] **Step 2: Verify existing takmeelView tests still pass (backward compatible)**

Run: `& 'node_modules\.bin\vitest.cmd' run src/rabea/__tests__/takmeelView.test.ts`
Expected: PASS (the extra fields don't break existing logic).

- [ ] **Step 3: Commit**

```
git add frontend/src/rabea/takmeelMock.ts
git commit -m "feat(rabea): add region + responsible to CenterTakmeel mock

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Extend `deriveTakmeelView` (TDD)

**Files:**
- Modify: `frontend/src/rabea/takmeelView.ts`
- Modify: `frontend/src/rabea/__tests__/takmeelView.test.ts`

- [ ] **Step 1: Append failing tests** to the END of the existing `describe("deriveTakmeelView", () => { ... })` block in `frontend/src/rabea/__tests__/takmeelView.test.ts` (insert these `it(...)` blocks just before the closing `});` of the describe). The existing `at(h,m)` helper and imports are reused. Add at top of file, after the existing import line `import type { CenterTakmeel } from "../takmeelMock";`, nothing new is needed (CenterTakmeel now has region/responsible; tests below supply them).

```ts
  const TWO: CenterTakmeel[] = [
    { id: "م22", region: "جازان", responsible: "عبدالله الزهراني", submittedAt: "07:32" },
    { id: "م23", region: "صبيا", responsible: "سامي القرني", submittedAt: null },
  ];

  it("derives ring + percent + counts (1 of 2 after deadline)", () => {
    const v = deriveTakmeelView(TWO, at(17, 19));
    expect(v.ringCircumference).toBeCloseTo(427.26, 2);
    expect(v.ringDash).toBe(`${(0.5 * 427.26).toFixed(2)} 427.26`);
    expect(v.percentLabel).toBe("٥٠٪");
    expect(v.completedCount).toBe(1);
    expect(v.pendingCount).toBe(1);
  });

  it("builds the pendingAfterDeadline summary", () => {
    const v = deriveTakmeelView(TWO, at(17, 19));
    expect(v.summary.kind).toBe("pendingAfterDeadline");
    expect(v.summary.pendingCount).toBe(1);
    expect(v.summary.firstPendingName).toBe("مركز م٢٣");
    expect(v.summary.firstPendingDelayLabel).toBe(v.centers.find((c) => c.id === "م23")!.lateLabel);
  });

  it("builds the allComplete summary", () => {
    const both: CenterTakmeel[] = [
      { id: "م22", region: "جازان", responsible: "ع", submittedAt: "07:32" },
      { id: "م23", region: "صبيا", responsible: "س", submittedAt: "07:51" },
    ];
    const v = deriveTakmeelView(both, at(10, 0));
    expect(v.summary.kind).toBe("allComplete");
    expect(v.summary.firstPendingName).toBeNull();
  });

  it("builds the beforeDeadline summary", () => {
    const v = deriveTakmeelView(TWO, at(8, 0));
    expect(v.summary.kind).toBe("beforeDeadline");
    expect(v.summary.pendingCount).toBe(1);
  });

  it("empty summary kind for no centers", () => {
    const v = deriveTakmeelView([], at(10, 0));
    expect(v.summary.kind).toBe("empty");
  });

  it("per-center display fields (completed vs pending)", () => {
    const v = deriveTakmeelView(TWO, at(17, 19));
    const done = v.centers.find((c) => c.id === "م22")!;
    expect(done.regionLabel).toBe("مركز م٢٢ · جازان");
    expect(done.subText).toBe("تم التكميل في الموعد · المسؤول: عبدالله الزهراني");
    expect(done.metaTime).toBe("٧:٣٢ ص");
    expect(done.metaSub).toBe("اليوم");
    const wait = v.centers.find((c) => c.id === "م23")!;
    expect(wait.regionLabel).toBe("مركز م٢٣ · صبيا");
    expect(wait.subText).toBe(`متأخر ${wait.lateLabel} · المسؤول: سامي القرني`);
    expect(wait.metaTime).toBe("— —:—");
    expect(wait.metaSub).toBe("غير مُسجّل");
  });
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `& 'node_modules\.bin\vitest.cmd' run src/rabea/__tests__/takmeelView.test.ts`
Expected: FAIL — `ringCircumference`/`ringDash`/`percentLabel`/`completedCount`/`pendingCount`/`summary`/`regionLabel`/`subText`/`metaTime`/`metaSub` are not on the returned objects.

- [ ] **Step 3: Edit `frontend/src/rabea/takmeelView.ts`**

3a. Replace the `CenterView` interface (lines 10–24) with:

```ts
export interface CenterView {
  id: string;
  submitted: boolean;
  /** Arabic-digit 12h label (e.g. "٧:٣٢ ص") when submitted; null otherwise. */
  submittedLabel: string | null;
  /** Only meaningful when the overall state is "complete": true for the
   *  earliest submitter. Always false in every other state. */
  fastest: boolean;
  /** Late metrics are non-null ONLY for a center that has not submitted AND
   *  the 09:00 deadline has passed. Null for submitted centers and before
   *  the deadline. */
  lateMinutes: number | null;
  lateLabel: string | null;
  lateTier: LateTier | null;
  /** Display fields for the redesigned page. */
  regionLabel: string; // "مركز م٢٢ · جازان"
  subText: string;     // completed/pending descriptive line
  metaTime: string;    // "٧:٣٢ ص" or "— —:—"
  metaSub: string;     // "اليوم" / "غير مُسجّل" / "قبل الموعد"
}
```

3b. Replace the `TakmeelView` interface (originally lines 26–34) with:

```ts
export type SummaryKind = "allComplete" | "beforeDeadline" | "pendingAfterDeadline" | "empty";

export interface TakmeelSummary {
  kind: SummaryKind;
  pendingCount: number;
  firstPendingName: string | null;
  firstPendingDelayLabel: string | null;
}

export interface TakmeelView {
  state: OverallState;
  submittedCount: number;
  total: number;
  percent: number;
  headline: string;
  beforeDeadline: boolean;
  completedCount: number;
  pendingCount: number;
  percentLabel: string;          // "٥٠٪"
  ringCircumference: number;     // 427.26
  ringDash: string;              // "213.63 427.26"
  summary: TakmeelSummary;
  centers: CenterView[];
}
```

3c. Add this constant just after `const AR_DIGITS = "٠١٢٣٤٥٦٧٨٦"` line — use exactly:

```ts
const RING_CIRCUMFERENCE = 427.26; // 2π·68, matches handoff ring r=68
```

(Place it on its own line immediately after the `const AR_DIGITS = "...";` line.)

3d. In the `total === 0` early-return object, replace it entirely with:

```ts
  if (total === 0) {
    return {
      state: "empty",
      submittedCount: 0,
      total: 0,
      percent: 0,
      headline: "لا توجد مراكز مرتبطة بحسابك",
      beforeDeadline: false,
      completedCount: 0,
      pendingCount: 0,
      percentLabel: "٠٪",
      ringCircumference: RING_CIRCUMFERENCE,
      ringDash: `0.00 ${RING_CIRCUMFERENCE}`,
      summary: { kind: "empty", pendingCount: 0, firstPendingName: null, firstPendingDelayLabel: null },
      centers: [],
    };
  }
```

3e. Replace the `centerViews` map and the final `return { ... }` (originally lines 134–161) with:

```ts
  const pendingCount = total - submittedCount;

  const centerViews: CenterView[] = centers.map((c) => {
    const submitted = c.submittedAt !== null;
    let submittedLabel: string | null = null;
    if (submitted) {
      const { h, m } = parseHHMM(c.submittedAt as string);
      submittedLabel = format12h(h, m);
    }
    const showLate = !submitted && !beforeDeadline;
    const cLateLabel = showLate ? lateLabel(lateMinutesNow) : null;
    const regionLabel = `مركز ${toArabicDigits(c.id)} · ${c.region}`;
    let subText: string;
    if (submitted) {
      subText = `تم التكميل في الموعد · المسؤول: ${c.responsible}`;
    } else if (showLate) {
      subText = `متأخر ${cLateLabel} · المسؤول: ${c.responsible}`;
    } else {
      subText = `قبل موعد التكميل · المسؤول: ${c.responsible}`;
    }
    const metaTime = submitted ? (submittedLabel as string) : "— —:—";
    const metaSub = submitted ? "اليوم" : beforeDeadline ? "قبل الموعد" : "غير مُسجّل";
    return {
      id: c.id,
      submitted,
      submittedLabel,
      fastest: isComplete && c.id === fastestId,
      lateMinutes: showLate ? lateMinutesNow : null,
      lateLabel: cLateLabel,
      lateTier: showLate ? lateTier(lateMinutesNow) : null,
      regionLabel,
      subText,
      metaTime,
      metaSub,
    };
  });

  const firstPending = centerViews.find((c) => !c.submitted) ?? null;
  let summaryKind: SummaryKind;
  if (state === "complete") summaryKind = "allComplete";
  else if (beforeDeadline) summaryKind = "beforeDeadline";
  else summaryKind = "pendingAfterDeadline";
  const summary: TakmeelSummary = {
    kind: summaryKind,
    pendingCount,
    firstPendingName:
      summaryKind === "pendingAfterDeadline" && firstPending ? firstPending.regionLabel.split(" · ")[0] : null,
    firstPendingDelayLabel:
      summaryKind === "pendingAfterDeadline" && firstPending ? firstPending.lateLabel : null,
  };

  return {
    state,
    submittedCount,
    total,
    percent,
    headline,
    beforeDeadline,
    completedCount: submittedCount,
    pendingCount,
    percentLabel: `${toArabicDigits(String(percent))}٪`,
    ringCircumference: RING_CIRCUMFERENCE,
    ringDash: `${(percent / 100 * RING_CIRCUMFERENCE).toFixed(2)} ${RING_CIRCUMFERENCE}`,
    summary,
    centers: centerViews,
  };
```

(`isComplete` and `fastestId` remain defined earlier in the function as before; `pendingCount` is now defined once here — ensure no duplicate `const pendingCount`.)

- [ ] **Step 4: Run tests to verify all pass**

Run: `& 'node_modules\.bin\vitest.cmd' run src/rabea/__tests__/takmeelView.test.ts`
Expected: PASS — all original + 6 new tests green.

- [ ] **Step 5: Typecheck**

Run: `& 'node_modules\.bin\tsc.cmd' -p tsconfig.app.json --noEmit 2>&1 | Select-String -Pattern "takmeelView"`
Expected: no output (no errors in takmeelView).

- [ ] **Step 6: Commit**

```
git add frontend/src/rabea/takmeelView.ts frontend/src/rabea/__tests__/takmeelView.test.ts
git commit -m "feat(rabea): extend deriveTakmeelView with ring/percent/summary/display fields

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: `CountRing` component

**Files:**
- Create: `frontend/src/rabea/welcome/CountRing.tsx`
- Test: `frontend/src/rabea/__tests__/CountRing.test.tsx`

- [ ] **Step 1: Failing test** — create `frontend/src/rabea/__tests__/CountRing.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CountRing } from "../welcome/CountRing";

describe("CountRing", () => {
  it("renders the big completed number, total, caption and aria-label", () => {
    render(
      <CountRing completedLabel="١" totalLabel="٢" dash="213.63 427.26" circumference={427.26} />,
    );
    expect(screen.getByText("١")).toBeInTheDocument();
    expect(screen.getByText("/ ٢")).toBeInTheDocument();
    expect(screen.getByText("مركز أكمل اليوم")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "١ من ٢ مركز أكمل التكميل" }),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test — expect FAIL** (`Cannot find module '../welcome/CountRing'`)

Run: `& 'node_modules\.bin\vitest.cmd' run src/rabea/__tests__/CountRing.test.tsx`

- [ ] **Step 3: Create `frontend/src/rabea/welcome/CountRing.tsx`:**

```tsx
interface Props {
  completedLabel: string; // "١"
  totalLabel: string;     // "٢"
  dash: string;           // "213.63 427.26"
  circumference: number;  // 427.26
}

export function CountRing({ completedLabel, totalLabel, dash }: Props) {
  return (
    <div
      className="relative h-40 w-40 max-[980px]:h-[130px] max-[980px]:w-[130px]"
      role="img"
      aria-label={`${completedLabel} من ${totalLabel} مركز أكمل التكميل`}
    >
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
        <circle
          cx="80"
          cy="80"
          r="68"
          fill="none"
          stroke="rgba(245,241,230,.08)"
          strokeWidth="12"
        />
        <circle
          cx="80"
          cy="80"
          r="68"
          fill="none"
          stroke="url(#rabea-ring)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={dash}
          className="motion-safe:[transition:stroke-dasharray_1.1s_ease-out]"
        />
        <defs>
          <linearGradient id="rabea-ring" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#46a96a" />
            <stop offset="100%" stopColor="#d9c79a" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="font-display text-[56px] font-extrabold leading-none tracking-tight text-[#f5f1e6] tabular-nums max-[980px]:text-[46px]">
          {completedLabel}
          <span className="text-[28px] font-semibold text-[#a9b8ad]"> / {totalLabel}</span>
        </div>
        <div className="mt-1.5 text-[11px] tracking-[0.02em] text-[#a9b8ad]">
          مركز أكمل اليوم
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test — expect PASS** (1 passed)

Run: `& 'node_modules\.bin\vitest.cmd' run src/rabea/__tests__/CountRing.test.tsx`

- [ ] **Step 5: Commit**

```
git add frontend/src/rabea/welcome/CountRing.tsx frontend/src/rabea/__tests__/CountRing.test.tsx
git commit -m "feat(rabea): CountRing SVG progress component

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: `CentersList` component

**Files:**
- Create: `frontend/src/rabea/welcome/CentersList.tsx`
- Test: `frontend/src/rabea/__tests__/CentersList.test.tsx`

- [ ] **Step 1: Failing test** — create `frontend/src/rabea/__tests__/CentersList.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CentersList } from "../welcome/CentersList";
import { deriveTakmeelView } from "../takmeelView";

function at(h: number, m: number) {
  return new Date(2026, 4, 17, h, m, 0, 0);
}

describe("CentersList", () => {
  it("renders a row per center with name, sub and meta", () => {
    const v = deriveTakmeelView(
      [
        { id: "م22", region: "جازان", responsible: "عبدالله الزهراني", submittedAt: "07:32" },
        { id: "م23", region: "صبيا", responsible: "سامي القرني", submittedAt: null },
      ],
      at(17, 19),
    );
    render(<CentersList centers={v.centers} />);
    expect(screen.getByText("مركز م٢٢ · جازان")).toBeInTheDocument();
    expect(screen.getByText("مركز م٢٣ · صبيا")).toBeInTheDocument();
    expect(screen.getByText("تفاصيل المراكز")).toBeInTheDocument();
    expect(screen.getByText("إدارة المراكز ←")).toBeInTheDocument();
    expect(screen.getByText("٧:٣٢ ص")).toBeInTheDocument();
    expect(screen.getByText("غير مُسجّل")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test — expect FAIL** (module not found)

Run: `& 'node_modules\.bin\vitest.cmd' run src/rabea/__tests__/CentersList.test.tsx`

- [ ] **Step 3: Create `frontend/src/rabea/welcome/CentersList.tsx`:**

```tsx
import { Check, Hourglass } from "lucide-react";
import type { CenterView } from "../takmeelView";

export function CentersList({ centers }: { centers: CenterView[] }) {
  return (
    <div className="mt-[18px] border-t border-dashed border-[rgba(245,241,230,.16)] pt-[18px]">
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="m-0 text-[12px] font-semibold tracking-[0.04em] text-[#a9b8ad]">
          تفاصيل المراكز
        </h3>
        <span className="cursor-default text-[11.5px] text-[#d9c79a]">إدارة المراكز ←</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {centers.map((c) => {
          const ok = c.submitted;
          return (
            <div
              key={c.id}
              className="grid grid-cols-[22px_1fr_auto] items-center gap-3 rounded-[12px] border border-[rgba(245,241,230,.10)] bg-[rgba(245,241,230,.025)] px-3 py-2.5 transition-colors hover:border-[rgba(245,241,230,.16)] hover:bg-[rgba(245,241,230,.05)]"
            >
              <span
                className={`grid h-[22px] w-[22px] place-items-center rounded-full ${
                  ok
                    ? "bg-[rgba(70,169,106,.16)] text-[#46a96a]"
                    : "bg-[rgba(225,160,74,.16)] text-[#e1a04a]"
                }`}
                aria-hidden="true"
              >
                {ok ? <Check size={13} /> : <Hourglass size={13} />}
              </span>
              <div>
                <div className="text-[13.5px] font-semibold text-[#f5f1e6]">{c.regionLabel}</div>
                <div
                  className={`mt-px text-[11.5px] ${ok ? "text-[#a9b8ad]" : "text-[#e1a04a]"}`}
                >
                  {c.subText}
                </div>
              </div>
              <div className="text-left text-[11.5px] text-[#a9b8ad]">
                <div
                  className={`font-mono text-[12px] font-medium tabular-nums ${
                    ok ? "text-[#e6dfcc]" : "text-[#e1a04a]"
                  }`}
                >
                  {c.metaTime}
                </div>
                <div>{c.metaSub}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test — expect PASS** (1 passed)

- [ ] **Step 5: Commit**

```
git add frontend/src/rabea/welcome/CentersList.tsx frontend/src/rabea/__tests__/CentersList.test.tsx
git commit -m "feat(rabea): CentersList detail rows

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: `CompletionPanel` component

**Files:**
- Create: `frontend/src/rabea/welcome/CompletionPanel.tsx`
- Test: `frontend/src/rabea/__tests__/CompletionPanel.test.tsx`

- [ ] **Step 1: Failing test** — create `frontend/src/rabea/__tests__/CompletionPanel.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CompletionPanel } from "../welcome/CompletionPanel";
import { deriveTakmeelView } from "../takmeelView";

function at(h: number, m: number) {
  return new Date(2026, 4, 17, h, m, 0, 0);
}

describe("CompletionPanel", () => {
  it("renders head, ring, side stats and centers for a partial day", () => {
    const v = deriveTakmeelView(
      [
        { id: "م22", region: "جازان", responsible: "عبدالله الزهراني", submittedAt: "07:32" },
        { id: "م23", region: "صبيا", responsible: "سامي القرني", submittedAt: null },
      ],
      at(17, 19),
    );
    render(<CompletionPanel view={v} dateLabel="الأحد ١٧ مايو" />);
    expect(screen.getByText("حالة التكميل اليومي")).toBeInTheDocument();
    expect(screen.getByText("المراكز التابعة لشعبة العمليات")).toBeInTheDocument();
    expect(screen.getByText("نسبة الإنجاز اليوم")).toBeInTheDocument();
    expect(screen.getByText("مكتمل")).toBeInTheDocument();
    expect(screen.getByText("بانتظار التكميل")).toBeInTheDocument();
    expect(screen.getByText("مركز م٢٣ · صبيا")).toBeInTheDocument();
  });

  it("renders the all-complete badge when every center submitted", () => {
    const v = deriveTakmeelView(
      [
        { id: "م22", region: "جازان", responsible: "ع", submittedAt: "07:32" },
        { id: "م23", region: "صبيا", responsible: "س", submittedAt: "07:51" },
      ],
      at(10, 0),
    );
    render(<CompletionPanel view={v} dateLabel="الأحد ١٧ مايو" />);
    expect(screen.getByText("جميع المراكز أكملت اليوم")).toBeInTheDocument();
  });

  it("renders the empty message when no centers", () => {
    const v = deriveTakmeelView([], at(10, 0));
    render(<CompletionPanel view={v} dateLabel="الأحد ١٧ مايو" />);
    expect(screen.getByText("لم يتم تسجيل أي مراكز بعد")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test — expect FAIL** (module not found)

- [ ] **Step 3: Create `frontend/src/rabea/welcome/CompletionPanel.tsx`:**

```tsx
import { Clipboard } from "lucide-react";
import type { TakmeelView } from "../takmeelView";
import { CountRing } from "./CountRing";
import { CentersList } from "./CentersList";

const AR = "٠١٢٣٤٥٦٧٨٩";
const ar = (s: string | number) => String(s).replace(/\d/g, (d) => AR[Number(d)]);

export function CompletionPanel({
  view,
  dateLabel,
}: {
  view: TakmeelView;
  dateLabel: string;
}) {
  return (
    <aside className="rounded-[22px] border border-[rgba(245,241,230,.16)] bg-[linear-gradient(180deg,rgba(245,241,230,.04),rgba(245,241,230,.02)),rgba(6,26,16,.55)] p-[22px] shadow-[0_30px_80px_-30px_rgba(0,0,0,.55),inset_0_1px_0_rgba(245,241,230,.06)] backdrop-blur-[8px]">
      <div className="mb-[18px] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid h-[30px] w-[30px] place-items-center rounded-[9px] bg-[rgba(217,199,154,.14)] text-[#d9c79a]">
            <Clipboard size={16} />
          </span>
          <div>
            <h2 className="m-0 text-[14px] font-semibold text-[#e6dfcc]">حالة التكميل اليومي</h2>
            <div className="mt-px text-[11.5px] text-[#a9b8ad]">المراكز التابعة لشعبة العمليات</div>
          </div>
        </div>
        <div className="text-left text-[11px] text-[#a9b8ad]">
          <b className="block text-[12.5px] font-medium text-[#e6dfcc]">{dateLabel}</b>
          {view.state === "empty" ? null : (
            <span>
              {view.beforeDeadline ? "يبدأ ٩:٠٠ ص" : "تم تجاوز الموعد ٩:٠٠ ص"}
            </span>
          )}
        </div>
      </div>

      {view.state === "empty" ? (
        <div className="grid place-items-center gap-2 py-10 text-center">
          <p className="m-0 text-[14px] text-[#e6dfcc]">لم يتم تسجيل أي مراكز بعد</p>
          <span className="cursor-default rounded-[12px] border border-[rgba(245,241,230,.16)] px-4 py-2 text-[12.5px] text-[#a9b8ad]">
            إضافة مركز
          </span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-[160px_1fr] items-center gap-[22px] px-1 pb-4 pt-3 max-[980px]:grid-cols-[130px_1fr] max-[560px]:grid-cols-1 max-[560px]:justify-items-center">
            <CountRing
              completedLabel={ar(view.completedCount)}
              totalLabel={ar(view.total)}
              dash={view.ringDash}
              circumference={view.ringCircumference}
            />
            <div>
              <div className="mb-1 text-[13px] text-[#a9b8ad]">نسبة الإنجاز اليوم</div>
              <div className="text-[22px] font-bold leading-tight tracking-tight text-[#f5f1e6]">
                <b className="text-[#e8d8aa]">{view.percentLabel}</b> من المراكز
                <br />
                أكملت التكميل
              </div>
              <div className="mt-3.5 flex gap-2.5">
                <div className="flex-1 rounded-[12px] border border-[rgba(245,241,230,.10)] bg-[rgba(245,241,230,.04)] px-3 py-2.5">
                  <div className="flex items-baseline gap-1 text-[20px] font-bold text-[#f5f1e6]">
                    <span className="h-2 w-2 rounded-full bg-[#46a96a] shadow-[0_0_8px_#46a96a]" />
                    <span className="tabular-nums">{ar(view.completedCount)}</span>
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-[#a9b8ad]">مكتمل</div>
                </div>
                <div className="flex-1 rounded-[12px] border border-[rgba(245,241,230,.10)] bg-[rgba(245,241,230,.04)] px-3 py-2.5">
                  <div className="flex items-baseline gap-1 text-[20px] font-bold text-[#f5f1e6]">
                    <span className="h-2 w-2 rounded-full bg-[#e1a04a] shadow-[0_0_8px_#e1a04a]" />
                    <span className="tabular-nums">{ar(view.pendingCount)}</span>
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-[#a9b8ad]">بانتظار التكميل</div>
                </div>
              </div>
            </div>
          </div>

          {view.state === "complete" ? (
            <div className="mt-[18px] flex items-center justify-center gap-2 rounded-[14px] border border-[rgba(70,169,106,.28)] bg-[rgba(70,169,106,.16)] py-3 text-[13.5px] font-semibold text-[#46a96a]">
              <span aria-hidden="true">✓</span> جميع المراكز أكملت اليوم
            </div>
          ) : null}

          <CentersList centers={view.centers} />
        </>
      )}
    </aside>
  );
}
```

- [ ] **Step 4: Run test — expect PASS** (3 passed)

- [ ] **Step 5: Commit**

```
git add frontend/src/rabea/welcome/CompletionPanel.tsx frontend/src/rabea/__tests__/CompletionPanel.test.tsx
git commit -m "feat(rabea): CompletionPanel (head + ring + stats + centers + states)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: `WelcomeTopBar` component

**Files:**
- Create: `frontend/src/rabea/welcome/WelcomeTopBar.tsx`
- Test: `frontend/src/rabea/__tests__/WelcomeTopBar.test.tsx`

- [ ] **Step 1: Failing test** — create `frontend/src/rabea/__tests__/WelcomeTopBar.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WelcomeTopBar } from "../welcome/WelcomeTopBar";

describe("WelcomeTopBar", () => {
  it("renders brand, alert pill, date and bell badge", () => {
    render(<WelcomeTopBar dateLabel="الأحد · ١٧ مايو ٢٠٢٦" />);
    expect(screen.getByText("نظام إنجاز")).toBeInTheDocument();
    expect(screen.getByText("لوحة شعبة العمليات")).toBeInTheDocument();
    expect(screen.getByText("حالة الإنذار")).toBeInTheDocument();
    expect(screen.getByText("عادي")).toBeInTheDocument();
    expect(screen.getByText("الأحد · ١٧ مايو ٢٠٢٦")).toBeInTheDocument();
    expect(screen.getByText("٣")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Create `frontend/src/rabea/welcome/WelcomeTopBar.tsx`:**

```tsx
import { Bell, Calendar } from "lucide-react";

export function WelcomeTopBar({ dateLabel }: { dateLabel: string }) {
  return (
    <header className="flex min-h-[44px] flex-nowrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="relative grid h-11 w-11 flex-none place-items-center rounded-full border-[1.5px] border-[#d9c79a] text-[18px] font-extrabold text-[#d9c79a] shadow-[inset_0_0_0_4px_rgba(217,199,154,.10)] before:absolute before:inset-1.5 before:rounded-full before:border before:border-dashed before:border-[rgba(217,199,154,.55)] before:content-['']"
        >
          <span className="font-display">إ</span>
        </span>
        <div>
          <div className="text-[14.5px] font-bold tracking-tight text-[#f5f1e6]">نظام إنجاز</div>
          <div className="mt-px text-[11.5px] text-[#a9b8ad]">لوحة شعبة العمليات</div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 text-[12.5px] text-[#a9b8ad] max-[560px]:hidden">
        <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(245,241,230,.10)] bg-[rgba(245,241,230,.04)] py-1 pl-3 pr-1">
          <span className="text-[11.5px] font-medium text-[#a9b8ad]">حالة الإنذار</span>
          <span className="h-3.5 w-px bg-[rgba(245,241,230,.10)]" />
          <span className="h-[7px] w-[7px] rounded-full bg-[#46a96a] shadow-[0_0_10px_#46a96a] motion-safe:animate-pulse" />
          <span className="rounded-full border border-[rgba(70,169,106,.28)] bg-[rgba(70,169,106,.16)] px-2.5 py-0.5 text-[12.5px] font-semibold text-[#f5f1e6]">
            عادي
          </span>
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(245,241,230,.10)] bg-[rgba(245,241,230,.04)] px-[11px] py-1.5">
          <Calendar size={13} />
          {dateLabel}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="التنبيهات"
          className="relative grid h-[34px] w-[34px] place-items-center rounded-[10px] border border-[rgba(245,241,230,.10)] bg-[rgba(245,241,230,.04)] text-[#e6dfcc] hover:bg-[rgba(245,241,230,.07)]"
        >
          <Bell size={16} />
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full border-2 border-[#061a10] bg-[#e1a04a] px-1 text-[10px] font-bold text-[#1a0f04]">
            ٣
          </span>
        </button>
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Commit**

```
git add frontend/src/rabea/welcome/WelcomeTopBar.tsx frontend/src/rabea/__tests__/WelcomeTopBar.test.tsx
git commit -m "feat(rabea): WelcomeTopBar (brand + alert + date + bell)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: `WelcomeGreeting` component

**Files:**
- Create: `frontend/src/rabea/welcome/WelcomeGreeting.tsx`
- Test: `frontend/src/rabea/__tests__/WelcomeGreeting.test.tsx`

- [ ] **Step 1: Failing test** — create `frontend/src/rabea/__tests__/WelcomeGreeting.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { WelcomeGreeting } from "../welcome/WelcomeGreeting";
import { deriveTakmeelView } from "../takmeelView";

function at(h: number, m: number) {
  return new Date(2026, 4, 17, h, m, 0, 0);
}

describe("WelcomeGreeting", () => {
  it("renders eyebrow, headline, role chip, summary and primary CTA", async () => {
    const v = deriveTakmeelView(
      [
        { id: "م22", region: "جازان", responsible: "ع", submittedAt: "07:32" },
        { id: "م23", region: "صبيا", responsible: "س", submittedAt: null },
      ],
      at(17, 19),
    );
    const onPrimary = vi.fn();
    render(<WelcomeGreeting summary={v.summary} onPrimary={onPrimary} />);
    expect(screen.getByText("INJAZ · OPERATIONS CENTER")).toBeInTheDocument();
    expect(screen.getByText("ربيع ٩.")).toBeInTheDocument();
    expect(screen.getByText("مدير شعبة العمليات")).toBeInTheDocument();
    expect(screen.getByText(/لديك/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /الانتقال إلى لوحة التحكم/ }));
    expect(onPrimary).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Create `frontend/src/rabea/welcome/WelcomeGreeting.tsx`:**

```tsx
import { ArrowLeft, Clipboard, User } from "lucide-react";
import type { TakmeelSummary } from "../takmeelView";

function SummaryText({ s }: { s: TakmeelSummary }) {
  if (s.kind === "allComplete") {
    return <>أكملت جميع المراكز تكميل اليوم — يمكنك الانتقال إلى لوحة التحكم.</>;
  }
  if (s.kind === "beforeDeadline") {
    return (
      <>
        لم يبدأ وقت رفع التكميل بعد (٩:٠٠ ص) — <b>{s.pendingCount}</b> مركز قيد الانتظار.
      </>
    );
  }
  // pendingAfterDeadline
  return (
    <>
      لديك <b>{s.pendingCount === 1 ? "مركز واحد" : `${s.pendingCount} مراكز`}</b> لم
      يُكمل تكميل اليوم حتى الآن — <b>{s.firstPendingName}</b> متأخّر منذ{" "}
      <b>{s.firstPendingDelayLabel}</b>. ابدأ بمتابعته قبل الانتقال إلى لوحة التحكم.
    </>
  );
}

export function WelcomeGreeting({
  summary,
  onPrimary,
}: {
  summary: TakmeelSummary;
  onPrimary: () => void;
}) {
  return (
    <section className="flex flex-col gap-[22px]">
      <div className="inline-flex items-center gap-2 self-start text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d9c79a] before:h-px before:w-[22px] before:bg-[rgba(217,199,154,.4)] before:content-[''] after:h-px after:w-[22px] after:bg-[rgba(217,199,154,.4)] after:content-['']">
        INJAZ · OPERATIONS CENTER
      </div>

      <h1 className="m-0 font-display text-[clamp(40px,5.6vw,76px)] font-extrabold leading-[1.05] tracking-[-.025em] text-[#f5f1e6]">
        مرحباً بعودتك،
        <br />
        <span className="bg-[linear-gradient(180deg,#e8d8aa,#d9c79a)] bg-clip-text text-transparent">
          ربيع ٩.
        </span>
      </h1>

      <div className="flex flex-wrap items-center gap-2 text-[14px] text-[#a9b8ad]">
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[rgba(245,241,230,.10)] bg-[rgba(245,241,230,.04)] px-[11px] py-[5px] text-[12.5px] font-medium text-[#e6dfcc]">
          <User size={13} className="text-[#a9b8ad]" />
          مدير شعبة العمليات
        </span>
      </div>

      <p className="m-0 mt-0.5 max-w-[540px] text-[15.5px] leading-[1.7] text-[#e6dfcc] [&_b]:font-semibold [&_b]:text-[#e8d8aa]">
        <SummaryText s={summary} />
      </p>

      <div className="mt-1.5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onPrimary}
          className="group inline-flex items-center gap-2.5 rounded-[12px] bg-[linear-gradient(180deg,#e8d8aa,#d9c79a)] px-5 py-3 text-[14px] font-semibold text-[#1d160a] shadow-[0_10px_30px_-10px_rgba(217,199,154,.45),inset_0_1px_0_rgba(255,255,255,.4),inset_0_-1px_0_rgba(0,0,0,.10)] transition-[filter] hover:brightness-105"
        >
          الانتقال إلى لوحة التحكم
          <ArrowLeft size={16} className="transition-transform duration-200 group-hover:-translate-x-[3px]" />
        </button>
        <button
          type="button"
          className="inline-flex cursor-default items-center gap-2.5 rounded-[12px] border border-[rgba(245,241,230,.16)] px-5 py-3 text-[14px] font-semibold text-[#e6dfcc] hover:bg-[rgba(245,241,230,.04)]"
        >
          <Clipboard size={14} />
          تكميل المراكز المعلّقة
        </button>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Commit**

```
git add frontend/src/rabea/welcome/WelcomeGreeting.tsx frontend/src/rabea/__tests__/WelcomeGreeting.test.tsx
git commit -m "feat(rabea): WelcomeGreeting (eyebrow + headline + summary + actions)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: `WelcomeFooter` component

**Files:**
- Create: `frontend/src/rabea/welcome/WelcomeFooter.tsx`
- Test: `frontend/src/rabea/__tests__/WelcomeFooter.test.tsx`

- [ ] **Step 1: Failing test** — create `frontend/src/rabea/__tests__/WelcomeFooter.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WelcomeFooter } from "../welcome/WelcomeFooter";

describe("WelcomeFooter", () => {
  it("renders the system footer line", () => {
    render(<WelcomeFooter />);
    expect(screen.getByText("نظام إنجاز")).toBeInTheDocument();
    expect(screen.getByText("شعبة العمليات")).toBeInTheDocument();
    expect(screen.getByText("2.4.1")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Create `frontend/src/rabea/welcome/WelcomeFooter.tsx`:**

```tsx
export function WelcomeFooter() {
  return (
    <footer className="flex items-center justify-between border-t border-[rgba(245,241,230,.10)] pt-3.5 text-[11.5px] text-[#7b8a80]">
      <div className="flex items-center gap-3">
        <span>نظام إنجاز</span>
        <span className="h-[3px] w-[3px] rounded-full bg-[#7b8a80]" />
        <span>شعبة العمليات</span>
        <span className="h-[3px] w-[3px] rounded-full bg-[#7b8a80]" />
        <span>
          الإصدار <span className="font-mono">2.4.1</span>
        </span>
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Commit**

```
git add frontend/src/rabea/welcome/WelcomeFooter.tsx frontend/src/rabea/__tests__/WelcomeFooter.test.tsx
git commit -m "feat(rabea): WelcomeFooter

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: `OperationsWelcomePage` (page shell + guard + live tick)

**Files:**
- Create: `frontend/src/rabea/OperationsWelcomePage.tsx`
- Test: `frontend/src/rabea/__tests__/OperationsWelcomePage.test.tsx`

- [ ] **Step 1: Failing test** — create `frontend/src/rabea/__tests__/OperationsWelcomePage.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { OperationsWelcomePage } from "../OperationsWelcomePage";
import { setRabeaMode } from "../rabeaSession";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/operations-welcome" element={<OperationsWelcomePage />} />
        <Route path="/login" element={<div>صفحة تسجيل الدخول</div>} />
        <Route path="/operations" element={<div>قيد التطوير</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("OperationsWelcomePage", () => {
  afterEach(() => setRabeaMode(false));

  it("renders the welcome design when in rabea mode", () => {
    setRabeaMode(true);
    renderAt("/operations-welcome");
    expect(screen.getByText("ربيع ٩.")).toBeInTheDocument();
    expect(screen.getByText("حالة التكميل اليومي")).toBeInTheDocument();
    expect(screen.getByText("مركز م٢٢ · جازان")).toBeInTheDocument();
    expect(screen.queryByText("صفحة تسجيل الدخول")).not.toBeInTheDocument();
  });

  it("redirects to /login when not in rabea mode", () => {
    setRabeaMode(false);
    renderAt("/operations-welcome");
    expect(screen.getByText("صفحة تسجيل الدخول")).toBeInTheDocument();
    expect(screen.queryByText("ربيع ٩.")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test — expect FAIL** (module not found)

- [ ] **Step 3: Create `frontend/src/rabea/OperationsWelcomePage.tsx`:**

```tsx
import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { today } from "../lib/clock";
import { isRabeaMode } from "./rabeaSession";
import { getTodayTakmeel } from "./takmeelMock";
import { deriveTakmeelView } from "./takmeelView";
import { CompletionPanel } from "./welcome/CompletionPanel";
import { WelcomeFooter } from "./welcome/WelcomeFooter";
import { WelcomeGreeting } from "./welcome/WelcomeGreeting";
import { WelcomeTopBar } from "./welcome/WelcomeTopBar";

const AR = "٠١٢٣٤٥٦٧٨٩";
const ar = (s: string) => s.replace(/\d/g, (d) => AR[Number(d)]);
const DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

function longDate(d: Date): string {
  return `${DAYS[d.getDay()]} · ${ar(String(d.getDate()))} ${MONTHS[d.getMonth()]} ${ar(String(d.getFullYear()))}`;
}
function shortDate(d: Date): string {
  return `${DAYS[d.getDay()]} ${ar(String(d.getDate()))} ${MONTHS[d.getMonth()]}`;
}

export function OperationsWelcomePage() {
  const navigate = useNavigate();
  const [now, setNow] = useState(() => today());

  useEffect(() => {
    const id = window.setInterval(() => setNow(today()), 60000);
    return () => window.clearInterval(id);
  }, []);

  if (!isRabeaMode()) {
    return <Navigate to="/login" replace />;
  }

  const view = deriveTakmeelView(getTodayTakmeel(), now);

  return (
    <main
      dir="rtl"
      className="relative grid min-h-screen grid-rows-[auto_1fr_auto] gap-[22px] overflow-hidden bg-[#061a10] px-7 py-[22px] text-[#f5f1e6] max-[560px]:px-4"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(1100px_600px_at_80%_-10%,rgba(70,169,106,.18),transparent_60%),radial-gradient(800px_500px_at_10%_100%,rgba(217,199,154,.06),transparent_60%),linear-gradient(160deg,#062319_0%,#061a10_50%,#04130b_100%)]"
      />
      <WelcomeTopBar dateLabel={longDate(now)} />

      <div className="mx-auto grid w-full max-w-[1280px] grid-cols-[1.05fr_1fr] items-center gap-8 max-[980px]:grid-cols-1 max-[980px]:gap-7">
        <WelcomeGreeting
          summary={view.summary}
          onPrimary={() => navigate("/operations")}
        />
        <CompletionPanel view={view} dateLabel={shortDate(now)} />
      </div>

      <WelcomeFooter />
    </main>
  );
}
```

- [ ] **Step 4: Run test — expect PASS** (2 passed)

Run: `& 'node_modules\.bin\vitest.cmd' run src/rabea/__tests__/OperationsWelcomePage.test.tsx`

- [ ] **Step 5: Typecheck the new files**

Run: `& 'node_modules\.bin\tsc.cmd' -p tsconfig.app.json --noEmit 2>&1 | Select-String -Pattern "rabea"`
Expected: no output.

- [ ] **Step 6: Commit**

```
git add frontend/src/rabea/OperationsWelcomePage.tsx frontend/src/rabea/__tests__/OperationsWelcomePage.test.tsx
git commit -m "feat(rabea): OperationsWelcomePage standalone page + guard + 60s tick

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: Rewire `LoginPage` REB9 → navigate (commit-hygiene split)

**Files:**
- Modify: `frontend/src/pages/LoginPage.tsx`

`LoginPage.tsx` has a pre-existing UNRELATED uncommitted hunk: a brand-aside `<div>` whose class is `relative z-10 my-auto flex flex-col items-start text-start` (the committed/main version is `relative z-10 my-auto`). Your commit must contain ONLY the Rabea edits; restore that hunk to the working tree afterward.

- [ ] **Step 1: Edit imports.** Replace exactly:
```tsx
import { Navigate } from "react-router-dom";
```
with:
```tsx
import { Navigate, useNavigate } from "react-router-dom";
```

- [ ] **Step 2: Remove the now-unused overlay import.** Delete exactly this line:
```tsx
import { useRabeaWelcome } from "../rabea/RabeaWelcomeTransition";
```
(Keep `import { RABEA_PASSWORD, RABEA_USERNAME, setRabeaMode } from "../rabea/rabeaSession";`.)

- [ ] **Step 3: Replace the overlay hook with navigate.** Replace exactly:
```tsx
  const { phase, start } = useLoginTransition();
  const { start: startRabea } = useRabeaWelcome();
```
with:
```tsx
  const { phase, start } = useLoginTransition();
  const navigate = useNavigate();
```

- [ ] **Step 4: Rewire the REB9 branch.** Replace exactly:
```tsx
    if (username === RABEA_USERNAME && password === RABEA_PASSWORD) {
      // Frontend-only Rabea gate: never hits the backend (REB9 is not a real
      // account). Injaz path below is unchanged for every other user.
      setRabeaMode(true);
      startRabea();
      return;
    }
```
with:
```tsx
    if (username === RABEA_USERNAME && password === RABEA_PASSWORD) {
      // Frontend-only Rabea gate: never hits the backend (REB9 is not a real
      // account). Navigates to the standalone welcome page. Injaz path below
      // is unchanged for every other user.
      setRabeaMode(true);
      navigate("/operations-welcome", { replace: true });
      return;
    }
```

- [ ] **Step 5: Typecheck**

Run: `& 'node_modules\.bin\tsc.cmd' -p tsconfig.app.json --noEmit 2>&1 | Select-String -Pattern "LoginPage"`
Expected: no output.

- [ ] **Step 6: Commit-hygiene split.** The working tree LoginPage.tsx now has the 4 Rabea edits + the pre-existing layout hunk. To commit only Rabea:
  1. Using the Edit tool, temporarily revert the pre-existing hunk: replace
     `        <div className="relative z-10 my-auto flex flex-col items-start text-start">`
     with
     `        <div className="relative z-10 my-auto">`.
  2. `git diff -- frontend/src/pages/LoginPage.tsx` — confirm ONLY the 4 Rabea hunks remain (imports ×2, hook line, REB9 block). If a layout hunk still shows, STOP/BLOCKED.
  3. `git add frontend/src/pages/LoginPage.tsx`
  4. `git diff --cached -- frontend/src/pages/LoginPage.tsx` — confirm only Rabea hunks staged.
  5. Commit:
     ```
     git commit -m "feat(rabea): LoginPage REB9 navigates to /operations-welcome

     Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
     ```
  6. Restore the pre-existing hunk to the working tree (Edit tool): replace
     `        <div className="relative z-10 my-auto">`
     back with
     `        <div className="relative z-10 my-auto flex flex-col items-start text-start">`.

- [ ] **Step 7: Final verify**

`git show HEAD -- frontend/src/pages/LoginPage.tsx` → only the 4 Rabea hunks.
`git diff -- frontend/src/pages/LoginPage.tsx` → only the restored layout line (unstaged).
`git show --stat HEAD` → exactly 1 file.

---

## Task 12: Rewire `App.tsx` (commit-hygiene split)

**Files:**
- Modify: `frontend/src/App.tsx`

`App.tsx` has a pre-existing UNRELATED uncommitted hunk: `import { LeavesPage } from "./pages/LeavesPage";` and `<Route path="/leaves" element={<LeavesPage />} />`. Your commit must contain ONLY the Rabea edits; restore those lines to the working tree afterward.

- [ ] **Step 1: Remove the provider import.** Delete exactly:
```tsx
import { RabeaWelcomeTransitionProvider } from "./rabea/RabeaWelcomeTransition";
```

- [ ] **Step 2: Add the page import.** Immediately after the line
```tsx
import { OperationsPlaceholderPage } from "./rabea/OperationsPlaceholderPage";
```
add:
```tsx
import { OperationsWelcomePage } from "./rabea/OperationsWelcomePage";
```

- [ ] **Step 3: Unwrap the provider + add the route.** Replace exactly:
```tsx
        <LoginTransitionProvider>
        <RabeaWelcomeTransitionProvider>
        <Routes>
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/operations" element={<OperationsPlaceholderPage />} />
```
with:
```tsx
        <LoginTransitionProvider>
        <Routes>
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/operations" element={<OperationsPlaceholderPage />} />
          <Route path="/operations-welcome" element={<OperationsWelcomePage />} />
```

- [ ] **Step 4: Fix the closing tags.** Replace exactly:
```tsx
        </Routes>
        </RabeaWelcomeTransitionProvider>
        </LoginTransitionProvider>
```
with:
```tsx
        </Routes>
        </LoginTransitionProvider>
```

- [ ] **Step 5: Typecheck**

Run: `& 'node_modules\.bin\tsc.cmd' -p tsconfig.app.json --noEmit 2>&1 | Select-String -Pattern "App.tsx"`
Expected: no output.

- [ ] **Step 6: Commit-hygiene split.**
  1. Edit tool — temporarily remove the two pre-existing leaves lines: delete the line `import { LeavesPage } from "./pages/LeavesPage";` and the line `            <Route path="/leaves" element={<LeavesPage />} />`.
  2. `git diff -- frontend/src/App.tsx` → confirm ONLY the Rabea hunks (provider import removed, page import added, provider unwrap + new route, closing-tag fix) and NO LeavesPage hunks. If leaves hunk remains, STOP/BLOCKED.
  3. `git add frontend/src/App.tsx`; `git diff --cached -- frontend/src/App.tsx` → only Rabea hunks.
  4. Commit:
     ```
     git commit -m "feat(rabea): route /operations-welcome, drop overlay provider

     Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
     ```
  5. Restore the two leaves lines to the working tree (Edit tool): re-add `import { LeavesPage } from "./pages/LeavesPage";` immediately before `import { LoginPage } from "./pages/LoginPage";`, and re-add `            <Route path="/leaves" element={<LeavesPage />} />` immediately before `            <Route path="/employees" element={<EmployeesListPage />} />`.

- [ ] **Step 7: Final verify**

`git show HEAD -- frontend/src/App.tsx` → only Rabea hunks (no LeavesPage).
`git diff -- frontend/src/App.tsx` → only the 2 restored leaves lines (unstaged).
`git show --stat HEAD` → exactly 1 file.

---

## Task 13: Update the integration test for the new flow

**Files:**
- Modify: `frontend/src/rabea/__tests__/rabeaLogin.test.tsx`

- [ ] **Step 1: Overwrite `frontend/src/rabea/__tests__/rabeaLogin.test.tsx`** with:

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

  it("REB9 navigates to the Rabea welcome page without calling the login API", async () => {
    render(<App />);

    await screen.findByRole("heading", { name: "تسجيل الدخول" });
    await user.type(screen.getByLabelText("اسم المستخدم"), "REB9");
    await user.type(screen.getByLabelText("كلمة المرور"), "1234567891");
    await user.click(screen.getByRole("button", { name: "تسجيل الدخول" }));

    await screen.findByText("ربيع ٩.");
    expect(screen.getByText("حالة التكميل اليومي")).toBeInTheDocument();

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
  });
});
```

- [ ] **Step 2: Run the test — expect PASS** (2 passed)

Run: `& 'node_modules\.bin\vitest.cmd' run src/rabea/__tests__/rabeaLogin.test.tsx`

- [ ] **Step 3: Commit**

```
git add frontend/src/rabea/__tests__/rabeaLogin.test.tsx
git commit -m "test(rabea): integration test for the new welcome-page navigation flow

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 14: Full regression + Injaz-untouched verification

**Files:** none (verification only — no code changes, no commits).

- [ ] **Step 1: Injaz untouched by branch commits**

Run: `git log --oneline main..HEAD -- frontend/src/components/LoginTransition.tsx` (must be EMPTY) and `git diff main...HEAD -- frontend/src/components/LoginTransition.tsx` (must be EMPTY).

- [ ] **Step 2: Branch commits touched only expected files**

Run: `git diff main...HEAD --stat`. Expected only: `docs/superpowers/**`, `frontend/src/rabea/**`, `frontend/index.html`, `frontend/tailwind.config.js`, and Rabea-only hunks in `frontend/src/pages/LoginPage.tsx` + `frontend/src/App.tsx`. Confirm `git diff main...HEAD -- frontend/src/App.tsx` has NO `LeavesPage` hunk and `git diff main...HEAD -- frontend/src/pages/LoginPage.tsx` has NO `flex flex-col items-start text-start` hunk.

- [ ] **Step 3: Full Rabea suite**

Run: `& 'node_modules\.bin\vitest.cmd' run src/rabea`
Expected: all Rabea suites pass (takmeelView, CountRing, CentersList, CompletionPanel, WelcomeTopBar, WelcomeGreeting, WelcomeFooter, OperationsWelcomePage, OperationsPlaceholderPage, rabeaSession, rabeaLogin, TakmeelStatusCard). `TakmeelStatusCard.test.tsx` still passes (retained dead code).

- [ ] **Step 4: Whole suite — classify failures**

Run: `& 'node_modules\.bin\vitest.cmd' run`. For each failing suite, determine Rabea-caused vs pre-existing-unrelated. The known pre-existing failing `<App/>` suites (`__tests__/BuildingPage.test.tsx`, `__tests__/EmployeesListPage.test.tsx`, `__tests__/VehiclesListPage.test.tsx`, `__tests__/LoginFlow.test.tsx`) must still fail for the SAME pre-existing reasons (unrelated to Rabea — they don't use REB9; the App change only removed a passthrough provider + added one route). Confirm no NEW failures attributable to Rabea.

- [ ] **Step 5: Typecheck**

Run: `& 'node_modules\.bin\tsc.cmd' -p tsconfig.app.json --noEmit 2>&1 | Select-String -Pattern "rabea/|LoginPage|App.tsx"`
Expected: no output (only the pre-existing DashboardPage/RatingsTab errors remain, unrelated).

- [ ] **Step 6: Lint changed files**

Run: `& 'node_modules\.bin\eslint.cmd' src/rabea src/pages/LoginPage.tsx src/App.tsx`
Expected: 0 errors (advisory warnings acceptable; the retained `RabeaWelcomeTransition.tsx` may carry the pre-existing react-refresh advisory — not a regression).

- [ ] **Step 7: Report** Status PASS/PASS_WITH_NOTES with evidence that Injaz/LoginTransition untouched and no Rabea regression.

---

## Self-Review

**1. Spec coverage:**
- §0/§1 standalone page, no backend, retained dead code → Tasks 10/11/12 (no deletion of overlay files; only unwire). ✓
- §2 routing/REB9/App unwrap/hygiene → Tasks 11, 12 (split commits, restore pre-existing hunks). ✓
- §3 components decomposition → Tasks 4–10 (CountRing, CentersList, CompletionPanel, TopBar, Greeting, Footer, Page). ✓
- §4 mock+pure-logic extension → Tasks 2, 3 (region/responsible; ring/percent/counts/summary/display fields) + tests. ✓
- §5 fidelity/tokens/fonts/bg/responsive → Task 1 (Mono+tailwind), components use arbitrary values + `max-[980px]`/`max-[560px]`, page bg gradient. ✓
- §6 behavior/states → primary CTA→`/operations` (Task 10), inert ghost/bell/manage/rows (Tasks 5,7,8), empty + all-complete (Task 6), before-deadline (Task 3 subText/metaSub + summary), 60s tick + motion-safe (Tasks 4,7,10). ✓
- §7 testing/regression → unit (Task 3), components (4–10), integration (Task 13), regression (Task 14). ✓
- §8 file list → matches the File Structure table; retained files untouched. ✓

**2. Placeholder scan:** No TBD/TODO/"similar to". Every code step shows complete code. Commands explicit. ✓

**3. Type consistency:** `CenterTakmeel{id,region,responsible,submittedAt}` (Task 2) used in Tasks 3/5/6/10 tests. `TakmeelView`/`CenterView`/`TakmeelSummary`/`SummaryKind` fields (`ringDash`,`ringCircumference`,`percentLabel`,`completedCount`,`pendingCount`,`summary`,`regionLabel`,`subText`,`metaTime`,`metaSub`) defined Task 3, consumed identically in Tasks 4 (`dash`,`circumference`), 5 (`c.regionLabel/subText/metaTime/metaSub/submitted`), 6 (`view.*`), 8 (`summary`,`onPrimary`), 10 (`view.summary`, `navigate`). `CountRing` props (`completedLabel,totalLabel,dash,circumference`) match Task 6 usage. `isRabeaMode/setRabeaMode` (existing) used Tasks 10/13. Route `/operations-welcome` consistent Tasks 10/11/12/13. ✓
