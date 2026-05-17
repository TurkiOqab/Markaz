import { AlertCircle, Eye, EyeOff, Lock, User } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { ApiRequestError } from "../api/client";
import { useAuth } from "../auth/useAuth";
import { Loader } from "../components/Loader";
import { useLoginTransition } from "../components/LoginTransition";
import { useRabeaWelcome } from "../rabea/RabeaWelcomeTransition";
import { RABEA_PASSWORD, RABEA_USERNAME, setRabeaMode } from "../rabea/rabeaSession";

/**
 * Editorial login (Variant 3 of the Injaz handoff): a two-column layout — a
 * dark green "stage" on the visual left with the brand silhouette, status
 * pill, and headline; a paper-toned form panel on the right.
 *
 * The page itself slides out as a single unit when login succeeds (driven by
 * `useLoginTransition`). The layout collapses to form-only below 900px.
 */
export function LoginPage() {
  const { loading, setupComplete, authenticated, login } = useAuth();
  const { phase, start } = useLoginTransition();
  const { start: startRabea } = useRabeaWelcome();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return <Loader fullPage />;
  }
  if (!setupComplete) {
    return <Navigate to="/setup" replace />;
  }
  // While the transition is mid-flight (overlay is on screen), don't auto-
  // redirect on `authenticated` — let the choreography play out.
  if (authenticated && phase === "idle") {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!username || !password) {
      setError("الحقول مطلوبة لإكمال تسجيل الدخول");
      return;
    }
    if (username === RABEA_USERNAME && password === RABEA_PASSWORD) {
      // Frontend-only Rabea gate: never hits the backend (REB9 is not a real
      // account). Injaz path below is unchanged for every other user.
      setRabeaMode(true);
      startRabea();
      return;
    }
    setSubmitting(true);
    try {
      await login(username, password);
      start();
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : "فشل تسجيل الدخول";
      setError(msg);
      setSubmitting(false);
    }
  }

  // Stage 1: blur + scale-down + fade out. Stages 2/3: stay invisible (the
  // welcome panel has fully taken over the viewport and is layering on top).
  const pageSlideClass =
    phase === "enter"
      ? "animate-login-blur-out"
      : phase === "hold" || phase === "exit"
        ? "opacity-0"
        : "";

  return (
    <main
      className={`flex min-h-screen w-full bg-white will-change-transform ${pageSlideClass}`}
    >
      {/* Form side — first in DOM so it lands on the visual right in RTL. */}
      <section
        className="flex flex-1 flex-col overflow-y-auto bg-injaz-paper px-12 py-12"
      >
        <div className="m-auto w-full max-w-[380px]">
          <p
            className="mb-2 text-[13px] font-medium tracking-wide text-injaz-green-700 opacity-0 animate-fade-slide-2"
          >
            — أهلاً بك في إنجاز
          </p>
          <h2
            className="mb-2 font-display text-[36px] font-bold leading-tight tracking-tight text-injaz-ink-900 opacity-0 animate-fade-slide-2"
          >
            تسجيل الدخول
          </h2>
          <p
            className="mb-8 text-sm text-injaz-ink-500 opacity-0 animate-fade-slide-3"
          >
            سجل دخولك بحسابك للوصول الى لوحة التحكم.
          </p>

          {error ? (
            <div
              key={error}
              role="alert"
              className="mb-4 flex animate-shake items-center gap-2 rounded-lg border border-[#f5d3cc] bg-[#fdf2f0] px-3 py-2.5 text-[13px] text-injaz-danger"
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} noValidate>
            <FieldGroup className="opacity-0 animate-fade-slide-3">
              <FieldLabel htmlFor="login-username">اسم المستخدم</FieldLabel>
              <FieldWrap>
                <FieldLeadIcon>
                  <User size={18} />
                </FieldLeadIcon>
                <FieldInput
                  id="login-username"
                  type="text"
                  placeholder="اسم المستخدم"
                  value={username}
                  autoComplete="username"
                  onChange={(e) => setUsername(e.target.value)}
                />
              </FieldWrap>
            </FieldGroup>

            <FieldGroup className="opacity-0 animate-fade-slide-4">
              <FieldLabel htmlFor="login-password">كلمة المرور</FieldLabel>
              <FieldWrap>
                <FieldLeadIcon>
                  <Lock size={18} />
                </FieldLeadIcon>
                <div className="relative min-w-0 flex-1">
                  <FieldInput
                    id="login-password"
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••••"
                    value={password}
                    autoComplete="current-password"
                    onChange={(e) => setPassword(e.target.value)}
                    className="!w-full pe-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? "إخفاء كلمة المرور" : "عرض كلمة المرور"}
                    className="absolute end-2.5 top-1/2 flex -translate-y-1/2 items-center rounded-md p-1.5 text-injaz-ink-500 transition-colors hover:bg-injaz-green-50 hover:text-injaz-green-800"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </FieldWrap>
            </FieldGroup>

            <div
              className="mb-6 mt-1 flex items-center justify-between opacity-0 animate-fade-slide-4"
            >
              <label className="flex cursor-pointer select-none items-center gap-2 text-[13px] text-injaz-ink-700">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span
                  aria-hidden
                  className="grid h-[18px] w-[18px] flex-shrink-0 place-items-center rounded-[5px] border-[1.5px] border-injaz-ink-300 bg-white transition-colors after:hidden after:h-[9px] after:w-[5px] after:translate-y-[-1px] after:rotate-45 after:border-b-2 after:border-r-2 after:border-white after:content-[''] peer-checked:border-injaz-green-700 peer-checked:bg-injaz-green-700 peer-checked:after:block"
                />
                تذكرني
              </label>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="text-[13px] font-medium text-injaz-green-700 transition-colors hover:text-injaz-green-900 hover:underline hover:underline-offset-[3px]"
              >
                نسيت كلمة المرور؟
              </a>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-[10px] bg-injaz-green-700 px-5 py-3.5 text-[15px] font-semibold tracking-wide text-white opacity-0 transition-all duration-200 animate-fade-slide-5 hover:-translate-y-px hover:bg-injaz-green-800 hover:shadow-[0_8px_20px_rgba(26,107,61,0.25)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? (
                <span
                  aria-hidden
                  className="h-4 w-4 animate-spin-fast rounded-full border-2 border-white/30 border-t-white"
                />
              ) : null}
              <span>{submitting ? "جارٍ التحقق..." : "تسجيل الدخول"}</span>
            </button>
          </form>

          <p
            className="mt-6 text-center text-xs text-injaz-ink-500 opacity-0 animate-fade-slide-6"
          >
            بحاجة إلى مساعدة؟ تواصل مع{" "}
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="font-medium text-injaz-green-700 transition-colors hover:text-injaz-green-900 hover:underline hover:underline-offset-[3px]"
            >
              الدعم الفني
            </a>
          </p>
        </div>
      </section>

      {/* Brand stage — visually on the left in RTL. Hidden on small screens. */}
      <aside
        className="relative hidden flex-col overflow-hidden bg-gradient-to-b from-[#0d3a24] via-[#14502f] to-[#1a6b3d] px-14 py-12 text-white md:flex"
        style={{ flex: "1.4 1 0%" }}
        aria-hidden="false"
      >
        <BrandShape />

        <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-3.5 opacity-0 animate-fade-slide-1">
            <img
              src="/logo.png"
              alt="إنجاز"
              className="h-[52px] w-[52px] rounded-2xl object-contain"
            />
            <div className="text-[13px] leading-snug opacity-85">
              <b className="block text-sm font-semibold opacity-100">نظام إنجاز</b>
              لوحة تحكم العمليات
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs opacity-0 animate-fade-slide-1">
            <span className="relative h-2 w-2 rounded-full bg-injaz-green-400">
              <span
                aria-hidden
                className="absolute -inset-[3px] rounded-full bg-injaz-green-400 opacity-40 animate-status-pulse"
              />
            </span>
            <span>جميع الأنظمة تعمل</span>
          </div>
        </div>

        <div className="relative z-10 my-auto">
          <p className="mb-4 text-xs uppercase tracking-[0.2em] opacity-60 opacity-0 animate-fade-slide-2">
            INJAZ · CONTROL CENTER
          </p>
          <h1
            className="mb-5 max-w-[600px] font-display text-[64px] font-extrabold leading-[1.1] tracking-tight opacity-0 animate-fade-slide-3"
          >
            عمليات المراكز
            <br />
            <em className="font-extrabold not-italic text-injaz-gold-soft">
              تدار بدقة و فعالية.
            </em>
          </h1>
          <p
            className="max-w-[480px] text-base leading-[1.7] opacity-75 opacity-0 animate-fade-slide-4"
          >
            رؤية موحدة لكل ما يجري في أعمال المراكز
          </p>
        </div>
      </aside>
    </main>
  );
}

