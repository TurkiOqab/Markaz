import { api } from "./client";
import type { DashboardStats } from "../types/dashboard";

export function fetchDashboardStats() {
  return api.get<DashboardStats>("/api/dashboard/stats");
}
