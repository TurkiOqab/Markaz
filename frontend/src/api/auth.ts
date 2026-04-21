import { api } from "./client";

export interface AuthStatus {
  setup_complete: boolean;
  authenticated: boolean;
}

export function fetchAuthStatus() {
  return api.get<AuthStatus>("/api/auth/status");
}

export function setupChief(username: string, password: string) {
  return api.post<{ ok: boolean }>("/api/setup", { username, password });
}

export function login(username: string, password: string) {
  return api.post<{ ok: boolean }>("/api/auth/login", { username, password });
}

export function logout() {
  return api.post<{ ok: boolean }>("/api/auth/logout");
}
