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
import { SelectField } from "../../../components/SelectField";
import { TextField } from "../../../components/TextField";
import type { InventoryItem } from "../../../types/models";

type SortKey = "name" | "qty_desc" | "qty_asc";

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: "name", label: "حسب الاسم" },
  { value: "qty_desc", label: "الكمية (من الأعلى)" },
  { value: "qty_asc", label: "الكمية (من الأقل)" },
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

  const [sort, setSort] = useState<SortKey>("name");
  const [category, setCategory] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [q, setQ] = useState("");

  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category))).sort(),
    [items],
  );

  const visible = useMemo(() => {
    let result = items;
    if (q) {
      const needle = q.toLowerCase();
      result = result.filter((i) => i.item_name.toLowerCase().includes(needle));
    }
    if (category) {
      result = result.filter((i) => i.category === category);
    }
    if (lowOnly) {
      result = result.filter((i) => i.quantity < i.min_threshold);
    }
    result = [...result].sort((a, b) => {
      if (sort === "qty_desc") return b.quantity - a.quantity;
      if (sort === "qty_asc") return a.quantity - b.quantity;
      return a.item_name.localeCompare(b.item_name, "ar");
    });
    return result;
  }, [items, q, category, lowOnly, sort]);

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
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={lowOnly}
              onChange={(e) => setLowOnly(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-500"
            />
            <span className="text-slate-700">أصناف منخفضة فقط</span>
          </label>
        </div>
        <Button onClick={() => setCreating(true)}>إضافة صنف</Button>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <TextField
            label="بحث بالاسم"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="..."
          />
          <SelectField
            label="التصنيف"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="كل التصنيفات"
            options={categories.map((c) => ({ value: c, label: c }))}
          />
          <SelectField
            label="الترتيب"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            options={SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
        </div>
      </section>

      {loading ? (
        <p className="text-slate-500">جارِ التحميل...</p>
      ) : visible.length === 0 ? (
        <EmptyState
          title={items.length === 0 ? "لا توجد أصناف" : "لا توجد نتائج"}
          description={
            items.length === 0 ? "أضف صنفاً للبدء" : "حاول تغيير الفلاتر أو البحث"
          }
        />
      ) : (
        <table className="w-full rounded-lg border border-slate-200 bg-white text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
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
