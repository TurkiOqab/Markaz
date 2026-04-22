import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";

type FetchMock = ReturnType<typeof vi.fn>;

function json(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

describe("Building page", () => {
  let fetchMock: FetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    window.history.pushState({}, "", "/building");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    window.history.pushState({}, "", "/");
  });

  it("loads the building and shows the main info hero band", async () => {
    fetchMock.mockResolvedValueOnce(
      json({ data: { setup_complete: true, authenticated: true } }),
    );
    fetchMock.mockResolvedValueOnce(
      json({
        data: {
          id: 1,
          name: "مركز الدفاع المدني الرئيسي",
          address: "شارع الملك فهد",
          notes: null,
          created_at: "2026-01-01T00:00:00",
          updated_at: "2026-01-01T00:00:00",
        },
      }),
    );
    // MainInfoTab now also fetches rooms/inventory/maintenance/reports counts.
    const emptyPage = json({
      data: { items: [], total: 0, page: 1, page_size: 1 },
    });
    fetchMock.mockResolvedValue(emptyPage);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "المبنى" })).toBeInTheDocument();
    });

    // Hero band shows the building name as an H2.
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "مركز الدفاع المدني الرئيسي" }),
      ).toBeInTheDocument();
    });
  });
});
