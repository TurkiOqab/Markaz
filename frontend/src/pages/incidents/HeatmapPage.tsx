import L from "../../lib/leaflet";
import "../../lib/leafletPlugins";
import { Flame, Layers, MapPin } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ApiRequestError } from "../../api/client";
import { listIncidents } from "../../api/incidents";
import { Button } from "../../components/Button";
import { Loader } from "../../components/Loader";
import { PageHeader } from "../../components/PageHeader";
import { SelectField } from "../../components/SelectField";
import { TextField } from "../../components/TextField";
import { INCIDENT_TYPES } from "../../constants/enums";
import type { Incident } from "../../types/models";
import { IncidentsTabs } from "./IncidentsTabs";

const DEFAULT_CENTER: [number, number] = [24.7136, 46.6753];

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

type ViewMode = "heatmap" | "markers";
type TimeRange = "today" | "week" | "month" | "year" | "all" | "custom";

const TIME_OPTIONS = [
  { value: "today", label: "اليوم" },
  { value: "week", label: "هذا الأسبوع" },
  { value: "month", label: "هذا الشهر" },
  { value: "year", label: "هذه السنة" },
  { value: "all", label: "كل الوقت" },
  { value: "custom", label: "فترة مخصصة" },
];

const STATUS_OPTIONS = [
  { value: "مكتمل", label: "مكتمل فقط" },
  { value: "غير مكتمل", label: "غير مكتمل فقط" },
];

function startOfRange(range: TimeRange, customFrom: string, customTo: string): {
  from: Date | null;
  to: Date | null;
} {
  const now = new Date();
  if (range === "today") {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return { from: d, to: null };
  }
  if (range === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return { from: d, to: null };
  }
  if (range === "month") {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 1);
    return { from: d, to: null };
  }
  if (range === "year") {
    const d = new Date(now);
    d.setFullYear(d.getFullYear() - 1);
    return { from: d, to: null };
  }
  if (range === "custom") {
    return {
      from: customFrom ? new Date(customFrom) : null,
      to: customTo ? new Date(customTo + "T23:59:59") : null,
    };
  }
  return { from: null, to: null };
}

function partOfDay(iso: string): "صباح" | "ظهر" | "مساء" | "ليل" {
  const h = new Date(iso).getHours();
  if (h >= 6 && h < 12) return "صباح";
  if (h >= 12 && h < 17) return "ظهر";
  if (h >= 17 && h < 21) return "مساء";
  return "ليل";
}

