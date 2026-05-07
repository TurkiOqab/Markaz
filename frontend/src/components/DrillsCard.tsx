import {
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  ListChecks,
  Plus,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { ApiRequestError } from "../api/client";
import {
  createDrill,
  deleteDrill,
  listDrills,
  notifyDrillsChanged,
  updateDrill,
} from "../api/drills";
import type { Drill, DrillKind, PrepStage } from "../types/models";
import { Button } from "./Button";
import { Modal } from "./Modal";
import { SelectField } from "./SelectField";
import { TextField } from "./TextField";

const DEFAULT_PREP_STAGES: PrepStage[] = [
  { label: "تجهيز الفرق", completed: false, completed_at: null },
  { label: "تجهيز التجهيزات والمعدات", completed: false, completed_at: null },
  { label: "تنسيق مع الجهات المعنية", completed: false, completed_at: null },
  { label: "التحقق النهائي من الجاهزية", completed: false, completed_at: null },
];

const KINDS: DrillKind[] = ["زيارة", "فرضية", "جولة ميدانية"];

const KIND_BADGE: Record<DrillKind, string> = {
  "زيارة": "bg-blue-50 text-blue-700 ring-blue-200",
  "فرضية": "bg-amber-50 text-amber-700 ring-amber-200",
  "جولة ميدانية": "bg-brand-50 text-brand-700 ring-brand-200",
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  // Backend may return either "YYYY-MM-DD" (date) or "YYYY-MM-DDTHH:MM:SS"
  // (datetime). Slice the date portion and parse as local to avoid TZ shifts.
  const ymd = iso.length >= 10 ? iso.slice(0, 10) : iso;
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d || Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) {
    return String(iso);
  }
  return new Date(y, m - 1, d).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function formatDateTimeSafe(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

import { todayIso as todayLocal } from "../lib/clock";

export function DrillsCard() {
  const [drills, setDrills] = useState<Drill[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [prepDrill, setPrepDrill] = useState<Drill | null>(null);

  const reload = useCallback(async () => {
    try {
      const res = await listDrills();
      setDrills(res.items);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "تعذر تحميل الجدول");
    }
  }, []);

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, [reload]);

  async function handleToggleComplete(d: Drill) {
    try {
      await updateDrill(d.id, { completed: !d.completed });
      await reload();
      notifyDrillsChanged();
      toast.success(d.completed ? "تم التراجع" : "تم تأكيد الإكمال");
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "تعذر التحديث");
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteDrill(id);
      await reload();
      notifyDrillsChanged();
      toast.success("تم الحذف");
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "تعذر الحذف");
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-surface-300 bg-white shadow-soft-green">
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-l from-brand-500 to-brand-700" />

      <header className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <ClipboardCheck size={20} />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-surface-900">
              جدول الزيارات والفرضيات
            </h2>
            <p className="text-xs text-surface-500">
              {drills.length} مجدولة
              {drills.length > 0
                ? ` • ${drills.filter((d) => d.completed).length} مكتملة`
                : ""}
            </p>
          </div>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} />
          إضافة
        </Button>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-right text-sm">
          <thead className="border-y border-surface-200 bg-surface-100 text-surface-500">
            <tr>
              <th className="px-4 py-2 text-xs font-bold">النوع</th>
              <th className="px-4 py-2 text-xs font-bold">الاسم</th>
              <th className="px-4 py-2 text-xs font-bold">الموعد</th>
              <th className="px-4 py-2 text-xs font-bold">الاستعداد</th>
              <th className="px-4 py-2 text-xs font-bold">الحالة</th>
              <th className="px-4 py-2 text-xs font-bold">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-200">
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-xs text-surface-500"
                >
                  جارِ التحميل...
                </td>
              </tr>
            ) : drills.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-xs text-surface-500"
                >
                  لا توجد زيارات أو فرضيات مجدولة. اضغط "إضافة" للبدء.
                </td>
              </tr>
            ) : (
              drills.map((d) => (
                <tr
                  key={d.id}
                  className={`transition-colors hover:bg-brand-50 ${d.completed ? "opacity-60" : ""}`}
                >
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${KIND_BADGE[d.kind]}`}
                    >
                      {d.kind}
                    </span>
                  </td>
                  <td className={`px-4 py-2.5 font-bold text-surface-900 ${d.completed ? "line-through" : ""}`}>
                    {d.title}
                  </td>
                  <td className="px-4 py-2.5 text-surface-500 tabular-nums">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar size={12} />
                      {formatDate(d.scheduled_at)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <PrepBadge drill={d} onOpen={() => setPrepDrill(d)} />
                  </td>
                  <td className="px-4 py-2.5">
                    {d.completed ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-bold text-brand-700 ring-1 ring-inset ring-brand-200">
                        <CheckCircle2 size={12} />
                        تمّت{" "}
                        {d.completed_at ? formatDateTimeSafe(d.completed_at) : ""}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-100 px-2.5 py-0.5 text-[11px] font-bold text-surface-500">
                        قيد الانتظار
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleToggleComplete(d)}
                        title={d.completed ? "تراجع" : "تأكيد الإكمال"}
                        className={`rounded-lg border px-2.5 py-1 text-[10px] font-bold transition-colors ${
                          d.completed
                            ? "border-surface-300 text-surface-500 hover:bg-surface-100"
                            : "border-brand-200 text-brand-700 hover:bg-brand-50"
                        }`}
                      >
                        {d.completed ? (
                          <span className="inline-flex items-center gap-1">
                            <Undo2 size={11} />
                            تراجع
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle2 size={11} />
                            تمّت
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(d.id)}
                        title="حذف"
                        className="rounded-lg border border-red-200 px-2 py-1 text-red-600 transition-colors hover:bg-red-50"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AddDrillModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={async () => {
          await reload();
        }}
      />

      <PrepStagesModal
        drill={prepDrill}
        onClose={() => setPrepDrill(null)}
        onSaved={async () => {
          await reload();
          notifyDrillsChanged();
        }}
      />
    </div>
  );
}

function PrepBadge({ drill, onOpen }: { drill: Drill; onOpen: () => void }) {
  const stages = drill.prep_stages ?? [];
  const total = stages.length;
  const done = stages.filter((s) => s.completed).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const tone =
    total === 0
      ? "border-surface-300 text-surface-500 hover:bg-surface-100"
      : pct === 100
        ? "border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100"
        : pct >= 50
          ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
          : "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100";
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-bold transition-colors ${tone}`}
      title="إدارة مراحل الاستعداد"
    >
      <ListChecks size={11} />
      {total === 0 ? "إعداد" : `${done}/${total}`}
    </button>
  );
}

