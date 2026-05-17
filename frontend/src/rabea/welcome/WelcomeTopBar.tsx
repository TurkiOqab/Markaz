import { Bell, Calendar } from "lucide-react";

export function WelcomeTopBar({ dateLabel }: { dateLabel: string }) {
  return (
    <header className="flex min-h-[44px] flex-nowrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="relative grid h-11 w-11 flex-none place-items-center rounded-full border-[1.5px] border-[#d9c79a] text-[18px] font-extrabold text-[#d9c79a] shadow-[inset_0_0_0_4px_rgba(217,199,154,.10)] before:absolute before:inset-1.5 before:rounded-full before:border before:border-dashed before:border-[rgba(217,199,154,.55)] before:content-['']"
        >
          <span className="font-display">إ</span>
        </span>
        <div>
          <div className="text-[14.5px] font-bold tracking-tight text-[#f5f1e6]">نظام إنجاز</div>
          <div className="mt-px text-[11.5px] text-[#a9b8ad]">لوحة شعبة العمليات</div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 text-[12.5px] text-[#a9b8ad] max-[560px]:hidden">
        <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(245,241,230,.10)] bg-[rgba(245,241,230,.04)] py-1 pl-3 pr-1">
          <span className="text-[11.5px] font-medium text-[#a9b8ad]">حالة الإنذار</span>
          <span className="h-3.5 w-px bg-[rgba(245,241,230,.10)]" />
          <span className="h-[7px] w-[7px] rounded-full bg-[#46a96a] shadow-[0_0_10px_#46a96a] motion-safe:animate-pulse" />
          <span className="rounded-full border border-[rgba(70,169,106,.28)] bg-[rgba(70,169,106,.16)] px-2.5 py-0.5 text-[12.5px] font-semibold text-[#f5f1e6]">
            عادي
          </span>
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(245,241,230,.10)] bg-[rgba(245,241,230,.04)] px-[11px] py-1.5">
          <Calendar size={13} />
          {dateLabel}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="التنبيهات"
          className="relative grid h-[34px] w-[34px] place-items-center rounded-[10px] border border-[rgba(245,241,230,.10)] bg-[rgba(245,241,230,.04)] text-[#e6dfcc] hover:bg-[rgba(245,241,230,.07)]"
        >
          <Bell size={16} />
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full border-2 border-[#061a10] bg-[#e1a04a] px-1 text-[10px] font-bold text-[#1a0f04]">
            ٣
          </span>
        </button>
      </div>
    </header>
  );
}
