import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../../App";
import { setWajebMode } from "../wajebSession";

type FetchMock = ReturnType<typeof vi.fn>;

function json(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

describe("Wajeb login distinction", () => {
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
    setWajebMode(false);
    window.history.pushState({}, "", "/");
  });

  it("WAJEB1 plays the entrance sweep then lands on the duty welcome, no login API", async () => {
    render(<App />);

    await screen.findByRole("heading", { name: "تسجيل الدخول" });
    await user.type(screen.getByLabelText("اسم المستخدم"), "WAJEB1");
    await user.type(screen.getByLabelText("كلمة المرور"), "1234567891");
    await user.click(screen.getByRole("button", { name: "تسجيل الدخول" }));

    expect(screen.getByTestId("wajeb-sweep")).toBeInTheDocument();

    await screen.findByText("واجب ١", {}, { timeout: 3000 });
    expect(screen.getByText("INJAZ · DUTY OFFICER")).toBeInTheDocument();
    expect(screen.queryByTestId("wajeb-sweep")).not.toBeInTheDocument();

    const loginCalls = fetchMock.mock.calls.filter((c) =>
      String(c[0]).includes("/api/auth/login"),
    );
    expect(loginCalls).toHaveLength(0);
  });
});
