import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ApiRequestError } from "../../api/client";
import { listEmployees } from "../../api/employees";
import { listVehicles } from "../../api/vehicles";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { SelectField } from "../../components/SelectField";
import { TextField } from "../../components/TextField";
import { VEHICLE_STATUSES, VEHICLE_TYPES } from "../../constants/enums";
import type { EmployeeSummary, VehicleSummary } from "../../types/models";

const PAGE_SIZE = 20;

export function VehiclesListPage() {
  const [vehicles, setVehicles] = useState<VehicleSummary[]>([]);
  const [drivers, setDrivers] = useState<EmployeeSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listEmployees({ page: 1, page_size: 200 })
      .then((res) => setDrivers(res.items))
      .catch(() => toast.error("تعذر تحميل الموظفين"));
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

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white">
        {loading ? (
          <div className="p-8 text-center text-slate-500">جارِ التحميل...</div>
        ) : vehicles.length === 0 ? (
          <EmptyState
            title="لا توجد مركبات"
            description="لم يتم العثور على نتائج، أو لم يتم إضافة مركبة بعد."
            action={
              <Link to="/vehicles/new">
                <Button>إضافة أول مركبة</Button>
              </Link>
            }
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-start font-medium">رقم اللوحة</th>
                <th className="px-4 py-3 text-start font-medium">النوع</th>
                <th className="px-4 py-3 text-start font-medium">الحالة</th>
                <th className="px-4 py-3 text-start font-medium">السائق</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr
                  key={v.id}
                  className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/vehicles/${v.id}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {v.plate_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{v.type}</td>
                  <td className="px-4 py-3 text-slate-700">{v.status}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {v.driver_id ? driverById.get(v.driver_id) ?? "—" : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

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
