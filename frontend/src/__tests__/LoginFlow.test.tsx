import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";

type FetchMock = ReturnType<typeof vi.fn>;

function json(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

describe("Login flow", () => {
  let fetchMock: FetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the login form when setup is complete and user is not authed, then navigates to the home menu on success", async () => {
    fetchMock.mockResolvedValueOnce(
      json({ data: { setup_complete: true, authenticated: false } }),
    );
    fetchMock.mockResolvedValueOnce(json({ data: { ok: true } }));
    fetchMock.mockResolvedValue(
      json({ data: { setup_complete: true, authenticated: true } }),
    );

    render(<App />);

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "تسجيل الدخول" })).toBeInTheDocument(),
    );

    await userEvent.type(screen.getByLabelText("اسم المستخدم"), "chief");
    await userEvent.type(screen.getByLabelText("كلمة المرور"), "StrongPass1!");
    await userEvent.click(screen.getByRole("button", { name: "تسجيل الدخول" }));

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "لوحة التحكم" })).toBeInTheDocument(),
    );
  });

  it("redirects to setup when system is not initialized", async () => {
    fetchMock.mockResolvedValueOnce(
      json({ data: { setup_complete: false, authenticated: false } }),
    );
    render(<App />);

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "مرحباً بك في مركز" })).toBeInTheDocument(),
    );
  });
});
