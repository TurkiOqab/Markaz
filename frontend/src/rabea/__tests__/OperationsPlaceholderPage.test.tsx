import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { OperationsPlaceholderPage } from "../OperationsPlaceholderPage";
import { setRabeaMode } from "../rabeaSession";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/operations" element={<OperationsPlaceholderPage />} />
        <Route path="/login" element={<div>صفحة تسجيل الدخول</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("OperationsPlaceholderPage", () => {
  afterEach(() => setRabeaMode(false));

  it("shows the under-construction message when in rabea mode", () => {
    setRabeaMode(true);
    renderAt("/operations");
    expect(
      screen.getByText("لوحة شعبة العمليات — قيد التطوير"),
    ).toBeInTheDocument();
    expect(screen.queryByText("صفحة تسجيل الدخول")).not.toBeInTheDocument();
  });

  it("redirects to /login when not in rabea mode", () => {
    setRabeaMode(false);
    renderAt("/operations");
    expect(screen.getByText("صفحة تسجيل الدخول")).toBeInTheDocument();
    expect(
      screen.queryByText("لوحة شعبة العمليات — قيد التطوير"),
    ).not.toBeInTheDocument();
  });
});
