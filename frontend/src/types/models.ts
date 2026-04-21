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
