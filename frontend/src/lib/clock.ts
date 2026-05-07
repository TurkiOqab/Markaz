// Single source of truth for "today" across the UI. Set OVERRIDE to a fixed
// date for demos / screenshots; set it to `null` to use the real system clock.

const OVERRIDE: Date | null = null; // set to a Date object to fix "today" for demos

export function today(): Date {
  return OVERRIDE ? new Date(OVERRIDE.getTime()) : new Date();
}

export function todayMidnight(): Date {
  const d = today();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function todayIso(): string {
  const d = today();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function nowIsoLocalMinute(): string {
  const d = today();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function nowTimeHHMM(): string {
  const d = today();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
