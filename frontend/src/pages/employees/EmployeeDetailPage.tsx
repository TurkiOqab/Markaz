import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ApiRequestError } from "../../api/client";
import { getEmployee } from "../../api/employees";
import type { Employee } from "../../types/models";
import { CertificationsTab } from "./tabs/CertificationsTab";
import { EquipmentTab } from "./tabs/EquipmentTab";
import { MainInfoTab } from "./tabs/MainInfoTab";
import { RatingsTab } from "./tabs/RatingsTab";

type TabKey = "main" | "certs" | "equipment" | "ratings";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "main", label: "المعلومات الأساسية" },
  { key: "certs", label: "الشهادات" },
  { key: "equipment", label: "التجهيزات" },
  { key: "ratings", label: "التقييمات الشهرية" },
];

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const employeeId = id ? Number(id) : NaN;
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<TabKey>("main");

  useEffect(() => {
    if (Number.isNaN(employeeId)) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    getEmployee(employeeId)
      .then((emp) => {
        setEmployee(emp);
        setLoading(false);
      })
      .catch((err) => {
        if (err instanceof ApiRequestError && err.status === 404) {
          setNotFound(true);
        } else {
          toast.error(err instanceof ApiRequestError ? err.message : "فشل تحميل الموظف");
        }
        setLoading(false);
      });
  }, [employeeId]);

  if (loading) {
    return <p className="text-slate-500">جارِ التحميل...</p>;
  }
  if (notFound) {
    return <Navigate to="/employees" replace />;
  }
  if (!employee) return null;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <Link to="/employees" className="text-sm text-slate-600 hover:underline">
            ← الرجوع إلى القائمة
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{employee.name}</h1>
          <p className="text-sm text-slate-600">
            {employee.rank} · {employee.specialty}
          </p>
        </div>
      </header>

      <nav className="border-b border-slate-200">
        <ul className="flex gap-6">
          {TABS.map((t) => (
            <li key={t.key}>
              <button
                type="button"
                onClick={() => setTab(t.key)}
                className={`-mb-px border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                  tab === t.key
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {t.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {tab === "main" ? (
        <MainInfoTab employee={employee} onUpdated={setEmployee} />
      ) : tab === "certs" ? (
        <CertificationsTab employeeId={employee.id} />
      ) : tab === "equipment" ? (
        <EquipmentTab employeeId={employee.id} />
      ) : (
        <RatingsTab employeeId={employee.id} />
      )}
    </div>
  );
}
