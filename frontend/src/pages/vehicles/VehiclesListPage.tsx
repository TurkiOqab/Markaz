import { AlertTriangle, CheckCircle2, Truck, Wrench } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ApiRequestError } from "../../api/client";
import { fetchDashboardStats } from "../../api/dashboard";
import { listEmployees } from "../../api/employees";
import { listVehicles } from "../../api/vehicles";
import { Badge, vehicleStatusTone } from "../../components/Badge";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { SelectField } from "../../components/SelectField";
import { StatCard } from "../../components/StatCard";
import { TextField } from "../../components/TextField";
import { VEHICLE_STATUSES, VEHICLE_TYPES } from "../../constants/enums";
import type { DashboardStats } from "../../types/dashboard";
import type { EmployeeSummary, VehicleSummary } from "../../types/models";

const PAGE_SIZE = 20;

function VehicleThumb({ src }: { src: string | null }) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className="h-14 w-14 rounded-lg border border-slate-200 object-cover"
      />
    );
  }
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
      <Truck size={24} />
    </div>
  );
}

export function VehiclesListPage() {
  const [vehicles, setVehicles] = useState<VehicleSummary[]>([]);
  const [drivers, setDrivers] = useState<EmployeeSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState<DashboardStats["vehicles"] | null>(null);

  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listEmployees({ page: 1, page_size: 200 })
      .then((res) => setDrivers(res.items))
      .catch(() => toast.error("تعذر تحميل الموظفين"));
    fetchDashboardStats()
      .then((s) => setStats(s.vehicles))
      .catch(() => {
        // Silent — list still works without the stat strip values.
      });
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

  const driverById = useMemo(() => new Map(drivers.map((d) => [d.id, d.name])), [drivers]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const inService = stats?.by_status?.["في الخدمة"] ?? 0;
  const maintenance = stats?.by_status?.["صيانة"] ?? 0;
  const outOfService = stats?.by_status?.["خارج الخدمة"] ?? 0;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">المركبات</h1>
          <p className="mt-1 text-sm text-slate-600">إدارة المركبات والصيانة والفحوصات</p>
        </div>
        <Link to="/vehicles/new">
          <Button>إضافة مركبة</Button>
        </Link>
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="إجمالي المركبات"
          value={stats?.total ?? "—"}
          icon={Truck}
          tone="brand"
        />
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
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500">
          جارِ التحميل...
        </div>
      ) : vehicles.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white">
          <EmptyState
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
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => (
            <Link
              key={v.id}
              to={`/vehicles/${v.id}`}
              className="group block rounded-lg border border-slate-200 bg-white p-4 transition hover:border-brand-400 hover:shadow-sm"
            >
              <div className="flex items-start gap-4">
                <VehicleThumb src={v.photo_path} />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-slate-900 group-hover:text-brand-700">
                    {v.plate_number}
                  </h3>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{v.type}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge tone={vehicleStatusTone(v.status)}>{v.status}</Badge>
                    <span className="text-xs text-slate-600">
                      {v.driver_id ? driverById.get(v.driver_id) ?? "—" : "بدون سائق"}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </section>
      )}

      {total > PAGE_SIZE ? (
        <footer className="flex items-center justify-between">
          <p className="text-sm text-slate-600">
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
