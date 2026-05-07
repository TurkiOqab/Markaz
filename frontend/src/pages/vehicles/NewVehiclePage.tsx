import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ApiRequestError } from "../../api/client";
import { listEmployees } from "../../api/employees";
import { createVehicle } from "../../api/vehicles";
import type { VehicleCreateInput } from "../../api/vehicles";
import { Button } from "../../components/Button";
import { PageHeader } from "../../components/PageHeader";
import { PlateInput } from "../../components/PlateInput";
import { SelectField } from "../../components/SelectField";
import { VEHICLE_LINES, VEHICLE_STATUSES, VEHICLE_TYPES } from "../../constants/enums";
import type { EmployeeSummary } from "../../types/models";

const EMPTY: VehicleCreateInput = {
  type: "كوماندر(مزدوجة)",
  plate_number: "",
  status: "في الخدمة",
  line: "الأول",
  driver_id: null,
};

export function NewVehiclePage() {
  const [form, setForm] = useState<VehicleCreateInput>(EMPTY);
  const [drivers, setDrivers] = useState<EmployeeSummary[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    listEmployees({ page: 1, page_size: 200 })
      .then((res) => setDrivers(res.items))
      .catch(() => toast.error("تعذر تحميل الموظفين"));
  }, []);

  function update<K extends keyof VehicleCreateInput>(key: K, value: VehicleCreateInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created = await createVehicle(form);
      toast.success("تم إنشاء المركبة");
      navigate(`/vehicles/${created.id}`, { replace: true });
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "فشل إنشاء المركبة");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="إضافة مركبة"
        backLink={{ to: "/vehicles", label: "الرجوع إلى القائمة" }}
      />

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-4 rounded-lg border border-surface-300 bg-white p-6 md:grid-cols-2"
      >
        <SelectField
          label="النوع"
          value={form.type}
          onChange={(e) => update("type", e.target.value as typeof form.type)}
          options={VEHICLE_TYPES.map((t) => ({ value: t, label: t }))}
        />
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-surface-900">رقم اللوحة</span>
          <PlateInput
            value={form.plate_number}
            onChange={(v) => update("plate_number", v)}
            required
          />
          <span className="text-[10px] text-surface-500">٣ حروف و٤ أرقام</span>
        </label>
        <SelectField
          label="الحالة"
          value={form.status}
          onChange={(e) => update("status", e.target.value as typeof form.status)}
          options={VEHICLE_STATUSES.map((s) => ({ value: s, label: s }))}
        />
        <SelectField
          label="الخط"
          value={form.line}
          onChange={(e) => update("line", e.target.value as typeof form.line)}
          options={VEHICLE_LINES.map((l) => ({ value: l, label: `الخط ${l}` }))}
        />
        <SelectField
          label="السائق"
          value={form.driver_id ? String(form.driver_id) : ""}
          onChange={(e) => update("driver_id", e.target.value ? Number(e.target.value) : null)}
          placeholder="بدون سائق"
          options={drivers.map((d) => ({ value: d.id, label: d.name }))}
        />

        <div className="flex justify-end gap-2 md:col-span-2">
          <Button variant="secondary" type="button" onClick={() => navigate(-1)}>
            إلغاء
          </Button>
          <Button type="submit" loading={submitting}>
            حفظ
          </Button>
        </div>
      </form>
    </div>
  );
}
