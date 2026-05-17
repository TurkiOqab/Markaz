import { Clipboard } from "lucide-react";
import type { LateTier, OverallState, TakmeelView } from "./takmeelView";

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const toArabicDigits = (input: string): string =>
  input.replace(/\d/g, (d) => AR_DIGITS[Number(d)]);

const BAR_COLOR: Record<OverallState, string> = {
  empty: "bg-white/20",
  pending: "bg-white/25",
  none: "bg-[#e56050]",
  partial: "bg-[#e89e40]",
  complete: "bg-injaz-green-400",
};

const TIER_TEXT: Record<LateTier, string> = {
  yellow: "text-[#f3b566]",
  orange: "text-[#f0a04b]",
  red: "text-[#ff8a7a]",
};

export function TakmeelStatusCard({ view }: { view: TakmeelView }) {
  if (view.state === "empty") {
    return (
      <Shell>
        <p className="text-center text-sm leading-relaxed opacity-85">
          {view.headline}
          <br />
          <span className="opacity-70">الرجاء التواصل مع مدير النظام</span>
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mb-5 flex items-center gap-2.5 text-[13px] font-medium uppercase tracking-[0.16em] opacity-70">
        <Clipboard size={16} />
        حالة التكميل اليومي
      </div>

      <div className="mb-1 text-center font-display text-[56px] font-extrabold leading-none tabular-nums">
        {toArabicDigits(String(view.submittedCount))} / {toArabicDigits(String(view.total))}
      </div>

      <div className="mx-auto mb-2 mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-500 ${BAR_COLOR[view.state]}`}
          style={{ width: `${view.percent}%` }}
        />
      </div>
      <div className="mb-5 text-center text-sm font-semibold opacity-85">
        {view.headline}
      </div>

      <div className="space-y-2 border-t border-white/10 pt-4">
        {view.centers.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="flex items-center gap-2">
              <span aria-hidden>{c.submitted ? "✅" : "⏳"}</span>
              <span className="opacity-90">مركز {c.id}</span>
              {c.fastest ? (
                <span className="text-injaz-gold-soft">⚡ (الأسرع)</span>
              ) : null}
            </span>
            <span className="tabular-nums opacity-80">
              {c.submitted ? (
                c.submittedLabel
              ) : c.lateLabel ? (
                <span className={c.lateTier ? TIER_TEXT[c.lateTier] : undefined}>
                  {c.lateLabel}
                </span>
              ) : (
                <span className="opacity-50">—</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-[18px] border border-white/10 bg-white/[0.05] px-7 py-6 text-white backdrop-blur-md">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.05), transparent 50%)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
