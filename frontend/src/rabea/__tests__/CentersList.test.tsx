import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CentersList } from "../welcome/CentersList";
import { deriveTakmeelView } from "../takmeelView";

function at(h: number, m: number) {
  return new Date(2026, 4, 17, h, m, 0, 0);
}

describe("CentersList", () => {
  it("renders a row per center with name, sub and meta", () => {
    const v = deriveTakmeelView(
      [
        { id: "م22", region: "جازان", responsible: "عبدالله الزهراني", submittedAt: "07:32" },
        { id: "م23", region: "صبيا", responsible: "سامي القرني", submittedAt: null },
      ],
      at(17, 19),
    );
    render(<CentersList centers={v.centers} />);
    expect(screen.getByText("مركز م٢٢ · جازان")).toBeInTheDocument();
    expect(screen.getByText("مركز م٢٣ · صبيا")).toBeInTheDocument();
    expect(screen.getByText("تفاصيل المراكز")).toBeInTheDocument();
    expect(screen.getByText("إدارة المراكز ←")).toBeInTheDocument();
    expect(screen.getByText("٧:٣٢ ص")).toBeInTheDocument();
    expect(screen.getByText("غير مُسجّل")).toBeInTheDocument();
  });
});
