import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { ApiRequestError } from "../../../api/client";
import {
  createInventory,
  deleteInventory,
  listInventory,
  updateInventory,
} from "../../../api/building";
import type { InventoryInput } from "../../../api/building";
import { Button } from "../../../components/Button";
import { EmptyState } from "../../../components/EmptyState";
import { Modal } from "../../../components/Modal";
import { SortHeader } from "../../../components/SortHeader";
import { TextField } from "../../../components/TextField";
import type { InventoryItem } from "../../../types/models";

type SortKey = "item_name" | "category" | "quantity" | "min_threshold" | "location";

const EMPTY: InventoryInput = {
  item_name: "",
  category: "",
  quantity: 0,
  location: "",
  min_threshold: 0,
  notes: null,
};

export function InventoryTab() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [creating, setCreating] = useState(false);

  const [sortKey, setSortKey] = useState<SortKey>("item_name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const visible = useMemo(() => {
    const sorted = [...items].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") return av - bv;
      return String(av).localeCompare(String(bv), "ar");
    });
    return sortDir === "desc" ? sorted.reverse() : sorted;
  }, [items, sortKey, sortDir]);

  async function reload() {
    setLoading(true);
    try {
      const res = await listInventory();
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
    if (!window.confirm("هل تريد حذف هذا الصنف؟")) return;
    try {
      await deleteInventory(id);
      toast.success("تم الحذف");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "فشل الحذف");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)}>إضافة صنف</Button>
      </div>

      {loading ? (
        <p className="text-slate-500">جارِ التحميل...</p>
      ) : items.length === 0 ? (
        <EmptyState title="لا توجد أصناف" description="أضف صنفاً للبدء" />
      ) : (
        <table className="w-full rounded-lg border border-slate-200 bg-white text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-start">
                <SortHeader
                  label="الصنف"
                  columnKey="item_name"
                  active={sortKey}
                  direction={sortDir}
                  onSort={toggleSort}
                />
              </th>
              <th className="px-4 py-3 text-start">
                <SortHeader
                  label="التصنيف"
                  columnKey="category"
                  active={sortKey}
                  direction={sortDir}
                  onSort={toggleSort}
                />
              </th>
              <th className="px-4 py-3 text-start">
                <SortHeader
                  label="الكمية"
                  columnKey="quantity"
                  active={sortKey}
                  direction={sortDir}
                  onSort={toggleSort}
                />
              </th>
              <th className="px-4 py-3 text-start">
                <SortHeader
                  label="الحد الأدنى"
                  columnKey="min_threshold"
                  active={sortKey}
                  direction={sortDir}
                  onSort={toggleSort}
                />
              </th>
              <th className="px-4 py-3 text-start">
                <SortHeader
                  label="الموقع"
                  columnKey="location"
                  active={sortKey}
                  direction={sortDir}
                  onSort={toggleSort}
                />
              </th>
              <th className="px-4 py-3 text-end font-medium text-slate-600">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((i) => {
              const lowStock = i.quantity < i.min_threshold;
              return (
                <tr key={i.id} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-4 py-3 font-medium text-slate-900">{i.item_name}</td>
                  <td className="px-4 py-3 text-slate-700">{i.category}</td>
                  <td
                    className={`px-4 py-3 ${lowStock ? "font-semibold text-red-600" : "text-slate-700"}`}
                  >
                    {i.quantity}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{i.min_threshold}</td>
                  <td className="px-4 py-3 text-slate-700">{i.location}</td>
                  <td className="px-4 py-3 text-end">
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" onClick={() => setEditing(i)}>
                        تعديل
                      </Button>
                      <Button variant="danger" onClick={() => handleDelete(i.id)}>
                        حذف
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {creating ? (
        <InventoryFormModal
          title="إضافة صنف"
          initial={EMPTY}
          onClose={() => setCreating(false)}
          onSubmit={async (payload) => {
            await createInventory(payload);
            toast.success("تمت الإضافة");
            setCreating(false);
            reload();
          }}
        />
      ) : null}

      {editing ? (
        <InventoryFormModal
          title="تعديل الصنف"
          initial={{
            item_name: editing.item_name,
            category: editing.category,
            quantity: editing.quantity,
            location: editing.location,
            min_threshold: editing.min_threshold,
            notes: editing.notes,
          }}
          onClose={() => setEditing(null)}
          onSubmit={async (payload) => {
            await updateInventory(editing.id, payload);
            toast.success("تم التحديث");
            setEditing(null);
            reload();
          }}
        />
      ) : null}
    </div>
  );
}

function InventoryFormModal({
  title,
  initial,
  onClose,
  onSubmit,
}: {
  title: string;
  initial: InventoryInput;
  onClose: () => void;
  onSubmit: (payload: InventoryInput) => Promise<void>;
}) {
  const [form, setForm] = useState<InventoryInput>(initial);
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
          <Button form="inv-form" type="submit" loading={submitting}>
            حفظ
          </Button>
        </>
      }
    >
      <form id="inv-form" onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="اسم الصنف"
          value={form.item_name}
          onChange={(e) => setForm((f) => ({ ...f, item_name: e.target.value }))}
          required
        />
        <TextField
          label="التصنيف"
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          required
        />
        <TextField
          label="الكمية"
          type="number"
          min={0}
          value={form.quantity}
          onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
          required
        />
        <TextField
          label="الحد الأدنى"
          type="number"
          min={0}
          value={form.min_threshold}
          onChange={(e) => setForm((f) => ({ ...f, min_threshold: Number(e.target.value) }))}
          required
        />
        <TextField
          label="الموقع"
          value={form.location}
          onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
          required
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
