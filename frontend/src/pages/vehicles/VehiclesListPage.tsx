import {
  AlertTriangle,
  Ambulance,
  Anchor,
  ArrowUpToLine,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Construction,
  Crown,
  Droplet,
  Flame,
  LifeBuoy,
  Lightbulb,
  Mountain,
  Package,
  Ship,
  Siren,
  Truck,
  User,
  Wrench,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ApiRequestError } from "../../api/client";
import { fetchDashboardStats } from "../../api/dashboard";
import { listVehicles } from "../../api/vehicles";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { Loader } from "../../components/Loader";
import { PageHeader } from "../../components/PageHeader";
import { SelectField } from "../../components/SelectField";
import { StatCard } from "../../components/StatCard";
import { TextField } from "../../components/TextField";
import { VEHICLE_STATUSES, VEHICLE_TYPES } from "../../constants/enums";
import type { DashboardStats } from "../../types/dashboard";
import type {
  InspectionResult,
  VehicleStatus,
  VehicleSummary,
  VehicleType,
} from "../../types/models";

const PAGE_SIZE = 12;

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
  // Legacy types — kept so existing DB rows still render with a sensible icon.
  "إطفاء": Truck,
  "إسعاف": Ambulance,
  "سلم": Truck,
  "قيادة": Crown,
  "إنقاذ": LifeBuoy,
};

function statusTone(s: VehicleStatus): {
  stripe: string;
  badgeBg: string;
  badgeText: string;
  ring: string;
} {
  if (s === "في الخدمة")
    return {
      stripe: "bg-brand-600",
      badgeBg: "bg-brand-50",
      badgeText: "text-brand-700",
      ring: "ring-brand-200",
    };
  if (s === "صيانة")
    return {
      stripe: "bg-amber-500",
      badgeBg: "bg-amber-50",
      badgeText: "text-amber-700",
      ring: "ring-amber-200",
    };
  return {
    stripe: "bg-red-600",
    badgeBg: "bg-red-50",
    badgeText: "text-red-700",
    ring: "ring-red-200",
  };
}

