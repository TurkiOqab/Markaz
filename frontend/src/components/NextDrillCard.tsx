import { CalendarClock } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DRILLS_CHANGED_EVENT, listDrills } from "../api/drills";
import { todayMidnight } from "../lib/clock";
import type { Drill, DrillKind } from "../types/models";

const KIND_TONE: Record<DrillKind, string> = {
  "زيارة": "bg-blue-50 text-blue-700 ring-blue-200",
  "فرضية": "bg-amber-50 text-amber-700 ring-amber-200",
  "جولة ميدانية": "bg-brand-50 text-brand-700 ring-brand-200",
};

function parseDateOnly(iso: string): Date | null {
  const ymd = iso.length >= 10 ? iso.slice(0, 10) : iso;
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function daysBetween(later: Date, earlier: Date): number {
  const ms = later.getTime() - earlier.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function formatDateAr(d: Date): string {
  return d.toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export function NextDrillCard() {
  const [drills, setDrills] = useState<Drill[] | null>(null);

  const refresh = useCallback(() => {
    listDrills()
      .then((res) => setDrills(res.items))
      .catch(() => setDrills([]));
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(DRILLS_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(DRILLS_CHANGED_EVENT, refresh);
  }, [refresh]);

  const next = useMemo(() => {
    if (!drills) return null;
    const today = todayMidnight();
    const upcoming = drills
      .filter((d) => !d.completed)
      .map((d) => ({ drill: d, date: parseDateOnly(d.scheduled_at) }))
      .filter((x): x is { drill: Drill; date: Date } => x.date != null && x.date >= today)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    return upcoming[0] ?? null;
  }, [drills]);

  // ── Render ────────────────────────────────────────────────────────────
  if (drills === null) {
    return <Shell label="أقرب فرضية / زيارة">…</Shell>;
  }
  if (!next) {
    return (
      <Shell label="أقرب فرضية / زيارة" sublabel="لا يوجد مجدول قادم">
        —
      </Shell>
    );
  }

  const days = daysBetween(next.date, todayMidnight());
  const daysLabel = days === 0 ? "اليوم" : days === 1 ? "غداً" : `${days} يوم`;
  const daysColor =
    days === 0
      ? "text-red-700"
      : days <= 3
        ? "text-amber-700"
        : "text-brand-700";
  const stripe =
    days === 0 ? "bg-red-600" : days <= 3 ? "bg-amber-500" : "bg-brand-600";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-surface-300 bg-white p-5 shadow-soft-green transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift-green hover:border-brand-300">
      <div className={`absolute inset-x-0 top-0 h-[3px] ${stripe}`} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-surface-500">أقرب فرضية / زيارة</p>
          <p
            className={`mt-2 text-4xl font-black tabular-nums tracking-tight ${daysColor}`}
          >
            {daysLabel}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${KIND_TONE[next.drill.kind]}`}
            >
              {next.drill.kind}
            </span>
            <span className="truncate text-xs font-bold text-surface-900">
              {next.drill.title}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-surface-500">{formatDateAr(next.date)}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <CalendarClock size={20} />
        </div>
      </div>
    </div>
  );
}

function Shell({
  label,
  sublabel,
  children,
}: {
  label: string;
  sublabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-surface-300 bg-white p-5 shadow-soft-green">
      <div className="absolute inset-x-0 top-0 h-[3px] bg-surface-300" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-surface-500">{label}</p>
          <p className="mt-2 text-4xl font-black text-surface-500">{children}</p>
          {sublabel ? <p className="mt-1 text-xs text-surface-500">{sublabel}</p> : null}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-100 text-surface-500">
          <CalendarClock size={20} />
        </div>
      </div>
    </div>
  );
}
