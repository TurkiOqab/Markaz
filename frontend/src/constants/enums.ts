import type {
  EquipmentCondition,
  IncidentType,
  InspectionResult,
  MaintenanceStatus,
  MaritalStatus,
  PhysicalAbility,
  RoomStatus,
  RoomType,
  VehicleStatus,
  VehicleType,
} from "../types/models";

export const MARITAL_STATUSES: MaritalStatus[] = ["أعزب", "متزوج", "مطلق", "أرمل"];
export const PHYSICAL_ABILITIES: PhysicalAbility[] = ["ممتاز", "جيد جداً", "جيد", "مقبول"];
export const EQUIPMENT_CONDITIONS: EquipmentCondition[] = ["ممتاز", "جيد", "متوسط", "تالف"];

export const VEHICLE_TYPES: VehicleType[] = [
  "كوماندر(مزدوجة)",
  "بروبلين",
  "ونش",
  "عربة الانارة",
  "جيب التدخل السريع",
  "اسعاف",
  "شاص الاطفاء في المواقع الجبلية",
  "صهريج",
  "سيارة الأنذار",
  "قارب",
  "سيارة السلالم",
  "عربة الشيول",
];
export const VEHICLE_STATUSES: VehicleStatus[] = ["في الخدمة", "خارج الخدمة", "صيانة"];
export const VEHICLE_LINES = ["الأول", "الثاني"] as const;
export const MAINTENANCE_STATUSES: MaintenanceStatus[] = [
  "مكتمل",
  "قيد التنفيذ",
  "مجدول",
  "ملغي",
];
export const INSPECTION_RESULTS: InspectionResult[] = ["ناجح", "يحتاج صيانة", "غير صالح"];

export const ROOM_TYPES: RoomType[] = ["غرفة نوم", "مكتب", "قاعة تدريس", "مرفق"];
export const ROOM_STATUSES: RoomStatus[] = ["جاهزة", "صيانة"];

export const RATING_AXIS_MIN = 0;
export const RATING_AXIS_MAX = 25;
export const RATING_TOTAL_MAX = 100;
export const RATING_AXES = [
  { key: "specialty_score", label: "التخصص" },
  { key: "discipline_score", label: "الانضباط" },
  { key: "fitness_score", label: "اللياقة" },
  { key: "appearance_score", label: "القيافة" },
] as const;
export type RatingAxisKey = (typeof RATING_AXES)[number]["key"];

export const INCIDENT_TYPES: IncidentType[] = [
  "حريق",
  "إنقاذ",
  "إسعاف",
  "أخرى",
];
