import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SubstituteTakmeelPage } from "../SubstituteTakmeelPage";
import { getSubstituteRecord, saveSubstituteTakmeel } from "../rabeaTakmeelStore";
import type { SubstituteRecord } from "../rabeaTakmeelStore";
import { setRabeaMode } from "../rabeaSession";

function renderAt() {
  return render(
    <MemoryRouter initialEntries={["/operations-welcome/substitute"]}>
      <Routes>
        <Route path="/operations-welcome/substitute" element={<SubstituteTakmeelPage />} />
        <Route path="/operations-welcome" element={<div>صفحة الترحيب</div>} />
        <Route path="/login" element={<div>تسجيل الدخول</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

const VALID: Record<string, string> = {
  "القوة الكاملة": "20",
  الإطفاء: "5",
  السائقين: "3",
  الإنقاذ: "2",
  الغواصين: "1",
  المدربين: "1",
  المهمة: "2",
  الغياب: "1",
  الموقوفين: "0",
  الإعاشة: "1",
};

describe("SubstituteTakmeelPage", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    setRabeaMode(true);
  });
  afterEach(() => {
    setRabeaMode(false);
    localStorage.clear();
  });

  it("redirects to /login when not in rabea mode", () => {
    setRabeaMode(false);
    renderAt();
    expect(screen.getByText("تسجيل الدخول")).toBeInTheDocument();
    expect(screen.queryByText("تكميل المراكز المعلّقة")).not.toBeInTheDocument();
  });

  it("lists the pending center and lets Rabea submit a substitute takmeel", async () => {
    renderAt();

    expect(
      screen.getByRole("heading", { name: "تكميل المراكز المعلّقة" }),
    ).toBeInTheDocument();
    expect(screen.getByText("مركز م23 - صبيا")).toBeInTheDocument();
    expect(
      screen.getByText("المسؤول: سامي القرني · آخر تواصل: لا يوجد"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /اختيار هذا المركز/ }));

    expect(
      screen.getByRole("heading", { name: /تكميل مركز م23 - صبيا/ }),
    ).toBeInTheDocument();

    const save = () => screen.getByRole("button", { name: /حفظ التكميل/ });
    expect(save()).toBeDisabled();

    await user.click(screen.getByText("الفرقة ب"));
    for (const [label, val] of Object.entries(VALID)) {
      await user.type(screen.getByLabelText(label), val);
    }
    // computed present = 20 - (2+1+0+1) = 16
    expect(screen.getByText("١٦")).toBeInTheDocument();

    expect(save()).toBeDisabled(); // still need both confirmations
    const checks = screen.getAllByRole("checkbox");
    await user.click(checks[0]);
    await user.click(checks[1]);
    expect(save()).toBeEnabled();

    await user.click(save());
    // final confirmation modal
    expect(
      screen.getByRole("heading", { name: /تأكيد رفع التكميل/ }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "نعم، تأكيد" }));

    expect(screen.getByText("✅ تم رفع التكميل بنجاح")).toBeInTheDocument();
    const rec = getSubstituteRecord("م23");
    expect(rec?.isSubstitute).toBe(true);
    expect(rec?.team).toBe("ب");
    expect(rec?.presentCount).toBe(16);
    expect(rec?.originalResponsible).toBe("سامي القرني");
    expect(rec?.locked).toBe(true);
  });

  it("shows the empty state when no centers are pending", () => {
    // م23 is the only pending center (م22 already submitted in the base mock).
    // Persisting a substitute for م23 leaves zero pending.
    const rec: SubstituteRecord = {
      centerId: "م23",
      team: "أ",
      fields: {
        totalForce: 10,
        firefighters: 4,
        drivers: 2,
        rescue: 1,
        divers: 1,
        trainers: 0,
        onMission: 1,
        absent: 0,
        suspended: 0,
        catering: 1,
      },
      presentCount: 8,
      note: "",
      submittedBy: "ربيع",
      isSubstitute: true,
      originalResponsible: "سامي القرني",
      locked: true,
      submittedAt: "11:15",
      createdAtIso: new Date().toISOString(),
    };
    saveSubstituteTakmeel(rec);

    renderAt();
    expect(
      within(document.body).getByText("✅ كل المراكز رفعت التكميل اليوم"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/اختر المركز لرفع تكميله/)).not.toBeInTheDocument();
  });
});
