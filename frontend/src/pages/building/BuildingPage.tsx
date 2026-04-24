import { Building2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ApiRequestError } from "../../api/client";
import { getBuilding } from "../../api/building";
import { PageHeader } from "../../components/PageHeader";
import type { Building } from "../../types/models";
import { InventoryTab } from "./tabs/InventoryTab";
import { MainInfoTab } from "./tabs/MainInfoTab";
import { MaintenanceTab } from "./tabs/MaintenanceTab";
import { ReportsTab } from "./tabs/ReportsTab";
import { RoomsTab } from "./tabs/RoomsTab";

export type BuildingTabKey = "main" | "rooms" | "inventory" | "maintenance" | "reports";

const TABS: Array<{ key: BuildingTabKey; label: string }> = [
  { key: "main", label: "المعلومات الأساسية" },
  { key: "rooms", label: "الغرف" },
  { key: "inventory", label: "المخزون" },
  { key: "maintenance", label: "الصيانة" },
  { key: "reports", label: "التقارير" },
];

export function BuildingPage() {
  const [building, setBuilding] = useState<Building | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<BuildingTabKey>("main");

  useEffect(() => {
    getBuilding()
      .then((b) => {
        setBuilding(b);
        setLoading(false);
      })
      .catch((err) => {
        toast.error(err instanceof ApiRequestError ? err.message : "فشل تحميل المبنى");
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-slate-500">جارِ التحميل...</p>;
  if (!building) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="المبنى"
        subtitle="إدارة معلومات المبنى ومرافقه"
        icon={Building2}
        iconTone="emerald"
      />

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
        <MainInfoTab
          building={building}
          onUpdated={setBuilding}
          onNavigate={setTab}
        />
      ) : tab === "rooms" ? (
        <RoomsTab />
      ) : tab === "inventory" ? (
        <InventoryTab />
      ) : tab === "maintenance" ? (
        <MaintenanceTab />
      ) : (
        <ReportsTab />
      )}
    </div>
  );
}
