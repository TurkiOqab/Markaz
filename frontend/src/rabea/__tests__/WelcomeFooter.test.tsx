import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WelcomeFooter } from "../welcome/WelcomeFooter";

describe("WelcomeFooter", () => {
  it("renders the system footer line", () => {
    render(<WelcomeFooter />);
    expect(screen.getByText("نظام إنجاز")).toBeInTheDocument();
    expect(screen.getByText("شعبة العمليات")).toBeInTheDocument();
    expect(screen.getByText("2.4.1")).toBeInTheDocument();
  });
});
