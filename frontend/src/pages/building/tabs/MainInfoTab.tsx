import { Building2, ClipboardList, FileText, Package, Pencil, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import type { ComponentType, FormEvent } from "react";
import { toast } from "sonner";
import { ApiRequestError } from "../../../api/client";
import {
  listBuildingMaintenance,
  listBuildingReports,
  listInventory,
  listRooms,
  updateBuilding,
} from "../../../api/building";
import { Button } from "../../../components/Button";
import { TextField } from "../../../components/TextField";
import type { Building } from "../../../types/models";
import type { BuildingTabKey } from "../BuildingPage";

interface Props {
  building: Building;
  onUpdated: (updated: Building) => void;
  onNavigate: (tab: BuildingTabKey) => void;
}

interface Counts {
  rooms: number;
  inventory: number;
  maintenance: number;
  reports: number;
}

export function MainInfoTab({ building, onUpdated, onNavigate }: Props) {
  const [form, setForm] = useState<Building>(building);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setForm(building);
  }, [building]);

  useEffect(() => {
    Promise.all([
      listRooms(),
      listInventory(),
      listBuildingMaintenance(),
      listBuildingReports(),
    ])
      .then(([rooms, inv, maint, reports]) => {
        setCounts({
          rooms: rooms.total,
          inventory: inv.total,
          maintenance: maint.total,
          reports: reports.total,
        });
      })
      .catch(() => {
        // Silent — the form still works without summary counts.
      });
  }, []);

  function startEditing() {
    setForm(building);
    setEditing(true);
  }

  function cancelEditing() {
    setForm(building);
    setEditing(false);
  }

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
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "فشل الحفظ");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Hero band */}
      <section className="rounded-lg border border-surface-300 bg-white p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Building2 size={28} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-bold text-surface-900">
              {building.name || "مبنى بدون اسم"}
            </h2>
            <p className="mt-1 truncate text-sm text-surface-500">
              {building.address || "لم يُحدد العنوان بعد"}
            </p>
            {building.notes ? (
              <p className="mt-2 whitespace-pre-line text-sm text-surface-500">{building.notes}</p>
            ) : null}
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
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <SummaryCard
          label="الغرف"
          value={counts?.rooms}
          icon={ClipboardList}
          onClick={() => onNavigate("rooms")}
        />
        <SummaryCard
          label="المخزون"
          value={counts?.inventory}
          icon={Package}
          onClick={() => onNavigate("inventory")}
        />
        <SummaryCard
          label="سجلات الصيانة"
          value={counts?.maintenance}
          icon={Wrench}
          onClick={() => onNavigate("maintenance")}
        />
        <SummaryCard
          label="التقارير"
          value={counts?.reports}
          icon={FileText}
          onClick={() => onNavigate("reports")}
        />
      </section>

      {/* Edit form — only shown when editing */}
      {editing ? (
        <section className="rounded-lg border border-surface-300 bg-white">
          <header className="border-b border-surface-300 px-6 py-4">
            <h3 className="text-sm font-semibold text-surface-900">تعديل المعلومات</h3>
          </header>
          <form onSubmit={handleSubmit} className="space-y-4 p-6">
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
              <span className="text-sm font-medium text-surface-900">ملاحظات</span>
              <textarea
                className="min-h-28 rounded-md border border-surface-300 bg-white px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-surface-500"
                value={form.notes ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value || null }))}
              />
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" type="button" onClick={cancelEditing} disabled={submitting}>
                إلغاء
              </Button>
              <Button type="submit" loading={submitting}>
                حفظ التعديلات
              </Button>
            </div>
          </form>
        </section>
      ) : null}
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
