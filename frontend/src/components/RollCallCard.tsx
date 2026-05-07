import { CheckCircle2, ClipboardList, Save } from "lucide-react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ApiRequestError } from "../api/client";
import { getTodayRollCall, upsertTodayRollCall } from "../api/rollCalls";
import { listTeams } from "../api/teams";
import { today, todayIso } from "../lib/clock";
import type { RollCall, RollCallInput, Team } from "../types/models";
import { Button } from "./Button";
import { RollCallDetailsModal } from "./RollCallDetailsModal";

type CountKey =
  | "total_force"
  | "firefighters"
  | "drivers"
  | "divers"
  | "trainers"
  | "on_mission"
  | "absent"
  | "suspended"
  | "catering";

interface ColumnDef {
  key: CountKey;
  label: string;
  group: "count" | "deduction";
}

const COLUMNS: ColumnDef[] = [
  { key: "total_force", label: "القوة", group: "count" },
  { key: "firefighters", label: "إطفاء و إنقاذ", group: "count" },
  { key: "drivers", label: "قائد ومشغل آليات", group: "count" },
  { key: "divers", label: "غواص", group: "count" },
  { key: "trainers", label: "تدريب", group: "count" },
  { key: "on_mission", label: "مهمة", group: "deduction" },
  { key: "absent", label: "غياب", group: "deduction" },
  { key: "suspended", label: "موقوف", group: "deduction" },
  { key: "catering", label: "إعاشة", group: "deduction" },
];

const EMPTY: Record<CountKey, number> = {
  total_force: 0,
  firefighters: 0,
  drivers: 0,
  divers: 0,
  trainers: 0,
  on_mission: 0,
  absent: 0,
  suspended: 0,
  catering: 0,
};

