import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ApiRequestError } from "../../../api/client";
import { listEmployees } from "../../../api/employees";
import { deleteVehicle, updateVehicle, uploadVehiclePhoto } from "../../../api/vehicles";
import { Button } from "../../../components/Button";
import { SelectField } from "../../../components/SelectField";
import { TextField } from "../../../components/TextField";
import { VEHICLE_STATUSES, VEHICLE_TYPES } from "../../../constants/enums";
import type { EmployeeSummary, Vehicle } from "../../../types/models";

interface Props {
  vehicle: Vehicle;
  onUpdated: (updated: Vehicle) => void;
}

export function MainInfoTab({ vehicle, onUpdated }: Props) {
  const [form, setForm] = useState<Vehicle>(vehicle);
  const [drivers, setDrivers] = useState<EmployeeSummary[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    listEmployees({ page: 1, page_size: 200 })
      .then((res) => setDrivers(res.items))
      .catch(() => toast.error("تعذر تحميل الموظفين"));
  }, []);

  useEffect(() => {
    setForm(vehicle);
  }, [vehicle]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const updated = await updateVehicle(vehicle.id, {
        type: form.type,
        plate_number: form.plate_number,
        status: form.status,
        driver_id: form.driver_id,
      });
      toast.success("تم الحفظ");
      onUpdated(updated);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "فشل الحفظ");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePhotoSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const updated = await uploadVehiclePhoto(vehicle.id, file);
      toast.success("تم رفع الصورة");
      onUpdated(updated);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "فشل رفع الصورة");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleDelete() {
    if (!window.confirm(`هل أنت متأكد من حذف المركبة ${vehicle.plate_number}؟`)) return;
    try {
      await deleteVehicle(vehicle.id);
      toast.success("تم الحذف");
      navigate("/vehicles", { replace: true });
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "فشل الحذف");
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">الصورة</h2>
        <div className="flex items-center gap-6">
          <div className="h-24 w-32 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
            {vehicle.photo_path ? (
              <img
                src={vehicle.photo_path}
                alt={vehicle.plate_number}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl text-slate-400">
                🚒
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoSelect}
              className="hidden"
            />
            <Button
              variant="secondary"
              type="button"
              onClick={() => fileRef.current?.click()}
              loading={uploading}
            >
              {vehicle.photo_path ? "تغيير الصورة" : "رفع صورة"}
            </Button>
            <p className="text-xs text-slate-500">JPG, PNG, WebP — الحد الأقصى 5 ميجابايت</p>
          </div>
        </div>
      </section>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-white p-6 md:grid-cols-2"
      >
        <SelectField
          label="النوع"
          value={form.type}
          onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as typeof f.type }))}
          options={VEHICLE_TYPES.map((t) => ({ value: t, label: t }))}
        />
        <TextField
          label="رقم اللوحة"
          value={form.plate_number}
          onChange={(e) => setForm((f) => ({ ...f, plate_number: e.target.value }))}
          required
        />
        <SelectField
          label="الحالة"
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as typeof f.status }))}
          options={VEHICLE_STATUSES.map((s) => ({ value: s, label: s }))}
        />
        <SelectField
          label="السائق"
          value={form.driver_id ? String(form.driver_id) : ""}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              driver_id: e.target.value ? Number(e.target.value) : null,
            }))
          }
          placeholder="بدون سائق"
          options={drivers.map((d) => ({ value: d.id, label: d.name }))}
        />

        <div className="flex justify-between gap-2 md:col-span-2">
          <Button variant="danger" type="button" onClick={handleDelete}>
            حذف المركبة
          </Button>
          <Button type="submit" loading={submitting}>
            حفظ التعديلات
          </Button>
        </div>
      </form>
    </div>
  );
}
