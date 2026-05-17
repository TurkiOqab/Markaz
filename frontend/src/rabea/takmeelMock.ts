// Static phase-1 takmeel data for Rabea's two centers. This is the single
// swap point for a future real API call (design spec 2026-05-17, §5).
// `submittedAt` is local 24h "HH:MM" or null when the center has not submitted.

export interface CenterTakmeel {
  id: string;
  submittedAt: string | null;
}

export function getTodayTakmeel(): CenterTakmeel[] {
  return [
    { id: "م22", submittedAt: "07:32" },
    { id: "م23", submittedAt: null },
  ];
}
