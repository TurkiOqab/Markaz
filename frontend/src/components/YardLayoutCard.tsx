import {
  Ambulance,
  Anchor,
  ArrowUpToLine,
  Construction,
  Crown,
  Droplet,
  Flame,
  GripVertical,
  LayoutGrid,
  LifeBuoy,
  Lightbulb,
  Mountain,
  Ship,
  Siren,
  Truck,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ApiRequestError } from "../api/client";
import { listVehicles, updateVehicleYard } from "../api/vehicles";
import type { VehicleLine, VehicleSummary, VehicleType } from "../types/models";

const TYPE_ICON: Record<VehicleType, LucideIcon> = {
  "كوماندر(مزدوجة)": Truck,
  "بروبلين": Flame,
  "ونش": Anchor,
  "عربة الانارة": Lightbulb,
  "جيب التدخل السريع": Zap,
  "اسعاف": Ambulance,
  "شاص الاطفاء في المواقع الجبلية": Mountain,
  "صهريج": Droplet,
  "سيارة الأنذار": Siren,
  "قارب": Ship,
  "سيارة السلالم": ArrowUpToLine,
  "عربة الشيول": Construction,
  "إطفاء": Truck,
  "إسعاف": Ambulance,
  "سلم": Truck,
  "قيادة": Crown,
  "إنقاذ": LifeBuoy,
};

function statusDot(status: VehicleSummary["status"]): string {
  if (status === "في الخدمة") return "bg-brand-500";
  if (status === "صيانة") return "bg-amber-500";
  return "bg-red-500";
}

/** Sort by saved yard_y rank, falling back to id so the order stays stable. */
function lineOrderCompare(a: VehicleSummary, b: VehicleSummary): number {
  const ay = a.yard_y ?? Number.POSITIVE_INFINITY;
  const by = b.yard_y ?? Number.POSITIVE_INFINITY;
  if (ay !== by) return ay - by;
  return a.id - b.id;
}

export function YardLayoutCard() {
  const [vehicles, setVehicles] = useState<VehicleSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const res = await listVehicles({ page: 1, page_size: 200 });
      setVehicles(res.items);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "تعذر تحميل المركبات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const lineOne = useMemo(
    () => vehicles.filter((v) => v.line === "الأول").sort(lineOrderCompare),
    [vehicles],
  );
  const lineTwo = useMemo(
    () => vehicles.filter((v) => v.line === "الثاني").sort(lineOrderCompare),
    [vehicles],
  );

  /**
   * Drop `draggedId` immediately before `targetId` within the same line.
   * Re-ranks every vehicle in that line to evenly-spaced values in [0, 1] so
   * subsequent reorders compare cleanly. Fewer, larger PATCHes would be
   * possible with fractional indexing, but for ~10-30 vehicles per line the
   * full re-rank is simple and visibly correct.
   */
  const reorder = useCallback(
    (draggedId: number, targetId: number, position: "before" | "after") => {
      if (draggedId === targetId) return;
      const dragged = vehicles.find((v) => v.id === draggedId);
      const target = vehicles.find((v) => v.id === targetId);
      if (!dragged || !target || dragged.line !== target.line) return;

      const list = vehicles.filter((v) => v.line === dragged.line).sort(lineOrderCompare);
      const without = list.filter((v) => v.id !== draggedId);
      const targetIdx = without.findIndex((v) => v.id === targetId);
      if (targetIdx < 0) return;
      const insertAt = position === "before" ? targetIdx : targetIdx + 1;
      const reordered = [
        ...without.slice(0, insertAt),
        dragged,
        ...without.slice(insertAt),
      ];

      const ranks = reordered.map((v, i) => ({
        id: v.id,
        rank: reordered.length === 1 ? 0.5 : i / (reordered.length - 1),
      }));
      const rankById = new Map(ranks.map((r) => [r.id, r.rank]));

      // Optimistic update — paint the new order immediately.
      setVehicles((arr) =>
        arr.map((v) => (rankById.has(v.id) ? { ...v, yard_y: rankById.get(v.id)! } : v)),
      );

      // Persist all affected vehicles in parallel; only roll back on failure.
      Promise.all(
        ranks.map((r) =>
          updateVehicleYard(r.id, { yard_y: r.rank }).catch((err) => {
            throw err;
          }),
        ),
      ).catch((err) => {
        toast.error(err instanceof ApiRequestError ? err.message : "تعذر حفظ الترتيب");
        reload();
      });
    },
    [vehicles, reload],
  );

  return (
    <div className="relative overflow-hidden rounded-2xl border border-surface-300 bg-white shadow-soft-green">
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-l from-brand-500 to-brand-700" />

      <header className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <LayoutGrid size={20} />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-surface-900">كراج المركز</h2>
            <p className="text-xs text-surface-500">
              اسحب أي مركبة لإعادة ترتيبها داخل خطها
            </p>
          </div>
        </div>
        <p className="text-[11px] font-bold text-surface-500">
          المجموع: <span className="text-surface-900 tabular-nums">{vehicles.length}</span>
        </p>
      </header>

      <div className="grid grid-cols-1 gap-px bg-surface-200">
        <LineColumn
          title="الخط الأول"
          line="الأول"
          accent="brand"
          vehicles={lineOne}
          loading={loading}
          onReorder={reorder}
        />
        <LineColumn
          title="الخط الثاني"
          line="الثاني"
          accent="brand"
          vehicles={lineTwo}
          loading={loading}
          onReorder={reorder}
        />
      </div>
    </div>
  );
}

