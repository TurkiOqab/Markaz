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
    fetchMock.mockImplementation((input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/api/auth/status")) {
        return Promise.resolve(
          json({ data: { setup_complete: true, authenticated: true } }),
        );
      }
      if (url.includes("/api/dashboard/stats")) {
        return Promise.resolve(
          json({
            data: {
              vehicles: { total: 1, by_status: { "في الخدمة": 1 } },
            },
          }),
        );
      }
      if (url.includes("/api/employees")) {
        return Promise.resolve(
          json({ data: { items: [], total: 0, page: 1, page_size: 200 } }),
        );
      }
      if (url.includes("/api/vehicles")) {
        return Promise.resolve(
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
      }
      return Promise.resolve(json({ data: null }));
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "المركبات" })).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /أ ب ج 1234/ })).toBeInTheDocument();
    });
    // Type + status appear in both filter dropdowns and cards; scope to the card.
    const card = screen.getByRole("link", { name: /أ ب ج 1234/ });
    expect(card).toHaveTextContent("إطفاء");
    expect(card).toHaveTextContent("في الخدمة");
  });
});
