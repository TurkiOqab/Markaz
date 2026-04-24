import { AlertTriangle, LayoutDashboard, Package, Truck, Users, Wrench } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { ApiRequestError } from "../api/client";
import { fetchDashboardStats } from "../api/dashboard";
import { Badge, vehicleStatusTone } from "../components/Badge";
import { DashboardSettings } from "../components/DashboardSettings";
import type { WidgetGroup } from "../components/DashboardSettings";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import type { DashboardStats } from "../types/dashboard";

const STATUS_COLORS: Record<string, string> = {
  "في الخدمة": "#10b981",
  "صيانة": "#f59e0b",
  "خارج الخدمة": "#dc2626",
};

const WIDGET_GROUPS: WidgetGroup[] = [
  {
    title: "بطاقات الإحصاءات",
    widgets: [
      { key: "stat.employees", label: "الموظفون" },
      { key: "stat.vehicles", label: "المركبات في الخدمة" },
      { key: "stat.maintenance", label: "صيانة مفتوحة" },
      { key: "stat.inventory", label: "أصناف منخفضة" },
    ],
  },
  {
    title: "الرسوم البيانية",
    widgets: [
      { key: "chart.vehicles", label: "حالة المركبات" },
      { key: "chart.shifts", label: "الموظفون حسب الوردية" },
      { key: "chart.ratings", label: "متوسط التقييمات" },
      { key: "chart.costs", label: "تكاليف الصيانة" },
    ],
  },
  {
    title: "التنبيهات",
    widgets: [
      { key: "attn.vehicles", label: "مركبات خارج الخدمة" },
      { key: "attn.stock", label: "مخزون منخفض" },
    ],
  },
];

const ALL_KEYS = WIDGET_GROUPS.flatMap((g) => g.widgets.map((w) => w.key));
const DEFAULT_VISIBLE: Record<string, boolean> = Object.fromEntries(
  ALL_KEYS.map((k) => [k, true]),
);
const STORAGE_KEY = "markaz:dashboard-visibility";

