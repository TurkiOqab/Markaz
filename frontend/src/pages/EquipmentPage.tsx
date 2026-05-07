import { Package, Truck, Users, Wrench } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ApiRequestError } from "../api/client";
import { fetchAllEquipment } from "../api/equipment";
import type {
  EquipmentSource,
  UnifiedEquipmentItem,
  UnifiedEquipmentResponse,
} from "../api/equipment";
import { Badge, conditionTone } from "../components/Badge";
import { EmptyState } from "../components/EmptyState";
import { Loader } from "../components/Loader";
import { PageHeader } from "../components/PageHeader";

const SOURCE_LABEL: Record<EquipmentSource, string> = {
  employee: "موظف",
  vehicle: "مركبة",
  inventory: "مخزون",
};

export function EquipmentPage() {
  const [data, setData] = useState<UnifiedEquipmentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<EquipmentSource | "all">("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    fetchAllEquipment()
      .then((d) => {
        if (active) setData(d);
      })
      .catch((err) => {
        const msg = err instanceof ApiRequestError ? err.message : "تعذر تحميل المعدات";
        toast.error(msg);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [] as UnifiedEquipmentItem[];
    const q = query.trim().toLowerCase();
    return data.items.filter((it) => {
      if (filter !== "all" && it.source !== filter) return false;
      if (!q) return true;
      return (
        it.item_name.toLowerCase().includes(q) ||
        it.owner_label.toLowerCase().includes(q)
      );
    });
  }, [data, filter, query]);

  if (loading) return <Loader fullPage />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="المعدات"
        subtitle={`${data.total} عنصر عبر الموظفين والمركبات والمخزون`}
        icon={Wrench}
        iconTone="brand"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          tone="brand"
          label="معدات الموظفين"
          value={data.by_source.employee}
          icon={Users}
        />
        <SummaryCard
          tone="amber"
          label="معدات المركبات"
          value={data.by_source.vehicle}
          icon={Truck}
        />
        <SummaryCard
          tone="blue"
          label="مخزون المركز"
          value={data.by_source.inventory}
          icon={Package}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-2xl border border-surface-300 bg-white p-1 shadow-soft-green transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift-green hover:border-brand-300">
          {(["all", "employee", "vehicle", "inventory"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                filter === s
                  ? "bg-gradient-to-l from-brand-500 to-brand-700 text-white shadow-soft-green transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift-green hover:border-brand-300"
                  : "text-surface-500 hover:bg-brand-50"
              }`}
            >
              {s === "all" ? "الكل" : SOURCE_LABEL[s]}
            </button>
          ))}
        </div>
        <input
          type="search"
          placeholder="بحث بالاسم أو المالك..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 rounded-xl border border-surface-300 bg-white px-4 py-2 text-sm shadow-soft-green transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift-green hover:border-brand-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="لا توجد نتائج"
          description="حاول تعديل التصفية أو البحث"
          icon={Wrench}
        />
      ) : (
        <div className="relative overflow-hidden rounded-2xl border border-surface-300 bg-white shadow-soft-green transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift-green hover:border-brand-300">
          <div className="absolute inset-x-0 top-0 h-[3px] bg-blue-600" />
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-right text-sm">
            <thead className="border-b border-surface-200 bg-surface-100 text-surface-500">
              <tr>
                <th className="px-4 py-3 text-xs font-bold">العنصر</th>
                <th className="px-4 py-3 text-xs font-bold">المصدر</th>
                <th className="px-4 py-3 text-xs font-bold">المالك / الموقع</th>
                <th className="px-4 py-3 text-xs font-bold">الكمية</th>
                <th className="px-4 py-3 text-xs font-bold">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {filtered.map((it) => (
                <tr key={it.id} className="transition-colors hover:bg-brand-50">
                  <td className="px-4 py-3 font-bold text-surface-900">{it.item_name}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-surface-100 px-2 py-0.5 text-[10px] font-bold text-surface-500">
                      {SOURCE_LABEL[it.source]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-surface-500">{it.owner_label}</td>
                  <td className="px-4 py-3 tabular-nums text-surface-900">
                    {it.quantity ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={conditionTone(it.condition)}>{it.condition}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  tone,
  label,
  value,
  icon: Icon,
}: {
  tone: "brand" | "amber" | "blue";
  label: string;
  value: number;
  icon: React.ComponentType<{ size?: number }>;
}) {
  const stripe =
    tone === "brand" ? "bg-brand-600" : tone === "amber" ? "bg-amber-500" : "bg-blue-600";
  const iconBg =
    tone === "brand"
      ? "bg-brand-50 text-brand-700"
      : tone === "amber"
        ? "bg-amber-50 text-amber-700"
        : "bg-blue-50 text-blue-700";
  return (
    <div className="relative overflow-hidden rounded-2xl border border-surface-300 bg-white p-5 shadow-soft-green transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift-green hover:border-brand-300">
      <div className={`absolute inset-x-0 top-0 h-[3px] ${stripe}`} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-surface-500">{label}</p>
          <p className="mt-2 text-4xl font-black tabular-nums text-surface-900">{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}
