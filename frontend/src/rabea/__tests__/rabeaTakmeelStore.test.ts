import { afterEach, describe, expect, it } from "vitest";
import {
  getPendingCenters,
  getSubstituteRecord,
  getTodayCenters,
  saveSubstituteTakmeel,
} from "../rabeaTakmeelStore";
import type { SubstituteRecord } from "../rabeaTakmeelStore";

function record(centerId: string, at: string): SubstituteRecord {
  return {
    centerId,
    team: "ب",
    fields: {
      totalForce: 20,
      firefighters: 8,
      drivers: 3,
      rescue: 2,
      divers: 1,
      trainers: 1,
      onMission: 2,
      absent: 1,
      suspended: 0,
      catering: 1,
    },
    presentCount: 16,
    note: "إجازة طارئة للمدير",
    submittedBy: "ربيع",
    isSubstitute: true,
    originalResponsible: "سامي القرني",
    locked: true,
    submittedAt: at,
    createdAtIso: new Date(2026, 4, 18, 11, 15).toISOString(),
  };
}

describe("rabeaTakmeelStore", () => {
  afterEach(() => localStorage.clear());

  it("returns the base mock when nothing is saved", () => {
    const centers = getTodayCenters();
    expect(centers.find((c) => c.id === "م22")?.submittedAt).toBe("07:32");
    expect(centers.find((c) => c.id === "م23")?.submittedAt).toBeNull();
    expect(getPendingCenters().map((c) => c.id)).toEqual(["م23"]);
    expect(getSubstituteRecord("م23")).toBeNull();
  });

  it("reflects a saved substitute takmeel and persists it", () => {
    saveSubstituteTakmeel(record("م23", "11:15"));

    const centers = getTodayCenters();
    expect(centers.find((c) => c.id === "م23")?.submittedAt).toBe("11:15");
    expect(centers.find((c) => c.id === "م22")?.submittedAt).toBe("07:32");
    expect(getPendingCenters()).toHaveLength(0);

    const rec = getSubstituteRecord("م23");
    expect(rec?.isSubstitute).toBe(true);
    expect(rec?.submittedBy).toBe("ربيع");
    expect(rec?.originalResponsible).toBe("سامي القرني");
    expect(rec?.locked).toBe(true);
    expect(rec?.presentCount).toBe(16);
  });
});
