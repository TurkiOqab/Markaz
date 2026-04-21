import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { ApiRequestError } from "../../../api/client";
import {
  createEmployeeEquipment,
  deleteEmployeeEquipment,
  listEmployeeEquipment,
  updateEmployeeEquipment,
} from "../../../api/employees";
import type { EquipmentInput } from "../../../api/employees";
import { Button } from "../../../components/Button";
import { EmptyState } from "../../../components/EmptyState";
import { Modal } from "../../../components/Modal";
import { SelectField } from "../../../components/SelectField";
import { TextField } from "../../../components/TextField";
import { EQUIPMENT_CONDITIONS } from "../../../constants/enums";
import type { Equipment } from "../../../types/models";

const EMPTY: EquipmentInput = {
  item_name: "",
  serial_number: null,
  assigned_date: "",
  condition: "جيد",
};

export function EquipmentTab({ employeeId }: { employeeId: number }) {
  const [items, setItems] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Equipment | null>(null);
  const [creating, setCreating] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      const res = await listEmployeeEquipment(employeeId);
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
    if (!window.confirm("هل تريد حذف هذا التجهيز؟")) return;
    try {
      await deleteEmployeeEquipment(employeeId, id);
      toast.success("تم الحذف");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "فشل الحذف");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)}>إضافة تجهيز</Button>
      </div>

      {loading ? (
        <p className="text-slate-500">جارِ التحميل...</p>
      ) : items.length === 0 ? (
        <EmptyState title="لا توجد تجهيزات" description="أضف تجهيزاً للبدء" />
      ) : (
        <table className="w-full rounded-lg border border-slate-200 bg-white text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-start font-medium">الاسم</th>
              <th className="px-4 py-3 text-start font-medium">الرقم التسلسلي</th>
              <th className="px-4 py-3 text-start font-medium">تاريخ التسليم</th>
              <th className="px-4 py-3 text-start font-medium">الحالة</th>
              <th className="px-4 py-3 text-end font-medium">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {items.map((eq) => (
              <tr key={eq.id} className="border-b border-slate-100 last:border-b-0">
                <td className="px-4 py-3 font-medium text-slate-900">{eq.item_name}</td>
                <td className="px-4 py-3 text-slate-700">{eq.serial_number ?? "—"}</td>
                <td className="px-4 py-3 text-slate-700">{eq.assigned_date}</td>
                <td className="px-4 py-3 text-slate-700">{eq.condition}</td>
                <td className="px-4 py-3 text-end">
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => setEditing(eq)}>
                      تعديل
                    </Button>
                    <Button variant="danger" onClick={() => handleDelete(eq.id)}>
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
        <EquipmentFormModal
          title="إضافة تجهيز"
          initial={EMPTY}
          onClose={() => setCreating(false)}
          onSubmit={async (payload) => {
            await createEmployeeEquipment(employeeId, payload);
            toast.success("تمت الإضافة");
            setCreating(false);
            reload();
          }}
        />
      ) : null}

      {editing ? (
        <EquipmentFormModal
          title="تعديل التجهيز"
          initial={{
            item_name: editing.item_name,
            serial_number: editing.serial_number,
            assigned_date: editing.assigned_date,
            condition: editing.condition,
          }}
          onClose={() => setEditing(null)}
          onSubmit={async (payload) => {
            await updateEmployeeEquipment(employeeId, editing.id, payload);
            toast.success("تم التحديث");
            setEditing(null);
            reload();
          }}
        />
      ) : null}
    </div>
  );
}

function EquipmentFormModal({
  title,
  initial,
  onClose,
  onSubmit,
}: {
  title: string;
  initial: EquipmentInput;
  onClose: () => void;
  onSubmit: (payload: EquipmentInput) => Promise<void>;
}) {
  const [form, setForm] = useState<EquipmentInput>(initial);
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
          <Button form="eq-form" type="submit" loading={submitting}>
            حفظ
          </Button>
        </>
      }
    >
      <form id="eq-form" onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="اسم التجهيز"
          value={form.item_name}
          onChange={(e) => setForm((f) => ({ ...f, item_name: e.target.value }))}
          required
        />
        <TextField
          label="الرقم التسلسلي"
          value={form.serial_number ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, serial_number: e.target.value || null }))}
        />
        <TextField
          label="تاريخ التسليم"
          type="date"
          value={form.assigned_date}
          onChange={(e) => setForm((f) => ({ ...f, assigned_date: e.target.value }))}
          required
        />
        <SelectField
          label="الحالة"
          value={form.condition}
          onChange={(e) =>
            setForm((f) => ({ ...f, condition: e.target.value as typeof f.condition }))
          }
          options={EQUIPMENT_CONDITIONS.map((c) => ({ value: c, label: c }))}
        />
      </form>
    </Modal>
  );
}