function loadVisibility(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_VISIBLE;
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return { ...DEFAULT_VISIBLE, ...parsed };
  } catch {
    return DEFAULT_VISIBLE;
  }
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState<Record<string, boolean>>(loadVisibility);

  useEffect(() => {
    fetchDashboardStats()
      .then((s) => {
        setStats(s);
        setLoading(false);
      })
      .catch((err) => {
        toast.error(err instanceof ApiRequestError ? err.message : "فشل تحميل الإحصائيات");
        setLoading(false);
      });
  }, []);

  function toggle(key: string, value: boolean) {
    setVisible((prev) => {
      const next = { ...prev, [key]: value };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function reset() {
    setVisible(DEFAULT_VISIBLE);
    localStorage.removeItem(STORAGE_KEY);
  }

  const statVisible = useMemo(
    () =>
      ["stat.employees", "stat.vehicles", "stat.maintenance", "stat.inventory"].some(
        (k) => visible[k],
      ),
    [visible],
  );
  const chartsVisible = useMemo(
    () =>
      ["chart.vehicles", "chart.shifts", "chart.ratings", "chart.costs"].some(
        (k) => visible[k],
      ),
    [visible],
  );
  const attnVisible = useMemo(
    () => ["attn.vehicles", "attn.stock"].some((k) => visible[k]),
    [visible],
  );

  if (loading) return <p className="text-slate-500">جارِ التحميل...</p>;
  if (!stats) return null;

  const inServiceCount = stats.vehicles.by_status["في الخدمة"] ?? 0;

  const vehicleData = Object.entries(stats.vehicles.by_status).map(([name, value]) => ({
    name,
    value,
  }));

  const shiftData = Object.entries(stats.employees.by_shift).map(([name, value]) => ({
    name,
    value,
  }));

  const monthlyAvg = stats.ratings.monthly_average.slice(-6).map((r) => ({
    period: `${r.year}/${String(r.month).padStart(2, "0")}`,
    average: r.average,
  }));

  const monthlyCosts = stats.maintenance.monthly_costs.slice(-6).map((c) => ({
    period: `${c.year}/${String(c.month).padStart(2, "0")}`,
    "مركبات": c.vehicle,
    "مبنى": c.building,
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="لوحة التحكم"
        subtitle="نظرة شاملة على المركز والإحصائيات"
        icon={LayoutDashboard}
        iconTone="brand"
        actions={
          <DashboardSettings
            groups={WIDGET_GROUPS}
            visible={visible}
            onToggle={toggle}
            onReset={reset}
          />
        }
      />

      {statVisible ? (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {visible["stat.employees"] ? (
            <StatCard
              label="الموظفون"
              value={stats.employees.total}
              sublabel="إجمالي الموظفين"
              icon={Users}
              tone="brand"
            />
          ) : null}
          {visible["stat.vehicles"] ? (
            <StatCard
              label="المركبات في الخدمة"
              value={`${inServiceCount} / ${stats.vehicles.total}`}
              sublabel="جاهزة للاستخدام"
              icon={Truck}
              tone="brand"
            />
          ) : null}
          {visible["stat.maintenance"] ? (
            <StatCard
              label="صيانة مفتوحة"
              value={stats.maintenance.open_count}
              sublabel="قيد التنفيذ أو مجدولة"
              icon={Wrench}
              tone={stats.maintenance.open_count > 0 ? "warning" : "neutral"}
            />
          ) : null}
          {visible["stat.inventory"] ? (
            <StatCard
              label="أصناف منخفضة المخزون"
              value={stats.inventory.low_stock.length}
              sublabel={`من أصل ${stats.inventory.total} صنفاً`}
              icon={Package}
              tone={stats.inventory.low_stock.length > 0 ? "danger" : "neutral"}
            />
          ) : null}
        </section>
      ) : null}

      {attnVisible ? (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {visible["attn.vehicles"] ? (
            <AttentionCard
              title="مركبات خارج الخدمة"
              empty="كل المركبات في الخدمة"
              items={stats.attention.vehicles_out.map((v) => (
                <li key={v.id} className="flex items-center justify-between py-2">
                  <Link
                    to={`/vehicles/${v.id}`}
                    className="font-medium text-slate-900 hover:underline"
                  >
                    {v.plate_number}
                  </Link>
                  <Badge tone={vehicleStatusTone(v.status)}>{v.status}</Badge>
                </li>
              ))}
            />
          ) : null}

          {visible["attn.stock"] ? (
            <AttentionCard
              title="مخزون منخفض"
              empty="كل الأصناف فوق الحد الأدنى"
              items={stats.attention.low_stock.slice(0, 5).map((i) => (
                <li key={i.id} className="flex items-center justify-between py-2">
                  <span className="truncate text-sm text-slate-900">{i.item_name}</span>
                  <span className="text-xs text-slate-500">
                    <span className="font-semibold text-red-600">{i.quantity}</span>
                    {" / "}
                    {i.min_threshold}
                  </span>
                </li>
              ))}
            />
          ) : null}
        </section>
      ) : null}

      {chartsVisible ? (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {visible["chart.vehicles"] ? (
            <ChartCard title="حالة المركبات">
              <div className="relative">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={vehicleData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                    >
                      {vehicleData.map((entry) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "#94a3b8"} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={24} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center -mt-3">
                  <div className="text-2xl font-bold text-slate-900">{stats.vehicles.total}</div>
                  <div className="text-xs text-slate-500">مركبة</div>
                </div>
              </div>
            </ChartCard>
          ) : null}

          {visible["chart.shifts"] ? (
            <ChartCard title="الموظفون حسب الوردية">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={shiftData} layout="vertical" margin={{ left: 30 }}>
                  <defs>
                    <linearGradient id="barBrand" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#b91c1c" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="#b91c1c" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" />
                  <Tooltip />
                  <Bar dataKey="value" fill="url(#barBrand)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          ) : null}

          {visible["chart.ratings"] ? (
            <ChartCard title="متوسط التقييمات الشهري">
              {monthlyAvg.length === 0 ? (
                <EmptyChart message="لا توجد تقييمات بعد" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart
                    data={monthlyAvg}
                    margin={{ top: 10, right: 24, left: 8, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="areaRatings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#b91c1c" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#b91c1c" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="period" />
                    <YAxis
                      domain={["auto", "auto"]}
                      allowDecimals
                      width={36}
                      tickFormatter={(v: number) => v.toFixed(1)}
                    />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="average"
                      stroke="#b91c1c"
                      strokeWidth={2}
                      fill="url(#areaRatings)"
                      dot={{ r: 3, fill: "#b91c1c" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          ) : null}

          {visible["chart.costs"] ? (
            <ChartCard title="تكاليف الصيانة (6 أشهر)">
              {monthlyCosts.length === 0 ? (
                <EmptyChart message="لا توجد بيانات صيانة" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={monthlyCosts}>
                    <defs>
                      <linearGradient id="areaVehicles" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#b91c1c" stopOpacity={0.55} />
                        <stop offset="100%" stopColor="#b91c1c" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="areaBuilding" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.55} />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="مركبات"
                      stackId="1"
                      stroke="#b91c1c"
                      strokeWidth={2}
                      fill="url(#areaVehicles)"
                    />
                    <Area
                      type="monotone"
                      dataKey="مبنى"
                      stackId="1"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      fill="url(#areaBuilding)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <h3 className="mb-3 text-sm font-semibold text-slate-700">{title}</h3>
      {children}
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[200px] items-center justify-center text-sm text-slate-500">
      {message}
    </div>
  );
}

function AttentionCard({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: ReactNode[];
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <header className="mb-2 flex items-center gap-2">
        <AlertTriangle size={16} className="text-amber-500" />
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      </header>
      {items.length === 0 ? (
        <p className="py-3 text-sm text-slate-500">{empty}</p>
      ) : (
        <ul className="divide-y divide-slate-100">{items}</ul>
      )}
    </div>
  );
}
