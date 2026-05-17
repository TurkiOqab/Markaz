// Static phase-1 takmeel data for Rabea's centers. Single swap point for a
// future real API (design spec 2026-05-17). `submittedAt` is local 24h
// "HH:MM" or null when the center has not submitted. `id` is rendered with
// Arabic-Indic digits by the view layer.

export interface CenterTakmeel {
  id: string;
  region: string;
  responsible: string;
  submittedAt: string | null;
}

export function getTodayTakmeel(): CenterTakmeel[] {
  return [
    { id: "م22", region: "جازان", responsible: "عبدالله الزهراني", submittedAt: "07:32" },
    { id: "م23", region: "صبيا", responsible: "سامي القرني", submittedAt: null },
  ];
}
