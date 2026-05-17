import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CompletionPanel } from "../welcome/CompletionPanel";
import { deriveTakmeelView } from "../takmeelView";

function at(h: number, m: number) {
  return new Date(2026, 4, 17, h, m, 0, 0);
}

describe("CompletionPanel", () => {
  it("renders head, ring, side stats and centers for a partial day", () => {
    const v = deriveTakmeelView(
      [
        { id: "م22", region: "جازان", responsible: "عبدالله الزهراني", submittedAt: "07:32" },
        { id: "م23", region: "صبيا", responsible: "سامي القرني", submittedAt: null },
      ],
      at(17, 19),
    );
    render(<CompletionPanel view={v} dateLabel="الأحد ١٧ مايو" />);
    expect(screen.getByText("حالة التكميل اليومي")).toBeInTheDocument();
    expect(screen.getByText("المراكز التابعة لشعبة العمليات")).toBeInTheDocument();
    expect(screen.getByText("نسبة الإنجاز اليوم")).toBeInTheDocument();
    expect(screen.getByText("مكتمل")).toBeInTheDocument();
    expect(screen.getByText("بانتظار التكميل")).toBeInTheDocument();
    expect(screen.getByText("مركز م٢٣ · صبيا")).toBeInTheDocument();
  });

  it("renders the all-complete badge when every center submitted", () => {
    const v = deriveTakmeelView(
      [
        { id: "م22", region: "جازان", responsible: "ع", submittedAt: "07:32" },
        { id: "م23", region: "صبيا", responsible: "س", submittedAt: "07:51" },
      ],
      at(10, 0),
    );
    render(<CompletionPanel view={v} dateLabel="الأحد ١٧ مايو" />);
    expect(screen.getByText("جميع المراكز أكملت اليوم")).toBeInTheDocument();
  });

  it("renders the empty message when no centers", () => {
    const v = deriveTakmeelView([], at(10, 0));
    render(<CompletionPanel view={v} dateLabel="الأحد ١٧ مايو" />);
    expect(screen.getByText("لم يتم تسجيل أي مراكز بعد")).toBeInTheDocument();
  });
});
