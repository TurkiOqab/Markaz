import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ApiRequestError } from "../../api/client";
import { createEmployee } from "../../api/employees";
import type { EmployeeCreateInput } from "../../api/employees";
import { listTeams } from "../../api/teams";
import { Button } from "../../components/Button";
import { PageHeader } from "../../components/PageHeader";
import { SelectField } from "../../components/SelectField";
import { TextField } from "../../components/TextField";
import { MARITAL_STATUSES, PHYSICAL_ABILITIES } from "../../constants/enums";
import type { Team } from "../../types/models";

const EMPTY: EmployeeCreateInput = {
  name: "",
  rank: "",
  specialty: "",
  date_of_birth: "",
  marital_status: "أعزب",
  physical_ability: "جيد",
  national_id: "",
  phone: "",
  email: null,
  team_id: 0,
  shift: "صباحية",
};

export function NewEmployeePage() {
  const [form, setForm] = useState<EmployeeCreateInput>(EMPTY);
  const [teams, setTeams] = useState<Team[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    listTeams()
      .then((res) => {
        setTeams(res.items);
        if (res.items.length > 0) {
          setForm((f) => ({ ...f, team_id: res.items[0].id }));
        }
      })
      .catch(() => toast.error("تعذر تحميل الفرق"));
  }, []);

  function update<K extends keyof EmployeeCreateInput>(key: K, value: EmployeeCreateInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created = await createEmployee({
        ...form,
        email: form.email || null,
      });
      toast.success("تم إنشاء الموظف");
      navigate(`/employees/${created.id}`, { replace: true });
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "فشل إنشاء الموظف");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="إضافة موظف"
        backLink={{ to: "/employees", label: "الرجوع إلى القائمة" }}
      />

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-4 rounded-lg border border-surface-300 bg-white p-6 md:grid-cols-2"
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
          label="الفرقة"
          value={String(form.team_id)}
          onChange={(e) => update("team_id", Number(e.target.value))}
          options={teams.map((t) => ({ value: t.id, label: t.name }))}
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