export function HeatmapPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("heatmap");
  const [range, setRange] = useState<TimeRange>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [type, setType] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const heatLayerRef = useRef<L.Layer | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);

  // Load all incidents once
  useEffect(() => {
    listIncidents({ page_size: 200 })
      .then((res) => setIncidents(res.items))
      .catch((err) =>
        toast.error(err instanceof ApiRequestError ? err.message : "تعذر تحميل الحوادث"),
      )
      .finally(() => setLoading(false));
  }, []);

  // Filter
  const { from, to } = useMemo(
    () => startOfRange(range, customFrom, customTo),
    [range, customFrom, customTo],
  );
  const filtered = useMemo(() => {
    return incidents.filter((i) => {
      if (type && i.type !== type) return false;
      if (statusFilter && i.status !== statusFilter) return false;
      const d = new Date(i.occurred_at);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [incidents, type, statusFilter, from, to]);

  const withCoords = useMemo(
    () => filtered.filter((i) => i.latitude != null && i.longitude != null),
    [filtered],
  );
  const missingCoords = filtered.length - withCoords.length;

  // Init map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = L.map(mapContainerRef.current).setView(DEFAULT_CENTER, 6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    }).addTo(map);
    mapRef.current = map;
    window.setTimeout(() => map.invalidateSize(), 200);
  }, []);

  // Update layers when filtered data or view changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old layers
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }
    if (markerLayerRef.current) {
      map.removeLayer(markerLayerRef.current);
      markerLayerRef.current = null;
    }

    if (withCoords.length === 0) return;

    const points: [number, number, number][] = withCoords.map((i) => [
      i.latitude as number,
      i.longitude as number,
      0.6,
    ]);

    if (view === "heatmap") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const heat = (L as any).heatLayer(points, {
        radius: 30,
        blur: 22,
        minOpacity: 0.4,
        maxZoom: 17,
        gradient: { 0.2: "#22c55e", 0.5: "#eab308", 0.8: "#f97316", 1.0: "#dc2626" },
      });
      heat.addTo(map);
      heatLayerRef.current = heat;
    } else {
      const group = L.layerGroup();
      withCoords.forEach((i) => {
        const m = L.marker([i.latitude as number, i.longitude as number], { icon: markerIcon });
        const html = `
          <div style="font-family:Tajawal,sans-serif;direction:rtl;text-align:right;min-width:200px">
            <div style="font-weight:800;font-size:13px;margin-bottom:4px">${escapeHtml(i.type)} — ${escapeHtml(i.location)}</div>
            <div style="font-size:11px;color:#6a8a6a;margin-bottom:6px">${new Date(i.occurred_at).toLocaleString("ar-EG")}</div>
            <a href="/incidents/${i.id}" style="display:inline-block;padding:4px 8px;background:#1a7a3a;color:#fff;border-radius:6px;font-size:11px;font-weight:bold;text-decoration:none">فتح التفاصيل</a>
          </div>`;
        m.bindPopup(html);
        group.addLayer(m);
      });
      group.addTo(map);
      markerLayerRef.current = group;
    }

    // Auto-fit if there are points
    if (withCoords.length > 0) {
      const bounds = L.latLngBounds(
        withCoords.map((i) => [i.latitude as number, i.longitude as number]),
      );
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [view, withCoords]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const stats = useMemo(() => {
    const byType: Record<string, number> = {};
    const byPart: Record<string, number> = { صباح: 0, ظهر: 0, مساء: 0, ليل: 0 };
    for (const i of filtered) {
      byType[i.type] = (byType[i.type] ?? 0) + 1;
      byPart[partOfDay(i.occurred_at)] = (byPart[partOfDay(i.occurred_at)] ?? 0) + 1;
    }
    return { byType, byPart };
  }, [filtered]);

  if (loading) return <Loader fullPage />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="الخريطة الحرارية للحوادث"
        subtitle="عرض توزيع الحوادث جغرافياً لتحديد المناطق الأكثر تكراراً"
        icon={Flame}
        iconTone="brand"
      />

      <IncidentsTabs />

      {missingCoords > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
          <span>
            يوجد <span className="font-extrabold">{missingCoords}</span> حادث بدون موقع
            جغرافي محدد ضمن النتائج المعروضة
          </span>
          <Link to="/incidents?status=غير مكتمل" className="text-xs font-bold underline">
            مراجعة الآن ←
          </Link>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
        {/* Map */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl border border-surface-300 bg-white p-1 shadow-soft-green">
              <button
                type="button"
                onClick={() => setView("heatmap")}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-bold transition-colors ${
                  view === "heatmap"
                    ? "bg-gradient-to-l from-brand-500 to-brand-700 text-white"
                    : "text-surface-700 hover:bg-brand-50"
                }`}
              >
                <Layers size={12} />
                خريطة حرارية
              </button>
              <button
                type="button"
                onClick={() => setView("markers")}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-bold transition-colors ${
                  view === "markers"
                    ? "bg-gradient-to-l from-brand-500 to-brand-700 text-white"
                    : "text-surface-700 hover:bg-brand-50"
                }`}
              >
                <MapPin size={12} />
                نقاط منفصلة
              </button>
            </div>
            <span className="text-xs text-surface-500">
              معروض: {withCoords.length} من {filtered.length} حادث
            </span>
          </div>
          <div
            ref={mapContainerRef}
            className="h-[560px] w-full overflow-hidden rounded-2xl border border-surface-300 shadow-soft-green"
          />
        </div>

        {/* Filters + Stats */}
        <div className="space-y-4">
          <section className="rounded-2xl border border-surface-300 bg-white p-4 shadow-soft-green">
            <h3 className="mb-3 text-xs font-extrabold text-surface-900">الفلاتر</h3>
            <div className="space-y-3">
              <SelectField
                label="الفترة"
                value={range}
                onChange={(e) => setRange(e.target.value as TimeRange)}
                options={TIME_OPTIONS}
              />
              {range === "custom" ? (
                <div className="grid grid-cols-2 gap-2">
                  <TextField
                    label="من"
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                  />
                  <TextField
                    label="إلى"
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                  />
                </div>
              ) : null}
              <SelectField
                label="النوع"
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="كل الأنواع"
                options={INCIDENT_TYPES.map((t) => ({ value: t, label: t }))}
              />
              <SelectField
                label="حالة الإكمال"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                placeholder="الكل"
                options={STATUS_OPTIONS}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setRange("month");
                  setCustomFrom("");
                  setCustomTo("");
                  setType("");
                  setStatusFilter("");
                }}
              >
                إعادة تعيين
              </Button>
            </div>
          </section>

          <section className="rounded-2xl border border-surface-300 bg-white p-4 shadow-soft-green">
            <h3 className="mb-3 text-xs font-extrabold text-surface-900">الإحصاءات</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2">
                <span className="text-xs font-bold text-brand-700">إجمالي الحوادث</span>
                <span className="text-xl font-black tabular-nums text-brand-700">
                  {filtered.length}
                </span>
              </div>

              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-surface-500">
                  حسب النوع
                </p>
                <ul className="space-y-1">
                  {Object.entries(stats.byType).length === 0 ? (
                    <li className="text-xs text-surface-500">—</li>
                  ) : (
                    Object.entries(stats.byType)
                      .sort((a, b) => b[1] - a[1])
                      .map(([t, c]) => (
                        <BarRow key={t} label={t} value={c} max={filtered.length} />
                      ))
                  )}
                </ul>
              </div>

              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-surface-500">
                  حسب وقت اليوم
                </p>
                <ul className="space-y-1">
                  {Object.entries(stats.byPart).map(([t, c]) => (
                    <BarRow key={t} label={t} value={c} max={filtered.length} />
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <li className="flex items-center gap-2 text-xs">
      <span className="w-16 shrink-0 truncate text-surface-900">{label}</span>
      <div className="flex-1 overflow-hidden rounded-full bg-surface-100">
        <div
          className="h-2 rounded-full bg-gradient-to-l from-brand-500 to-brand-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 shrink-0 text-end font-bold tabular-nums text-surface-500">
        {value}
      </span>
    </li>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Augment Leaflet types for heatLayer (provided by leaflet.heat at runtime)
declare module "leaflet" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function heatLayer(points: [number, number, number][], options?: any): L.Layer;
}
