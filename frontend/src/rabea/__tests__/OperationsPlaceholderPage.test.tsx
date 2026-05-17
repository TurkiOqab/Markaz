import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { OperationsPlaceholderPage } from "../OperationsPlaceholderPage";
import { setRabeaMode } from "../rabeaSession";

describe("OperationsPlaceholderPage", () => {
  afterEach(() => setRabeaMode(false));

  it("shows the under-construction message when in rabea mode", () => {
    setRabeaMode(true);
    render(
      <MemoryRouter>
        <OperationsPlaceholderPage />
      </MemoryRouter>,
    );
    expect(
      screen.getByText("لوحة شعبة العمليات — قيد التطوير"),
    ).toBeInTheDocument();
  });

  it("redirects away when not in rabea mode", () => {
    setRabeaMode(false);
    render(
      <MemoryRouter initialEntries={["/operations"]}>
        <OperationsPlaceholderPage />
      </MemoryRouter>,
    );
    expect(
      screen.queryByText("لوحة شعبة العمليات — قيد التطوير"),
    ).not.toBeInTheDocument();
  });
});