// ---------- Local field primitives (login-only, no global TextField changes) ----------

function FieldGroup({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={`mb-[18px] ${className}`}>{children}</div>;
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-[13px] font-medium tracking-wide text-injaz-ink-700"
    >
      {children}
    </label>
  );
}

function FieldWrap({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-2.5">{children}</div>;
}

function FieldLeadIcon({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center text-injaz-ink-500"
    >
      {children}
    </span>
  );
}

function FieldInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return (
    <input
      {...rest}
      className={`min-w-0 flex-1 rounded-[10px] border-[1.5px] border-injaz-ink-100 bg-white px-3.5 py-3.5 text-[15px] text-injaz-ink-900 outline-none transition-all placeholder:text-injaz-ink-300 hover:border-injaz-ink-300 focus:border-injaz-green-600 focus:shadow-[0_0_0_4px_rgba(34,133,80,0.12)] ${className}`}
    />
  );
}

// ---------- Brand silhouette + drifting scan lines ----------

function BrandShape() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      <div
        className="relative w-[95%] max-w-[820px] animate-shape-drift"
        style={{ filter: "drop-shadow(0 20px 60px rgba(0,0,0,0.25))" }}
      >
        <img
          src="/shape.webp"
          alt=""
          className="block h-auto w-full opacity-85"
        />
        <svg
          viewBox="0 0 306 237"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          <defs>
            <linearGradient id="loginGlint" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#e8d9b8" stopOpacity="0" />
              <stop offset="50%" stopColor="#e8d9b8" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#e8d9b8" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="loginGlintSoft" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#e8d9b8" stopOpacity="0" />
              <stop offset="50%" stopColor="#e8d9b8" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#e8d9b8" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect x="0" y="80" width="110" height="0.8" fill="url(#loginGlintSoft)">
            <animate attributeName="x" values="-40;220;-40" dur="11s" repeatCount="indefinite" />
          </rect>
          <rect x="0" y="125" width="140" height="1" fill="url(#loginGlint)">
            <animate
              attributeName="x"
              values="-50;230;-50"
              dur="9s"
              repeatCount="indefinite"
              begin="-3s"
            />
          </rect>
          <rect x="0" y="170" width="100" height="0.8" fill="url(#loginGlintSoft)">
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
  );
}
