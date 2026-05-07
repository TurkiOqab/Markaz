import { api } from "./client";

export type EquipmentSource = "employee" | "vehicle" | "inventory";

export interface UnifiedEquipmentItem {
  id: string;
  source: EquipmentSource;
  item_name: string;
  owner_label: string;
  owner_id: number;
  quantity: number | null;
  condition: string;
  serial_number: string | null;
  assigned_date: string | null;
  category?: string;
  min_threshold?: number;
}

export interface UnifiedEquipmentResponse {
  items: UnifiedEquipmentItem[];
  total: number;
  by_source: Record<EquipmentSource, number>;
}

export function fetchAllEquipment() {
  return api.get<UnifiedEquipmentResponse>("/api/equipment/all");
}
