import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { ApiRequestError } from "../../../api/client";
import {
  createCertification,
  deleteCertification,
  listCertifications,
  updateCertification,
} from "../../../api/employees";
import type { CertificationInput } from "../../../api/employees";
import { Button } from "../../../components/Button";
import { EmptyState } from "../../../components/EmptyState";
import { Modal } from "../../../components/Modal";
import { TextField } from "../../../components/TextField";
import type { Certification } from "../../../types/models";

const EMPTY: CertificationInput = {
  name: "",
  issuing_authority: "",
  issue_date: "",
  expiry_date: "",
};

export function CertificationsTab({ employeeId }: { employeeId: number }) {
  const [items, setItems] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Certification | null>(null);
  const [creating, setCreating] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      const res = await listCertifications(employeeId);
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
    if (!window.confirm("هل تريد حذف هذه الشهادة؟")) return;
    try {
      await deleteCertification(employeeId, id);
      toast.success("تم الحذف");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "فشل الحذف");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)}>إضافة شهادة</Button>
      </div>

      {loading ? (
        <p className="text-slate-500">جارِ التحميل...</p>
      ) : items.length === 0 ? (
        <EmptyState title="لا توجد شهادات" description="أضف شهادة جديدة للبدء" />
      ) : (
        <table className="w-full rounded-lg border border-slate-200 bg-white text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-start font-medium">الاسم</th>
              <th className="px-4 py-3 text-start font-medium">جهة الإصدار</th>
              <th className="px-4 py-3 text-start font-medium">تاريخ الإصدار</th>
              <th className="px-4 py-3 text-start font-medium">تاريخ الانتهاء</th>
              <th className="px-4 py-3 text-end font-medium">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-b border-slate-100 last:border-b-0">
                <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                <td className="px-4 py-3 text-slate-700">{c.issuing_authority}</td>
                <td className="px-4 py-3 text-slate-700">{c.issue_date}</td>
                <td className="px-4 py-3 text-slate-700">{c.expiry_date}</td>
                <td className="px-4 py-3 text-end">
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => setEditing(c)}>
                      تعديل
                    </Button>
                    <Button variant="danger" onClick={() => handleDelete(c.id)}>
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
        <CertificationFormModal
          title="إضافة شهادة"
          initial={EMPTY}
          onClose={() => setCreating(false)}
          onSubmit={async (payload) => {
            await createCertification(employeeId, payload);
            toast.success("تمت الإضافة");
            setCreating(false);
            reload();
          }}
        />
      ) : null}

      {editing ? (
        <CertificationFormModal
          title="تعديل الشهادة"
          initial={{
            name: editing.name,
            issuing_authority: editing.issuing_authority,
            issue_date: editing.issue_date,
            expiry_date: editing.expiry_date,
          }}
          onClose={() => setEditing(null)}
          onSubmit={async (payload) => {
            await updateCertification(employeeId, editing.id, payload);
            toast.success("تم التحديث");
            setEditing(null);
            reload();
          }}
        />
      ) : null}
    </div>
  );
}

function CertificationFormModal({
  title,
  initial,
  onClose,
  onSubmit,
}: {
  title: string;
  initial: CertificationInput;
  onClose: () => void;
  onSubmit: (payload: CertificationInput) => Promise<void>;
}) {
  const [form, setForm] = useState<CertificationInput>(initial);
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
          <Button form="cert-form" type="submit" loading={submitting}>
            حفظ
          </Button>
        </>
      }
    >
      <form id="cert-form" onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="اسم الشهادة"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
        />
        <TextField
          label="جهة الإصدار"
          value={form.issuing_authority}
          onChange={(e) => setForm((f) => ({ ...f, issuing_authority: e.target.value }))}
          required
        />
        <TextField
          label="تاريخ الإصدار"
          type="date"
          value={form.issue_date}
          onChange={(e) => setForm((f) => ({ ...f, issue_date: e.target.value }))}
          required
        />
        <TextField
          label="تاريخ الانتهاء"
          type="date"
          value={form.expiry_date}
          onChange={(e) => setForm((f) => ({ ...f, expiry_date: e.target.value }))}
          required
        />
      </form>
    </Modal>
  );
}
