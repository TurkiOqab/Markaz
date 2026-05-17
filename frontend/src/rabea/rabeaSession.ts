// Phase-1 Rabea (operations division) gate. Frontend-only: REB9 is NOT a real
// backend account. The password living in source is an accepted phase-1
// tradeoff for a local single-user app (see design spec 2026-05-17).

export const RABEA_USERNAME = "REB9";
export const RABEA_PASSWORD = "1234567891";

const FLAG_KEY = "injaz_rabea_mode";

export function setRabeaMode(on: boolean): void {
  try {
    if (on) sessionStorage.setItem(FLAG_KEY, "1");
    else sessionStorage.removeItem(FLAG_KEY);
  } catch {
    // sessionStorage unavailable (private mode / SSR) — gate is best-effort.
  }
}

export function isRabeaMode(): boolean {
  try {
    return sessionStorage.getItem(FLAG_KEY) === "1";
  } catch {
    return false;
  }
}
