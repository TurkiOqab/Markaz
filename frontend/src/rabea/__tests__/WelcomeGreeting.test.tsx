import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { WelcomeGreeting } from "../welcome/WelcomeGreeting";
import { deriveTakmeelView } from "../takmeelView";

function at(h: number, m: number) {
  return new Date(2026, 4, 17, h, m, 0, 0);
}

describe("WelcomeGreeting", () => {
  it("renders eyebrow, headline, role chip, summary and primary CTA", async () => {
    const v = deriveTakmeelView(
      [
        { id: "م22", region: "جازان", responsible: "ع", submittedAt: "07:32" },
        { id: "م23", region: "صبيا", responsible: "س", submittedAt: null },
      ],
      at(17, 19),
    );
    const onPrimary = vi.fn();
    render(<WelcomeGreeting summary={v.summary} onPrimary={onPrimary} />);
    expect(screen.getByText("INJAZ · OPERATIONS CENTER")).toBeInTheDocument();
    expect(screen.getByText("ربيع ٩.")).toBeInTheDocument();
    expect(screen.getByText("مدير شعبة العمليات")).toBeInTheDocument();
    expect(screen.getByText(/لديك/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /الانتقال إلى لوحة التحكم/ }));
    expect(onPrimary).toHaveBeenCalledTimes(1);
  });
});
