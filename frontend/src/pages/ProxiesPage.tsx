import { ArrowRightLeft, CheckCircle2, Clock, Pencil, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { ApiRequestError } from "../api/client";
import { listEmployees } from "../api/employees";
import {
  createProxy,
  deleteProxy,
  listProxies,
  listProxyBalances,
  notifyProxiesChanged,
  settleProxy,
  updateProxy,
} from "../api/proxies";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { Loader } from "../components/Loader";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { SelectField } from "../components/SelectField";
import { TextField } from "../components/TextField";
import type { EmployeeSummary, Proxy, ProxyBalance, Team } from "../types/models";
import { listTeams } from "../api/teams";
import { todayIso as todayLocal } from "../lib/clock";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function monthOptions(proxies: Proxy[]): Array<{ value: string; label: string }> {
  // Build YYYY-MM keys present in the data, descending; current/last/3-months
  // come pre-baked so the user gets useful filters even on day one.
  const keys = new Set<string>();
  const now = new Date();
  const cur = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  keys.add(cur);
  for (const p of proxies) {
    const src = p.created_at ?? p.shift_date;
    if (!src) continue;
    keys.add(src.slice(0, 7));
  }
  const sorted = [...keys].sort().reverse();
  return sorted.map((k) => {
    const [y, m] = k.split("-").map(Number);
    const label = new Date(y, m - 1, 1).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
    });
    return { value: k, label };
  });
}

const STATUS_OPTIONS = [
  { value: "settled", label: "مُسوَّاة فقط" },
  { value: "pending", label: "معلقة فقط" },
];

