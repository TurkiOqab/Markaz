import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  RabeaEntranceTransitionProvider,
  useRabeaEntrance,
} from "../RabeaEntranceTransition";

function Starter() {
  const { start } = useRabeaEntrance();
  return (
    <button type="button" onClick={start}>
      go
    </button>
  );
}

function renderProvider() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <RabeaEntranceTransitionProvider>
        <Routes>
          <Route path="/login" element={<Starter />} />
          <Route
            path="/operations-welcome"
            element={<div>صفحة ربيع</div>}
          />
        </Routes>
      </RabeaEntranceTransitionProvider>
    </MemoryRouter>,
  );
}

describe("RabeaEntranceTransition", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("shows the sweep overlay on start, then navigates to /operations-welcome and clears", () => {
    renderProvider();
    expect(screen.queryByTestId("rabea-sweep")).not.toBeInTheDocument();
    expect(screen.queryByText("صفحة ربيع")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "go" }));

    expect(screen.getByTestId("rabea-sweep")).toBeInTheDocument();
    expect(screen.queryByText("صفحة ربيع")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText("صفحة ربيع")).toBeInTheDocument();
    expect(screen.queryByTestId("rabea-sweep")).not.toBeInTheDocument();
  });

  it("ignores a second start while already sweeping", () => {
    renderProvider();
    fireEvent.click(screen.getByRole("button", { name: "go" }));
    fireEvent.click(screen.getByRole("button", { name: "go" }));
    expect(screen.getAllByTestId("rabea-sweep")).toHaveLength(1);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText("صفحة ربيع")).toBeInTheDocument();
  });
});
