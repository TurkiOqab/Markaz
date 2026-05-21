import { ArrowLeft, Sun, Users } from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { getTodayRollCall, upsertTodayRollCall } from "../api/rollCalls";
import { listTeams } from "../api/teams";
import { today } from "../lib/clock";
import { InjazAuraBackdrop } from "./InjazAuraBackdrop";
import type { RollCall, Team } from "../types/models";

/**
 * Welcome / hand-off transition between /login and /.
 *
 *   stage 1 ("enter", ~900ms) – login fades + blur-out, gold-line sweep right→
 *                               left, welcome reveals (blur 10→0 + scale).
 *   stage 2 ("hold")          – welcome panel sits on screen until the user
 *                               clicks the gold CTA.
 *   stage 3 ("exit",  ~700ms) – welcome blur+scale-out, dashboard slides in.
 *
 * The provider lives at App root *inside* BrowserRouter so the welcome overlay
 * survives the navigate() between stages 2 and 3 — that overlap is what makes
 * the welcome's exit and the dashboard's entry look mechanically linked.
 *
 * Stage 2 has no timer — the user drives the transition forward.
 */

export type LoginTransitionPhase = "idle" | "enter" | "hold" | "exit";

const ENTER_MS = 1000;
const EXIT_MS = 500;

interface ContextValue {
  phase: LoginTransitionPhase;
  start: () => void;
}

const LoginTransitionContext = createContext<ContextValue>({
  phase: "idle",
  start: () => {},
});

export function useLoginTransition(): ContextValue {
  return useContext(LoginTransitionContext);
}

// TODO: wire to real weather feed and current chief profile. Team + present
// count come from the daily roll-call (التكميل اليومي) — see TeamCard.
const USER_NAME = "الملازم علي الحامظي";
const TEAM_LEADER = "الرائد سلمان الشهري";
const WEATHER = {
  temp: "٣٤",
  unit: "°م",
  meta: "صحو · رياح خفيفة من الشمال",
  humidity: "١٨٪",
  wind: "١٢ كم/س",
  visibility: "ممتازة",
};
const VERSION_LABEL = "الإصدار ٢٢.٤.١";
const FOOTER_LABEL = "نظام إنجاز · مركز عمليات جازان";

type AlertLevel = "white" | "orange" | "red";

const ALERT_COPY: Record<AlertLevel, { label: string; sub: string }> = {
  white: { label: "الإنذار: أبيض", sub: "الوضع طبيعي، لا توجد بلاغات نشطة" },
  orange: { label: "الإنذار: برتقالي", sub: "تأهب جزئي، متابعة مستمرة للحالة" },
  red: { label: "الإنذار: أحمر", sub: "تأهب قصوى، استدعاء كامل للفرق" },
};

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const toArabicDigits = (input: string): string =>
  input.replace(/\d/g, (d) => AR_DIGITS[Number(d)]);

function formatLongArabicDate(d: Date): string {
  const days = [
    "الأحد",
    "الإثنين",
    "الثلاثاء",
    "الأربعاء",
    "الخميس",
    "الجمعة",
    "السبت",
  ];
  const months = [
    "يناير",
    "فبراير",
    "مارس",
    "أبريل",
    "مايو",
    "يونيو",
    "يوليو",
    "أغسطس",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
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

export function LoginTransitionProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<LoginTransitionPhase>("idle");
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
    // Navigate at the START of the exit so the dashboard mounts and runs its
    // own slide-in animation underneath the welcome's exit fade.
    navigate("/", { replace: true, state: { animateIn: true } });
    timers.current.push(window.setTimeout(() => setPhase("idle"), EXIT_MS));
  }

  useEffect(() => () => clearTimers(), []);

  return (
    <LoginTransitionContext.Provider value={{ phase, start }}>
      {children}
      {phase !== "idle" ? (
        <WelcomeOverlay phase={phase} onProceed={proceed} />
      ) : null}
      {phase === "enter" ? <GoldSweepOverlay /> : null}
    </LoginTransitionContext.Provider>
  );
}

// ---------- Soft gold sweep that crosses the screen during stage 1 ----------

function GoldSweepOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[110] overflow-hidden"
    >
      {/* Soft veil — much lighter than the design original so it reads as a
          tint rather than a wipe. */}
      <div
        className="absolute inset-0 animate-veil-sweep will-change-transform"
        style={{
          background:
            "linear-gradient(270deg, rgba(13,58,36,0) 0%, rgba(13,58,36,0.18) 60%, rgba(10,40,24,0.35) 100%)",
        }}
      />
      <GoldLine top="28%" thickness="0.5px" opacity={0.28} />
      <GoldLine top="50%" thickness="1px"   opacity={0.45} />
      <GoldLine top="72%" thickness="0.5px" opacity={0.28} />
    </div>
  );
}

