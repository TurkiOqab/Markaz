import { AlertTriangle, Package, Truck, Users, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
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
  Line,
  LineChart,
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
import { StatCard } from "../components/StatCard";
import type { DashboardStats } from "../types/dashboard";

const STATUS_COLORS: Record<string, string> = {
  "في الخدمة": "#10b981",
  "صيانة": "#f59e0b",
  "خارج الخدمة": "#dc2626",
};

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

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
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">لوحة التحكم</h1>
        <p className="mt-1 text-sm text-slate-600">نظرة سريعة على حالة المركز</p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="الموظفون"
          value={stats.employees.total}
          sublabel="إجمالي الموظفين"
          icon={Users}
          tone="brand"
        />
        <StatCard
          label="المركبات في الخدمة"
          value={`${inServiceCount} / ${stats.vehicles.total}`}
          sublabel="جاهزة للاستخدام"
          icon={Truck}
          tone="brand"
        />
        <StatCard
          label="صيانة مفتوحة"
          value={stats.maintenance.open_count}
          sublabel="قيد التنفيذ أو مجدولة"
          icon={Wrench}
          tone={stats.maintenance.open_count > 0 ? "warning" : "neutral"}
        />
        <StatCard
          label="أصناف منخفضة المخزون"
          value={stats.inventory.low_stock.length}
          sublabel={`من أصل ${stats.inventory.total} صنفاً`}
          icon={Package}
          tone={stats.inventory.low_stock.length > 0 ? "danger" : "neutral"}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="حالة المركبات">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={vehicleData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
              >
                {vehicleData.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "#94a3b8"} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="الموظفون حسب الوردية">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={shiftData} layout="vertical" margin={{ left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" />
              <Tooltip />
              <Bar dataKey="value" fill="#b91c1c" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="متوسط التقييمات الشهري">
          {monthlyAvg.length === 0 ? (
            <EmptyChart message="لا توجد تقييمات بعد" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={monthlyAvg}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="period" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Line type="monotone" dataKey="average" stroke="#b91c1c" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="تكاليف الصيانة (6 أشهر)">
          {monthlyCosts.length === 0 ? (
            <EmptyChart message="لا توجد بيانات صيانة" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthlyCosts}>
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
                  fill="#b91c1c"
                  fillOpacity={0.4}
                />
                <Area
                  type="monotone"
                  dataKey="مبنى"
                  stackId="1"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.4}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
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

        <AttentionCard
          title="شهادات تنتهي قريباً"
          empty="لا شهادات تنتهي خلال 60 يوماً"
          items={stats.attention.expiring_certs.slice(0, 5).map((c, i) => (
            <li key={i} className="flex items-center justify-between gap-3 py-2">
              <div className="min-w-0 flex-1">
                <Link
                  to={`/employees/${c.employee_id}`}
                  className="block truncate font-medium text-slate-900 hover:underline"
                >
                  {c.employee_name}
                </Link>
                <p className="truncate text-xs text-slate-500">{c.cert_name}</p>
              </div>
              <Badge tone={c.days_until <= 15 ? "danger" : "warning"}>
                {c.days_until} يوم
              </Badge>
            </li>
          ))}
        />

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
      </section>
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
    <div className="flex h-[240px] items-center justify-center text-sm text-slate-500">
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
