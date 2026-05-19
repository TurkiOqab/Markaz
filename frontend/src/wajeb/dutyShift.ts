// Pure live-countdown math for the duty shift counter. The page anchors the
// shift to the current day (see dutyMock) and re-derives this every minute, so
// the big number + progress bar tick as real time passes.

export interface ShiftProgress {
  hoursLeft: number;
  minutesLeft: number;
  percentElapsed: number; // 0..100, integer
  ended: boolean;
}

const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));

export function deriveShift(
  startedAt: Date,
  endsAt: Date,
  now: Date,
): ShiftProgress {
  const total = endsAt.getTime() - startedAt.getTime();
  const remaining = endsAt.getTime() - now.getTime();
  const ended = remaining <= 0;

  if (total <= 0) {
    return { hoursLeft: 0, minutesLeft: 0, percentElapsed: 100, ended: true };
  }

  const elapsed = now.getTime() - startedAt.getTime();
  const percentElapsed = Math.round(clamp((elapsed / total) * 100, 0, 100));

  const safeRemaining = Math.max(remaining, 0);
  const hoursLeft = Math.floor(safeRemaining / 3_600_000);
  const minutesLeft = Math.floor((safeRemaining % 3_600_000) / 60_000);

  return { hoursLeft, minutesLeft, percentElapsed, ended };
}
