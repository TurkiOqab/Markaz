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
  specialty_score: number;
  discipline_score: number;
  fitness_score: number;
  appearance_score: number;
  total: number;
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
  rating_score: number | null;
  certifications_count: number;
  certification_names: string[];
  proxy_balance: number;
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

export type VehicleType =
  | "كوماندر(مزدوجة)"
  | "بروبلين"
  | "ونش"
  | "عربة الانارة"
  | "جيب التدخل السريع"
  | "اسعاف"
  | "شاص الاطفاء في المواقع الجبلية"
  | "صهريج"
  | "سيارة الأنذار"
  | "قارب"
  | "سيارة السلالم"
  | "عربة الشيول"
  // Legacy values — kept so existing DB rows still typecheck; not offered in the UI dropdown.
  | "إطفاء"
  | "إسعاف"
  | "سلم"
  | "قيادة"
  | "إنقاذ";
export type VehicleStatus = "في الخدمة" | "خارج الخدمة" | "صيانة";
export type VehicleLine = "الأول" | "الثاني";
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
  line: VehicleLine;
  yard_x: number | null;
  yard_y: number | null;
  driver_id: number | null;
  driver_name: string | null;
  photo_path: string | null;
  equipment_count: number;
  open_maintenance_count: number;
  last_inspection_date: string | null;
  last_inspection_result: InspectionResult | null;
}

export interface Vehicle {
  id: number;
  type: VehicleType;
  plate_number: string;
  status: VehicleStatus;
  line: VehicleLine;
  driver_id: number | null;
  photo_path: string | null;
  created_at: string;
  updated_at: string;
  maintenance: VehicleMaintenance[];
  equipment: VehicleOnboardEquipment[];
  inspections: VehicleInspection[];
}

// ---------- Building ----------

export type RoomType = "غرفة نوم" | "مكتب" | "قاعة تدريس" | "مرفق";
export type RoomStatus = "جاهزة" | "صيانة";

export interface Building {
  id: number;
  name: string;
  address: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: number;
  type: RoomType;
  name: string;
  capacity: number;
  status: RoomStatus;
  notes: string | null;
}

export interface InventoryItem {
  id: number;
  item_name: string;
  category: string;
  quantity: number;
  location: string;
  min_threshold: number;
  notes: string | null;
}

export interface BuildingMaintenance {
  id: number;
  date: string;
  description: string;
  cost: number;
  contractor: string;
  status: MaintenanceStatus;
}

export interface BuildingReport {
  id: number;
  date: string;
  title: string;
  summary: string;
  file_path: string | null;
}

// ---------- Incidents ----------

export type IncidentType = "حريق" | "إنقاذ" | "إسعاف" | "أخرى";
export type IncidentSeverity = "بسيط" | "متوسط" | "خطير" | "كارثي";

export interface IncidentTeamRow {
  team_type: string;
  name_code: string;
  departure_time: string;
  arrival_time: string;
  return_time: string;
}

export interface IncidentDetails {
  // Section 1
  receiving_entity?: string;
  report_date?: string;
  report_time?: string;
  classification_main?: string;
  classification_sub?: string;
  reporter_nationality?: string;
  reporter_age?: string;
  reporter_id?: string;
  reporter_workplace?: string;
  contact_method?: string;
  contact_phone?: string;
  // Section 2
  place_category?: string;
  place_subtype?: string;
  location_region?: string;
  location_city?: string;
  location_governorate?: string;
  location_center?: string;
  location_district?: string;
  location_main_street?: string;
  weather_conditions?: string[];
  weather_other?: string;
  site_info?: string[];
  site_info_other?: string;
  license_status?: string;
  license_number?: string;
  license_date?: string;
  // Section 3
  dispatched_teams?: IncidentTeamRow[];
  support_teams?: IncidentTeamRow[];
  participating_agencies?: string[];
  agencies_other?: string;
  operation_summary?: string;
}

export type IncidentStatus = "مكتمل" | "غير مكتمل";

export interface Incident {
  id: number;
  occurred_at: string;
  type: IncidentType;
  severity?: IncidentSeverity;
  location: string;
  description: string;
  response_minutes: number | null;
  duration_minutes: number | null;
  personnel_count: number | null;
  vehicles_dispatched: string | null;
  outcome: string | null;
  reporter_name: string | null;
  notes: string | null;
  status: IncidentStatus;
  details: IncidentDetails | null;
  latitude: number | null;
  longitude: number | null;
}

// ---------- Proxies ----------

export interface Proxy {
  id: number;
  delegator_id: number;
  substitute_id: number;
  delegator_name: string;
  substitute_name: string;
  delegator_team: string | null;
  substitute_team: string | null;
  shift_date: string;
  coverage_date: string | null;
  reason: string | null;
  settled: boolean;
  settled_date: string | null;
  created_at: string | null;
}

export interface ProxyBalance {
  substitute_id: number;
  substitute_name: string;
  team_name: string | null;
  count: number;
}

export interface ProxyBalances {
  items: ProxyBalance[];
  total_pending: number;
  unique_substitutes: number;
}

// ---------- Roll Call (التكميل) ----------

export interface RollCall {
  id: number;
  date: string;
  team: string;
  total_force: number;
  firefighters: number;
  drivers: number;
  divers: number;
  trainers: number;
  on_mission: number;
  absent: number;
  suspended: number;
  catering: number;
  present_count: number;
}

export interface RollCallInput {
  team: string;
  total_force: number;
  firefighters: number;
  drivers: number;
  divers: number;
  trainers: number;
  on_mission: number;
  absent: number;
  suspended: number;
  catering: number;
}

// ---------- Drills (الزيارات والفرضيات) ----------

export type DrillKind = "زيارة" | "فرضية" | "جولة ميدانية";

export interface PrepStage {
  label: string;
  completed: boolean;
  completed_at: string | null;
}

export interface Drill {
  id: number;
  kind: DrillKind;
  title: string;
  scheduled_at: string;
  completed: boolean;
  completed_at: string | null;
  notes: string | null;
  prep_stages: PrepStage[];
}

export interface DrillCreateInput {
  kind: DrillKind;
  title: string;
  scheduled_at: string;
  notes?: string | null;
  prep_stages?: PrepStage[];
}
