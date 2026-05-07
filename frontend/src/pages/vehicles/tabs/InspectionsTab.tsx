import { ClipboardCheck } from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { ApiRequestError } from "../../../api/client";
import {
  createInspection,
  deleteInspection,
  listInspections,
  updateInspection,
} from "../../../api/vehicles";
import type { InspectionInput } from "../../../api/vehicles";
import { Badge, inspectionResultTone } from "../../../components/Badge";
import { Button } from "../../../components/Button";
import { EmptyState } from "../../../components/EmptyState";
import { Loader } from "../../../components/Loader";
import { Modal } from "../../../components/Modal";
import { SelectField } from "../../../components/SelectField";
import { TextField } from "../../../components/TextField";
import { INSPECTION_RESULTS } from "../../../constants/enums";
import type { VehicleInspection } from "../../../types/models";

const EMPTY: InspectionInput = {
  inspection_date: "",
  inspector_name: "",
  result: "ناجح",
  notes: null,
};

export function InspectionsTab({ vehicleId }: { vehicleId: number }) {
  const [items, setItems] = useState<VehicleInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<VehicleInspection | null>(null);
  const [creating, setCreating] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      const res = await listInspections(vehicleId);
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
  }, [vehicleId]);

  async function handleDelete(id: number) {
    if (!window.confirm("هل تريد حذف هذا الفحص؟")) return;
    try {
      await deleteInspection(vehicleId, id);
      toast.success("تم الحذف");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "فشل الحذف");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)}>إضافة فحص</Button>
      </div>

      {loading ? (
        <Loader />
      ) : items.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="لا توجد فحوصات"
          description="أضف فحصاً للبدء"
        />
      ) : (
        <table className="w-full rounded-lg border border-surface-300 bg-white text-sm">
          <thead className="border-b border-surface-300 bg-surface-100 text-surface-500">
            <tr>
              <th className="px-4 py-3 text-start font-medium">التاريخ</th>
              <th className="px-4 py-3 text-start font-medium">المفتش</th>
              <th className="px-4 py-3 text-start font-medium">النتيجة</th>
              <th className="px-4 py-3 text-start font-medium">ملاحظات</th>
              <th className="px-4 py-3 text-end font-medium">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-b border-surface-100 last:border-b-0">
                <td className="px-4 py-3 text-surface-900">{i.inspection_date}</td>
                <td className="px-4 py-3 font-medium text-surface-900">{i.inspector_name}</td>
                <td className="px-4 py-3">
                  <Badge tone={inspectionResultTone(i.result)}>{i.result}</Badge>
                </td>
                <td className="px-4 py-3 text-surface-500">{i.notes ?? "—"}</td>
                <td className="px-4 py-3 text-end">
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => setEditing(i)}>
                      تعديل
                    </Button>
                    <Button variant="danger" onClick={() => handleDelete(i.id)}>
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
        <InspectionFormModal
          title="إضافة فحص"
          initial={EMPTY}
          onClose={() => setCreating(false)}
          onSubmit={async (payload) => {
            await createInspection(vehicleId, payload);
            toast.success("تمت الإضافة");
            setCreating(false);
            reload();
          }}
        />
      ) : null}

      {editing ? (
        <InspectionFormModal
          title="تعديل الفحص"
          initial={{
            inspection_date: editing.inspection_date,
            inspector_name: editing.inspector_name,
            result: editing.result,
            notes: editing.notes,
          }}
          onClose={() => setEditing(null)}
          onSubmit={async (payload) => {
            await updateInspection(vehicleId, editing.id, payload);
            toast.success("تم التحديث");
            setEditing(null);
            reload();
          }}
        />
      ) : null}
    </div>
  );
}

function InspectionFormModal({
  title,
  initial,
  onClose,
  onSubmit,
}: {
  title: string;
  initial: InspectionInput;
  onClose: () => void;
  onSubmit: (payload: InspectionInput) => Promise<void>;
}) {
  const [form, setForm] = useState<InspectionInput>(initial);
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
          <Button form="insp-form" type="submit" loading={submitting}>
            حفظ
          </Button>
        </>
      }
    >
      <form id="insp-form" onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="تاريخ الفحص"
          type="date"
          value={form.inspection_date}
          onChange={(e) => setForm((f) => ({ ...f, inspection_date: e.target.value }))}
          required
        />
        <TextField
          label="اسم المفتش"
          value={form.inspector_name}
          onChange={(e) => setForm((f) => ({ ...f, inspector_name: e.target.value }))}
          required
        />
        <SelectField
          label="النتيجة"
          value={form.result}
          onChange={(e) => setForm((f) => ({ ...f, result: e.target.value as typeof f.result }))}
          options={INSPECTION_RESULTS.map((r) => ({ value: r, label: r }))}
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
