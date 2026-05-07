import { api } from "./client";
import type { Drill, DrillCreateInput } from "../types/models";

export function listDrills() {
  return api.get<{ items: Drill[]; total: number }>("/api/drills");
}

export function createDrill(input: DrillCreateInput) {
  return api.post<Drill>("/api/drills", input);
}

export function updateDrill(id: number, input: Partial<DrillCreateInput> & { completed?: boolean }) {
  return api.patch<Drill>(`/api/drills/${id}`, input);
}

export function deleteDrill(id: number) {
  return api.del<void>(`/api/drills/${id}`);
}

// Cross-component bus so NextDrillCard refreshes when DrillsCard mutates.
export const DRILLS_CHANGED_EVENT = "markaz:drills-changed";

export function notifyDrillsChanged() {
  window.dispatchEvent(new Event(DRILLS_CHANGED_EVENT));
}
