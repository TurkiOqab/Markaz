import type {
  EquipmentCondition,
  InspectionResult,
  MaintenanceStatus,
  MaritalStatus,
  PhysicalAbility,
  Shift,
  VehicleStatus,
  VehicleType,
} from "../types/models";

export const MARITAL_STATUSES: MaritalStatus[] = ["أعزب", "متزوج", "مطلق", "أرمل"];
export const PHYSICAL_ABILITIES: PhysicalAbility[] = ["ممتاز", "جيد جداً", "جيد", "مقبول"];
export const SHIFTS: Shift[] = ["صباحية", "مسائية", "ليلية"];
export const EQUIPMENT_CONDITIONS: EquipmentCondition[] = ["ممتاز", "جيد", "متوسط", "تالف"];

export const VEHICLE_TYPES: VehicleType[] = ["إطفاء", "إسعاف", "سلم", "قيادة", "إنقاذ"];
export const VEHICLE_STATUSES: VehicleStatus[] = ["في الخدمة", "خارج الخدمة", "صيانة"];
export const MAINTENANCE_STATUSES: MaintenanceStatus[] = [
  "مكتمل",
  "قيد التنفيذ",
  "مجدول",
  "ملغي",
];
export const INSPECTION_RESULTS: InspectionResult[] = ["ناجح", "يحتاج صيانة", "غير صالح"];

export const RATING_MIN = 0;
export const RATING_MAX = 5;
