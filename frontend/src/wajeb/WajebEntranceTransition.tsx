import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

// Matches Injaz/Rabea ENTER_MS so the choreography feels identical.
const ENTER_MS = 1000;

export type WajebEntrancePhase = "idle" | "sweep";

interface ContextValue {
  phase: WajebEntrancePhase;
  start: () => void;
}

const WajebEntranceContext = createContext<ContextValue>({
  phase: "idle",
  start: () => {},
});

export function useWajebEntrance(): ContextValue {
  return useContext(WajebEntranceContext);
}

export function WajebEntranceTransitionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [phase, setPhase] = useState<WajebEntrancePhase>("idle");
  const navigate = useNavigate();
  const timers = useRef<number[]>([]);

  function clearTimers() {
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
  }

  function start() {
    if (phase !== "idle") return;
    clearTimers();
    setPhase("sweep");
    timers.current.push(
      window.setTimeout(() => {
        navigate("/duty-welcome", { replace: true });
        setPhase("idle");
      }, ENTER_MS),
    );
  }

  useEffect(() => () => clearTimers(), []);

  return (
    <WajebEntranceContext.Provider value={{ phase, start }}>
      {children}
      {phase === "sweep" ? <WajebGoldSweepOverlay /> : null}
    </WajebEntranceContext.Provider>
  );
}

// Visual duplicate of Injaz's GoldSweepOverlay — kept independent so the Injaz
// file is never touched (same rationale as RabeaEntranceTransition).
function WajebGoldSweepOverlay() {
  return (
    <div
      aria-hidden
      data-testid="wajeb-sweep"
      className="pointer-events-none fixed inset-0 z-[110] overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#062319] via-[#061a10] to-[#04130b]" />
      <div
        className="absolute inset-0 animate-veil-sweep will-change-transform"
        style={{
          background:
            "linear-gradient(270deg, rgba(13,58,36,0) 0%, rgba(13,58,36,0.18) 60%, rgba(10,40,24,0.35) 100%)",
        }}
      />
      <GoldLine top="28%" thickness="0.5px" opacity={0.28} />
      <GoldLine top="50%" thickness="1px" opacity={0.45} />
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
