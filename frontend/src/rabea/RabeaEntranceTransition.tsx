import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

// Matches Injaz LoginTransition ENTER_MS so the choreography feels identical.
const ENTER_MS = 1000;

export type RabeaEntrancePhase = "idle" | "sweep";

interface ContextValue {
  phase: RabeaEntrancePhase;
  start: () => void;
}

const RabeaEntranceContext = createContext<ContextValue>({
  phase: "idle",
  start: () => {},
});

export function useRabeaEntrance(): ContextValue {
  return useContext(RabeaEntranceContext);
}

export function RabeaEntranceTransitionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [phase, setPhase] = useState<RabeaEntrancePhase>("idle");
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
        navigate("/operations-welcome", { replace: true });
        setPhase("idle");
      }, ENTER_MS),
    );
  }

  useEffect(() => () => clearTimers(), []);

  return (
    <RabeaEntranceContext.Provider value={{ phase, start }}>
      {children}
      {phase === "sweep" ? <RabeaGoldSweepOverlay /> : null}
    </RabeaEntranceContext.Provider>
  );
}

// Visual duplicate of Injaz's GoldSweepOverlay (LoginTransition.tsx) — kept
// independent so the Injaz file is never touched. Adds a dark-green backdrop
// because the destination page mounts only after the navigate.
function RabeaGoldSweepOverlay() {
  return (
    <div
      aria-hidden
      data-testid="rabea-sweep"
      className="pointer-events-none fixed inset-0 z-[110] overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a2818] via-[#0d3a24] to-[#14502f]" />
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