function GoldLine({
  top,
  thickness,
  opacity,
}: {
  top: string;
  thickness: string;
  opacity: number;
}) {
  return (
    <div
      className="absolute -end-[40%] w-[60%] animate-gold-sweep will-change-transform"
      style={{
        top,
        height: thickness,
        opacity,
        background:
          "linear-gradient(270deg, rgba(232,217,184,0) 0%, rgba(232,217,184,0.6) 30%, rgba(255,236,196,0.85) 50%, rgba(232,217,184,0.6) 70%, rgba(232,217,184,0) 100%)",
        filter:
          "drop-shadow(0 0 4px rgba(232,217,184,0.45)) drop-shadow(0 0 10px rgba(232,217,184,0.18))",
      }}
    />
  );
}

// ---------- Welcome panel ----------

function WelcomeOverlay({
  phase,
  onProceed,
}: {
  phase: LoginTransitionPhase;
  onProceed: () => void;
}) {
  const [alertLevel, setAlertLevel] = useState<AlertLevel>("white");
  const [now, setNow] = useState(() => formatClock(today()));
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [rollCall, setRollCall] = useState<RollCall | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [savingTeam, setSavingTeam] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setNow(formatClock(new Date())), 30000);
    let active = true;
    Promise.all([listTeams(), getTodayRollCall()])
      .then(([t, rc]) => {
        if (!active) return;
        setTeams(t.items);
        setRollCall(rc);
        // Pre-select today's saved team if any; otherwise leave blank so the
        // user must consciously pick one before continuing.
        if (rc) setSelectedTeam(rc.team);
      })
      // Welcome card is best-effort: silently fall back to empty state.
      .catch(() => undefined);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, []);

  /**
   * On CTA: persist the chosen receiving team to today's roll-call so the
   * dashboard's RollCallCard picks it up. Counts default to whatever already
   * exists (or zeros for a brand-new entry); the chief fills them on the
   * dashboard.
   */
  async function handleProceed() {
    if (selectedTeam && selectedTeam !== rollCall?.team) {
      setSavingTeam(true);
      try {
        await upsertTodayRollCall({
          team: selectedTeam,
          total_force: rollCall?.total_force ?? 0,
          firefighters: rollCall?.firefighters ?? 0,
          drivers: rollCall?.drivers ?? 0,
          divers: rollCall?.divers ?? 0,
          trainers: rollCall?.trainers ?? 0,
          on_mission: rollCall?.on_mission ?? 0,
          absent: rollCall?.absent ?? 0,
          suspended: rollCall?.suspended ?? 0,
          catering: rollCall?.catering ?? 0,
        });
      } catch {
        // Don't block the transition on a backend hiccup; the user can still
        // edit the team on the dashboard.
      } finally {
        setSavingTeam(false);
      }
    }
    onProceed();
  }

  const dateLabel = formatLongArabicDate(today());

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
        className={`pointer-events-auto absolute inset-0 flex flex-col overflow-hidden px-14 pb-9 pt-10 text-white ${animationClass}`}
      >
        {/* unified ambient backdrop (same as the rest of the welcome surfaces) */}
        <InjazAuraBackdrop contained />

        {/* incoming sheen — only during reveal, very subtle */}
        {phase === "enter" ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[5] animate-sheen-sweep will-change-transform"
            style={{
              background:
                "linear-gradient(270deg, transparent 0%, rgba(232,217,184,0.10) 50%, transparent 100%)",
            }}
          />
        ) : null}

        {/* TOP — org left, alert switch + clock right */}
        <header className="relative z-10 flex flex-wrap items-center justify-between gap-4 opacity-0 animate-fade-slide-1">
          <div className="flex items-center gap-3.5">
            <img
              src="/logo.png"
              alt="إنجاز"
              className="h-12 w-12 rounded-xl object-contain"
            />
            <div className="text-[13px] leading-snug opacity-85">
              <b className="block text-sm font-semibold opacity-100">نظام إنجاز</b>
              لوحة تحكم العمليات
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div
              role="tablist"
              aria-label="مستوى الإنذار"
              className="flex gap-1 rounded-full border border-[rgba(245,241,230,.10)] bg-[rgba(245,241,230,.04)] p-1"
            >
              {(["white", "orange", "red"] as const).map((a) => {
                const isActive = alertLevel === a;
                const activeCls =
                  a === "white"
                    ? "bg-white/10 text-[#f5f1e6]"
                    : a === "orange"
                      ? "bg-[#e1a04a]/15 text-[#f0a04b]"
                      : "bg-[#c0392b]/20 text-[#ff8a7a]";
                return (
                  <button
                    key={a}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setAlertLevel(a)}
                    className={`rounded-full px-3.5 py-1.5 text-[11px] font-medium tracking-wider transition-colors ${
                      isActive ? activeCls : "text-[#a9b8ad] hover:text-[#e6dfcc]"
                    }`}
                  >
                    {a === "white" ? "أبيض" : a === "orange" ? "برتقالي" : "أحمر"}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/85">
              <span className="h-1.5 w-1.5 rounded-full bg-injaz-gold-soft" />
              <span className="tabular-nums">{now}</span>
            </div>
          </div>
        </header>

        {/* MAIN — greeting + cards */}
        <div className="relative z-10 mx-auto my-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-8 md:grid-cols-[1.05fr_1fr]">
          <div className="max-w-[640px]">
            <p className="mb-5 text-xs uppercase tracking-[0.24em] opacity-55 animate-fade-slide-2">
              INJAZ · CONTROL CENTER
            </p>
            <h1 className="mb-4 font-display text-[72px] font-extrabold leading-[1.05] tracking-tight opacity-0 animate-fade-slide-2">
              مرحباً بعودتك
              <br />
              <em className="font-extrabold not-italic text-injaz-gold-soft">
                إنجاز ٢٢.
              </em>
            </h1>
            <div className="mb-8 flex items-center gap-3 text-base opacity-75 animate-fade-slide-3">
              <span>{dateLabel}</span>
              <span className="h-1 w-1 rounded-full bg-white/40" />
              <span>{USER_NAME}</span>
            </div>

            <div className="opacity-0 animate-fade-slide-3">
              <AlertPill level={alertLevel} />
            </div>

            <div className="mt-7 opacity-0 animate-fade-slide-4">
              <button
                type="button"
                onClick={handleProceed}
                disabled={phase !== "hold" || !selectedTeam || savingTeam}
                className="group inline-flex items-center gap-3.5 rounded-full bg-injaz-gold-soft px-8 py-[18px] text-[15px] font-semibold tracking-wide text-[#0d3a24] shadow-[0_12px_32px_rgba(232,217,184,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_44px_rgba(232,217,184,0.28)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span>
                  {savingTeam ? "جارٍ الحفظ..." : "الانتقال إلى لوحة التحكم"}
                </span>
                <ArrowLeft
                  size={18}
                  className="transition-transform duration-200 group-hover:-translate-x-1.5"
                />
              </button>
              {!selectedTeam ? (
                <p className="mt-3 text-xs text-injaz-gold-soft/80">
                  اختر الفرقة المستلمة للمتابعة
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-[18px]">
            <TeamCard
              teams={teams}
              rollCall={rollCall}
              leader={TEAM_LEADER}
              selectedTeam={selectedTeam}
              onSelect={setSelectedTeam}
            />
            <WeatherCard />
          </div>
        </div>

        {/* FOOTER */}
        <footer className="relative z-10 mt-5 flex items-center justify-between border-t border-white/10 pt-[18px] text-[11px] tracking-wide opacity-55 animate-fade-slide-5">
          <span>{FOOTER_LABEL}</span>
          <span>{VERSION_LABEL}</span>
        </footer>
      </div>
    </div>
  );
}

// ---------- Sub-components ----------

function AlertPill({ level }: { level: AlertLevel }) {
  const palette: Record<
    AlertLevel,
    { wrap: string; dot: string }
  > = {
    white: {
      wrap: "border-white/25 bg-white/10 text-white",
      dot: "bg-white",
    },
    orange: {
      wrap: "border-[#e89e40]/40 bg-[#e89e40]/15 text-[#f3b566]",
      dot: "bg-[#e89e40]",
    },
    red: {
      wrap: "border-[#e56050]/45 bg-[#c0392b]/20 text-[#ff8a7a]",
      dot: "bg-[#e56050]",
    },
  };
  const p = palette[level];
  const copy = ALERT_COPY[level];
  return (
    <span
      className={`inline-flex items-center gap-2.5 rounded-full border px-4 py-2 text-xs font-semibold tracking-wide ${p.wrap}`}
    >
      <span className={`relative h-2 w-2 rounded-full ${p.dot}`}>
        <span
          aria-hidden
          className={`absolute -inset-[3px] rounded-full opacity-40 animate-status-pulse ${p.dot}`}
        />
      </span>
      <span>
        {copy.label} — {copy.sub}
      </span>
    </span>
  );
}

function TeamCard({
  teams,
  rollCall,
  leader,
  selectedTeam,
  onSelect,
}: {
  teams: Team[] | null;
  rollCall: RollCall | null;
  leader: string;
  selectedTeam: string | null;
  onSelect: (name: string) => void;
}) {
  const cells = teams ?? [];
  const matchesSaved =
    rollCall != null && selectedTeam != null && rollCall.team === selectedTeam;

  return (
    <Card delayClass="opacity-0 animate-fade-slide-3">
      <CardHead label="الفرقة المستلمة لهذا اليوم">
        <Users size={16} />
      </CardHead>
      <div className="grid grid-cols-3 gap-2">
        {cells.length === 0
          ? [0, 1, 2].map((i) => <TeamCellSkeleton key={i} />)
          : cells.slice(0, 3).map((t) => {
              const isActive = selectedTeam === t.name;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelect(t.name)}
                  aria-pressed={isActive}
                  className={`relative rounded-xl border px-3 pb-4 pt-[18px] text-center transition-colors ${
                    isActive
                      ? "border-injaz-gold-soft/50 bg-gradient-to-b from-injaz-gold-soft/20 to-injaz-gold-soft/5"
                      : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                  }`}
                >
                  {isActive ? (
                    <span
                      aria-hidden
                      className="absolute end-2 top-2 h-1.5 w-1.5 rounded-full bg-injaz-gold-soft shadow-[0_0_10px_#e8d9b8]"
                    />
                  ) : null}
                  <div
                    className={`font-display text-[40px] font-extrabold leading-none ${
                      isActive ? "text-injaz-gold-soft" : "text-white/95"
                    }`}
                  >
                    {t.name}
                  </div>
                </button>
              );
            })}
      </div>
      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-1 border-t border-white/10 pt-3.5 text-xs opacity-70">
        {matchesSaved ? (
          <span>
            قائد الفرقة:{" "}
            <b className="font-semibold text-injaz-gold-soft opacity-100">{leader}</b>
          </span>
        ) : selectedTeam ? (
          <span className="opacity-80">
            سيتم اعتماد الفرقة <b className="opacity-100">{selectedTeam}</b> في التكميل اليومي
          </span>
        ) : (
          <span className="opacity-80">اختر الفرقة المستلمة لليوم</span>
        )}
      </div>
    </Card>
  );
}

function TeamCellSkeleton() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 pb-4 pt-[18px] text-center">
      <div className="mx-auto mb-1 h-9 w-9 animate-pulse rounded bg-white/10" />
      <div className="mx-auto h-2 w-12 animate-pulse rounded bg-white/10" />
    </div>
  );
}

