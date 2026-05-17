import type { CenterTakmeel } from "./takmeelMock";

// Official daily deadline: 09:00 local. Judgment (late/complete) only applies
// once the clock passes this; before it the card is neutral "pending".
export const DEADLINE_HOUR = 9;

export type OverallState = "empty" | "pending" | "none" | "partial" | "complete";
export type LateTier = "yellow" | "orange" | "red";

export interface CenterView {
  id: string;
  submitted: boolean;
  /** Arabic-digit 12h label (e.g. "٧:٣٢ ص") when submitted; null otherwise. */
  submittedLabel: string | null;
  /** Only meaningful when the overall state is "complete": true for the
   *  earliest submitter. Always false in every other state. */
  fastest: boolean;
  /** Late metrics are non-null ONLY for a center that has not submitted AND
   *  the 09:00 deadline has passed. They are null both for submitted centers
   *  and for any center while still before the deadline ("pending"). */
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
