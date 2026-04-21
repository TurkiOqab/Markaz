// Shape mirrors the backend Pydantic `*Out` schemas.

export interface Team {
  id: number;
  name: string;
  description: string | null;
}

export type MaritalStatus = "أعزب" | "متزوج" | "مطلق" | "أرمل";
export type PhysicalAbility = "ممتاز" | "جيد جداً" | "جيد" | "مقبول";
export type Shift = "صباحية" | "مسائية" | "ليلية";
export type EquipmentCondition = "ممتاز" | "جيد" | "متوسط" | "تالف";

export interface Certification {
  id: number;
  name: string;
  issuing_authority: string;
  issue_date: string;
  expiry_date: string;
}

export interface Equipment {
  id: number;
  item_name: string;
  serial_number: string | null;
  assigned_date: string;
  condition: EquipmentCondition;
}

export interface MonthlyRating {
  id: number;
  year: number;
  month: number;
  rating: number;
  notes: string | null;
}

export interface EmployeeSummary {
  id: number;
  name: string;
  rank: string;
  specialty: string;
  national_id: string;
  photo_path: string | null;
  team_id: number;
  shift: Shift;
}

export interface Employee {
  id: number;
  name: string;
  rank: string;
  specialty: string;
  date_of_birth: string;
  marital_status: MaritalStatus;
  physical_ability: PhysicalAbility;
  national_id: string;
  photo_path: string | null;
  phone: string;
  email: string | null;
  team_id: number;
  shift: Shift;
  created_at: string;
  updated_at: string;
  certifications: Certification[];
  equipment: Equipment[];
  monthly_ratings: MonthlyRating[];
}

export interface PagedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

// ---------- Vehicles ----------

export type VehicleType = "إطفاء" | "إسعاف" | "سلم" | "قيادة" | "إنقاذ";
export type VehicleStatus = "في الخدمة" | "خارج الخدمة" | "صيانة";
export type MaintenanceStatus = "مكتمل" | "قيد التنفيذ" | "مجدول" | "ملغي";
export type InspectionResult = "ناجح" | "يحتاج صيانة" | "غير صالح";

export interface VehicleMaintenance {
  id: number;
  date: string;
  description: string;
  cost: number;
  contractor: string;
  status: MaintenanceStatus;
}

export interface VehicleOnboardEquipment {
  id: number;
  item_name: string;
  quantity: number;
  condition: EquipmentCondition;
}

export interface VehicleInspection {
  id: number;
  inspection_date: string;
  inspector_name: string;
  result: InspectionResult;
  notes: string | null;
}

export interface VehicleSummary {
  id: number;
  type: VehicleType;
  plate_number: string;
  status: VehicleStatus;
  driver_id: number | null;
  photo_path: string | null;
}

export interface Vehicle {
  id: number;
  type: VehicleType;
  plate_number: string;
  status: VehicleStatus;
  driver_id: number | null;
  photo_path: string | null;
  created_at: string;
  updated_at: string;
  maintenance: VehicleMaintenance[];
  equipment: VehicleOnboardEquipment[];
  inspections: VehicleInspection[];
}
