import { describe, expect, it } from "vitest";
import { deriveTakmeelView } from "../takmeelView";
import type { CenterTakmeel } from "../takmeelMock";

// Local-time Date helper: year, month(0-based), day, hour, minute.
function at(h: number, m: number): Date {
  return new Date(2026, 4, 17, h, m, 0, 0);
}

const BOTH_NULL: CenterTakmeel[] = [
  { id: "م22", region: "جازان", responsible: "عبدالله الزهراني", submittedAt: null },
  { id: "م23", region: "صبيا", responsible: "سامي القرني", submittedAt: null },
];

describe("deriveTakmeelView", () => {
  it("empty center list -> state 'empty'", () => {
    const v = deriveTakmeelView([], at(10, 0));
    expect(v.state).toBe("empty");
    expect(v.headline).toBe("لا توجد مراكز مرتبطة بحسابك");
    expect(v.centers).toHaveLength(0);
  });

  it("before 09:00, none submitted -> pending, 0/2, no late labels", () => {
    const v = deriveTakmeelView(BOTH_NULL, at(8, 0));
    expect(v.state).toBe("pending");
    expect(v.beforeDeadline).toBe(true);
    expect(v.submittedCount).toBe(0);
    expect(v.total).toBe(2);
    expect(v.percent).toBe(0);
    expect(v.headline).toBe("بانتظار وقت رفع التكميل (٩:٠٠ ص)");
    expect(v.centers.every((c) => c.lateLabel === null)).toBe(true);
    expect(v.centers.every((c) => c.fastest === false)).toBe(true);
  });

  it("before 09:00 with an early submission -> pending but counts it, no judgment", () => {
    const centers: CenterTakmeel[] = [
      { id: "م22", region: "جازان", responsible: "عبدالله الزهراني", submittedAt: "07:32" },
      { id: "م23", region: "صبيا", responsible: "سامي القرني", submittedAt: null },
    ];
    const v = deriveTakmeelView(centers, at(8, 0));
    expect(v.state).toBe("pending");
    expect(v.submittedCount).toBe(1);
    expect(v.percent).toBe(50);
    const m22 = v.centers.find((c) => c.id === "م22")!;
    expect(m22.submitted).toBe(true);
    expect(m22.fastest).toBe(false);
    const m23 = v.centers.find((c) => c.id === "م23")!;
    expect(m23.lateLabel).toBeNull();
  });

  it("after 09:00, both submitted -> complete, fastest = earliest", () => {
    const centers: CenterTakmeel[] = [
      { id: "م22", region: "جازان", responsible: "عبدالله الزهراني", submittedAt: "07:51" },
      { id: "م23", region: "صبيا", responsible: "سامي القرني", submittedAt: "07:32" },
    ];
    const v = deriveTakmeelView(centers, at(10, 0));
    expect(v.state).toBe("complete");
    expect(v.submittedCount).toBe(2);
    expect(v.percent).toBe(100);
    expect(v.headline).toBe("اكتمل التكميل اليوم ✅");
    expect(v.centers.find((c) => c.id === "م23")!.fastest).toBe(true);
    expect(v.centers.find((c) => c.id === "م22")!.fastest).toBe(false);
  });

  it("after 09:00, one missing 23 min late -> partial, yellow tier", () => {
    const centers: CenterTakmeel[] = [
      { id: "م22", region: "جازان", responsible: "عبدالله الزهراني", submittedAt: "07:32" },
      { id: "م23", region: "صبيا", responsible: "سامي القرني", submittedAt: null },
    ];
    const v = deriveTakmeelView(centers, at(9, 23));
    expect(v.state).toBe("partial");
    expect(v.submittedCount).toBe(1);
    expect(v.headline).toBe("بانتظار مركز واحد");
    const m23 = v.centers.find((c) => c.id === "م23")!;
    expect(m23.lateMinutes).toBe(23);
    expect(m23.lateTier).toBe("yellow");
    expect(m23.lateLabel).toBe("متأخر ٢٣ دقيقة");
  });

  it("after 09:00, none submitted 45 min late -> none, orange tier", () => {
    const v = deriveTakmeelView(BOTH_NULL, at(9, 45));
    expect(v.state).toBe("none");
    expect(v.headline).toBe("لم يرفع أي مركز التكميل");
    expect(v.centers[0].lateTier).toBe("orange");
  });

  it("late tier boundaries: 29=yellow, 30=orange, 60=orange, 61=red", () => {
    expect(deriveTakmeelView(BOTH_NULL, at(9, 29)).centers[0].lateTier).toBe("yellow");
    expect(deriveTakmeelView(BOTH_NULL, at(9, 30)).centers[0].lateTier).toBe("orange");
    expect(deriveTakmeelView(BOTH_NULL, at(10, 0)).centers[0].lateTier).toBe("orange");
    expect(deriveTakmeelView(BOTH_NULL, at(10, 1)).centers[0].lateTier).toBe("red");
  });

  it("formats a long late label with hours and minutes", () => {
    const v = deriveTakmeelView(BOTH_NULL, at(10, 15));
    expect(v.centers[0].lateLabel).toBe("متأخر ساعة و ١٥ دقيقة");
  });

  it("formats submitted time as arabic-digit 12h", () => {
    const centers: CenterTakmeel[] = [{ id: "م22", region: "جازان", responsible: "عبدالله الزهراني", submittedAt: "07:32" }];
    const v = deriveTakmeelView(centers, at(10, 0));
    expect(v.centers[0].submittedLabel).toBe("٧:٣٢ ص");
  });
});
