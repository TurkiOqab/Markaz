import { Check, Hourglass } from "lucide-react";
import type { CenterView, LateTier } from "../takmeelView";

const TIER_TEXT: Record<LateTier, string> = {
  yellow: "text-[#f3b566]",
  orange: "text-[#f0a04b]",
  red: "text-[#ff8a7a] [text-shadow:0_0_8px_rgba(255,138,122,.45)]",
};

const TIER_ICON_BG: Record<LateTier, string> = {
  yellow: "bg-[rgba(243,182,102,.16)]",
  orange: "bg-[rgba(240,160,75,.16)]",
  red: "bg-[rgba(255,138,122,.18)]",
};

export function CentersList({ centers }: { centers: CenterView[] }) {
  return (
    <div className="mt-[18px] border-t border-dashed border-[rgba(245,241,230,.16)] pt-[18px]">
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="m-0 text-[12px] font-semibold tracking-[0.04em] text-[#a9b8ad]">
          تفاصيل المراكز
        </h3>
        <span className="cursor-default text-[11.5px] text-[#d9c79a]">إدارة المراكز ←</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {centers.map((c) => {
          const ok = c.submitted;
          // Pending late centers graduate by tier; pending-before-deadline
          // keeps the neutral amber; submitted is green/neutral.
          const lateColor = c.lateTier ? TIER_TEXT[c.lateTier] : "text-[#e1a04a]";
          const iconCls = ok
            ? "bg-[rgba(70,169,106,.16)] text-[#46a96a]"
            : c.lateTier
              ? `${TIER_ICON_BG[c.lateTier]} ${TIER_TEXT[c.lateTier]}`
              : "bg-[rgba(225,160,74,.16)] text-[#e1a04a]";
          return (
            <div
              key={c.id}
              className="grid grid-cols-[22px_1fr_auto] items-center gap-3 rounded-[12px] border border-[rgba(245,241,230,.10)] bg-[rgba(245,241,230,.025)] px-3 py-2.5 transition-colors hover:border-[rgba(245,241,230,.16)] hover:bg-[rgba(245,241,230,.05)]"
            >
              <span
                className={`grid h-[22px] w-[22px] place-items-center rounded-full ${iconCls}`}
                aria-hidden="true"
              >
                {ok ? <Check size={13} /> : <Hourglass size={13} />}
              </span>
              <div>
                <div className="text-[13.5px] font-semibold text-[#f5f1e6]">{c.regionLabel}</div>
                <div
                  className={`mt-px text-[11.5px] ${ok ? "text-[#a9b8ad]" : lateColor}`}
                >
                  {c.subText}
                </div>
              </div>
              <div className="text-left text-[11.5px] text-[#a9b8ad]">
                <div
                  className={`font-mono text-[12px] font-medium tabular-nums ${
                    ok ? "text-[#e6dfcc]" : lateColor
                  }`}
                >
                  {c.metaTime}
                </div>
                <div>{c.metaSub}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
