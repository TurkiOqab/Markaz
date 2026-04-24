import { Wrench } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { ApiRequestError } from "../../../api/client";
import {
  createBuildingMaintenance,
  deleteBuildingMaintenance,
  listBuildingMaintenance,
  updateBuildingMaintenance,
} from "../../../api/building";
import type { BuildingMaintenanceInput } from "../../../api/building";
import { Badge, maintenanceStatusTone } from "../../../components/Badge";
import { Button } from "../../../components/Button";
import { EmptyState } from "../../../components/EmptyState";
import { Loader } from "../../../components/Loader";
import { Modal } from "../../../components/Modal";
import { SelectField } from "../../../components/SelectField";
import { SortSelect } from "../../../components/SortSelect";
import { TextField } from "../../../components/TextField";
import { MAINTENANCE_STATUSES } from "../../../constants/enums";
import type { BuildingMaintenance } from "../../../types/models";

type SortOption = "date_desc" | "date_asc" | "cost_desc" | "cost_asc" | "status_asc";

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: "date_desc", label: "التاريخ (الأحدث)" },
  { value: "date_asc", label: "التاريخ (الأقدم)" },
  { value: "cost_desc", label: "التكلفة (من الأعلى)" },
  { value: "cost_asc", label: "التكلفة (من الأقل)" },
  { value: "status_asc", label: "حسب الحالة" },
];

const EMPTY: BuildingMaintenanceInput = {
  date: "",
  description: "",
  cost: 0,
  contractor: "",
  status: "مكتمل",
};

export function MaintenanceTab() {
  const [items, setItems] = useState<BuildingMaintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BuildingMaintenance | null>(null);
  const [creating, setCreating] = useState(false);

  const [sort, setSort] = useState<SortOption>("date_desc");

  const visible = useMemo(() => {
    const sorted = [...items];
    switch (sort) {
      case "date_desc":
        sorted.sort((a, b) => b.date.localeCompare(a.date));
        break;
      case "date_asc":
        sorted.sort((a, b) => a.date.localeCompare(b.date));
        break;
      case "cost_desc":
        sorted.sort((a, b) => b.cost - a.cost);
        break;
      case "cost_asc":
        sorted.sort((a, b) => a.cost - b.cost);
        break;
      case "status_asc":
        sorted.sort((a, b) => a.status.localeCompare(b.status, "ar"));
        break;
    }
    return sorted;
  }, [items, sort]);

  async function reload() {
    setLoading(true);
    try {
      const res = await listBuildingMaintenance();
      setItems(res.items);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "فشل التحميل");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleDelete(id: number) {
    if (!window.confirm("هل تريد حذف سجل الصيانة هذا؟")) return;
    try {
      await deleteBuildingMaintenance(id);
      toast.success("تم الحذف");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "فشل الحذف");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-3">
        <SortSelect
          value={sort}
          onChange={(v) => setSort(v as SortOption)}
          options={SORT_OPTIONS}
        />
        <Button onClick={() => setCreating(true)}>إضافة صيانة</Button>
      </div>

      {loading ? (
        <Loader />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="لا توجد سجلات صيانة"
          description="أضف سجل صيانة للبدء"
        />
      ) : (
        <table className="w-full rounded-lg border border-slate-200 bg-white text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-start font-medium">التاريخ</th>
              <th className="px-4 py-3 text-start font-medium">الوصف</th>
              <th className="px-4 py-3 text-start font-medium">التكلفة</th>
              <th className="px-4 py-3 text-start font-medium">المقاول</th>
              <th className="px-4 py-3 text-start font-medium">الحالة</th>
              <th className="px-4 py-3 text-end font-medium">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((m) => (
              <tr key={m.id} className="border-b border-slate-100 last:border-b-0">
                <td className="px-4 py-3 text-slate-700">{m.date}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{m.description}</td>
                <td className="px-4 py-3 text-slate-700">{m.cost}</td>
                <td className="px-4 py-3 text-slate-700">{m.contractor}</td>
                <td className="px-4 py-3">
                  <Badge tone={maintenanceStatusTone(m.status)}>{m.status}</Badge>
                </td>
                <td className="px-4 py-3 text-end">
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => setEditing(m)}>
                      تعديل
                    </Button>
                    <Button variant="danger" onClick={() => handleDelete(m.id)}>
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
        <MaintenanceFormModal
          title="إضافة صيانة"
          initial={EMPTY}
          onClose={() => setCreating(false)}
          onSubmit={async (payload) => {
            await createBuildingMaintenance(payload);
            toast.success("تمت الإضافة");
            setCreating(false);
            reload();
          }}
        />
      ) : null}

      {editing ? (
        <MaintenanceFormModal
          title="تعديل الصيانة"
          initial={{
            date: editing.date,
            description: editing.description,
            cost: editing.cost,
            contractor: editing.contractor,
            status: editing.status,
          }}
          onClose={() => setEditing(null)}
          onSubmit={async (payload) => {
            await updateBuildingMaintenance(editing.id, payload);
            toast.success("تم التحديث");
            setEditing(null);
            reload();
          }}
        />
      ) : null}
    </div>
  );
}

function MaintenanceFormModal({
  title,
  initial,
  onClose,
  onSubmit,
}: {
  title: string;
  initial: BuildingMaintenanceInput;
  onClose: () => void;
  onSubmit: (payload: BuildingMaintenanceInput) => Promise<void>;
}) {
  const [form, setForm] = useState<BuildingMaintenanceInput>(initial);
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
          <Button form="bmaint-form" type="submit" loading={submitting}>
            حفظ
          </Button>
        </>
      }
    >
      <form id="bmaint-form" onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="التاريخ"
          type="date"
          value={form.date}
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          required
        />
        <TextField
          label="الوصف"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          required
        />
        <TextField
          label="التكلفة"
          type="number"
          min={0}
          step="0.01"
          value={form.cost}
          onChange={(e) => setForm((f) => ({ ...f, cost: Number(e.target.value) }))}
          required
        />
        <TextField
          label="المقاول"
          value={form.contractor}
          onChange={(e) => setForm((f) => ({ ...f, contractor: e.target.value }))}
          required
        />
        <SelectField
          label="الحالة"
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as typeof f.status }))}
          options={MAINTENANCE_STATUSES.map((s) => ({ value: s, label: s }))}
        />
      </form>
    </Modal>
  );
}
