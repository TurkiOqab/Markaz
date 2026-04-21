import { api } from "./client";
import type {
  Certification,
  Employee,
  EmployeeSummary,
  Equipment,
  MonthlyRating,
  PagedResponse,
  Shift,
} from "../types/models";

export interface EmployeeListParams {
  q?: string;
  team_id?: number;
  shift?: Shift;
  page?: number;
  page_size?: number;
}

function queryString(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (entries.length === 0) return "";
  const qs = entries
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return `?${qs}`;
}

export function listEmployees(params: EmployeeListParams = {}) {
  return api.get<PagedResponse<EmployeeSummary>>(`/api/employees${queryString(params)}`);
}

export function getEmployee(id: number) {
  return api.get<Employee>(`/api/employees/${id}`);
}

export type EmployeeCreateInput = Omit<
  Employee,
  | "id"
  | "photo_path"
  | "created_at"
  | "updated_at"
  | "certifications"
  | "equipment"
  | "monthly_ratings"
>;

export function createEmployee(input: EmployeeCreateInput) {
  return api.post<Employee>("/api/employees", input);
}

export function updateEmployee(id: number, input: Partial<EmployeeCreateInput>) {
  return api.patch<Employee>(`/api/employees/${id}`, input);
}

export function deleteEmployee(id: number) {
  return api.del<void>(`/api/employees/${id}`);
}

export async function uploadEmployeePhoto(id: number, file: File): Promise<Employee> {
  const form = new FormData();
  form.append("file", file);
  return api.post<Employee>(`/api/employees/${id}/photo`, form);
}

// ---------- Nested: certifications ----------

export type CertificationInput = Omit<Certification, "id">;

export function listCertifications(employeeId: number) {
  return api.get<PagedResponse<Certification>>(`/api/employees/${employeeId}/certifications`);
}
export function createCertification(employeeId: number, input: CertificationInput) {
  return api.post<Certification>(`/api/employees/${employeeId}/certifications`, input);
}
export function updateCertification(
  employeeId: number,
  certId: number,
  input: Partial<CertificationInput>,
) {
  return api.patch<Certification>(
    `/api/employees/${employeeId}/certifications/${certId}`,
    input,
  );
}
export function deleteCertification(employeeId: number, certId: number) {
  return api.del<void>(`/api/employees/${employeeId}/certifications/${certId}`);
}

// ---------- Nested: equipment ----------

export type EquipmentInput = Omit<Equipment, "id">;

export function listEmployeeEquipment(employeeId: number) {
  return api.get<PagedResponse<Equipment>>(`/api/employees/${employeeId}/equipment`);
}
export function createEmployeeEquipment(employeeId: number, input: EquipmentInput) {
  return api.post<Equipment>(`/api/employees/${employeeId}/equipment`, input);
}
export function updateEmployeeEquipment(
  employeeId: number,
  eqId: number,
  input: Partial<EquipmentInput>,
) {
  return api.patch<Equipment>(`/api/employees/${employeeId}/equipment/${eqId}`, input);
}
export function deleteEmployeeEquipment(employeeId: number, eqId: number) {
  return api.del<void>(`/api/employees/${employeeId}/equipment/${eqId}`);
}

// ---------- Nested: monthly ratings ----------

export type RatingInput = Omit<MonthlyRating, "id">;

export function listRatings(employeeId: number) {
  return api.get<PagedResponse<MonthlyRating>>(`/api/employees/${employeeId}/ratings`);
}
export function createRating(employeeId: number, input: RatingInput) {
  return api.post<MonthlyRating>(`/api/employees/${employeeId}/ratings`, input);
}
export function updateRating(employeeId: number, ratingId: number, input: Partial<RatingInput>) {
  return api.patch<MonthlyRating>(`/api/employees/${employeeId}/ratings/${ratingId}`, input);
}
export function deleteRating(employeeId: number, ratingId: number) {
  return api.del<void>(`/api/employees/${employeeId}/ratings/${ratingId}`);
}
