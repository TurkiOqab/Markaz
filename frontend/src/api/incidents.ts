import { api } from "./client";
import type { Incident, IncidentType, PagedResponse } from "../types/models";

export interface IncidentListParams {
  type?: IncidentType;
  status?: string;
  page?: number;
  page_size?: number;
}

function queryString(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (entries.length === 0) return "";
  return (
    "?" +
    entries
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join("&")
  );
}

export type IncidentInput = Omit<Incident, "id">;

export function listIncidents(params: IncidentListParams = {}) {
  return api.get<PagedResponse<Incident>>(`/api/incidents${queryString({ ...params })}`);
}
export function getIncident(id: number) {
  return api.get<Incident>(`/api/incidents/${id}`);
}
export function createIncident(input: IncidentInput) {
  return api.post<Incident>("/api/incidents", input);
}
export function updateIncident(id: number, input: Partial<IncidentInput>) {
  return api.patch<Incident>(`/api/incidents/${id}`, input);
}
export function deleteIncident(id: number) {
  return api.del<void>(`/api/incidents/${id}`);
}
