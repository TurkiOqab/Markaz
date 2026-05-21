import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { today } from "../lib/clock";
import { InjazAuraBackdrop } from "../components/InjazAuraBackdrop";
import { isRabeaMode } from "./rabeaSession";
import { getTodayCenters } from "./rabeaTakmeelStore";
import { deriveTakmeelView } from "./takmeelView";
import { CompletionPanel } from "./welcome/CompletionPanel";
import { WelcomeFooter } from "./welcome/WelcomeFooter";
import { WelcomeGreeting } from "./welcome/WelcomeGreeting";
import { WelcomeTopBar } from "./welcome/WelcomeTopBar";

const AR = "٠١٢٣٤٥٦٧٨٩";
const ar = (s: string) => s.replace(/\d/g, (d) => AR[Number(d)]);
const DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

function longDate(d: Date): string {
  return `${DAYS[d.getDay()]} · ${ar(String(d.getDate()))} ${MONTHS[d.getMonth()]} ${ar(String(d.getFullYear()))}`;
}
function shortDate(d: Date): string {
  return `${DAYS[d.getDay()]} ${ar(String(d.getDate()))} ${MONTHS[d.getMonth()]}`;
}

export function OperationsWelcomePage() {
  const navigate = useNavigate();
  const [now, setNow] = useState(() => today());

  useEffect(() => {
    const id = window.setInterval(() => setNow(today()), 60000);
    return () => window.clearInterval(id);
  }, []);

  if (!isRabeaMode()) {
    return <Navigate to="/login" replace />;
  }

  const view = deriveTakmeelView(getTodayCenters(), now);

  return (
    <main
      dir="rtl"
      className="relative grid min-h-screen grid-rows-[auto_1fr_auto] gap-[22px] overflow-hidden px-7 py-[22px] text-[#f5f1e6] max-[560px]:px-4 animate-welcome-reveal will-change-transform"
    >
      <InjazAuraBackdrop />
      <WelcomeTopBar dateLabel={longDate(now)} />

      <div className="mx-auto grid w-full max-w-[1280px] grid-cols-[1.05fr_1fr] items-center gap-8 max-[980px]:grid-cols-1 max-[980px]:gap-7">
        <WelcomeGreeting
          summary={view.summary}
          onPrimary={() => navigate("/operations-panel")}
          onPending={() => navigate("/operations-welcome/substitute")}
          pendingTier={view.worstPendingTier}
        />
        <CompletionPanel view={view} dateLabel={shortDate(now)} />
      </div>

      <WelcomeFooter />
    </main>
  );
}
