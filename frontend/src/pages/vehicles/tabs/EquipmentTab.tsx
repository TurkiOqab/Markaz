import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { ApiRequestError } from "../../../api/client";
import {
  createVehicleEquipment,
  deleteVehicleEquipment,
  listVehicleEquipment,
  updateVehicleEquipment,
} from "../../../api/vehicles";
import type { VehicleEquipmentInput } from "../../../api/vehicles";
import { Button } from "../../../components/Button";
import { EmptyState } from "../../../components/EmptyState";
import { Modal } from "../../../components/Modal";
import { SelectField } from "../../../components/SelectField";
import { TextField } from "../../../components/TextField";
import { EQUIPMENT_CONDITIONS } from "../../../constants/enums";
import type { VehicleOnboardEquipment } from "../../../types/models";

const EMPTY: VehicleEquipmentInput = {
  item_name: "",
  quantity: 1,
  condition: "جيد",
};

export function EquipmentTab({ vehicleId }: { vehicleId: number }) {
  const [items, setItems] = useState<VehicleOnboardEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<VehicleOnboardEquipment | null>(null);
  const [creating, setCreating] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      const res = await listVehicleEquipment(vehicleId);
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
    if (!window.confirm("هل تريد حذف هذا التجهيز؟")) return;
    try {
      await deleteVehicleEquipment(vehicleId, id);
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
        <EmptyState title="لا توجد تجهيزات على المركبة" description="أضف تجهيزاً للبدء" />
      ) : (
        <table className="w-full rounded-lg border border-slate-200 bg-white text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-start font-medium">الاسم</th>
              <th className="px-4 py-3 text-start font-medium">الكمية</th>
              <th className="px-4 py-3 text-start font-medium">الحالة</th>
              <th className="px-4 py-3 text-end font-medium">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {items.map((eq) => (
              <tr key={eq.id} className="border-b border-slate-100 last:border-b-0">
                <td className="px-4 py-3 font-medium text-slate-900">{eq.item_name}</td>
                <td className="px-4 py-3 text-slate-700">{eq.quantity}</td>
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
            await createVehicleEquipment(vehicleId, payload);
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
            quantity: editing.quantity,
            condition: editing.condition,
          }}
          onClose={() => setEditing(null)}
          onSubmit={async (payload) => {
            await updateVehicleEquipment(vehicleId, editing.id, payload);
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
  initial: VehicleEquipmentInput;
  onClose: () => void;
  onSubmit: (payload: VehicleEquipmentInput) => Promise<void>;
}) {
  const [form, setForm] = useState<VehicleEquipmentInput>(initial);
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
          <Button form="veq-form" type="submit" loading={submitting}>
            حفظ
          </Button>
        </>
      }
    >
      <form id="veq-form" onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="اسم التجهيز"
          value={form.item_name}
          onChange={(e) => setForm((f) => ({ ...f, item_name: e.target.value }))}
          required
        />
        <TextField
          label="الكمية"
          type="number"
          min={0}
          value={form.quantity}
          onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
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
