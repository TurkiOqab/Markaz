import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { OperationsWelcomePage } from "../OperationsWelcomePage";
import { setRabeaMode } from "../rabeaSession";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/operations-welcome" element={<OperationsWelcomePage />} />
        <Route path="/login" element={<div>صفحة تسجيل الدخول</div>} />
        <Route path="/operations" element={<div>قيد التطوير</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("OperationsWelcomePage", () => {
  afterEach(() => setRabeaMode(false));

  it("renders the welcome design when in rabea mode", () => {
    setRabeaMode(true);
    renderAt("/operations-welcome");
    expect(screen.getByText("ربيع ٩.")).toBeInTheDocument();
    expect(screen.getByText("حالة التكميل اليومي")).toBeInTheDocument();
    expect(screen.getByText("مركز م٢٢ · جازان")).toBeInTheDocument();
    expect(screen.queryByText("صفحة تسجيل الدخول")).not.toBeInTheDocument();
  });

  it("redirects to /login when not in rabea mode", () => {
    setRabeaMode(false);
    renderAt("/operations-welcome");
    expect(screen.getByText("صفحة تسجيل الدخول")).toBeInTheDocument();
    expect(screen.queryByText("ربيع ٩.")).not.toBeInTheDocument();
  });
});
