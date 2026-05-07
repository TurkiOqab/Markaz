import { FileText } from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { ApiRequestError } from "../../../api/client";
import {
  createBuildingReport,
  deleteBuildingReport,
  listBuildingReports,
  updateBuildingReport,
} from "../../../api/building";
import type { BuildingReportInput } from "../../../api/building";
import { Button } from "../../../components/Button";
import { EmptyState } from "../../../components/EmptyState";
import { Loader } from "../../../components/Loader";
import { Modal } from "../../../components/Modal";
import { TextField } from "../../../components/TextField";
import type { BuildingReport } from "../../../types/models";

const EMPTY: BuildingReportInput = {
  date: "",
  title: "",
  summary: "",
  file_path: null,
};

export function ReportsTab() {
  const [items, setItems] = useState<BuildingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BuildingReport | null>(null);
  const [creating, setCreating] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      const res = await listBuildingReports();
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
    if (!window.confirm("هل تريد حذف هذا التقرير؟")) return;
    try {
      await deleteBuildingReport(id);
      toast.success("تم الحذف");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "فشل الحذف");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)}>إضافة تقرير</Button>
      </div>

      {loading ? (
        <Loader />
      ) : items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="لا توجد تقارير"
          description="أضف تقريراً للبدء"
        />
      ) : (
        <div className="space-y-3">
          {items.map((r) => (
            <article key={r.id} className="rounded-lg border border-surface-300 bg-white p-5">
              <header className="mb-2 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-surface-900">{r.title}</h3>
                  <p className="text-xs text-surface-500">{r.date}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setEditing(r)}>
                    تعديل
                  </Button>
                  <Button variant="danger" onClick={() => handleDelete(r.id)}>
                    حذف
                  </Button>
                </div>
              </header>
              <p className="whitespace-pre-line text-sm text-surface-900">{r.summary}</p>
            </article>
          ))}
        </div>
      )}

      {creating ? (
        <ReportFormModal
          title="إضافة تقرير"
          initial={EMPTY}
          onClose={() => setCreating(false)}
          onSubmit={async (payload) => {
            await createBuildingReport(payload);
            toast.success("تمت الإضافة");
            setCreating(false);
            reload();
          }}
        />
      ) : null}

      {editing ? (
        <ReportFormModal
          title="تعديل التقرير"
          initial={{
            date: editing.date,
            title: editing.title,
            summary: editing.summary,
            file_path: editing.file_path,
          }}
          onClose={() => setEditing(null)}
          onSubmit={async (payload) => {
            await updateBuildingReport(editing.id, payload);
            toast.success("تم التحديث");
            setEditing(null);
            reload();
          }}
        />
      ) : null}
    </div>
  );
}

function ReportFormModal({
  title,
  initial,
  onClose,
  onSubmit,
}: {
  title: string;
  initial: BuildingReportInput;
  onClose: () => void;
  onSubmit: (payload: BuildingReportInput) => Promise<void>;
}) {
  const [form, setForm] = useState<BuildingReportInput>(initial);
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
          <Button form="rep-form" type="submit" loading={submitting}>
            حفظ
          </Button>
        </>
      }
    >
      <form id="rep-form" onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="التاريخ"
          type="date"
          value={form.date}
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          required
        />
        <TextField
          label="العنوان"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          required
        />
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-surface-900">الملخص</span>
          <textarea
            className="min-h-28 rounded-md border border-surface-300 bg-white px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-surface-500"
            value={form.summary}
            onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
            required
          />
        </label>
      </form>
    </Modal>
  );
}
