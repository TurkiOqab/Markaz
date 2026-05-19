import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InjazAuraBackdrop } from "../InjazAuraBackdrop";

describe("InjazAuraBackdrop", () => {
  it("defaults to a fixed, full-viewport, decorative backdrop with scan lines", () => {
    const { container } = render(<InjazAuraBackdrop />);
    const root = screen.getByTestId("injaz-aura");
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root.className).toContain("fixed");
    expect(root.className).not.toContain("absolute");
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("scopes to its container when `contained`", () => {
    render(<InjazAuraBackdrop contained />);
    const root = screen.getByTestId("injaz-aura");
    expect(root.className).toContain("absolute");
    expect(root.className).not.toContain("fixed");
  });

  it("gives each instance unique gradient ids (no SVG url() collision)", () => {
    const { container } = render(
      <>
        <InjazAuraBackdrop />
        <InjazAuraBackdrop />
      </>,
    );
    const ids = Array.from(
      container.querySelectorAll("linearGradient"),
    ).map((g) => g.id);
    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(4);
  });
});
