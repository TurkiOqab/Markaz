import { api } from "./client";
import type { PagedResponse, Team } from "../types/models";

export function listTeams() {
  return api.get<PagedResponse<Team>>("/api/teams");
}
