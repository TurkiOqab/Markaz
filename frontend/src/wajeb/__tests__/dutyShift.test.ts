import { describe, expect, it } from "vitest";
import { deriveShift } from "../dutyShift";

// Shift: starts 17 May 15:28, ends 18 May 08:00 (16h32m total).
const start = new Date(2026, 4, 17, 15, 28, 0, 0);
const end = new Date(2026, 4, 18, 8, 0, 0, 0);

describe("deriveShift", () => {
  it("at start: full time remaining, 0% elapsed", () => {
    const p = deriveShift(start, end, start);
    expect(p.hoursLeft).toBe(16);
    expect(p.minutesLeft).toBe(32);
    expect(p.percentElapsed).toBe(0);
    expect(p.ended).toBe(false);
  });

  it("mid-shift: derives remaining and percent live", () => {
    // 4h elapsed -> now 19:28 on the 17th
    const now = new Date(2026, 4, 17, 19, 28, 0, 0);
    const p = deriveShift(start, end, now);
    expect(p.hoursLeft).toBe(12);
    expect(p.minutesLeft).toBe(32);
    // 4h of 16h32m (992 min) -> 240/992 = 24.19% -> 24
    expect(p.percentElapsed).toBe(24);
    expect(p.ended).toBe(false);
  });

  it("at end: zero remaining, 100%, ended", () => {
    const p = deriveShift(start, end, end);
    expect(p.hoursLeft).toBe(0);
    expect(p.minutesLeft).toBe(0);
    expect(p.percentElapsed).toBe(100);
    expect(p.ended).toBe(true);
  });

  it("past end: clamps remaining to 0 and percent to 100", () => {
    const after = new Date(2026, 4, 18, 12, 0, 0, 0);
    const p = deriveShift(start, end, after);
    expect(p.hoursLeft).toBe(0);
    expect(p.minutesLeft).toBe(0);
    expect(p.percentElapsed).toBe(100);
    expect(p.ended).toBe(true);
  });

  it("before start: clamps percent to 0", () => {
    const before = new Date(2026, 4, 17, 12, 0, 0, 0);
    const p = deriveShift(start, end, before);
    expect(p.percentElapsed).toBe(0);
    expect(p.ended).toBe(false);
  });

  it("guards a non-positive total span", () => {
    const p = deriveShift(end, start, start);
    expect(p).toEqual({
      hoursLeft: 0,
      minutesLeft: 0,
      percentElapsed: 100,
      ended: true,
    });
  });
});
