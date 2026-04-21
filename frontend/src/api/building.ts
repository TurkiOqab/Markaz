import { api } from "./client";
import type {
  Building,
  BuildingMaintenance,
  BuildingReport,
  InventoryItem,
  PagedResponse,
  Room,
} from "../types/models";

// ---------- Singleton ----------

export function getBuilding() {
  return api.get<Building>("/api/building");
}

export type BuildingUpdateInput = Partial<Pick<Building, "name" | "address" | "notes">>;

export function updateBuilding(input: BuildingUpdateInput) {
  return api.patch<Building>("/api/building", input);
}

// ---------- Rooms ----------

export type RoomInput = Omit<Room, "id">;

export function listRooms() {
  return api.get<PagedResponse<Room>>("/api/building/rooms");
}
export function createRoom(input: RoomInput) {
  return api.post<Room>("/api/building/rooms", input);
}
export function updateRoom(id: number, input: Partial<RoomInput>) {
  return api.patch<Room>(`/api/building/rooms/${id}`, input);
}
export function deleteRoom(id: number) {
  return api.del<void>(`/api/building/rooms/${id}`);
}

// ---------- Inventory ----------

export type InventoryInput = Omit<InventoryItem, "id">;

export function listInventory() {
  return api.get<PagedResponse<InventoryItem>>("/api/building/inventory");
}
export function createInventory(input: InventoryInput) {
  return api.post<InventoryItem>("/api/building/inventory", input);
}
export function updateInventory(id: number, input: Partial<InventoryInput>) {
  return api.patch<InventoryItem>(`/api/building/inventory/${id}`, input);
}
export function deleteInventory(id: number) {
  return api.del<void>(`/api/building/inventory/${id}`);
}

// ---------- Maintenance ----------

export type BuildingMaintenanceInput = Omit<BuildingMaintenance, "id">;

export function listBuildingMaintenance() {
  return api.get<PagedResponse<BuildingMaintenance>>("/api/building/maintenance");
}
export function createBuildingMaintenance(input: BuildingMaintenanceInput) {
  return api.post<BuildingMaintenance>("/api/building/maintenance", input);
}
export function updateBuildingMaintenance(
  id: number,
  input: Partial<BuildingMaintenanceInput>,
) {
  return api.patch<BuildingMaintenance>(`/api/building/maintenance/${id}`, input);
}
export function deleteBuildingMaintenance(id: number) {
  return api.del<void>(`/api/building/maintenance/${id}`);
}

// ---------- Reports ----------

export type BuildingReportInput = Omit<BuildingReport, "id">;

export function listBuildingReports() {
  return api.get<PagedResponse<BuildingReport>>("/api/building/reports");
}
export function createBuildingReport(input: BuildingReportInput) {
  return api.post<BuildingReport>("/api/building/reports", input);
}
export function updateBuildingReport(id: number, input: Partial<BuildingReportInput>) {
  return api.patch<BuildingReport>(`/api/building/reports/${id}`, input);
}
export function deleteBuildingReport(id: number) {
  return api.del<void>(`/api/building/reports/${id}`);
}
