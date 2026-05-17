import { ArrowLeft } from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { today } from "../lib/clock";
import { getTodayTakmeel } from "./takmeelMock";
import { deriveTakmeelView } from "./takmeelView";
import { TakmeelStatusCard } from "./TakmeelStatusCard";

const ENTER_MS = 1000;
const EXIT_MS = 500;

export type RabeaPhase = "idle" | "enter" | "hold" | "exit";

interface ContextValue {
  phase: RabeaPhase;
  start: () => void;
}

const RabeaWelcomeContext = createContext<ContextValue>({
  phase: "idle",
  start: () => {},
});

export function useRabeaWelcome(): ContextValue {
  return useContext(RabeaWelcomeContext);
}

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const toArabicDigits = (input: string): string =>
  input.replace(/\d/g, (d) => AR_DIGITS[Number(d)]);

function formatLongArabicDate(d: Date): string {
  const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const months = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
  ];
  return `${days[d.getDay()]}، ${toArabicDigits(String(d.getDate()))} ${months[d.getMonth()]} ${toArabicDigits(String(d.getFullYear()))}`;
}

function formatClock(d: Date): string {
  const h = d.getHours() % 12 || 12;
  const m = d.getMinutes();
  const suffix = d.getHours() >= 12 ? "م" : "ص";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${toArabicDigits(pad(h))}:${toArabicDigits(pad(m))} ${suffix}`;
}

export function RabeaWelcomeTransitionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [phase, setPhase] = useState<RabeaPhase>("idle");
  const navigate = useNavigate();
  const timers = useRef<number[]>([]);

  function clearTimers() {
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
  }

  function start() {
    if (phase !== "idle") return;
    clearTimers();
    setPhase("enter");
    timers.current.push(window.setTimeout(() => setPhase("hold"), ENTER_MS));
  }

  function proceed() {
    if (phase !== "hold") return;
    clearTimers();
    setPhase("exit");
    navigate("/operations", { replace: true });
    timers.current.push(window.setTimeout(() => setPhase("idle"), EXIT_MS));
  }

  useEffect(() => () => clearTimers(), []);

  return (
    <RabeaWelcomeContext.Provider value={{ phase, start }}>
      {children}
      {phase !== "idle" ? (
        <RabeaWelcomeOverlay phase={phase} onProceed={proceed} />
      ) : null}
    </RabeaWelcomeContext.Provider>
  );
}

function RabeaWelcomeOverlay({
  phase,
  onProceed,
}: {
  phase: RabeaPhase;
  onProceed: () => void;
}) {
  const [now, setNow] = useState(() => today());

  useEffect(() => {
    // Recompute every 60s so the takmeel card's deadline/late logic and the
    // header clock stay live without flicker (only `now` changes).
    const id = window.setInterval(() => setNow(today()), 60000);
    return () => window.clearInterval(id);
  }, []);

  const view = deriveTakmeelView(getTodayTakmeel(), now);
  const dateLabel = formatLongArabicDate(now);
  const clockLabel = formatClock(now);

  const animationClass =
    phase === "enter"
      ? "animate-welcome-reveal will-change-transform"
      : phase === "exit"
        ? "animate-welcome-leave will-change-transform"
        : "";

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[100] overflow-hidden"
      role="status"
      aria-live="polite"
    >
      <div
        className={`pointer-events-auto absolute inset-0 flex flex-col overflow-hidden bg-gradient-to-b from-[#0a2818] via-[#0d3a24] to-[#14502f] px-8 pb-9 pt-10 text-white md:px-14 ${animationClass}`}
      >
        <BrandShapeBackdrop />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 1200px 800px at 50% 50%, transparent 0%, rgba(10,40,24,0.4) 100%)",
          }}
        />

        <header className="relative z-10 flex flex-wrap items-center justify-between gap-4 opacity-0 animate-fade-slide-1">
          <div className="flex items-center gap-3.5">
            <img
              src="/logo.png"
              alt="إنجاز"
              className="h-12 w-12 rounded-xl object-contain"
            />
            <div className="text-[13px] leading-snug opacity-85">
              <b className="block text-sm font-semibold opacity-100">نظام إنجاز</b>
              لوحة شعبة العمليات
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/85">
            <span className="h-1.5 w-1.5 rounded-full bg-injaz-gold-soft" />
            <span className="tabular-nums">{clockLabel}</span>
          </div>
        </header>

        <div className="relative z-10 my-auto grid grid-cols-1 items-center gap-12 md:grid-cols-[0.9fr_1.1fr]">
          {/* Card first in DOM -> lands on the visual left in RTL, and stacks
              on top on mobile (design spec §4 responsive rule). */}
          <div className="opacity-0 animate-fade-slide-3">
            <TakmeelStatusCard view={view} />
          </div>

          <div className="max-w-[640px]">
            <p className="mb-5 text-xs uppercase tracking-[0.24em] opacity-55 animate-fade-slide-2">
              INJAZ · OPERATIONS CENTER
            </p>
            <h1 className="mb-4 font-display text-[64px] font-extrabold leading-[1.05] tracking-tight opacity-0 animate-fade-slide-2 md:text-[72px]">
              مرحباً بعودتك
              <br />
              <em className="font-extrabold not-italic text-injaz-gold-soft">
                إنجاز ٩.
              </em>
            </h1>
            <div className="mb-8 flex flex-wrap items-center gap-3 text-base opacity-75 animate-fade-slide-3">
              <span>{dateLabel}</span>
              <span className="h-1 w-1 rounded-full bg-white/40" />
              <span>ربيع - مدير شعبة العمليات</span>
            </div>

            <div className="opacity-0 animate-fade-slide-4">
              <button
                type="button"
                onClick={onProceed}
                disabled={phase !== "hold"}
                className="group inline-flex items-center gap-3.5 rounded-full bg-injaz-gold-soft px-8 py-[18px] text-[15px] font-semibold tracking-wide text-[#0d3a24] shadow-[0_12px_32px_rgba(232,217,184,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_44px_rgba(232,217,184,0.28)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span>الانتقال إلى لوحة التحكم</span>
                <ArrowLeft
                  size={18}
                  className="transition-transform duration-200 group-hover:-translate-x-1.5"
                />
              </button>
            </div>
          </div>
        </div>

        <footer className="relative z-10 mt-5 flex items-center justify-between border-t border-white/10 pt-[18px] text-[11px] tracking-wide opacity-55 animate-fade-slide-5">
          <span>نظام إنجاز · شعبة العمليات</span>
          <span>الإصدار ٢٢.٤.١</span>
        </footer>
      </div>
    </div>
  );
}

function BrandShapeBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.18]"
    >
      <div
        className="relative w-[78%] max-w-[1100px] animate-shape-drift-slow"
        style={{ filter: "drop-shadow(0 30px 80px rgba(0,0,0,0.4))" }}
      >
        <img src="/shape.webp" alt="" className="block h-auto w-full" />
      </div>
    </div>
  );
}
