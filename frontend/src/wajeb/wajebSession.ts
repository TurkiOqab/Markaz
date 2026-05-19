// Phase-1 Wajeb (duty officer) gate. Frontend-only: WAJEB1 is NOT a real
// backend account — same accepted tradeoff as the Rabea gate (local
// single-station app). The credential lives in source by design.

export const WAJEB_USERNAME = "WAJEB1";
export const WAJEB_PASSWORD = "1234567891";

const FLAG_KEY = "injaz_wajeb_mode";

export function setWajebMode(on: boolean): void {
  try {
    if (on) sessionStorage.setItem(FLAG_KEY, "1");
    else sessionStorage.removeItem(FLAG_KEY);
  } catch {
    // sessionStorage unavailable (private mode / SSR) — gate is best-effort.
  }
}

export function isWajebMode(): boolean {
  try {
    return sessionStorage.getItem(FLAG_KEY) === "1";
  } catch {
    return false;
  }
}
