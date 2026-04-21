import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { ApiRequestError } from "../../../api/client";
import { updateBuilding } from "../../../api/building";
import { Button } from "../../../components/Button";
import { TextField } from "../../../components/TextField";
import type { Building } from "../../../types/models";

interface Props {
  building: Building;
  onUpdated: (updated: Building) => void;
}

export function MainInfoTab({ building, onUpdated }: Props) {
  const [form, setForm] = useState<Building>(building);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm(building);
  }, [building]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const updated = await updateBuilding({
        name: form.name,
        address: form.address,
        notes: form.notes || null,
      });
      toast.success("تم الحفظ");
      onUpdated(updated);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "فشل الحفظ");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-slate-200 bg-white p-6"
    >
      <TextField
        label="اسم المبنى"
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        required
      />
      <TextField
        label="العنوان"
        value={form.address}
        onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
        required
      />
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-slate-700">ملاحظات</span>
        <textarea
          className="min-h-28 rounded-md border border-slate-300 bg-white px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-slate-500"
          value={form.notes ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value || null }))}
        />
      </label>
      <div className="flex justify-end">
        <Button type="submit" loading={submitting}>
          حفظ التعديلات
        </Button>
      </div>
    </form>
  );
}
