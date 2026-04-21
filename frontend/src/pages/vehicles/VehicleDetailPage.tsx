import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ApiRequestError } from "../../api/client";
import { getVehicle } from "../../api/vehicles";
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

  if (loading) return <p className="text-slate-500">جارِ التحميل...</p>;
  if (notFound) return <Navigate to="/vehicles" replace />;
  if (!vehicle) return null;

  return (
    <div className="space-y-6">
      <header>
        <Link to="/vehicles" className="text-sm text-slate-600 hover:underline">
          ← الرجوع إلى القائمة
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{vehicle.plate_number}</h1>
        <p className="text-sm text-slate-600">
          {vehicle.type} · {vehicle.status}
        </p>
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