export function ProxiesPage() {
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [balances, setBalances] = useState<ProxyBalance[]>([]);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Proxy | null>(null);
  // Default to current month — that's the "آخر الوكالات" the user usually
  // cares about. Empty string = all months.
  const [monthFilter, setMonthFilter] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [statusFilter, setStatusFilter] = useState<string>("");

  const reload = useCallback(async () => {
    try {
      const [proxRes, balRes] = await Promise.all([listProxies(), listProxyBalances()]);
      setProxies(proxRes.items);
      setBalances(balRes.items);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "تعذر تحميل الوكالات");
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      reload(),
      listEmployees({ page: 1, page_size: 200 }).then((r) => active && setEmployees(r.items)),
      listTeams().then((r) => active && setTeams(r.items)),
    ])
      .catch(() => undefined)
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [reload]);

  async function handleSettle(id: number) {
    try {
      await settleProxy(id);
      toast.success("تمت تسوية الوكالة");
      await reload();
      notifyProxiesChanged();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "تعذر التسوية");
    }
  }

  async function handleDelete(p: Proxy) {
    const label = `${p.delegator_name} ← ${p.substitute_name}`;
    if (!window.confirm(`هل تريد حذف وكالة "${label}"؟`)) return;
    try {
      await deleteProxy(p.id);
      toast.success("تم حذف الوكالة");
      await reload();
      notifyProxiesChanged();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "تعذر الحذف");
    }
  }

  const months = useMemo(() => monthOptions(proxies), [proxies]);

  const visibleProxies = useMemo(() => {
    return proxies.filter((p) => {
      if (monthFilter) {
        const src = p.created_at ?? p.shift_date;
        if (!src || src.slice(0, 7) !== monthFilter) return false;
      }
      if (statusFilter === "settled" && !p.settled) return false;
      if (statusFilter === "pending" && p.settled) return false;
      return true;
    });
  }, [proxies, monthFilter, statusFilter]);

  if (loading) return <Loader fullPage />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="الوكالات"
        subtitle="تسجيل وتسوية وكالات الورديات بين الموظفين"
        icon={ArrowRightLeft}
        iconTone="brand"
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={16} />
            تسجيل وكالة
          </Button>
        }
      />

      {balances.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-extrabold text-surface-900">
            أرصدة مستحقة ({balances.length})
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {balances.map((b) => (
              <BalanceCard key={b.substitute_id} balance={b} />
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-sm font-extrabold text-surface-900">
            سجل الوكالات
            <span className="ms-2 text-xs font-bold text-surface-500">
              ({visibleProxies.length}
              {visibleProxies.length !== proxies.length ? ` من ${proxies.length}` : ""})
            </span>
          </h2>
          <div className="flex flex-wrap items-end gap-2">
            <div className="w-44">
              <SelectField
                label="الشهر"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                placeholder="كل الأشهر"
                options={months}
              />
            </div>
            <div className="w-40">
              <SelectField
                label="الحالة"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                placeholder="الكل"
                options={STATUS_OPTIONS}
              />
            </div>
            {(monthFilter || statusFilter) && (
              <button
                type="button"
                onClick={() => {
                  setMonthFilter("");
                  setStatusFilter("");
                }}
                className="rounded-lg border border-surface-300 bg-white px-3 py-2 text-xs font-bold text-surface-500 transition-colors hover:bg-surface-100"
              >
                مسح الفلاتر
              </button>
            )}
          </div>
        </div>

        {proxies.length === 0 ? (
          <EmptyState
            title="لا توجد وكالات مسجّلة"
            description="ابدأ بتسجيل أول وكالة"
            icon={ArrowRightLeft}
            action={
              <Button onClick={() => setModalOpen(true)}>
                <Plus size={16} />
                تسجيل وكالة
              </Button>
            }
          />
        ) : visibleProxies.length === 0 ? (
          <EmptyState
            title="لا توجد نتائج مطابقة"
            description="حاول تعديل الفلاتر أو اختر شهراً آخر"
            icon={ArrowRightLeft}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-surface-300 bg-white shadow-soft-green transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift-green hover:border-brand-300">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-right text-sm">
                <thead className="border-b border-surface-200 bg-surface-100 text-surface-500">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold">التاريخ</th>
                    <th className="px-4 py-3 text-xs font-bold">المُوكِّل</th>
                    <th className="px-4 py-3 text-xs font-bold">النائب</th>
                    <th className="px-4 py-3 text-xs font-bold">شفت المُوكِّل</th>
                    <th className="px-4 py-3 text-xs font-bold">تاريخ التغطية</th>
                    <th className="px-4 py-3 text-xs font-bold">الحالة</th>
                    <th className="px-4 py-3 text-xs font-bold">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-200">
                  {visibleProxies.map((p) => (
                    <tr key={p.id} className="transition-colors hover:bg-brand-50">
                      <td className="px-4 py-3 text-surface-500">
                        {p.created_at ? formatDate(p.created_at) : "—"}
                      </td>
                      <td className="px-4 py-3 font-bold text-surface-900">
                        {p.delegator_name}
                        {p.delegator_team ? (
                          <span className="block text-[10px] font-medium text-surface-500">
                            {p.delegator_team}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 font-bold text-surface-900">
                        {p.substitute_name}
                        {p.substitute_team ? (
                          <span className="block text-[10px] font-medium text-surface-500">
                            {p.substitute_team}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-surface-900">{formatDate(p.shift_date)}</td>
                      <td className="px-4 py-3 text-surface-900">
                        {formatDate(p.coverage_date ?? p.shift_date)}
                      </td>
                      <td className="px-4 py-3">
                        {p.settled ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-bold text-brand-700 ring-1 ring-inset ring-brand-200">
                            <CheckCircle2 size={12} />
                            مُسوَّاة
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 ring-1 ring-inset ring-amber-200">
                            <Clock size={12} />
                            معلقة
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {!p.settled ? (
                            <button
                              type="button"
                              onClick={() => handleSettle(p.id)}
                              className="rounded-xl border border-brand-200 bg-white px-3 py-1.5 text-xs font-bold text-brand-700 transition-colors hover:bg-brand-50"
                            >
                              تسوية
                            </button>
                          ) : (
                            <span className="text-[11px] text-surface-500">
                              {p.settled_date ? formatDate(p.settled_date) : "—"}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => setEditing(p)}
                            className="inline-flex items-center gap-1 rounded-xl border border-surface-300 bg-white px-2.5 py-1.5 text-xs font-bold text-surface-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                            title="تعديل"
                          >
                            <Pencil size={12} />
                            تعديل
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(p)}
                            className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-white px-2.5 py-1.5 text-xs font-bold text-red-700 transition-colors hover:bg-red-50"
                            title="حذف"
                          >
                            <Trash2 size={12} />
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <ProxyFormModal
        open={modalOpen}
        proxy={null}
        onClose={() => setModalOpen(false)}
        employees={employees}
        teams={teams}
        onSaved={async () => {
          await reload();
          notifyProxiesChanged();
        }}
      />

      <ProxyFormModal
        open={editing !== null}
        proxy={editing}
        onClose={() => setEditing(null)}
        employees={employees}
        teams={teams}
        onSaved={async () => {
          await reload();
          notifyProxiesChanged();
        }}
      />
    </div>
  );
}

function BalanceCard({ balance }: { balance: ProxyBalance }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-soft-green transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift-green hover:border-brand-300">
      <div className="absolute inset-x-0 top-0 h-[3px] bg-amber-500" />
      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
        رصيد مستحق
      </p>
      <p className="mt-1 truncate text-sm font-extrabold text-surface-900">
        {balance.substitute_name}
      </p>
      {balance.team_name ? (
        <p className="text-[11px] text-surface-500">{balance.team_name}</p>
      ) : null}
      <p className="mt-2 text-4xl font-black tabular-nums text-amber-700">
        {balance.count}
        <span className="ms-1 text-xs font-bold text-amber-600">يوم</span>
      </p>
    </div>
  );
}

interface ProxyFormModalProps {
  open: boolean;
  proxy: Proxy | null;
  onClose: () => void;
  employees: EmployeeSummary[];
  teams: Team[];
  onSaved: () => Promise<void> | void;
}

function ProxyFormModal({ open, proxy, onClose, employees, teams, onSaved }: ProxyFormModalProps) {
  const isEdit = proxy !== null;
  const [delegatorId, setDelegatorId] = useState("");
  const [substituteId, setSubstituteId] = useState("");
  const [shiftDate, setShiftDate] = useState(todayLocal());
  const [coverageDate, setCoverageDate] = useState(todayLocal());
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Re-seed when the modal opens (or when switching between proxies in edit mode).
  useEffect(() => {
    if (!open) return;
    if (proxy) {
      setDelegatorId(String(proxy.delegator_id));
      setSubstituteId(String(proxy.substitute_id));
      setShiftDate(proxy.shift_date);
      setCoverageDate(proxy.coverage_date ?? proxy.shift_date);
      setReason(proxy.reason ?? "");
    } else {
      setDelegatorId("");
      setSubstituteId("");
      setShiftDate(todayLocal());
      setCoverageDate(todayLocal());
      setReason("");
    }
  }, [open, proxy]);

  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t.name])), [teams]);

  const delegatorOptions = useMemo(
    () =>
      employees.map((e) => ({
        value: e.id,
        label: `${e.name} — ${teamById.get(e.team_id) ?? "—"}`,
      })),
    [employees, teamById],
  );

  const substituteOptions = useMemo(
    () =>
      employees
        .filter((e) => String(e.id) !== delegatorId)
        .map((e) => ({
          value: e.id,
          label: `${e.name} — ${teamById.get(e.team_id) ?? "—"}`,
        })),
    [employees, teamById, delegatorId],
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!delegatorId || !substituteId) {
      toast.error("اختر المُوكِّل والنائب");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        delegator_id: Number(delegatorId),
        substitute_id: Number(substituteId),
        shift_date: shiftDate,
        coverage_date: coverageDate,
        reason: reason.trim() || null,
      };
      if (isEdit && proxy) {
        await updateProxy(proxy.id, payload);
        toast.success("تم تحديث الوكالة");
      } else {
        await createProxy(payload);
        toast.success("تم تسجيل الوكالة");
      }
      onClose();
      await onSaved();
    } catch (err) {
      toast.error(
        err instanceof ApiRequestError
          ? err.message
          : isEdit
            ? "تعذر التعديل"
            : "تعذر التسجيل",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "تعديل الوكالة" : "تسجيل وكالة جديدة"}
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
          >
            <X size={16} />
            إلغاء
          </Button>
          <Button type="submit" form="proxy-form" loading={submitting}>
            {isEdit ? "حفظ" : "تسجيل"}
          </Button>
        </>
      }
    >
      <form id="proxy-form" onSubmit={handleSubmit} className="space-y-4">
        <SelectField
          label="المُوكِّل"
          value={delegatorId}
          onChange={(e) => {
            setDelegatorId(e.target.value);
            if (e.target.value === substituteId) setSubstituteId("");
          }}
          placeholder="اختر الموظف"
          options={delegatorOptions}
          required
        />
        <SelectField
          label="النائب"
          value={substituteId}
          onChange={(e) => setSubstituteId(e.target.value)}
          placeholder={delegatorId ? "اختر النائب" : "اختر المُوكِّل أولاً"}
          options={substituteOptions}
          disabled={!delegatorId}
          required
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextField
            label="تاريخ شفت المُوكِّل"
            type="date"
            value={shiftDate}
            onChange={(e) => {
              setShiftDate(e.target.value);
              // If coverage date hasn't been touched (still equals previous shift), keep them in sync.
              if (!coverageDate || coverageDate === shiftDate) setCoverageDate(e.target.value);
            }}
            required
          />
          <TextField
            label="تاريخ التغطية (يوم عمل النائب)"
            type="date"
            value={coverageDate}
            onChange={(e) => setCoverageDate(e.target.value)}
            required
          />
        </div>
        <TextField
          label="السبب (اختياري)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="إجازة / مرض / ظرف طارئ"
        />
      </form>
    </Modal>
  );
}
