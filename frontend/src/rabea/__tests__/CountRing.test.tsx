import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CountRing } from "../welcome/CountRing";

describe("CountRing", () => {
  it("renders the big completed number, total, caption and aria-label", () => {
    render(
      <CountRing completedLabel="١" totalLabel="٢" dash="213.63 427.26" circumference={427.26} />,
    );
    expect(screen.getByText("١")).toBeInTheDocument();
    expect(screen.getByText("/ ٢")).toBeInTheDocument();
    expect(screen.getByText("مركز أكمل اليوم")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "١ من ٢ مركز أكمل التكميل" }),
    ).toBeInTheDocument();
  });
});
