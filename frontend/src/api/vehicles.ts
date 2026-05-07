import { api } from "./client";
import type {
  PagedResponse,
  Vehicle,
  VehicleInspection,
  VehicleMaintenance,
  VehicleOnboardEquipment,
  VehicleStatus,
  VehicleSummary,
  VehicleType,
} from "../types/models";

export interface VehicleListParams {
  q?: string;
  type?: VehicleType;
  status?: VehicleStatus;
  page?: number;
  page_size?: number;
}

function queryString(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (entries.length === 0) return "";
  const qs = entries
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return `?${qs}`;
}

export function listVehicles(params: VehicleListParams = {}) {
  return api.get<PagedResponse<VehicleSummary>>(`/api/vehicles${queryString({ ...params })}`);
}

export function getVehicle(id: number) {
  return api.get<Vehicle>(`/api/vehicles/${id}`);
}

export type VehicleCreateInput = Pick<
  Vehicle,
  "type" | "plate_number" | "status" | "line" | "driver_id"
>;

export interface VehicleYardPosition {
  yard_x?: number | null;
  yard_y?: number | null;
}

export function updateVehicleYard(id: number, pos: VehicleYardPosition) {
  return api.patch<Vehicle>(`/api/vehicles/${id}`, pos);
}

export function createVehicle(input: VehicleCreateInput) {
  return api.post<Vehicle>("/api/vehicles", input);
}

export function updateVehicle(id: number, input: Partial<VehicleCreateInput>) {
  return api.patch<Vehicle>(`/api/vehicles/${id}`, input);
}

export function deleteVehicle(id: number) {
  return api.del<void>(`/api/vehicles/${id}`);
}

export async function uploadVehiclePhoto(id: number, file: File): Promise<Vehicle> {
  const form = new FormData();
  form.append("file", file);
  return api.post<Vehicle>(`/api/vehicles/${id}/photo`, form);
}

// ---------- Maintenance ----------

export type MaintenanceInput = Omit<VehicleMaintenance, "id">;

export function listMaintenance(vehicleId: number) {
  return api.get<PagedResponse<VehicleMaintenance>>(`/api/vehicles/${vehicleId}/maintenance`);
}
export function createMaintenance(vehicleId: number, input: MaintenanceInput) {
  return api.post<VehicleMaintenance>(`/api/vehicles/${vehicleId}/maintenance`, input);
}
export function updateMaintenance(
  vehicleId: number,
  maintenanceId: number,
  input: Partial<MaintenanceInput>,
) {
  return api.patch<VehicleMaintenance>(
    `/api/vehicles/${vehicleId}/maintenance/${maintenanceId}`,
    input,
  );
}
export function deleteMaintenance(vehicleId: number, maintenanceId: number) {
  return api.del<void>(`/api/vehicles/${vehicleId}/maintenance/${maintenanceId}`);
}

// ---------- Onboard equipment ----------

export type VehicleEquipmentInput = Omit<VehicleOnboardEquipment, "id">;

export function listVehicleEquipment(vehicleId: number) {
  return api.get<PagedResponse<VehicleOnboardEquipment>>(
    `/api/vehicles/${vehicleId}/equipment`,
  );
}
export function createVehicleEquipment(vehicleId: number, input: VehicleEquipmentInput) {
  return api.post<VehicleOnboardEquipment>(`/api/vehicles/${vehicleId}/equipment`, input);
}
export function updateVehicleEquipment(
  vehicleId: number,
  equipmentId: number,
  input: Partial<VehicleEquipmentInput>,
) {
  return api.patch<VehicleOnboardEquipment>(
    `/api/vehicles/${vehicleId}/equipment/${equipmentId}`,
    input,
  );
}
export function deleteVehicleEquipment(vehicleId: number, equipmentId: number) {
  return api.del<void>(`/api/vehicles/${vehicleId}/equipment/${equipmentId}`);
}

// ---------- Inspections ----------

export type InspectionInput = Omit<VehicleInspection, "id">;

export function listInspections(vehicleId: number) {
  return api.get<PagedResponse<VehicleInspection>>(`/api/vehicles/${vehicleId}/inspections`);
}
export function createInspection(vehicleId: number, input: InspectionInput) {
  return api.post<VehicleInspection>(`/api/vehicles/${vehicleId}/inspections`, input);
}
export function updateInspection(
  vehicleId: number,
  inspectionId: number,
  input: Partial<InspectionInput>,
) {
  return api.patch<VehicleInspection>(
    `/api/vehicles/${vehicleId}/inspections/${inspectionId}`,
    input,
  );
}
export function deleteInspection(vehicleId: number, inspectionId: number) {
  return api.del<void>(`/api/vehicles/${vehicleId}/inspections/${inspectionId}`);
}