function inspectionTone(r: InspectionResult): { text: string; bg: string } {
  if (r === "ناجح") return { text: "text-brand-700", bg: "bg-brand-50" };
  if (r === "يحتاج صيانة") return { text: "text-amber-700", bg: "bg-amber-50" };
  return { text: "text-red-700", bg: "bg-red-50" };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function daysAgo(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

export function VehiclesListPage() {
  const [vehicles, setVehicles] = useState<VehicleSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState<DashboardStats["vehicles"] | null>(null);

  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats()
      .then((s) => setStats(s.vehicles))
      .catch(() => undefined);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listVehicles({
        q: q || undefined,
        type: (type || undefined) as VehicleSummary["type"] | undefined,
        status: (status || undefined) as VehicleSummary["status"] | undefined,
        page,
        page_size: PAGE_SIZE,
      });
      setVehicles(res.items);
      setTotal(res.total);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "تعذر تحميل المركبات");
    } finally {
      setLoading(false);
    }
  }, [q, type, status, page]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const inService = stats?.by_status?.["في الخدمة"] ?? 0;
  const maintenance = stats?.by_status?.["صيانة"] ?? 0;
  const outOfService = stats?.by_status?.["خارج الخدمة"] ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="المركبات"
        subtitle="إدارة المركبات والصيانة والفحوصات"
        icon={Truck}
        iconTone="amber"
        actions={
          <Link to="/vehicles/new">
            <Button>إضافة مركبة</Button>
          </Link>
        }
      />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="إجمالي المركبات" value={stats?.total ?? "—"} icon={Truck} tone="brand" />
        <StatCard label="في الخدمة" value={inService} icon={CheckCircle2} tone="neutral" />
        <StatCard label="في الصيانة" value={maintenance} icon={Wrench} tone="warning" />
        <StatCard label="خارج الخدمة" value={outOfService} icon={AlertTriangle} tone="danger" />
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <TextField
          label="بحث برقم اللوحة"
          value={q}
          onChange={(e) => {
            setPage(1);
            setQ(e.target.value);
          }}
          placeholder="..."
        />
        <SelectField
          label="النوع"
          value={type}
          onChange={(e) => {
            setPage(1);
            setType(e.target.value);
          }}
          placeholder="كل الأنواع"
          options={VEHICLE_TYPES.map((t) => ({ value: t, label: t }))}
        />
        <SelectField
          label="الحالة"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          placeholder="كل الحالات"
          options={VEHICLE_STATUSES.map((s) => ({ value: s, label: s }))}
        />
      </section>

      {loading ? (
        <Loader />
      ) : vehicles.length === 0 ? (
        <div className="rounded-2xl border border-surface-300 bg-white">
          <EmptyState
            icon={Truck}
            title="لا توجد مركبات"
            description="لم يتم العثور على نتائج، أو لم يتم إضافة مركبة بعد."
            action={
              <Link to="/vehicles/new">
                <Button>إضافة أول مركبة</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <LineSection
            title="الخط الأول"
            subtitle="مركبات الاستجابة الأولى"
            vehicles={vehicles.filter((v) => v.line === "الأول")}
            stripe="bg-brand-600"
            badgeBg="bg-brand-50"
            badgeText="text-brand-700"
          />
          <LineSection
            title="الخط الثاني"
            subtitle="مركبات الإسناد والاحتياط"
            vehicles={vehicles.filter((v) => v.line === "الثاني")}
            stripe="bg-blue-600"
            badgeBg="bg-blue-50"
            badgeText="text-blue-700"
          />
        </>
      )}

      {total > PAGE_SIZE ? (
        <footer className="flex items-center justify-between">
          <p className="text-sm text-surface-500">
            صفحة {page} من {totalPages} — إجمالي {total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              السابق
            </Button>
            <Button
              variant="secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              التالي
            </Button>
          </div>
        </footer>
      ) : null}
    </div>
  );
}

