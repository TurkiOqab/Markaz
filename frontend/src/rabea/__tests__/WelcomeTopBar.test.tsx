import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WelcomeTopBar } from "../welcome/WelcomeTopBar";

describe("WelcomeTopBar", () => {
  it("renders brand, alert pill, date and bell badge", () => {
    render(<WelcomeTopBar dateLabel="الأحد · ١٧ مايو ٢٠٢٦" />);
    expect(screen.getByText("نظام إنجاز")).toBeInTheDocument();
    expect(screen.getByText("لوحة شعبة العمليات")).toBeInTheDocument();
    expect(screen.getByText("حالة الإنذار")).toBeInTheDocument();
    expect(screen.getByText("عادي")).toBeInTheDocument();
    expect(screen.getByText("الأحد · ١٧ مايو ٢٠٢٦")).toBeInTheDocument();
    expect(screen.getByText("٣")).toBeInTheDocument();
  });
});
