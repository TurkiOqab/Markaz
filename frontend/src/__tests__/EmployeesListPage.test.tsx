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

describe("Employees list page", () => {
  let fetchMock: FetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    window.history.pushState({}, "", "/employees");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    window.history.pushState({}, "", "/");
  });

  it("loads teams + employees and renders a card per employee", async () => {
    fetchMock.mockImplementation((input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/api/auth/status")) {
        return Promise.resolve(
          json({ data: { setup_complete: true, authenticated: true } }),
        );
      }
      if (url.includes("/api/teams")) {
        return Promise.resolve(
          json({
            data: {
              items: [{ id: 1, name: "الفريق أ", description: null }],
              total: 1,
              page: 1,
              page_size: 1,
            },
          }),
        );
      }
      if (url.includes("/api/dashboard/stats")) {
        return Promise.resolve(
          json({
            data: {
              employees: { total: 1, by_shift: { صباحية: 1 } },
            },
          }),
        );
      }
      if (url.includes("/api/employees")) {
        return Promise.resolve(
          json({
            data: {
              items: [
                {
                  id: 10,
                  name: "أحمد محمد",
                  rank: "رائد",
                  specialty: "إنقاذ",
                  national_id: "1000000001",
                  photo_path: null,
                  team_id: 1,
                  shift: "صباحية",
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
      expect(screen.getByRole("heading", { name: "الموظفون" })).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /أحمد محمد/ })).toBeInTheDocument();
    });
    expect(screen.getByText(/رائد · إنقاذ/)).toBeInTheDocument();
  });
});