function VehicleCard({ v }: { v: VehicleSummary }) {
  const tone = statusTone(v.status);
  const Icon = TYPE_ICON[v.type] ?? Truck;
  const photoUrl = v.photo_path ? `/uploads/${v.photo_path}` : null;
  return (
    <Link
      to={`/vehicles/${v.id}`}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-surface-300 bg-white shadow-soft-green ring-1 ring-inset transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lift-green ${tone.ring}`}
    >
      {/* status stripe */}
      <div className={`h-[3px] ${tone.stripe}`} />

      {/* banner photo */}
      <div className="relative h-40 w-full overflow-hidden bg-surface-100">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-surface-400">
            <Icon size={56} />
          </div>
        )}
        {/* status badge */}
        <div
          className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${tone.badgeBg} ${tone.badgeText} ${tone.ring}`}
        >
          {v.status}
        </div>
      </div>

      {/* identity */}
      <div className="p-4">
        <div className="flex items-center gap-2">
          <Icon size={16} className="shrink-0 text-surface-700" />
          <h3 className="truncate text-sm font-black text-surface-900 group-hover:text-brand-700">
            {v.type}
          </h3>
        </div>

        <PlateBoxes plate={v.plate_number} className="mt-2" />

        <div className="mt-3 flex items-center gap-2 text-xs text-surface-700">
          <User size={12} className="shrink-0 text-surface-500" />
          <span className="truncate">
            {v.driver_name ? v.driver_name : <span className="text-surface-500">بدون سائق</span>}
          </span>
        </div>

        {/* stats strip */}
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-surface-200 pt-3 text-center">
          <Stat
            icon={Package}
            label="تجهيزات"
            value={v.equipment_count}
            tone="neutral"
          />
          <Stat
            icon={Wrench}
            label="صيانة مفتوحة"
            value={v.open_maintenance_count}
            tone={v.open_maintenance_count > 0 ? "amber" : "neutral"}
          />
          <Stat
            icon={ClipboardCheck}
            label="آخر فحص"
            value={
              v.last_inspection_date ? `${daysAgo(v.last_inspection_date)} يوم` : "—"
            }
            tone={
              v.last_inspection_result
                ? v.last_inspection_result === "ناجح"
                  ? "brand"
                  : v.last_inspection_result === "يحتاج صيانة"
                    ? "amber"
                    : "danger"
                : "neutral"
            }
          />
        </div>

        {/* last inspection detail row */}
        {v.last_inspection_date ? (
          <div className="mt-3 flex items-center justify-between rounded-xl border border-surface-200 bg-surface-50 px-3 py-2 text-[11px]">
            <span className="inline-flex items-center gap-1.5 text-surface-700">
              <Calendar size={11} />
              {formatDate(v.last_inspection_date)}
            </span>
            {v.last_inspection_result ? (
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 font-bold ${inspectionTone(v.last_inspection_result).bg} ${inspectionTone(v.last_inspection_result).text}`}
              >
                {v.last_inspection_result}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  tone: "neutral" | "brand" | "amber" | "danger";
}) {
  const toneCls =
    tone === "brand"
      ? "text-brand-700"
      : tone === "amber"
        ? "text-amber-700"
        : tone === "danger"
          ? "text-red-700"
          : "text-surface-900";
  return (
    <div>
      <div className={`flex items-center justify-center gap-1 ${toneCls}`}>
        <Icon size={12} />
        <span className="text-base font-black tabular-nums leading-none">{value}</span>
      </div>
      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-surface-500">
        {label}
      </p>
    </div>
  );
}

/**
 * Renders the plate number as separate character boxes — 3 letter slots and
 * 4 digit slots, matching the standard Saudi plate format. Letters pull from
 * Arabic + Latin ranges; missing characters render as empty slots so the
 * layout stays stable.
 */
function PlateBoxes({
  plate,
  className = "",
}: {
  plate: string;
  className?: string;
}) {
  const chars = Array.from(plate);
  const letters = chars.filter((c) => /[\p{L}]/u.test(c)).slice(0, 3);
  const digits = chars.filter((c) => /\d/.test(c)).slice(0, 4);
  while (letters.length < 3) letters.push("");
  while (digits.length < 4) digits.push("");
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <PlateGroup chars={letters} />
      <PlateGroup chars={digits} mono />
    </div>
  );
}

function PlateGroup({ chars, mono = false }: { chars: string[]; mono?: boolean }) {
  return (
    <div className="flex gap-0.5">
      {chars.map((c, i) => (
        <span
          key={i}
          className={`flex h-6 w-6 items-center justify-center rounded-md border border-surface-300 bg-white text-[12px] font-black text-surface-900 shadow-[inset_0_-1px_0_rgba(0,0,0,0.04)] ${mono ? "tabular-nums" : ""}`}
        >
          {c || " "}
        </span>
      ))}
    </div>
  );
}

function LineSection({
  title,
  subtitle,
  vehicles,
  stripe,
  badgeBg,
  badgeText,
}: {
  title: string;
  subtitle: string;
  vehicles: VehicleSummary[];
  stripe: string;
  badgeBg: string;
  badgeText: string;
}) {
  return (
    <section className="space-y-4">
      <header className="flex items-center gap-3">
        <span className={`h-7 w-1 rounded-full ${stripe}`} aria-hidden />
        <div className="flex flex-1 items-baseline gap-3">
          <h2 className="text-lg font-extrabold text-surface-900">{title}</h2>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${badgeBg} ${badgeText}`}
          >
            {vehicles.length} مركبة
          </span>
          <span className="hidden text-xs text-surface-500 md:inline">{subtitle}</span>
        </div>
      </header>
      {vehicles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-300 bg-white px-4 py-8 text-center text-xs text-surface-500">
          لا توجد مركبات في هذا الخط ضمن المرشحات الحالية
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {vehicles.map((v) => (
            <VehicleCard key={v.id} v={v} />
          ))}
        </div>
      )}
    </section>
  );
}