function PrepStagesModal({
  drill,
  onClose,
  onSaved,
}: {
  drill: Drill | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const [stages, setStages] = useState<PrepStage[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!drill) return;
    const existing = drill.prep_stages ?? [];
    setStages(existing.length > 0 ? existing.map((s) => ({ ...s })) : DEFAULT_PREP_STAGES.map((s) => ({ ...s })));
  }, [drill]);

  if (!drill) return null;

  function toggle(i: number) {
    setStages((arr) =>
      arr.map((s, idx) =>
        idx === i
          ? {
              ...s,
              completed: !s.completed,
              completed_at: !s.completed ? new Date().toISOString() : null,
            }
          : s,
      ),
    );
  }

  function setLabel(i: number, label: string) {
    setStages((arr) => arr.map((s, idx) => (idx === i ? { ...s, label } : s)));
  }

  function remove(i: number) {
    setStages((arr) => arr.filter((_, idx) => idx !== i));
  }

  function add() {
    setStages((arr) => [
      ...arr,
      { label: `مرحلة ${arr.length + 1}`, completed: false, completed_at: null },
    ]);
  }

  async function handleSave() {
    if (!drill) return;
    const cleaned = stages
      .map((s) => ({ ...s, label: s.label.trim() }))
      .filter((s) => s.label.length > 0);
    if (cleaned.some((s) => s.label.length > 200)) {
      toast.error("اسم المرحلة طويل جداً");
      return;
    }
    setSubmitting(true);
    try {
      await updateDrill(drill.id, { prep_stages: cleaned });
      toast.success("تم حفظ مراحل الاستعداد");
      onClose();
      await onSaved();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "تعذر الحفظ");
    } finally {
      setSubmitting(false);
    }
  }

  const done = stages.filter((s) => s.completed).length;
  const total = stages.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <Modal
      open={drill !== null}
      onClose={onClose}
      title={`الاستعداد: ${drill.title}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            إلغاء
          </Button>
          <Button onClick={handleSave} loading={submitting}>
            حفظ
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-surface-300 bg-surface-50 p-3">
          <div className="flex items-center justify-between text-xs font-bold text-surface-700">
            <span>التقدم</span>
            <span className="tabular-nums">
              {done} / {total} ({pct}%)
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-200">
            <div
              className={`h-full ${pct === 100 ? "bg-brand-600" : pct >= 50 ? "bg-blue-600" : "bg-amber-500"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <ul className="space-y-2">
          {stages.map((s, i) => (
            <li
              key={i}
              className="flex items-start gap-2 rounded-xl border border-surface-200 bg-white p-2"
            >
              <button
                type="button"
                onClick={() => toggle(i)}
                aria-label={s.completed ? "إلغاء التحقق" : "تحقق من المرحلة"}
                className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                  s.completed
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-surface-300 bg-white text-transparent hover:border-brand-400"
                }`}
              >
                <CheckCircle2 size={14} />
              </button>
              <div className="flex-1">
                <input
                  type="text"
                  value={s.label}
                  onChange={(e) => setLabel(i, e.target.value)}
                  className={`w-full rounded-md border border-transparent bg-transparent px-1 py-0.5 text-sm font-medium focus:border-surface-300 focus:bg-white focus:outline-none ${
                    s.completed ? "text-surface-500 line-through" : "text-surface-900"
                  }`}
                />
                {s.completed && s.completed_at ? (
                  <p className="text-[10px] text-surface-500">
                    أُكملت {formatDateTimeSafe(s.completed_at)}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => remove(i)}
                title="حذف المرحلة"
                className="rounded-md p-1 text-surface-400 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={add}
          className="w-full rounded-xl border-2 border-dashed border-surface-300 px-3 py-2 text-xs font-bold text-surface-500 transition-colors hover:border-brand-400 hover:text-brand-700"
        >
          <Plus size={12} className="inline align-middle" /> إضافة مرحلة
        </button>
      </div>
    </Modal>
  );
}

function AddDrillModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => Promise<void> | void;
}) {
  const [kind, setKind] = useState<DrillKind>("زيارة");
  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState(todayLocal());
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setKind("زيارة");
    setTitle("");
    setScheduledAt(todayLocal());
    setNotes("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("الاسم مطلوب");
      return;
    }
    setSubmitting(true);
    try {
      await createDrill({
        kind,
        title: title.trim(),
        scheduled_at: scheduledAt,
        notes: notes.trim() || null,
      });
      toast.success("تم الإضافة");
      reset();
      onClose();
      await onCreated();
      notifyDrillsChanged();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "تعذر الإضافة");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="إضافة زيارة أو فرضية"
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              reset();
              onClose();
            }}
            disabled={submitting}
          >
            إلغاء
          </Button>
          <Button type="submit" form="drill-form" loading={submitting}>
            حفظ
          </Button>
        </>
      }
    >
      <form id="drill-form" onSubmit={handleSubmit} className="space-y-4">
        <SelectField
          label="النوع"
          value={kind}
          onChange={(e) => setKind(e.target.value as DrillKind)}
          options={KINDS.map((k) => ({ value: k, label: k }))}
        />
        <TextField
          label="الاسم"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="مثال: زيارة المدير العام / فرضية حريق مبنى"
        />
        <TextField
          label="الموعد"
          type="date"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          required
        />
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-surface-900">
            ملاحظات (اختياري)
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="rounded-md border border-surface-300 bg-white px-3 py-2 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </label>
      </form>
    </Modal>
  );
}
