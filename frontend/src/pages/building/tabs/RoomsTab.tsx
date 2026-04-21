import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { ApiRequestError } from "../../../api/client";
import { createRoom, deleteRoom, listRooms, updateRoom } from "../../../api/building";
import type { RoomInput } from "../../../api/building";
import { Button } from "../../../components/Button";
import { EmptyState } from "../../../components/EmptyState";
import { Modal } from "../../../components/Modal";
import { SelectField } from "../../../components/SelectField";
import { TextField } from "../../../components/TextField";
import { ROOM_STATUSES, ROOM_TYPES } from "../../../constants/enums";
import type { Room } from "../../../types/models";

const EMPTY: RoomInput = {
  type: "غرفة نوم",
  name: "",
  capacity: 1,
  status: "جاهزة",
  notes: null,
};

export function RoomsTab() {
  const [items, setItems] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Room | null>(null);
  const [creating, setCreating] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      const res = await listRooms();
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
    if (!window.confirm("هل تريد حذف هذه الغرفة؟")) return;
    try {
      await deleteRoom(id);
      toast.success("تم الحذف");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "فشل الحذف");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)}>إضافة غرفة</Button>
      </div>

      {loading ? (
        <p className="text-slate-500">جارِ التحميل...</p>
      ) : items.length === 0 ? (
        <EmptyState title="لا توجد غرف" description="أضف غرفة للبدء" />
      ) : (
        <table className="w-full rounded-lg border border-slate-200 bg-white text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-start font-medium">الاسم</th>
              <th className="px-4 py-3 text-start font-medium">النوع</th>
              <th className="px-4 py-3 text-start font-medium">السعة</th>
              <th className="px-4 py-3 text-start font-medium">الحالة</th>
              <th className="px-4 py-3 text-end font-medium">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 last:border-b-0">
                <td className="px-4 py-3 font-medium text-slate-900">{r.name}</td>
                <td className="px-4 py-3 text-slate-700">{r.type}</td>
                <td className="px-4 py-3 text-slate-700">{r.capacity}</td>
                <td className="px-4 py-3 text-slate-700">{r.status}</td>
                <td className="px-4 py-3 text-end">
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => setEditing(r)}>
                      تعديل
                    </Button>
                    <Button variant="danger" onClick={() => handleDelete(r.id)}>
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
        <RoomFormModal
          title="إضافة غرفة"
          initial={EMPTY}
          onClose={() => setCreating(false)}
          onSubmit={async (payload) => {
            await createRoom(payload);
            toast.success("تمت الإضافة");
            setCreating(false);
            reload();
          }}
        />
      ) : null}

      {editing ? (
        <RoomFormModal
          title="تعديل الغرفة"
          initial={{
            type: editing.type,
            name: editing.name,
            capacity: editing.capacity,
            status: editing.status,
            notes: editing.notes,
          }}
          onClose={() => setEditing(null)}
          onSubmit={async (payload) => {
            await updateRoom(editing.id, payload);
            toast.success("تم التحديث");
            setEditing(null);
            reload();
          }}
        />
      ) : null}
    </div>
  );
}

function RoomFormModal({
  title,
  initial,
  onClose,
  onSubmit,
}: {
  title: string;
  initial: RoomInput;
  onClose: () => void;
  onSubmit: (payload: RoomInput) => Promise<void>;
}) {
  const [form, setForm] = useState<RoomInput>(initial);
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
          <Button form="room-form" type="submit" loading={submitting}>
            حفظ
          </Button>
        </>
      }
    >
      <form id="room-form" onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="الاسم"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
        />
        <SelectField
          label="النوع"
          value={form.type}
          onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as typeof f.type }))}
          options={ROOM_TYPES.map((t) => ({ value: t, label: t }))}
        />
        <TextField
          label="السعة"
          type="number"
          min={0}
          value={form.capacity}
          onChange={(e) => setForm((f) => ({ ...f, capacity: Number(e.target.value) }))}
          required
        />
        <SelectField
          label="الحالة"
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as typeof f.status }))}
          options={ROOM_STATUSES.map((s) => ({ value: s, label: s }))}
        />
        <TextField
          label="ملاحظات"
          value={form.notes ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value || null }))}
        />
      </form>
    </Modal>
  );
}
