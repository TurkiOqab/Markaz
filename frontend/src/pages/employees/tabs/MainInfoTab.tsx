import { Award, Briefcase, Pencil, Star } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, ComponentType, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ApiRequestError } from "../../../api/client";
import {
  deleteEmployee,
  listCertifications,
  listEmployeeEquipment,
  listRatings,
  updateEmployee,
  uploadEmployeePhoto,
} from "../../../api/employees";
import { listTeams } from "../../../api/teams";
import { Avatar } from "../../../components/Avatar";
import { Button } from "../../../components/Button";
import { SelectField } from "../../../components/SelectField";
import { TextField } from "../../../components/TextField";
import { MARITAL_STATUSES, PHYSICAL_ABILITIES } from "../../../constants/enums";
import type { Employee, Team } from "../../../types/models";
import type { EmployeeTabKey } from "../EmployeeDetailPage";

interface Props {
  employee: Employee;
  onUpdated: (updated: Employee) => void;
  onNavigate: (tab: EmployeeTabKey) => void;
}

interface Counts {
  certs: number;
  equipment: number;
  ratings: number;
}

export function MainInfoTab({ employee, onUpdated, onNavigate }: Props) {
  const [form, setForm] = useState<Employee>(employee);
  const [teams, setTeams] = useState<Team[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
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

  useEffect(() => {
    Promise.all([
      listCertifications(employee.id),
      listEmployeeEquipment(employee.id),
      listRatings(employee.id),
    ])
      .then(([certs, eq, ratings]) => {
        setCounts({
          certs: certs.total,
          equipment: eq.total,
          ratings: ratings.total,
        });
      })
      .catch(() => {
        // Silent — the hero still works without summary counts.
      });
  }, [employee.id]);

  const teamName = useMemo(
    () => teams.find((t) => t.id === employee.team_id)?.name ?? "—",
    [teams, employee.team_id],
  );

  function update<K extends keyof Employee>(key: K, value: Employee[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function startEditing() {
    setForm(employee);
    setEditing(true);
  }

  function cancelEditing() {
    setForm(employee);
    setEditing(false);
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
      setEditing(false);
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
      {/* Hero band */}
      <section className="rounded-lg border border-surface-300 bg-white p-6">
        <div className="flex items-start gap-5">
          <div className="flex flex-col items-center gap-2">
            <Avatar name={employee.name} src={employee.photo_path} size="lg" />
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="text-xs text-surface-500 hover:text-brand-700 disabled:opacity-50"
            >
              {uploading
                ? "جارِ الرفع..."
                : employee.photo_path
                  ? "تغيير الصورة"
                  : "رفع صورة"}
            </button>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-bold text-surface-900">{employee.name}</h2>
            <p className="mt-1 truncate text-sm text-surface-500">
              {employee.rank} · {employee.specialty}
            </p>
            <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <InfoRow label="الرقم الوطني" value={employee.national_id} />
              <InfoRow label="تاريخ الميلاد" value={employee.date_of_birth} />
              <InfoRow label="الهاتف" value={employee.phone} />
              <InfoRow label="البريد الإلكتروني" value={employee.email ?? "—"} />
              <InfoRow label="الحالة الاجتماعية" value={employee.marital_status} />
              <InfoRow label="القدرة البدنية" value={employee.physical_ability} />
              <InfoRow label="الفرقة" value={teamName} />
            </dl>
          </div>
          {!editing ? (
            <Button variant="secondary" onClick={startEditing}>
              <Pencil size={16} />
              تعديل
            </Button>
          ) : null}
        </div>
      </section>

      {/* Summary cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          label="الشهادات"
          value={counts?.certs}
          icon={Award}
          onClick={() => onNavigate("certs")}
        />
        <SummaryCard
          label="التجهيزات"
          value={counts?.equipment}
          icon={Briefcase}
          onClick={() => onNavigate("equipment")}
        />
        <SummaryCard
          label="التقييمات الشهرية"
          value={counts?.ratings}
          icon={Star}
          onClick={() => onNavigate("ratings")}
        />
      </section>

      {/* Edit form — only shown when editing */}
      {editing ? (
        <section className="rounded-lg border border-surface-300 bg-white">
          <header className="border-b border-surface-300 px-6 py-4">
            <h3 className="text-sm font-semibold text-surface-900">تعديل المعلومات</h3>
          </header>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
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
              onChange={(e) =>
                update("marital_status", e.target.value as typeof form.marital_status)
              }
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
              label="الفرقة"
              value={String(form.team_id)}
              onChange={(e) => update("team_id", Number(e.target.value))}
              options={teams.map((t) => ({ value: t.id, label: t.name }))}
            />

            <div className="flex justify-between gap-2 md:col-span-2">
              <Button variant="danger" type="button" onClick={handleDelete} disabled={submitting}>
                حذف الموظف
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={cancelEditing}
                  disabled={submitting}
                >
                  إلغاء
                </Button>
                <Button type="submit" loading={submitting}>
                  حفظ التعديلات
                </Button>
              </div>
            </div>
          </form>
        </section>
      ) : null}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 text-surface-500">{label}:</dt>
      <dd className="min-w-0 truncate font-medium text-surface-900">{value || "—"}</dd>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  onClick,
}: {
  label: string;
  value: number | undefined;
  icon: ComponentType<{ size?: number }>;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-4 rounded-lg border border-surface-300 bg-white p-4 text-start transition hover:border-brand-400 hover:shadow-sm"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-100 text-surface-500 group-hover:bg-brand-50 group-hover:text-brand-700">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-surface-500">{label}</p>
        <p className="text-xl font-bold text-surface-900">{value ?? "—"}</p>
      </div>
    </button>
  );
}
