import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { DutyWelcomePage } from "../DutyWelcomePage";
import { setWajebMode } from "../wajebSession";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/duty-welcome" element={<DutyWelcomePage />} />
        <Route path="/login" element={<div>صفحة تسجيل الدخول</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("DutyWelcomePage", () => {
  afterEach(() => setWajebMode(false));

  it("redirects to /login when not in wajeb mode", () => {
    setWajebMode(false);
    renderAt("/duty-welcome");
    expect(screen.getByText("صفحة تسجيل الدخول")).toBeInTheDocument();
    expect(screen.queryByText("واجب ١")).not.toBeInTheDocument();
  });

  it("renders the duty welcome design in wajeb mode", () => {
    setWajebMode(true);
    renderAt("/duty-welcome");

    expect(screen.getByText("INJAZ · DUTY OFFICER")).toBeInTheDocument();
    expect(screen.getByText("واجب ١")).toBeInTheDocument();
    expect(screen.getByText("الملازم خالد العتيبي")).toBeInTheDocument();
    expect(screen.getByText("استلامك نشط الآن")).toBeInTheDocument();
    expect(screen.getByText(/تبدأ مهمتك اليوم بزيارة ميدانية واحدة/)).toBeInTheDocument();
    expect(screen.getByText("عادي")).toBeInTheDocument();

    // Panel sections
    expect(screen.getByRole("heading", { name: "استلامك" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "حوادث منذ بداية الاستلام" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "زيارتك الميدانية لليوم" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "مجموعة الاستلام" }),
    ).toBeInTheDocument();

    expect(screen.getByText("المتبقي من الاستلام")).toBeInTheDocument();
    expect(screen.getByText("حالات مُسجَّلة")).toBeInTheDocument();
    expect(screen.getByText("مركز م1")).toBeInTheDocument();
    expect(screen.getByText("عبدالله الشهري")).toBeInTheDocument();

    // Handover is READ-ONLY: the names render, but there are NO form fields.
    expect(screen.getByText("الرقيب أول محمد العتيبي")).toBeInTheDocument();
    expect(screen.getByText("الرائد فهد القحطاني")).toBeInTheDocument();
    expect(screen.getByText("النقيب سعد الشمري")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).toBeNull();

    // Buttons exist but are non-navigating placeholders.
    expect(
      screen.getByRole("button", { name: /دخول إلى لوحة التحكم/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /إنهاء الاستلام وإصدار التقرير/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ابدأ الزيارة/ })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /طباعة النموذج/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /عرض الحوادث/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "التنبيهات" })).toBeInTheDocument();

    expect(screen.queryByText("صفحة تسجيل الدخول")).not.toBeInTheDocument();
  });
});
