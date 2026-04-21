import type {
  EquipmentCondition,
  MaritalStatus,
  PhysicalAbility,
  Shift,
} from "../types/models";

export const MARITAL_STATUSES: MaritalStatus[] = ["أعزب", "متزوج", "مطلق", "أرمل"];
export const PHYSICAL_ABILITIES: PhysicalAbility[] = ["ممتاز", "جيد جداً", "جيد", "مقبول"];
export const SHIFTS: Shift[] = ["صباحية", "مسائية", "ليلية"];
export const EQUIPMENT_CONDITIONS: EquipmentCondition[] = ["ممتاز", "جيد", "متوسط", "تالف"];

export const RATING_MIN = 0;
export const RATING_MAX = 5;
