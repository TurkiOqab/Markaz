import { Construction } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { isRabeaMode } from "./rabeaSession";

export function OperationsPlaceholderPage() {
  const navigate = useNavigate();

  if (!isRabeaMode()) {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#0a2818] via-[#0d3a24] to-[#14502f] px-8 text-center text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.15]"
      >
        <img
          src="/shape.webp"
          alt=""
          className="w-[70%] max-w-[900px] animate-shape-drift-slow"
        />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-5">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-injaz-gold-soft/25 bg-injaz-gold-soft/10 text-injaz-gold-soft">
          <Construction size={32} strokeWidth={1.7} />
        </span>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          لوحة شعبة العمليات — قيد التطوير
        </h1>
        <p className="max-w-[420px] text-sm leading-relaxed opacity-75">
          هذه اللوحة قيد الإنشاء وستتوفر في تحديث قادم.
        </p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold transition-colors hover:bg-white/10"
        >
          العودة للصفحة الترحيبية
        </button>
      </div>
    </main>
  );
}
