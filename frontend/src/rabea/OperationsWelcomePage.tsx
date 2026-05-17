import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { today } from "../lib/clock";
import { isRabeaMode } from "./rabeaSession";
import { getTodayTakmeel } from "./takmeelMock";
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

  const view = deriveTakmeelView(getTodayTakmeel(), now);

  return (
    <main
      dir="rtl"
      className="relative grid min-h-screen grid-rows-[auto_1fr_auto] gap-[22px] overflow-hidden bg-gradient-to-b from-[#0a2818] via-[#0d3a24] to-[#14502f] px-7 py-[22px] text-[#f5f1e6] max-[560px]:px-4 animate-welcome-reveal will-change-transform"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 flex items-center justify-center opacity-[0.18]"
      >
        <div
          className="relative w-[78%] max-w-[1100px] animate-shape-drift-slow"
          style={{ filter: "drop-shadow(0 30px 80px rgba(0,0,0,0.4))" }}
        >
          <img src="/shape.webp" alt="" className="block h-auto w-full" />
          <svg
            viewBox="0 0 306 237"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full"
          >
            <defs>
              <linearGradient id="rabeaWelcomeGlint" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#e8d9b8" stopOpacity="0" />
                <stop offset="50%" stopColor="#e8d9b8" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#e8d9b8" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="rabeaWelcomeGlintSoft" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#e8d9b8" stopOpacity="0" />
                <stop offset="50%" stopColor="#e8d9b8" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#e8d9b8" stopOpacity="0" />
              </linearGradient>
            </defs>
            <rect x="0" y="80" width="110" height="0.8" fill="url(#rabeaWelcomeGlintSoft)">
              <animate attributeName="x" values="-40;220;-40" dur="11s" repeatCount="indefinite" />
            </rect>
            <rect x="0" y="125" width="140" height="1" fill="url(#rabeaWelcomeGlint)">
              <animate
                attributeName="x"
                values="-50;230;-50"
                dur="9s"
                repeatCount="indefinite"
                begin="-3s"
              />
            </rect>
            <rect x="0" y="170" width="100" height="0.8" fill="url(#rabeaWelcomeGlintSoft)">
              <animate
                attributeName="x"
                values="-30;240;-30"
                dur="13s"
                repeatCount="indefinite"
                begin="-6s"
              />
            </rect>
          </svg>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 1200px 800px at 50% 50%, transparent 0%, rgba(10,40,24,0.4) 100%)",
        }}
      />
      <WelcomeTopBar dateLabel={longDate(now)} />

      <div className="mx-auto grid w-full max-w-[1280px] grid-cols-[1.05fr_1fr] items-center gap-8 max-[980px]:grid-cols-1 max-[980px]:gap-7">
        <WelcomeGreeting
          summary={view.summary}
          onPrimary={() => navigate("/operations")}
        />
        <CompletionPanel view={view} dateLabel={shortDate(now)} />
      </div>

      <WelcomeFooter />
    </main>
  );
}
