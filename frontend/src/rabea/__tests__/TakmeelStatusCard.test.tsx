import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TakmeelStatusCard } from "../TakmeelStatusCard";
import { deriveTakmeelView } from "../takmeelView";

function at(h: number, m: number): Date {
  return new Date(2026, 4, 17, h, m, 0, 0);
}

describe("TakmeelStatusCard", () => {
  it("renders the title and X / total", () => {
    const view = deriveTakmeelView(
      [
        { id: "م22", region: "جازان", responsible: "عبدالله الزهراني", submittedAt: "07:32" },
        { id: "م23", region: "صبيا", responsible: "سامي القرني", submittedAt: null },
      ],
      at(9, 23),
    );
    render(<TakmeelStatusCard view={view} />);
    expect(screen.getByText("حالة التكميل اليومي")).toBeInTheDocument();
    expect(screen.getByText("١ / ٢")).toBeInTheDocument();
    expect(screen.getByText("بانتظار مركز واحد")).toBeInTheDocument();
    expect(screen.getByText("متأخر ٢٣ دقيقة")).toBeInTheDocument();
  });

  it("renders the empty state message", () => {
    const view = deriveTakmeelView([], at(10, 0));
    render(<TakmeelStatusCard view={view} />);
    expect(screen.getByText("لا توجد مراكز مرتبطة بحسابك")).toBeInTheDocument();
  });
});
