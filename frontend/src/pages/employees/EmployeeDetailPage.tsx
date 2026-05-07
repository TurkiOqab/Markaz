import { Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ApiRequestError } from "../../api/client";
import { getEmployee } from "../../api/employees";
import { Loader } from "../../components/Loader";
import { PageHeader } from "../../components/PageHeader";
import type { Employee } from "../../types/models";
import { CertificationsTab } from "./tabs/CertificationsTab";
import { EquipmentTab } from "./tabs/EquipmentTab";
import { MainInfoTab } from "./tabs/MainInfoTab";
import { RatingsTab } from "./tabs/RatingsTab";

export type EmployeeTabKey = "main" | "certs" | "equipment" | "ratings";

const TABS: Array<{ key: EmployeeTabKey; label: string }> = [
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
  const [tab, setTab] = useState<EmployeeTabKey>("main");

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
    return <Loader />;
  }
  if (notFound) {
    return <Navigate to="/employees" replace />;
  }
  if (!employee) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={employee.name}
        subtitle={`${employee.rank} · ${employee.specialty}`}
        icon={Users}
        iconTone="blue"
        backLink={{ to: "/employees", label: "الرجوع إلى القائمة" }}
      />

      <nav className="border-b border-surface-300">
        <ul className="flex gap-6">
          {TABS.map((t) => (
            <li key={t.key}>
              <button
                type="button"
                onClick={() => setTab(t.key)}
                className={`-mb-px border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                  tab === t.key
                    ? "border-surface-900 text-surface-900"
                    : "border-transparent text-surface-500 hover:text-surface-900"
                }`}
              >
                {t.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {tab === "main" ? (
        <MainInfoTab employee={employee} onUpdated={setEmployee} onNavigate={setTab} />
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
