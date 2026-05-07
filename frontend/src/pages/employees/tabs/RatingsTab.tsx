import { Award, Dumbbell, Lock, Shield, Star, Target, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { ApiRequestError } from "../../../api/client";
import {
  createManagerNote,
  createRating,
  deleteManagerNote,
  deleteRating,
  listManagerNotes,
  listRatings,
  updateRating,
} from "../../../api/employees";
import type { ManagerNote, RatingInput } from "../../../api/employees";
import { Button } from "../../../components/Button";
import { EmptyState } from "../../../components/EmptyState";
import { Loader } from "../../../components/Loader";
import { Modal } from "../../../components/Modal";
import { TextField } from "../../../components/TextField";
import {
  RATING_AXES,
  RATING_AXIS_MAX,
  RATING_TOTAL_MAX,
  type RatingAxisKey,
} from "../../../constants/enums";
import type { MonthlyRating } from "../../../types/models";

const NOW = new Date();
const EMPTY: RatingInput = {
  year: NOW.getFullYear(),
  month: NOW.getMonth() + 1,
  specialty_score: 20,
  discipline_score: 20,
  fitness_score: 20,
  appearance_score: 20,
  notes: null,
};

const AXIS_ICON: Record<RatingAxisKey, typeof Target> = {
  specialty_score: Target,
  discipline_score: Shield,
  fitness_score: Dumbbell,
  appearance_score: Award,
};

function totalTone(total: number): { text: string; bg: string; bar: string } {
  if (total >= 90) return { text: "text-brand-700", bg: "bg-brand-50", bar: "bg-brand-600" };
  if (total >= 75) return { text: "text-blue-700", bg: "bg-blue-50", bar: "bg-blue-600" };
  if (total >= 60) return { text: "text-amber-700", bg: "bg-amber-50", bar: "bg-amber-500" };
  return { text: "text-red-700", bg: "bg-red-50", bar: "bg-red-600" };
}

function axisTone(score: number): { text: string; bar: string } {
  const pct = (score / RATING_AXIS_MAX) * 100;
  if (pct >= 90) return { text: "text-brand-700", bar: "bg-brand-600" };
  if (pct >= 75) return { text: "text-blue-700", bar: "bg-blue-600" };
  if (pct >= 60) return { text: "text-amber-700", bar: "bg-amber-500" };
  return { text: "text-red-700", bar: "bg-red-600" };
}

export function RatingsTab({ employeeId }: { employeeId: number }) {
  const [items, setItems] = useState<MonthlyRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<MonthlyRating | null>(null);
  const [creating, setCreating] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      const res = await listRatings(employeeId);
      setItems(res.items);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "فشل التحميل");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  async function handleDelete(id: number) {
    if (!window.confirm("هل تريد حذف هذا التقييم؟")) return;
    try {
      await deleteRating(employeeId, id);
      toast.success("تم الحذف");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "فشل الحذف");
    }
  }

  const summary = useMemo(() => {
    if (items.length === 0) return null;
    const sum = (key: RatingAxisKey) =>
      items.reduce((acc, r) => acc + r[key], 0);
    const avgAxis = (key: RatingAxisKey) => sum(key) / items.length;
    const overall =
      items.reduce((acc, r) => acc + r.total, 0) / items.length;
    return {
      overall,
      axes: RATING_AXES.map((a) => ({ ...a, value: avgAxis(a.key) })),
    };
  }, [items]);

  return (
    <div className="space-y-5">
      {summary ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <OverallSummaryCard total={summary.overall} />
          {summary.axes.map((a) => (
            <AxisSummaryCard
              key={a.key}
              axisKey={a.key}
              label={a.label}
              value={a.value}
            />
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <ManagerNotesButton employeeId={employeeId} />
        <Button onClick={() => setCreating(true)}>إضافة تقييم</Button>
      </div>

      {loading ? (
        <Loader />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Star}
          title="لا توجد تقييمات"
          description="أضف تقييماً شهرياً للبدء"
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-surface-300 bg-white shadow-soft-green">
          <table className="w-full text-sm">
            <thead className="border-b border-surface-300 bg-surface-100 text-surface-500">
              <tr>
                <th className="px-3 py-3 text-start font-bold">السنة</th>
                <th className="px-3 py-3 text-start font-bold">الشهر</th>
                {RATING_AXES.map((a) => (
                  <th key={a.key} className="px-3 py-3 text-center font-bold">
                    {a.label}
                  </th>
                ))}
                <th className="px-3 py-3 text-center font-bold">المجموع</th>
                <th className="px-3 py-3 text-start font-bold">ملاحظات</th>
                <th className="px-3 py-3 text-end font-bold">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => {
                const tone = totalTone(r.total);
                const pct = (r.total / RATING_TOTAL_MAX) * 100;
                return (
                  <tr key={r.id} className="border-b border-surface-100 last:border-b-0">
                    <td className="px-3 py-3 text-surface-900 tabular-nums">{r.year}</td>
                    <td className="px-3 py-3 text-surface-900 tabular-nums">{r.month}</td>
                    {RATING_AXES.map((a) => (
                      <td
                        key={a.key}
                        className={`px-3 py-3 text-center font-bold tabular-nums ${axisTone(r[a.key]).text}`}
                      >
                        {r[a.key]}
                      </td>
                    ))}
                    <td className="px-3 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-black tabular-nums ${tone.bg} ${tone.text}`}
                        >
                          {r.total}/{RATING_TOTAL_MAX}
                        </span>
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-200">
                          <div
                            className={`h-full ${tone.bar}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-surface-500">{r.notes ?? "—"}</td>
                    <td className="px-3 py-3 text-end">
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setEditing(r)}>
                          تعديل
                        </Button>
                        <Button variant="danger" onClick={() => handleDelete(r.id)}>
                          حذف
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {creating ? (
        <RatingFormModal
          title="إضافة تقييم"
          initial={EMPTY}
          allowEditPeriod
          onClose={() => setCreating(false)}
          onSubmit={async (payload) => {
            await createRating(employeeId, payload);
            toast.success("تمت الإضافة");
            setCreating(false);
            reload();
          }}
        />
      ) : null}

      {editing ? (
        <RatingFormModal
          title="تعديل التقييم"
          initial={{
            year: editing.year,
            month: editing.month,
            specialty_score: editing.specialty_score,
            discipline_score: editing.discipline_score,
            fitness_score: editing.fitness_score,
            appearance_score: editing.appearance_score,
            notes: editing.notes,
          }}
          allowEditPeriod={false}
          onClose={() => setEditing(null)}
          onSubmit={async (payload) => {
            await updateRating(employeeId, editing.id, {
              specialty_score: payload.specialty_score,
              discipline_score: payload.discipline_score,
              fitness_score: payload.fitness_score,
              appearance_score: payload.appearance_score,
              notes: payload.notes,
            });
            toast.success("تم التحديث");
            setEditing(null);
            reload();
          }}
        />
      ) : null}
    </div>
  );
}

function OverallSummaryCard({ total }: { total: number }) {
  const tone = totalTone(total);
  const size = 96;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (total / RATING_TOTAL_MAX) * circumference;
  const colorMap: Record<string, string> = {
    "text-brand-700": "#1a7a3a",
    "text-blue-700": "#2563eb",
    "text-amber-700": "#d97706",
    "text-red-700": "#dc2626",
  };
  const stroke_color = colorMap[tone.text] ?? "#1a7a3a";
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-surface-300 bg-white p-4 shadow-soft-green md:col-span-1">
      <p className="text-[10px] font-bold uppercase tracking-wider text-surface-500">
        المتوسط الكلي
      </p>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#eaf2ea"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={stroke_color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-black tabular-nums leading-none ${tone.text}`}>
            {total.toFixed(1)}
          </span>
          <span className="text-[9px] font-bold text-surface-500">/ {RATING_TOTAL_MAX}</span>
        </div>
      </div>
    </div>
  );
}

function AxisSummaryCard({
  axisKey,
  label,
  value,
}: {
  axisKey: RatingAxisKey;
  label: string;
  value: number;
}) {
  const Icon = AXIS_ICON[axisKey];
  const tone = axisTone(value);
  const pct = (value / RATING_AXIS_MAX) * 100;
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-surface-300 bg-white p-4 shadow-soft-green">
      <div className="flex items-center gap-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-surface-100 ${tone.text}`}>
          <Icon size={16} />
        </div>
        <p className="text-sm font-extrabold text-surface-900">{label}</p>
      </div>
      <div className="flex items-baseline justify-between">
        <span className={`text-2xl font-black tabular-nums ${tone.text}`}>
          {value.toFixed(1)}
        </span>
        <span className="text-[10px] font-bold text-surface-500">/ {RATING_AXIS_MAX}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-200">
        <div className={`h-full ${tone.bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function RatingFormModal({
  title,
  initial,
  allowEditPeriod,
  onClose,
  onSubmit,
}: {
  title: string;
  initial: RatingInput;
  allowEditPeriod: boolean;
  onClose: () => void;
  onSubmit: (payload: RatingInput) => Promise<void>;
}) {
  const [form, setForm] = useState<RatingInput>(initial);
  const [submitting, setSubmitting] = useState(false);
  const total =
    form.specialty_score +
    form.discipline_score +
    form.fitness_score +
    form.appearance_score;
  const tone = totalTone(total);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(form);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "فشل الحفظ");
    } finally {
      setSubmitting(false);
    }
  }

  function setAxis(key: RatingAxisKey, raw: string) {
    const n = Math.max(0, Math.min(RATING_AXIS_MAX, Number(raw) || 0));
    setForm((f) => ({ ...f, [key]: n }));
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
          <Button form="rating-form" type="submit" loading={submitting}>
            حفظ
          </Button>
        </>
      }
    >
      <form id="rating-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="السنة"
            type="number"
            min={2000}
            max={2100}
            value={form.year}
            onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) }))}
            disabled={!allowEditPeriod}
            required
          />
          <TextField
            label="الشهر (1-12)"
            type="number"
            min={1}
            max={12}
            value={form.month}
            onChange={(e) => setForm((f) => ({ ...f, month: Number(e.target.value) }))}
            disabled={!allowEditPeriod}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {RATING_AXES.map((a) => (
            <TextField
              key={a.key}
              label={`${a.label} (0-${RATING_AXIS_MAX})`}
              type="number"
              min={0}
              max={RATING_AXIS_MAX}
              value={form[a.key]}
              onChange={(e) => setAxis(a.key, e.target.value)}
              required
            />
          ))}
        </div>

        <div
          className={`flex items-center justify-between rounded-2xl border border-surface-300 px-4 py-3 ${tone.bg}`}
        >
          <span className="text-sm font-bold text-surface-700">المجموع</span>
          <span className={`text-2xl font-black tabular-nums ${tone.text}`}>
            {total} / {RATING_TOTAL_MAX}
          </span>
        </div>

        <TextField
          label="ملاحظات"
          value={form.notes ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value || null }))}
        />
      </form>
    </Modal>
  );
}

function formatNoteDate(iso: string): string {
  const d = new Date(iso);
  const datePart = d.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });
  const timePart = d.toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart} • ${timePart}`;
}

function ManagerNotesButton({ employeeId }: { employeeId: number }) {
  const [phase, setPhase] = useState<"closed" | "auth" | "open">("closed");
  const [password, setPassword] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [notes, setNotes] = useState<ManagerNote[]>([]);
  const [newText, setNewText] = useState("");
  const [newAction, setNewAction] = useState("");
  const [adding, setAdding] = useState(false);

  function reset() {
    setPhase("closed");
    setPassword("");
    setNotes([]);
    setNewText("");
    setNewAction("");
  }

  async function handleAuth(e: FormEvent) {
    e.preventDefault();
    if (!password) return;
    setAuthSubmitting(true);
    try {
      const res = await listManagerNotes(employeeId, password);
      setNotes(res.items);
      setPhase("open");
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        toast.error("كلمة السر غير صحيحة");
      } else {
        toast.error(err instanceof ApiRequestError ? err.message : "تعذر التحقق");
      }
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handleAdd() {
    const text = newText.trim();
    if (!text) return;
    const action = newAction.trim() || null;
    setAdding(true);
    try {
      const created = await createManagerNote(employeeId, text, action);
      setNotes((arr) => [created, ...arr]);
      setNewText("");
      setNewAction("");
      toast.success("تمت إضافة الملاحظة");
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "تعذر الإضافة");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(noteId: number) {
    if (!window.confirm("هل تريد حذف هذه الملاحظة؟")) return;
    try {
      await deleteManagerNote(employeeId, noteId);
      setNotes((arr) => arr.filter((n) => n.id !== noteId));
      toast.success("تم الحذف");
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "تعذر الحذف");
    }
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setPhase("auth")}>
        <Lock size={14} />
        ملاحظات مدير المركز
      </Button>

      <Modal
        open={phase === "auth"}
        onClose={reset}
        title="تأكيد كلمة السر"
        footer={
          <>
            <Button variant="secondary" onClick={reset} disabled={authSubmitting}>
              إلغاء
            </Button>
            <Button form="manager-notes-auth" type="submit" loading={authSubmitting}>
              متابعة
            </Button>
          </>
        }
      >
        <form id="manager-notes-auth" onSubmit={handleAuth} className="space-y-3">
          <p className="text-sm text-surface-600">
            ملاحظات مدير المركز محمية، أدخل كلمة سر حسابك للمتابعة.
          </p>
          <TextField
            label="كلمة السر"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            required
          />
        </form>
      </Modal>

      <Modal
        open={phase === "open"}
        onClose={reset}
        title="ملاحظات مدير المركز"
        footer={
          <Button variant="secondary" onClick={reset}>
            إغلاق
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2 rounded-2xl border border-surface-300 bg-surface-50 p-3">
            <div>
              <label className="mb-1 block text-[11px] font-bold text-surface-700">
                الملاحظة
              </label>
              <textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="اكتب الملاحظة…"
                rows={3}
                className="w-full resize-none rounded-xl border border-surface-300 bg-white px-3 py-2 text-sm text-surface-900 outline-none transition-colors focus:border-brand-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold text-surface-700">
                الإجراء المتخذ <span className="font-normal text-surface-500">(اختياري)</span>
              </label>
              <textarea
                value={newAction}
                onChange={(e) => setNewAction(e.target.value)}
                placeholder="ما الإجراء الذي اتخذ بناءً على هذه الملاحظة؟"
                rows={2}
                className="w-full resize-none rounded-xl border border-surface-300 bg-white px-3 py-2 text-sm text-surface-900 outline-none transition-colors focus:border-brand-500"
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleAdd} loading={adding} disabled={!newText.trim()}>
                إضافة ملاحظة
              </Button>
            </div>
          </div>

          {notes.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-surface-300 bg-white p-6 text-center text-sm text-surface-500">
              لا توجد ملاحظات بعد.
            </p>
          ) : (
            <ul className="space-y-2">
              {notes.map((n) => (
                <li
                  key={n.id}
                  className="group flex items-start gap-3 rounded-2xl border border-surface-200 bg-white p-3 shadow-soft-green"
                >
                  <div className="flex-1 space-y-2">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-surface-500">
                        الملاحظة
                      </p>
                      <p className="whitespace-pre-wrap text-sm text-surface-900">{n.text}</p>
                    </div>
                    {n.action_taken ? (
                      <div className="rounded-xl border border-brand-200 bg-brand-50 p-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-brand-700">
                          الإجراء المتخذ
                        </p>
                        <p className="whitespace-pre-wrap text-sm text-brand-900">
                          {n.action_taken}
                        </p>
                      </div>
                    ) : null}
                    <p className="text-[11px] font-bold text-surface-500">
                      {formatNoteDate(n.created_at)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(n.id)}
                    className="rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-red-50 hover:text-red-700"
                    title="حذف"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>
    </>
  );
}
