import { Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ApiRequestError } from "../../api/client";
import { getVehicle } from "../../api/vehicles";
import { Loader } from "../../components/Loader";
import { PageHeader } from "../../components/PageHeader";
import type { Vehicle } from "../../types/models";
import { EquipmentTab } from "./tabs/EquipmentTab";
import { InspectionsTab } from "./tabs/InspectionsTab";
import { MainInfoTab } from "./tabs/MainInfoTab";
import { MaintenanceTab } from "./tabs/MaintenanceTab";

type TabKey = "main" | "maintenance" | "equipment" | "inspections";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "main", label: "المعلومات الأساسية" },
  { key: "maintenance", label: "الصيانة" },
  { key: "equipment", label: "المعدات" },
  { key: "inspections", label: "الفحوصات" },
];

export function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const vehicleId = id ? Number(id) : NaN;
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<TabKey>("main");

  useEffect(() => {
    if (Number.isNaN(vehicleId)) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    getVehicle(vehicleId)
      .then((v) => {
        setVehicle(v);
        setLoading(false);
      })
      .catch((err) => {
        if (err instanceof ApiRequestError && err.status === 404) {
          setNotFound(true);
        } else {
          toast.error(err instanceof ApiRequestError ? err.message : "فشل تحميل المركبة");
        }
        setLoading(false);
      });
  }, [vehicleId]);

  if (loading) return <Loader />;
  if (notFound) return <Navigate to="/vehicles" replace />;
  if (!vehicle) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={vehicle.plate_number}
        subtitle={`${vehicle.type} · ${vehicle.status}`}
        icon={Truck}
        iconTone="amber"
        backLink={{ to: "/vehicles", label: "الرجوع إلى القائمة" }}
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
        <MainInfoTab vehicle={vehicle} onUpdated={setVehicle} />
      ) : tab === "maintenance" ? (
        <MaintenanceTab vehicleId={vehicle.id} />
      ) : tab === "equipment" ? (
        <EquipmentTab vehicleId={vehicle.id} />
      ) : (
        <InspectionsTab vehicleId={vehicle.id} />
      )}
    </div>
  );
}
