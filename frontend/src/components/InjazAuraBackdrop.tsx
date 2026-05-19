import { useId } from "react";

/**
 * Shared ambient backdrop for the Injaz welcome surfaces (the duty/Rabea
 * welcome pages, the substitute-takmeel views, and the login brand stage).
 *
 * Composition (faithful to the welcome-duty handoff):
 *  - deep-green radial + linear wash
 *  - faint dot grid with an elliptical mask
 *  - centre vignette
 *  - gold-tinted dotted KSA map
 *  - four desynced gold scan lines (SMIL)
 *
 * `contained` scopes the layers to the nearest `relative`/`overflow-hidden`
 * ancestor (used for the login green column); the default fills the viewport
 * (used by the full-screen welcome pages).
 */
export function InjazAuraBackdrop({ contained = false }: { contained?: boolean }) {
  // Unique gradient ids so two instances never collide (e.g. nested routes).
  const raw = useId().replace(/[^a-zA-Z0-9]/g, "");
  const lineId = `aura-line-${raw}`;
  const softId = `aura-soft-${raw}`;

  const pos = contained ? "absolute" : "fixed";
  const zBg = contained ? "z-0" : "-z-20";
  const zShapes = contained ? "z-0" : "-z-10";

  return (
    <>
      <div
        data-testid="injaz-aura"
        aria-hidden="true"
        className={`pointer-events-none ${pos} inset-0 ${zBg} overflow-hidden`}
        style={{
          background:
            "radial-gradient(1100px 600px at 80% -10%, rgba(70,169,106,.18), transparent 60%), radial-gradient(800px 500px at 10% 100%, rgba(217,199,154,.06), transparent 60%), linear-gradient(160deg, #062319 0%, #061a10 50%, #04130b 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(245,241,230,.06) 1px, transparent 1.5px)",
            backgroundSize: "18px 18px",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 60% at 50% 45%, #000 30%, transparent 75%)",
            maskImage:
              "radial-gradient(ellipse 70% 60% at 50% 45%, #000 30%, transparent 75%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 30%, transparent, rgba(0,0,0,.35) 90%)",
          }}
        />
      </div>

      <div
        aria-hidden="true"
        className={`pointer-events-none ${pos} inset-0 ${zShapes} overflow-hidden`}
      >
        <div
          className="absolute left-1/2 top-1/2 w-[min(1100px,95vw)] -translate-x-1/2 -translate-y-1/2 opacity-[0.18]"
          style={{
            aspectRatio: "306 / 237",
            background: "url('/shape-ksa.webp') center/contain no-repeat",
            WebkitMaskImage:
              "radial-gradient(ellipse 90% 80% at 50% 50%, #000 50%, transparent 95%)",
            maskImage:
              "radial-gradient(ellipse 90% 80% at 50% 50%, #000 50%, transparent 95%)",
            filter: "brightness(1.4) sepia(.6) hue-rotate(355deg) saturate(2)",
          }}
        />
        <svg
          viewBox="0 0 1600 900"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          <defs>
            <linearGradient id={lineId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#e8d9b8" stopOpacity="0" />
              <stop offset="50%" stopColor="#e8d9b8" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#e8d9b8" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={softId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#e8d9b8" stopOpacity="0" />
              <stop offset="50%" stopColor="#e8d9b8" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#e8d9b8" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect
            x="0" y="200" width="560" height="1.2"
            fill={`url(#${softId})`}
            style={{ filter: "drop-shadow(0 0 4px rgba(232,217,184,.25))" }}
          >
            <animate attributeName="x" values="-300;1700;-300" dur="22s" repeatCount="indefinite" />
          </rect>
          <rect
            x="0" y="380" width="720" height="1.6"
            fill={`url(#${lineId})`}
            style={{ filter: "drop-shadow(0 0 4px rgba(232,217,184,.25))" }}
          >
            <animate attributeName="x" values="-360;1700;-360" dur="18s" repeatCount="indefinite" begin="-5s" />
          </rect>
          <rect
            x="0" y="560" width="500" height="1.2"
            fill={`url(#${softId})`}
            style={{ filter: "drop-shadow(0 0 4px rgba(232,217,184,.25))" }}
          >
            <animate attributeName="x" values="-280;1700;-280" dur="26s" repeatCount="indefinite" begin="-10s" />
          </rect>
          <rect
            x="0" y="720" width="640" height="1.4"
            fill={`url(#${lineId})`}
            style={{ filter: "drop-shadow(0 0 4px rgba(232,217,184,.25))" }}
          >
            <animate attributeName="x" values="-340;1700;-340" dur="20s" repeatCount="indefinite" begin="-13s" />
          </rect>
        </svg>
      </div>
    </>
  );
}
