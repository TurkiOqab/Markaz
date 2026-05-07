import { api } from "./client";
import type { RollCall, RollCallInput } from "../types/models";

export function getTodayRollCall() {
  return api.get<RollCall | null>("/api/roll-calls/today");
}

export function upsertTodayRollCall(input: RollCallInput) {
  return api.put<RollCall>("/api/roll-calls/today", input);
}