function WeatherCard() {
  return (
    <Card delayClass="opacity-0 animate-fade-slide-4">
      <CardHead label="حالة الجو · جازان">
        <span className="text-[11px] opacity-50">محدّث الآن</span>
      </CardHead>
      <div className="grid grid-cols-[auto_1fr] items-center gap-[18px]">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-injaz-gold-soft/25 bg-gradient-to-br from-injaz-gold-soft/25 to-injaz-gold-soft/5 text-injaz-gold-soft">
          <Sun size={32} strokeWidth={1.7} />
        </div>
        <div>
          <div className="flex items-baseline gap-1 font-display text-[38px] font-bold leading-none tabular-nums">
            {WEATHER.temp}
            <small className="text-base font-medium opacity-60">{WEATHER.unit}</small>
          </div>
          <div className="mt-1 text-[13px] opacity-70">{WEATHER.meta}</div>
        </div>
      </div>
      <div className="mt-3.5 grid grid-cols-3 gap-2.5 border-t border-white/10 pt-3.5">
        <Stat label="الرطوبة" value={WEATHER.humidity} />
        <Stat label="الرياح" value={WEATHER.wind} />
        <Stat label="الرؤية" value={WEATHER.visibility} />
      </div>
    </Card>
  );
}

function Card({
  delayClass = "",
  children,
}: {
  delayClass?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[22px] border border-[rgba(245,241,230,.16)] bg-[linear-gradient(180deg,rgba(245,241,230,.04),rgba(245,241,230,.02)),rgba(6,26,16,.55)] px-6 py-[22px] shadow-[0_30px_80px_-30px_rgba(0,0,0,.55),inset_0_1px_0_rgba(245,241,230,.06)] backdrop-blur-[8px] ${delayClass}`}
    >
      <div className="relative">{children}</div>
    </div>
  );
}

function CardHead({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-3.5 flex items-center justify-between">
      <span className="text-[11px] font-medium uppercase tracking-[0.18em] opacity-55">
        {label}
      </span>
      <span className="opacity-70">{children}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-[11px] tracking-wide opacity-60">
      {label}
      <b className="mt-0.5 block text-sm font-semibold text-white opacity-100">
        {value}
      </b>
    </div>
  );
}

// (Old shape.webp + glint backdrop removed — replaced by the shared
// <InjazAuraBackdrop /> used across all welcome surfaces.)
