import { api } from "./client";
import type { Proxy, ProxyBalances } from "../types/models";

export interface ProxyCreateInput {
  delegator_id: number;
  substitute_id: number;
  shift_date: string;
  coverage_date?: string | null;
  reason?: string | null;
}

export function listProxies() {
  return api.get<{ items: Proxy[]; total: number }>("/api/proxies");
}

export function listProxyBalances() {
  return api.get<ProxyBalances>("/api/proxies/balances");
}

export function createProxy(input: ProxyCreateInput) {
  return api.post<Proxy>("/api/proxies", input);
}

export interface ProxyUpdateInput {
  delegator_id?: number;
  substitute_id?: number;
  shift_date?: string;
  coverage_date?: string | null;
  reason?: string | null;
}

export function updateProxy(id: number, input: ProxyUpdateInput) {
  return api.patch<Proxy>(`/api/proxies/${id}`, input);
}

export function settleProxy(id: number) {
  return api.patch<Proxy>(`/api/proxies/${id}/settle`);
}

export function deleteProxy(id: number) {
  return api.del<void>(`/api/proxies/${id}`);
}

export const PROXIES_CHANGED_EVENT = "markaz:proxies-changed";

export function notifyProxiesChanged() {
  window.dispatchEvent(new Event(PROXIES_CHANGED_EVENT));
}