interface ColumnProps {
  title: string;
  line: VehicleLine;
  accent: "brand" | "blue";
  vehicles: VehicleSummary[];
  loading: boolean;
  onReorder: (draggedId: number, targetId: number, position: "before" | "after") => void;
}

function LineColumn({ title, accent, vehicles, loading, onReorder }: ColumnProps) {
  const [dragId, setDragId] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<{ id: number; pos: "before" | "after" } | null>(
    null,
  );
  const navigate = useNavigate();

  const headerCls =
    accent === "brand"
      ? "bg-brand-50 text-brand-700 border-b-brand-200"
      : "bg-blue-50 text-blue-700 border-b-blue-200";
  const stripe = accent === "brand" ? "bg-brand-600" : "bg-blue-600";
  const iconTone = accent === "brand" ? "text-brand-700" : "text-blue-700";

  function handleDragStart(e: DragEvent<HTMLLIElement>, id: number) {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
    // Required for Firefox: setData must be called or dragstart is cancelled.
    e.dataTransfer.setData("text/plain", String(id));
  }

  function handleDragOver(e: DragEvent<HTMLLIElement>, id: number) {
    if (dragId == null || dragId === id) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    // Horizontal layout: split decision on the *inline* axis. In RTL the
    // visual "before" slot is to the right of the chip, so we compare against
    // the right half rather than the left.
    const rect = e.currentTarget.getBoundingClientRect();
    const isRtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const fromStart = isRtl ? rect.right - e.clientX : e.clientX - rect.left;
    const pos = fromStart < rect.width / 2 ? "before" : "after";
    if (dropTarget?.id !== id || dropTarget?.pos !== pos) {
      setDropTarget({ id, pos });
    }
  }

  function handleDrop(e: DragEvent<HTMLLIElement>, id: number) {
    e.preventDefault();
    if (dragId != null && dropTarget) {
      onReorder(dragId, id, dropTarget.pos);
    }
    setDragId(null);
    setDropTarget(null);
  }

  function handleDragEnd() {
    setDragId(null);
    setDropTarget(null);
  }

  return (
    <div className="bg-white">
      <header
        className={`flex items-center justify-between gap-2 border-b px-4 py-2.5 ${headerCls}`}
      >
        <div className="flex items-center gap-2">
          <span className={`h-5 w-1 rounded-full ${stripe}`} aria-hidden />
          <h3 className="text-sm font-extrabold">{title}</h3>
        </div>
        <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold tabular-nums">
          {vehicles.length} مركبة
        </span>
      </header>

      {loading ? (
        <p className="px-4 py-6 text-center text-xs text-surface-500">جارٍ التحميل…</p>
      ) : vehicles.length === 0 ? (
        <p className="px-4 py-8 text-center text-xs text-surface-500">
          لا توجد مركبات في هذا الخط
        </p>
      ) : (
        // Horizontal chip layout: vehicles flow inline with wrap, so the
        // column uses its full width before stacking onto a new row.
        <ul className="flex flex-wrap gap-2 p-3">
          {vehicles.map((v) => {
            const Icon = TYPE_ICON[v.type] ?? Truck;
            const isDragging = dragId === v.id;
            const showStartMarker = dropTarget?.id === v.id && dropTarget.pos === "before";
            const showEndMarker = dropTarget?.id === v.id && dropTarget.pos === "after";
            return (
              <li
                key={v.id}
                draggable
                onDragStart={(e) => handleDragStart(e, v.id)}
                onDragOver={(e) => handleDragOver(e, v.id)}
                onDrop={(e) => handleDrop(e, v.id)}
                onDragEnd={handleDragEnd}
                onClick={() => navigate(`/vehicles/${v.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`/vehicles/${v.id}`);
                  }
                }}
                tabIndex={0}
                title={`${v.type} — ${v.plate_number}`}
                className={`group relative inline-flex max-w-full cursor-pointer items-center gap-2 rounded-xl border border-surface-200 bg-white px-2.5 py-1.5 text-xs transition-colors hover:border-brand-300 hover:bg-brand-50 ${isDragging ? "opacity-40" : ""}`}
              >
                {showStartMarker ? (
                  <span
                    className="absolute -start-1 top-1/2 h-8 w-[2px] -translate-y-1/2 rounded-full bg-brand-600"
                    aria-hidden
                  />
                ) : null}
                {showEndMarker ? (
                  <span
                    className="absolute -end-1 top-1/2 h-8 w-[2px] -translate-y-1/2 rounded-full bg-brand-600"
                    aria-hidden
                  />
                ) : null}
                <span
                  className="cursor-grab text-surface-400 group-hover:text-surface-700 active:cursor-grabbing"
                  aria-hidden
                >
                  <GripVertical size={12} />
                </span>
                <div className={`shrink-0 ${iconTone}`}>
                  <Icon size={16} />
                </div>
                <span className="max-w-[12ch] truncate font-bold text-surface-900">{v.type}</span>
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${statusDot(v.status)}`}
                  title={v.status}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
