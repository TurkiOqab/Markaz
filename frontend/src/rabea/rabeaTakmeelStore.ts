// Phase-2 frontend-only persistence for Rabea's substitute takmeel. There is
// NO backend (single-station app, mock centers). Substitute submissions are
// stored in localStorage keyed by date+center so they survive a reload and the
// welcome card reflects them. The audit/notification/lock/permission concerns
// from the spec are deferred (no backend); the record below carries the
// distinguishing fields so a future log can render them.

import { todayIso } from "../lib/clock";
import { getTodayTakmeel } from "./takmeelMock";
import type { CenterTakmeel } from "./takmeelMock";

export interface SubstituteFields {
  totalForce: number;
  firefighters: number;
  drivers: number;
  rescue: number;
  divers: number;
  trainers: number;
  onMission: number;
  absent: number;
  suspended: number;
  catering: number;
}

export interface SubstituteRecord {
  centerId: string;
  team: string; // "أ" | "ب" | "ج"
  fields: SubstituteFields;
  presentCount: number; // computed: totalForce - (onMission+absent+suspended+catering)
  note: string;
  submittedBy: "ربيع";
  isSubstitute: true;
  originalResponsible: string;
  locked: true;
  submittedAt: string; // "HH:MM" local
  createdAtIso: string; // full ISO timestamp
}

const KEY_PREFIX = "rabea_substitute_takmeel:";

function keyFor(): string {
  return `${KEY_PREFIX}${todayIso()}`;
}

function readAll(): Record<string, SubstituteRecord> {
  try {
    const raw = localStorage.getItem(keyFor());
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, SubstituteRecord>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/** Substitute record saved today for a center, if any. */
export function getSubstituteRecord(centerId: string): SubstituteRecord | null {
  return readAll()[centerId] ?? null;
}

/** Persist a substitute takmeel for today (overwrites any prior for that center). */
export function saveSubstituteTakmeel(record: SubstituteRecord): void {
  try {
    const all = readAll();
    all[record.centerId] = record;
    localStorage.setItem(keyFor(), JSON.stringify(all));
  } catch {
    // localStorage unavailable (private mode) — best-effort, like the rabea
    // session flag. The in-session UI still reflects the save via re-render.
  }
}

/**
 * Today's centers = the static mock, but any center with a persisted
 * substitute record for today is marked submitted at the record's time.
 */
export function getTodayCenters(): CenterTakmeel[] {
  const subs = readAll();
  return getTodayTakmeel().map((c) => {
    const rec = subs[c.id];
    return rec ? { ...c, submittedAt: rec.submittedAt } : c;
  });
}

/** Centers that still have NOT submitted today (no base time, no substitute). */
export function getPendingCenters(): CenterTakmeel[] {
  return getTodayCenters().filter((c) => c.submittedAt === null);
}