function todayLabel(): string {
  return today().toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function toNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

function computePresent(values: Record<CountKey, number>): number {
  return (
    toNum(values.firefighters) +
    toNum(values.drivers) +
    toNum(values.divers) +
    toNum(values.trainers)
  );
}

export function RollCallCard() {
  const [values, setValues] = useState<Record<CountKey, number>>(EMPTY);
  const [team, setTeam] = useState<string>("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [savedRollCall, setSavedRollCall] = useState<RollCall | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    let active = true;
    Promise.all([getTodayRollCall(), listTeams()])
      .then(([rc, t]) => {
        if (!active) return;
        setTeams(t.items);
        if (rc) {
          setValues({
            total_force: toNum(rc.total_force),
            firefighters: toNum(rc.firefighters),
            drivers: toNum(rc.drivers),
            divers: toNum(rc.divers),
            trainers: toNum(rc.trainers),
            on_mission: toNum(rc.on_mission),
            absent: toNum(rc.absent),
            suspended: toNum(rc.suspended),
            catering: toNum(rc.catering),
          });
          setTeam(rc.team);
          setSavedRollCall(rc);
          setSavedAt(
            new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
          );
        } else if (t.items.length > 0) {
          setTeam(t.items[0].name);
        }
      })
      .catch(() => undefined)
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const present = useMemo(() => computePresent(values), [values]);

  const liveRollCall: RollCall = useMemo(
    () => ({
      id: savedRollCall?.id ?? 0,
      date: savedRollCall?.date ?? todayIso(),
      team,
      total_force: toNum(values.total_force),
      firefighters: toNum(values.firefighters),
      drivers: toNum(values.drivers),
      divers: toNum(values.divers),
      trainers: toNum(values.trainers),
      on_mission: toNum(values.on_mission),
      absent: toNum(values.absent),
      suspended: toNum(values.suspended),
      catering: toNum(values.catering),
      present_count: present,
    }),
    [savedRollCall, team, values, present],
  );

  function handleChange(key: CountKey, e: ChangeEvent<HTMLInputElement>) {
    const n = toNum(e.target.value);
    setValues((prev) => ({ ...prev, [key]: n }));
    setDirty(true);
  }

  function handleKeyDown(idx: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const next = inputsRef.current[idx + 1];
      if (next) next.focus();
      else handleSave();
    }
  }

  async function handleSave() {
    if (!team) {
      toast.error("اختر الفرقة المناوبة");
      return;
    }
    setSaving(true);
    try {
      const input: RollCallInput = { team, ...values };
      const saved = await upsertTodayRollCall(input);
      toast.success("تم حفظ التكميل");
      setSavedAt(
        new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
      );
      setDirty(false);
      setSavedRollCall(saved);
      setDetailsOpen(true);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "تعذر الحفظ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-surface-300 bg-white shadow-soft-green">
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-l from-brand-500 to-brand-700" />

      <header className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <ClipboardList size={20} />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-surface-900">التكميل اليومي</h2>
            <p className="text-xs text-surface-500">{todayLabel()}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {teams.length > 0 ? (
            <div className="flex items-center gap-1 rounded-xl border border-surface-300 bg-white p-1 shadow-soft-green">
              <span className="px-2 text-[11px] font-bold text-surface-500">الفرقة</span>
              {teams.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTeam(t.name);
                    setDirty(true);
                  }}
                  className={`rounded-lg px-3 py-1 text-xs font-extrabold transition-colors ${
                    team === t.name
                      ? "bg-gradient-to-l from-brand-500 to-brand-700 text-white shadow-soft-green"
                      : "text-surface-700 hover:bg-brand-50"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          ) : null}
          {savedAt && !dirty ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-700 ring-1 ring-inset ring-brand-200">
              <CheckCircle2 size={12} />
              حُفظ {savedAt}
            </span>
          ) : null}
          <Button onClick={handleSave} loading={saving} disabled={loading}>
            <Save size={16} />
            حفظ
          </Button>
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-center text-sm">
          <thead className="border-y border-surface-200 bg-surface-100 text-surface-500">
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`px-2 py-2 text-[11px] font-bold ${
                    col.group === "deduction" ? "text-amber-700" : ""
                  }`}
                >
                  {col.label}
                </th>
              ))}
              <th className="bg-brand-50 px-2 py-2 text-[11px] font-bold text-brand-700">
                الموجود
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              {COLUMNS.map((col, idx) => (
                <td key={col.key} className="px-1 py-2">
                  <input
                    ref={(el) => {
                      inputsRef.current[idx] = el;
                    }}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={values[col.key] === 0 ? "" : values[col.key]}
                    onChange={(e) => handleChange(col.key, e)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onFocus={(e) => e.target.select()}
                    placeholder="0"
                    disabled={loading}
                    className={`w-full rounded-lg border px-2 py-2 text-center text-base font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-500/30 ${
                      col.group === "deduction"
                        ? "border-amber-200 bg-amber-50/40 text-amber-900 focus:border-amber-500"
                        : "border-surface-300 bg-white text-surface-900 focus:border-brand-500"
                    }`}
                  />
                </td>
              ))}
              <td className="bg-brand-50 px-1 py-2">
                <div className="flex flex-col items-center gap-0.5 rounded-lg border border-brand-300 bg-white px-2 py-2 shadow-soft-green">
                  <span className="text-2xl font-black tabular-nums leading-none text-brand-700">
                    {present}
                  </span>
                  <span className="text-[9px] font-medium text-surface-500">
                    {toNum(values.firefighters)}+{toNum(values.drivers)}+{toNum(values.divers)}+
                    {toNum(values.trainers)}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-surface-200 bg-surface-50 px-5 py-2 text-[11px] text-surface-500">
        <span>
          Tab أو Enter للانتقال بين الحقول • الموجود = إطفاء و إنقاذ + قائد ومشغل آليات + غواص +
          تدريب
        </span>
        <button
          type="button"
          onClick={() => setDetailsOpen(true)}
          className="font-bold text-brand-700 transition-colors hover:text-brand-800"
        >
          عرض تفاصيل التكميل ←
        </button>
      </footer>

      <RollCallDetailsModal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        rollCall={liveRollCall}
        teams={teams}
      />
    </div>
  );
}
