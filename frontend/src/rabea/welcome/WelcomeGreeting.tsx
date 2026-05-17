import { ArrowLeft, Clipboard, User } from "lucide-react";
import type { TakmeelSummary } from "../takmeelView";

function SummaryText({ s }: { s: TakmeelSummary }) {
  if (s.kind === "allComplete") {
    return <>أكملت جميع المراكز تكميل اليوم — يمكنك الانتقال إلى لوحة التحكم.</>;
  }
  if (s.kind === "beforeDeadline") {
    return (
      <>
        لم يبدأ وقت رفع التكميل بعد (٩:٠٠ ص) — <b>{s.pendingCount}</b> مركز قيد الانتظار.
      </>
    );
  }
  // pendingAfterDeadline
  return (
    <>
      لديك <b>{s.pendingCount === 1 ? "مركز واحد" : `${s.pendingCount} مراكز`}</b> لم
      يُكمل تكميل اليوم حتى الآن — <b>{s.firstPendingName}</b> متأخّر منذ{" "}
      <b>{s.firstPendingDelayLabel}</b>. ابدأ بمتابعته قبل الانتقال إلى لوحة التحكم.
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
          <User size={13} className="text-[#a9b8ad]" />
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
          className="group inline-flex items-center gap-2.5 rounded-[12px] bg-[linear-gradient(180deg,#e8d8aa,#d9c79a)] px-5 py-3 text-[14px] font-semibold text-[#1d160a] shadow-[0_10px_30px_-10px_rgba(217,199,154,.45),inset_0_1px_0_rgba(255,255,255,.4),inset_0_-1px_0_rgba(0,0,0,.10)] transition-[filter] hover:brightness-105"
        >
          الانتقال إلى لوحة التحكم
          <ArrowLeft size={16} className="transition-transform duration-200 group-hover:-translate-x-[3px]" />
        </button>
        <button
          type="button"
          className="inline-flex cursor-default items-center gap-2.5 rounded-[12px] border border-[rgba(245,241,230,.16)] px-5 py-3 text-[14px] font-semibold text-[#e6dfcc] hover:bg-[rgba(245,241,230,.04)]"
        >
          <Clipboard size={14} />
          تكميل المراكز المعلّقة
        </button>
      </div>
    </section>
  );
}
