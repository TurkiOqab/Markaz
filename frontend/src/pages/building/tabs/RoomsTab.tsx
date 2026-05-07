import {
  BedDouble,
  Briefcase,
  ChefHat,
  ClipboardList,
  Dumbbell,
  GraduationCap,
  Pencil,
  Trash2,
  Wrench,
} from "lucide-react";
import type { ComponentType } from "react";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { ApiRequestError } from "../../../api/client";
import { createRoom, deleteRoom, listRooms, updateRoom } from "../../../api/building";
import type { RoomInput } from "../../../api/building";
import { Badge, roomStatusTone } from "../../../components/Badge";
import { Button } from "../../../components/Button";
import { EmptyState } from "../../../components/EmptyState";
import { Loader } from "../../../components/Loader";
import { Modal } from "../../../components/Modal";
import { SelectField } from "../../../components/SelectField";
import { SortSelect } from "../../../components/SortSelect";
import { TextField } from "../../../components/TextField";
import { ROOM_STATUSES, ROOM_TYPES } from "../../../constants/enums";
import type { Room, RoomType } from "../../../types/models";

type SortOption = "name_asc" | "name_desc" | "type_asc";

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: "name_asc", label: "الاسم (أ-ي)" },
  { value: "name_desc", label: "الاسم (ي-أ)" },
  { value: "type_asc", label: "حسب النوع" },
];

const ROOM_ICONS: Record<RoomType, ComponentType<{ size?: number }>> = {
  "غرفة نوم": BedDouble,
  "مكتب": Briefcase,
  "قاعة تدريس": GraduationCap,
  "مرفق": Wrench,
};

const ROOM_TONE: Record<RoomType, { bg: string; fg: string }> = {
  "غرفة نوم": { bg: "bg-blue-50", fg: "text-blue-700" },
  "مكتب": { bg: "bg-amber-50", fg: "text-amber-700" },
  "قاعة تدريس": { bg: "bg-brand-50", fg: "text-brand-700" },
  "مرفق": { bg: "bg-surface-100", fg: "text-surface-500" },
};

// Name-based icon overrides — useful for distinctive facilities like the gym/kitchen.
function pickIcon(room: Room): ComponentType<{ size?: number }> {
  const n = room.name;
  if (/رياضي|الجيم|نادي/.test(n)) return Dumbbell;
  if (/مطبخ|طبخ|مطعم|إعاش/.test(n)) return ChefHat;
  return ROOM_ICONS[room.type] ?? Wrench;
}

function pickTone(room: Room): { bg: string; fg: string } {
  const n = room.name;
  if (/رياضي|الجيم|نادي/.test(n)) return { bg: "bg-red-50", fg: "text-red-700" };
  if (/مطبخ|طبخ|مطعم|إعاش/.test(n)) return { bg: "bg-amber-50", fg: "text-amber-700" };
  return ROOM_TONE[room.type] ?? ROOM_TONE["مرفق"];
}

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

  const [sort, setSort] = useState<SortOption>("name_asc");

  const visible = useMemo(() => {
    const sorted = [...items];
    switch (sort) {
      case "name_asc":
        sorted.sort((a, b) => a.name.localeCompare(b.name, "ar"));
        break;
      case "name_desc":
        sorted.sort((a, b) => b.name.localeCompare(a.name, "ar"));
        break;
      case "type_asc":
        sorted.sort((a, b) => a.type.localeCompare(b.type, "ar"));
        break;
    }
    return sorted;
  }, [items, sort]);

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
      <div className="flex items-center justify-end gap-3">
        <SortSelect
          value={sort}
          onChange={(v) => setSort(v as SortOption)}
          options={SORT_OPTIONS}
        />
        <Button onClick={() => setCreating(true)}>إضافة غرفة</Button>
      </div>

      {loading ? (
        <Loader />
      ) : items.length === 0 ? (
        <EmptyState icon={ClipboardList} title="لا توجد غرف" description="أضف غرفة للبدء" />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {visible.map((r) => (
            <RoomCard
              key={r.id}
              room={r}
              onEdit={() => setEditing(r)}
              onDelete={() => handleDelete(r.id)}
            />
          ))}
        </div>
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

function RoomCard({
  room,
  onEdit,
  onDelete,
}: {
  room: Room;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const Icon = pickIcon(room);
  const tone = pickTone(room);
  return (
    <div className="group relative flex flex-col items-center gap-2 rounded-xl border border-surface-300 bg-white p-4 text-center transition hover:border-brand-300 hover:shadow-soft-green transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift-green hover:border-brand-300">
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-2xl ${tone.bg} ${tone.fg}`}
      >
        <Icon size={28} />
      </div>
      <h3 className="line-clamp-2 text-sm font-extrabold text-surface-900">{room.name}</h3>
      <p className="text-[11px] text-surface-500">{room.type}</p>
      <div className="mt-1">
        <Badge tone={roomStatusTone(room.status)}>{room.status}</Badge>
      </div>

      {/* Hover actions */}
      <div className="absolute end-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={onEdit}
          title="تعديل"
          className="rounded-md border border-brand-200 bg-white p-1 text-brand-700 hover:bg-brand-50"
        >
          <Pencil size={12} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          title="حذف"
          className="rounded-md border border-red-200 bg-white p-1 text-red-600 hover:bg-red-50"
        >
          <Trash2 size={12} />
        </button>
      </div>
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
