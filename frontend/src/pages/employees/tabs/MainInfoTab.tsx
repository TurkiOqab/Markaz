import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ApiRequestError } from "../../../api/client";
import { deleteEmployee, updateEmployee, uploadEmployeePhoto } from "../../../api/employees";
import { listTeams } from "../../../api/teams";
import { Button } from "../../../components/Button";
import { SelectField } from "../../../components/SelectField";
import { TextField } from "../../../components/TextField";
import { MARITAL_STATUSES, PHYSICAL_ABILITIES, SHIFTS } from "../../../constants/enums";
import type { Employee, Team } from "../../../types/models";

interface Props {
  employee: Employee;
  onUpdated: (updated: Employee) => void;
}

export function MainInfoTab({ employee, onUpdated }: Props) {
  const [form, setForm] = useState<Employee>(employee);
  const [teams, setTeams] = useState<Team[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    listTeams()
      .then((res) => setTeams(res.items))
      .catch(() => toast.error("تعذر تحميل الفرق"));
  }, []);

  useEffect(() => {
    setForm(employee);
  }, [employee]);

  function update<K extends keyof Employee>(key: K, value: Employee[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const updated = await updateEmployee(employee.id, {
        name: form.name,
        rank: form.rank,
        specialty: form.specialty,
        date_of_birth: form.date_of_birth,
        marital_status: form.marital_status,
        physical_ability: form.physical_ability,
        national_id: form.national_id,
        phone: form.phone,
        email: form.email || null,
        team_id: form.team_id,
        shift: form.shift,
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
      const updated = await uploadEmployeePhoto(employee.id, file);
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
    if (!window.confirm(`هل أنت متأكد من حذف الموظف ${employee.name}؟`)) return;
    try {
      await deleteEmployee(employee.id);
      toast.success("تم الحذف");
      navigate("/employees", { replace: true });
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "فشل الحذف");
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">الصورة</h2>
        <div className="flex items-center gap-6">
          <div className="h-24 w-24 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
            {employee.photo_path ? (
              <img
                src={employee.photo_path}
                alt={employee.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl text-slate-400">
                ؟
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
              {employee.photo_path ? "تغيير الصورة" : "رفع صورة"}
            </Button>
            <p className="text-xs text-slate-500">JPG, PNG, WebP — الحد الأقصى 5 ميجابايت</p>
          </div>
        </div>
      </section>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-white p-6 md:grid-cols-2"
      >
        <TextField
          label="الاسم"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          required
        />
        <TextField
          label="الرتبة"
          value={form.rank}
          onChange={(e) => update("rank", e.target.value)}
          required
        />
        <TextField
          label="التخصص"
          value={form.specialty}
          onChange={(e) => update("specialty", e.target.value)}
          required
        />
        <TextField
          label="الرقم الوطني"
          value={form.national_id}
          onChange={(e) => update("national_id", e.target.value)}
          required
        />
        <TextField
          label="تاريخ الميلاد"
          type="date"
          value={form.date_of_birth}
          onChange={(e) => update("date_of_birth", e.target.value)}
          required
        />
        <TextField
          label="الهاتف"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          required
        />
        <TextField
          label="البريد الإلكتروني"
          type="email"
          value={form.email ?? ""}
          onChange={(e) => update("email", e.target.value || null)}
        />
        <SelectField
          label="الحالة الاجتماعية"
          value={form.marital_status}
          onChange={(e) => update("marital_status", e.target.value as typeof form.marital_status)}
          options={MARITAL_STATUSES.map((s) => ({ value: s, label: s }))}
        />
        <SelectField
          label="القدرة البدنية"
          value={form.physical_ability}
          onChange={(e) =>
            update("physical_ability", e.target.value as typeof form.physical_ability)
          }
          options={PHYSICAL_ABILITIES.map((s) => ({ value: s, label: s }))}
        />
        <SelectField
          label="الفريق"
          value={String(form.team_id)}
          onChange={(e) => update("team_id", Number(e.target.value))}
          options={teams.map((t) => ({ value: t.id, label: t.name }))}
        />
        <SelectField
          label="الوردية"
          value={form.shift}
          onChange={(e) => update("shift", e.target.value as typeof form.shift)}
          options={SHIFTS.map((s) => ({ value: s, label: s }))}
        />

        <div className="flex justify-between gap-2 md:col-span-2">
          <Button variant="danger" type="button" onClick={handleDelete}>
            حذف الموظف
          </Button>
          <Button type="submit" loading={submitting}>
            حفظ التعديلات
          </Button>
        </div>
      </form>
    </div>
  );
}
