import { Package } from "lucide-react";
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
import { Loader } from "../../../components/Loader";
import { Modal } from "../../../components/Modal";
import { SortSelect } from "../../../components/SortSelect";
import { TextField } from "../../../components/TextField";
import type { InventoryItem } from "../../../types/models";

type SortOption =
  | "name_asc"
  | "name_desc"
  | "qty_desc"
  | "qty_asc"
  | "category_asc";

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: "name_asc", label: "الاسم (أ-ي)" },
  { value: "name_desc", label: "الاسم (ي-أ)" },
  { value: "qty_desc", label: "الكمية (من الأعلى)" },
  { value: "qty_asc", label: "الكمية (من الأقل)" },
  { value: "category_asc", label: "التصنيف" },
];

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

  const [sort, setSort] = useState<SortOption>("name_asc");

  const visible = useMemo(() => {
    const sorted = [...items];
    switch (sort) {
      case "name_asc":
        sorted.sort((a, b) => a.item_name.localeCompare(b.item_name, "ar"));
        break;
      case "name_desc":
        sorted.sort((a, b) => b.item_name.localeCompare(a.item_name, "ar"));
        break;
      case "qty_desc":
        sorted.sort((a, b) => b.quantity - a.quantity);
        break;
      case "qty_asc":
        sorted.sort((a, b) => a.quantity - b.quantity);
        break;
      case "category_asc":
        sorted.sort((a, b) => a.category.localeCompare(b.category, "ar"));
        break;
    }
    return sorted;
  }, [items, sort]);

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
      <div className="flex items-center justify-end gap-3">
        <SortSelect
          value={sort}
          onChange={(v) => setSort(v as SortOption)}
          options={SORT_OPTIONS}
        />
        <Button onClick={() => setCreating(true)}>إضافة صنف</Button>
      </div>

      {loading ? (
        <Loader />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="لا توجد أصناف"
          description="أضف صنفاً للبدء"
        />
      ) : (
        <table className="w-full rounded-lg border border-surface-300 bg-white text-sm">
          <thead className="border-b border-surface-300 bg-surface-100 text-surface-500">
            <tr>
              <th className="px-4 py-3 text-start font-medium">الصنف</th>
              <th className="px-4 py-3 text-start font-medium">التصنيف</th>
              <th className="px-4 py-3 text-start font-medium">الكمية</th>
              <th className="px-4 py-3 text-start font-medium">الحد الأدنى</th>
              <th className="px-4 py-3 text-start font-medium">الموقع</th>
              <th className="px-4 py-3 text-end font-medium">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((i) => {
              const lowStock = i.quantity < i.min_threshold;
              return (
                <tr key={i.id} className="border-b border-surface-100 last:border-b-0">
                  <td className="px-4 py-3 font-medium text-surface-900">{i.item_name}</td>
                  <td className="px-4 py-3 text-surface-900">{i.category}</td>
                  <td
                    className={`px-4 py-3 ${lowStock ? "font-semibold text-red-600" : "text-surface-900"}`}
                  >
                    {i.quantity}
                  </td>
                  <td className="px-4 py-3 text-surface-500">{i.min_threshold}</td>
                  <td className="px-4 py-3 text-surface-900">{i.location}</td>
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
