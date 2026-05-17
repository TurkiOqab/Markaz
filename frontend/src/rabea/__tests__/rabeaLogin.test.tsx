import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../../App";
import { setRabeaMode } from "../rabeaSession";

type FetchMock = ReturnType<typeof vi.fn>;

function json(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

describe("Rabea login distinction", () => {
  let fetchMock: FetchMock;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    fetchMock = vi.fn((input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/api/auth/status")) {
        return Promise.resolve(
          json({ data: { setup_complete: true, authenticated: false } }),
        );
      }
      if (url.includes("/api/auth/login")) {
        return Promise.resolve(
          json({ detail: "بيانات الدخول غير صحيحة" }, { status: 401 }),
        );
      }
      return Promise.resolve(json({ data: {} }));
    });
    vi.stubGlobal("fetch", fetchMock);
    window.history.pushState({}, "", "/login");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    setRabeaMode(false); // also clears the sessionStorage rabea flag
    window.history.pushState({}, "", "/");
  });

  it("REB9 opens the Rabea welcome without calling the login API", async () => {
    render(<App />);

    await screen.findByRole("heading", { name: "تسجيل الدخول" });
    await user.type(screen.getByLabelText("اسم المستخدم"), "REB9");
    await user.type(screen.getByLabelText("كلمة المرور"), "1234567891");
    await user.click(screen.getByRole("button", { name: "تسجيل الدخول" }));

    await screen.findByText("ربيع - مدير شعبة العمليات");
    expect(screen.getByText("حالة التكميل اليومي")).toBeInTheDocument();

    const loginCalls = fetchMock.mock.calls.filter((c) =>
      String(c[0]).includes("/api/auth/login"),
    );
    expect(loginCalls).toHaveLength(0);
  });

  it("a non-REB9 user still goes through the backend login (Injaz path)", async () => {
    render(<App />);

    await screen.findByRole("heading", { name: "تسجيل الدخول" });
    await user.type(screen.getByLabelText("اسم المستخدم"), "somechief");
    await user.type(screen.getByLabelText("كلمة المرور"), "passwordlong");
    await user.click(screen.getByRole("button", { name: "تسجيل الدخول" }));

    await waitFor(() => {
      const loginCalls = fetchMock.mock.calls.filter((c) =>
        String(c[0]).includes("/api/auth/login"),
      );
      expect(loginCalls.length).toBeGreaterThan(0);
    });
    expect(
      screen.queryByText("ربيع - مدير شعبة العمليات"),
    ).not.toBeInTheDocument();
  });
});
