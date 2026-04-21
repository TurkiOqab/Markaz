import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { ApiRequestError } from "../../../api/client";
import {
  createRating,
  deleteRating,
  listRatings,
  updateRating,
} from "../../../api/employees";
import type { RatingInput } from "../../../api/employees";
import { Button } from "../../../components/Button";
import { EmptyState } from "../../../components/EmptyState";
import { Modal } from "../../../components/Modal";
import { TextField } from "../../../components/TextField";
import { RATING_MAX, RATING_MIN } from "../../../constants/enums";
import type { MonthlyRating } from "../../../types/models";

const NOW = new Date();
const EMPTY: RatingInput = {
  year: NOW.getFullYear(),
  month: NOW.getMonth() + 1,
  rating: 4,
  notes: null,
};

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

  const average = items.length
    ? (items.reduce((sum, r) => sum + r.rating, 0) / items.length).toFixed(2)
    : "—";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          المتوسط: <span className="font-semibold text-slate-900">{average}</span>
        </p>
        <Button onClick={() => setCreating(true)}>إضافة تقييم</Button>
      </div>

      {loading ? (
        <p className="text-slate-500">جارِ التحميل...</p>
      ) : items.length === 0 ? (
        <EmptyState title="لا توجد تقييمات" description="أضف تقييماً شهرياً للبدء" />
      ) : (
        <table className="w-full rounded-lg border border-slate-200 bg-white text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-start font-medium">السنة</th>
              <th className="px-4 py-3 text-start font-medium">الشهر</th>
              <th className="px-4 py-3 text-start font-medium">التقييم</th>
              <th className="px-4 py-3 text-start font-medium">ملاحظات</th>
              <th className="px-4 py-3 text-end font-medium">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 last:border-b-0">
                <td className="px-4 py-3 text-slate-700">{r.year}</td>
                <td className="px-4 py-3 text-slate-700">{r.month}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{r.rating}</td>
                <td className="px-4 py-3 text-slate-600">{r.notes ?? "—"}</td>
                <td className="px-4 py-3 text-end">
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
            ))}
          </tbody>
        </table>
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
            rating: editing.rating,
            notes: editing.notes,
          }}
          allowEditPeriod={false}
          onClose={() => setEditing(null)}
          onSubmit={async (payload) => {
            await updateRating(employeeId, editing.id, {
              rating: payload.rating,
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
        <TextField
          label={`التقييم (${RATING_MIN}-${RATING_MAX})`}
          type="number"
          step="0.1"
          min={RATING_MIN}
          max={RATING_MAX}
          value={form.rating}
          onChange={(e) => setForm((f) => ({ ...f, rating: Number(e.target.value) }))}
          required
        />
        <TextField
          label="ملاحظات"
          value={form.notes ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value || null }))}
        />
      </form>
    </Modal>
  );
}
