import {
  AlertTriangle,
  ArrowRightLeft,
  Check,
  CheckCircle2,
  Clock,
  Users2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ApiRequestError } from "../api/client";
import { listEmployees, updateEmployee } from "../api/employees";
import { listProxies, settleProxy, notifyProxiesChanged } from "../api/proxies";
import { todayIso } from "../lib/clock";
import type { EmployeeSummary, Proxy, RollCall, Team } from "../types/models";
import { Avatar } from "./Avatar";
import { Button } from "./Button";
import { Loader } from "./Loader";
import { Modal } from "./Modal";

interface Props {
  open: boolean;
  onClose: () => void;
  rollCall: RollCall | null;
  teams: Team[];
}

interface RosterRow {
  displayed: EmployeeSummary;
  substituteFor: string | null; // delegator's name, when this row is a substitute
}

export function RollCallDetailsModal({ open, onClose, rollCall, teams }: Props) {
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [loading, setLoading] = useState(false);

  // The team currently on duty per the roll-call card
  const activeTeam = useMemo(
    () => teams.find((t) => t.name === rollCall?.team) ?? null,
    [teams, rollCall?.team],
  );

  useEffect(() => {
    if (!open || !rollCall) return;
    setLoading(true);
    Promise.all([
      // Fetch ALL employees so we can resolve substitutes from any team.
      // Backend caps page_size at 200; that's plenty for a single station.
      listEmployees({ page: 1, page_size: 200 }),
      listProxies(),
    ])
      .then(([e, p]) => {
        setEmployees(e.items);
        const today = todayIso();
        // Substitute is actually present on coverage_date — that's what
        // determines whose name we show in the team roster today.
        setProxies(
          p.items.filter((pr) => (pr.coverage_date ?? pr.shift_date) === today),
        );
      })
      .catch((err) =>
        toast.error(err instanceof ApiRequestError ? err.message : "تعذر تحميل التفاصيل"),
      )
      .finally(() => setLoading(false));
  }, [open, rollCall]);

  // Build the displayed roster: replace any team-member who delegated their
  // shift today with the substitute, and collect a list of applied proxies
  // plus any warnings (e.g. substitute already on the duty team).
  const { roster, appliedCount, warnings } = useMemo(() => {
    if (!activeTeam) {
      return { roster: [] as RosterRow[], appliedCount: 0, warnings: [] as string[] };
    }
    const byId = new Map(employees.map((e) => [e.id, e]));
    const teamList = employees.filter((e) => e.team_id === activeTeam.id);
    const teamIds = new Set(teamList.map((m) => m.id));

    const subForDelegator = new Map<number, EmployeeSummary>();
    const warnings: string[] = [];
    let applied = 0;

    for (const p of proxies) {
      const deleg = byId.get(p.delegator_id);
      const sub = byId.get(p.substitute_id);
      if (!deleg || !sub) continue;
      if (deleg.team_id !== activeTeam.id) continue;
      subForDelegator.set(p.delegator_id, sub);
      applied++;
      if (teamIds.has(sub.id)) {
        warnings.push(
          `النائب ${sub.name} أصلاً ضمن المناوبة (نيابة عن ${deleg.name}) — يُرجى مراجعة الوكالة`,
        );
      }
    }

    const rows: RosterRow[] = teamList.map((m) => {
      const sub = subForDelegator.get(m.id);
      return sub
        ? { displayed: sub, substituteFor: m.name }
        : { displayed: m, substituteFor: null };
    });

    return { roster: rows, appliedCount: applied, warnings };
  }, [employees, activeTeam, proxies]);

  function updateLocalName(id: number, name: string) {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, name } : e)));
  }

  async function persistName(id: number, name: string) {
    if (!name.trim()) {
      toast.error("الاسم لا يمكن أن يكون فارغاً");
      return;
    }
    try {
      await updateEmployee(id, { name: name.trim() });
      toast.success("تم حفظ الاسم");
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "تعذر حفظ الاسم");
    }
  }

  async function handleSettle(id: number) {
    try {
      await settleProxy(id);
      setProxies((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, settled: true, settled_date: todayIso() } : p,
        ),
      );
      notifyProxiesChanged();
      toast.success("تمت تسوية الوكالة");
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "تعذر التسوية");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="تفاصيل تكميل اليوم"
      size="2xl"
      footer={
        <Button variant="secondary" onClick={onClose}>
          إغلاق
        </Button>
      }
    >
      {!rollCall ? null : (
        <div className="space-y-6">
          {/* Section 1: Roll Call Summary */}
          <RollCallSummary rollCall={rollCall} />

          {loading ? (
            <Loader />
          ) : (
            <>
              {/* Section 2: Today's Team */}
              <section>
                <header className="mb-3 flex items-center gap-2">
                  <Users2 size={16} className="text-brand-700" />
                  <h3 className="text-sm font-extrabold text-surface-900">
                    موظفو الفرقة المناوبة اليوم
                  </h3>
                </header>

                {appliedCount > 0 ? (
                  <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700 ring-1 ring-inset ring-amber-200">
                    <ArrowRightLeft size={12} />
                    عدد الوكالات المطبّقة اليوم: {appliedCount}
                  </div>
                ) : null}

                {warnings.length > 0 ? (
                  <ul className="mb-3 space-y-1">
                    {warnings.map((w, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700"
                      >
                        <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {!activeTeam ? (
                  <p className="rounded-xl border border-dashed border-surface-300 bg-surface-50 px-4 py-6 text-center text-xs text-surface-500">
                    اختر فرقة مناوبة من بطاقة التكميل
                  </p>
                ) : roster.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-surface-300 bg-surface-50 px-4 py-6 text-center text-xs text-surface-500">
                    لا يوجد موظفون في الفرقة {activeTeam.name}
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-surface-300 bg-white">
                    <div className="flex items-center justify-between border-b border-surface-200 bg-surface-100 px-4 py-2">
                      <span className="text-xs font-extrabold text-surface-900">
                        الفرقة {activeTeam.name}
                      </span>
                      <span className="text-[10px] font-bold text-surface-500">
                        {roster.length} عضو
                      </span>
                    </div>
                    <ul className="divide-y divide-surface-200">
                      {roster.map((row) => (
                        <EmployeeRow
                          key={row.displayed.id}
                          employee={row.displayed}
                          substituteFor={row.substituteFor}
                          onLocalChange={(name) => updateLocalName(row.displayed.id, name)}
                          onPersist={(name) => persistName(row.displayed.id, name)}
                        />
                      ))}
                    </ul>
                  </div>
                )}
              </section>

              {/* Section 3: Today's Proxies */}
              <section>
                <header className="mb-3 flex items-center gap-2">
                  <ArrowRightLeft size={16} className="text-brand-700" />
                  <h3 className="text-sm font-extrabold text-surface-900">
                    وكالات اليوم ({proxies.length})
                  </h3>
                </header>
                {proxies.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-surface-300 bg-surface-50 px-4 py-6 text-center text-xs text-surface-500">
                    لا توجد وكالات لليوم
                  </p>
                ) : (
                  <ul className="divide-y divide-surface-200 overflow-hidden rounded-2xl border border-surface-300 bg-white">
                    {proxies.map((p) => (
                      <li
                        key={p.id}
                        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-surface-900">
                              {p.delegator_name}
                            </p>
                            <p className="truncate text-[10px] text-surface-500">
                              المُوكِّل {p.delegator_team ? `— ${p.delegator_team}` : ""}
                            </p>
                          </div>
                          <ArrowRightLeft size={14} className="shrink-0 text-surface-300" />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-surface-900">
                              {p.substitute_name}
                            </p>
                            <p className="truncate text-[10px] text-surface-500">
                              النائب {p.substitute_team ? `— ${p.substitute_team}` : ""}
                            </p>
                          </div>
                        </div>
                        {p.settled ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700 ring-1 ring-inset ring-brand-200">
                            <CheckCircle2 size={11} />
                            مُسوَّاة
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-inset ring-amber-200">
                              <Clock size={11} />
                              معلقة
                            </span>
                            <button
                              type="button"
                              onClick={() => handleSettle(p.id)}
                              className="rounded-lg border border-brand-200 bg-white px-2.5 py-1 text-[10px] font-bold text-brand-700 transition-colors hover:bg-brand-50"
                            >
                              تسوية
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}

function toNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

function RollCallSummary({ rollCall }: { rollCall: RollCall }) {
  const ff = toNum(rollCall.firefighters);
  const dr = toNum(rollCall.drivers);
  const dv = toNum(rollCall.divers);
  const tr = toNum(rollCall.trainers);
  const om = toNum(rollCall.on_mission);
  const ab = toNum(rollCall.absent);
  const sp = toNum(rollCall.suspended);
  const ca = toNum(rollCall.catering);
  const computedPresent = ff + dr + dv + tr;
  const totalDeductions = om + ab + sp + ca;

  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-extrabold text-surface-900">ملخّص التكميل</h3>
        <span className="text-[11px] text-surface-500">
          الفرقة <span className="font-bold text-brand-700">{rollCall.team || "—"}</span>
        </span>
      </header>

      {/* Group: Force */}
      <div className="grid grid-cols-1">
        <SummaryCell label="القوة الإجمالية" value={toNum(rollCall.total_force)} tone="brand" wide />
      </div>

      {/* Group: Specialties */}
      <div>
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-700">
          التخصصات (الموجود)
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <SummaryCell label="إطفاء و إنقاذ" value={ff} />
          <SummaryCell label="قائد ومشغل آليات" value={dr} />
          <SummaryCell label="غواص" value={dv} />
          <SummaryCell label="تدريب" value={tr} />
        </div>
      </div>

      {/* Group: Deductions */}
      <div>
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
          الخصومات (غير موجود)
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <SummaryCell label="مهمة" value={om} tone="amber" />
          <SummaryCell label="غياب" value={ab} tone="amber" />
          <SummaryCell label="موقوف" value={sp} tone="amber" />
          <SummaryCell label="إعاشة" value={ca} tone="amber" />
        </div>
      </div>

      {/* Result strip */}
      <div className="grid grid-cols-2 gap-2">
        <div className="relative overflow-hidden rounded-2xl border border-brand-300 bg-brand-50 px-4 py-3 shadow-soft-green">
          <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-l from-brand-500 to-brand-700" />
          <p className="text-[11px] font-bold text-brand-700">الموجود</p>
          <p className="mt-1 text-3xl font-black leading-none tabular-nums text-brand-700">
            {computedPresent}
          </p>
          <p className="mt-1 text-[10px] font-medium text-surface-500">
            {ff}+{dr}+{dv}+{tr}
          </p>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 shadow-soft-green">
          <div className="absolute inset-x-0 top-0 h-[3px] bg-amber-500" />
          <p className="text-[11px] font-bold text-amber-700">إجمالي الخصومات</p>
          <p className="mt-1 text-3xl font-black leading-none tabular-nums text-amber-700">
            {totalDeductions}
          </p>
          <p className="mt-1 text-[10px] font-medium text-surface-500">
            {om}+{ab}+{sp}+{ca}
          </p>
        </div>
      </div>
    </section>
  );
}

function SummaryCell({
  label,
  value,
  tone,
  wide,
}: {
  label: string;
  value: number;
  tone?: "brand" | "amber";
  wide?: boolean;
}) {
  const stripe =
    tone === "brand"
      ? "bg-brand-500"
      : tone === "amber"
        ? "bg-amber-500"
        : "bg-surface-300";
  const valueColor =
    tone === "brand"
      ? "text-brand-700"
      : tone === "amber"
        ? "text-amber-700"
        : "text-surface-900";
  return (
    <div
      className={`relative flex ${wide ? "flex-row items-center justify-between gap-3 px-4" : "flex-col items-center gap-1 px-2"} overflow-hidden rounded-xl border border-surface-300 bg-white py-3 text-center shadow-soft-green`}
    >
      <div className={`absolute inset-x-0 top-0 h-[3px] ${stripe}`} />
      <p
        className={`${wide ? "text-sm" : "text-[11px]"} font-bold leading-tight text-surface-500`}
      >
        {label}
      </p>
      <p
        className={`${wide ? "text-4xl" : "text-3xl"} font-black leading-none tabular-nums ${valueColor}`}
      >
        {value}
      </p>
      {!wide ? <p className="text-[10px] font-medium text-surface-500">موظف</p> : null}
    </div>
  );
}

function EmployeeRow({
  employee,
  substituteFor,
  onLocalChange,
  onPersist,
}: {
  employee: EmployeeSummary;
  substituteFor?: string | null;
  onLocalChange: (name: string) => void;
  onPersist: (name: string) => Promise<void>;
}) {
  const [original] = useState(employee.name);
  const [pending, setPending] = useState(false);

  const dirty = employee.name !== original;

  async function handleSave() {
    if (!dirty) return;
    setPending(true);
    await onPersist(employee.name);
    setPending(false);
  }

  return (
    <li
      className={`flex items-center gap-3 px-4 py-2.5 ${
        substituteFor ? "bg-amber-50/40" : ""
      }`}
    >
      <Avatar
        name={employee.name}
        src={employee.photo_path ? `/uploads/${employee.photo_path}` : null}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={employee.name}
            onChange={(e) => onLocalChange(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                (e.target as HTMLInputElement).blur();
              }
            }}
            className={`min-w-0 flex-1 rounded-lg border bg-white px-2 py-1 text-sm font-bold text-surface-900 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/30 ${
              dirty ? "border-amber-300 bg-amber-50/30" : "border-transparent hover:border-surface-300"
            }`}
          />
          {substituteFor ? (
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-extrabold text-orange-700 ring-1 ring-inset ring-orange-300"
              title={`نائب عن ${substituteFor}`}
            >
              <ArrowRightLeft size={10} />
              نائب عن {substituteFor}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-[10px] text-surface-500">
          {employee.rank} • {employee.specialty}
        </p>
      </div>
      {dirty ? (
        <span className="text-[10px] font-bold text-amber-600">
          {pending ? "..." : <Check size={12} className="text-brand-700" />}
        </span>
      ) : null}
    </li>
  );
}
