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

describe("Vehicles list page", () => {
  let fetchMock: FetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    window.history.pushState({}, "", "/vehicles");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    window.history.pushState({}, "", "/");
  });

  it("renders seeded vehicles", async () => {
    fetchMock.mockResolvedValueOnce(
      json({ data: { setup_complete: true, authenticated: true } }),
    );
    fetchMock.mockResolvedValueOnce(
      json({ data: { items: [], total: 0, page: 1, page_size: 200 } }),
    );
    fetchMock.mockResolvedValueOnce(
      json({
        data: {
          items: [
            {
              id: 1,
              type: "إطفاء",
              plate_number: "أ ب ج 1234",
              status: "في الخدمة",
              driver_id: null,
              photo_path: null,
            },
          ],
          total: 1,
          page: 1,
          page_size: 20,
        },
      }),
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "المركبات" })).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "أ ب ج 1234" })).toBeInTheDocument();
    });
    // The type + status appear in both filter dropdowns and table cells; scope to the row.
    const row = screen.getByRole("link", { name: "أ ب ج 1234" }).closest("tr")!;
    expect(row).toHaveTextContent("إطفاء");
    expect(row).toHaveTextContent("في الخدمة");
  });
});
