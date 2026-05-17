import { ArrowLeft, Clipboard, User } from "lucide-react";
import type { TakmeelSummary } from "../takmeelView";

const AR = "٠١٢٣٤٥٦٧٨٩";
const ar = (n: number) => String(n).replace(/\d/g, (d) => AR[Number(d)]);

function SummaryText({ s }: { s: TakmeelSummary }) {
  if (s.kind === "empty") {
    // The page guards this (CompletionPanel shows the empty state); render
    // nothing here defensively rather than a broken "منذ null" sentence.
    return null;
  }
  if (s.kind === "allComplete") {
    return <>أكملت جميع المراكز تكميل اليوم — يمكنك الانتقال إلى لوحة التحكم.</>;
  }
  if (s.kind === "beforeDeadline") {
    return (
      <>
        لم يبدأ وقت رفع التكميل بعد (٩:٠٠ ص) — <b>{ar(s.pendingCount)}</b> مركز قيد الانتظار.
      </>
    );
  }
  // pendingAfterDeadline
  return (
    <>
      لديك <b>{s.pendingCount === 1 ? "مركز واحد" : `${ar(s.pendingCount)} مراكز`}</b> لم
      يُكمل تكميل اليوم حتى الآن — <b>{s.firstPendingName}</b> متأخّر. ابدأ بمتابعته قبل
      الانتقال إلى لوحة التحكم.
    </>
  );
}

export function WelcomeGreeting({
  summary,
  onPrimary,
}: {
  summary: TakmeelSummary;
  onPrimary: () => void;
}) {
  return (
    <section className="flex flex-col gap-[22px]">
      <div className="inline-flex items-center gap-2 self-start text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d9c79a] before:h-px before:w-[22px] before:bg-[rgba(217,199,154,.4)] before:content-[''] after:h-px after:w-[22px] after:bg-[rgba(217,199,154,.4)] after:content-['']">
        INJAZ · OPERATIONS CENTER
      </div>

      <h1 className="m-0 font-display text-[clamp(40px,5.6vw,76px)] font-extrabold leading-[1.05] tracking-[-.025em] text-[#f5f1e6]">
        مرحباً بعودتك،
        <br />
        <span className="bg-[linear-gradient(180deg,#e8d8aa,#d9c79a)] bg-clip-text text-transparent">
          ربيع ٩.
        </span>
      </h1>

      <div className="flex flex-wrap items-center gap-2 text-[14px] text-[#a9b8ad]">
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[rgba(245,241,230,.10)] bg-[rgba(245,241,230,.04)] px-[11px] py-[5px] text-[12.5px] font-medium text-[#e6dfcc]">
          <User size={13} aria-hidden="true" className="text-[#a9b8ad]" />
          مدير شعبة العمليات
        </span>
      </div>

      <p className="m-0 mt-0.5 max-w-[540px] text-[15.5px] leading-[1.7] text-[#e6dfcc] [&_b]:font-semibold [&_b]:text-[#e8d8aa]">
        <SummaryText s={summary} />
      </p>

      <div className="mt-1.5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onPrimary}
          className="group inline-flex items-center gap-3.5 rounded-full bg-injaz-gold-soft px-8 py-[18px] text-[15px] font-semibold tracking-wide text-[#0d3a24] shadow-[0_12px_32px_rgba(232,217,184,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_44px_rgba(232,217,184,0.28)]"
        >
          الانتقال إلى لوحة التحكم
          <ArrowLeft size={18} aria-hidden="true" className="transition-transform duration-200 group-hover:-translate-x-1.5" />
        </button>
        <button
          type="button"
          className="inline-flex cursor-default items-center gap-2.5 rounded-full border border-white/15 bg-white/5 px-6 py-[18px] text-[14px] font-semibold text-white/85 transition-colors hover:bg-white/10"
        >
          <Clipboard size={14} aria-hidden="true" />
          تكميل المراكز المعلّقة
        </button>
      </div>
    </section>
  );
}
