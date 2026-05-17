import { Clipboard } from "lucide-react";
import type { TakmeelView } from "../takmeelView";
import { CountRing } from "./CountRing";
import { CentersList } from "./CentersList";

const AR = "٠١٢٣٤٥٦٧٨٩";
const ar = (s: string | number) => String(s).replace(/\d/g, (d) => AR[Number(d)]);

export function CompletionPanel({
  view,
  dateLabel,
}: {
  view: TakmeelView;
  dateLabel: string;
}) {
  return (
    <aside className="rounded-[22px] border border-[rgba(245,241,230,.16)] bg-[linear-gradient(180deg,rgba(245,241,230,.04),rgba(245,241,230,.02)),rgba(6,26,16,.55)] p-[22px] shadow-[0_30px_80px_-30px_rgba(0,0,0,.55),inset_0_1px_0_rgba(245,241,230,.06)] backdrop-blur-[8px]">
      <div className="mb-[18px] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid h-[30px] w-[30px] place-items-center rounded-[9px] bg-[rgba(217,199,154,.14)] text-[#d9c79a]">
            <Clipboard size={16} />
          </span>
          <div>
            <h2 className="m-0 text-[14px] font-semibold text-[#e6dfcc]">حالة التكميل اليومي</h2>
            <div className="mt-px text-[11.5px] text-[#a9b8ad]">المراكز التابعة لشعبة العمليات</div>
          </div>
        </div>
        <div className="text-left text-[11px] text-[#a9b8ad]">
          <b className="block text-[12.5px] font-medium text-[#e6dfcc]">{dateLabel}</b>
          {view.state === "empty" ? null : (
            <span>
              {view.beforeDeadline ? "يبدأ ٩:٠٠ ص" : "تم تجاوز الموعد ٩:٠٠ ص"}
            </span>
          )}
        </div>
      </div>

      {view.state === "empty" ? (
        <div className="grid place-items-center gap-2 py-10 text-center">
          <p className="m-0 text-[14px] text-[#e6dfcc]">لم يتم تسجيل أي مراكز بعد</p>
          <span className="cursor-default rounded-[12px] border border-[rgba(245,241,230,.16)] px-4 py-2 text-[12.5px] text-[#a9b8ad]">
            إضافة مركز
          </span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-[160px_1fr] items-center gap-[22px] px-1 pb-4 pt-3 max-[980px]:grid-cols-[130px_1fr] max-[560px]:grid-cols-1 max-[560px]:justify-items-center">
            <CountRing
              completedLabel={ar(view.completedCount)}
              totalLabel={ar(view.total)}
              dash={view.ringDash}
              circumference={view.ringCircumference}
            />
            <div>
              <div className="mb-1 text-[13px] text-[#a9b8ad]">نسبة الإنجاز اليوم</div>
              <div className="text-[22px] font-bold leading-tight tracking-tight text-[#f5f1e6]">
                <b className="text-[#e8d8aa]">{view.percentLabel}</b> من المراكز
                <br />
                أكملت التكميل
              </div>
              <div className="mt-3.5 flex gap-2.5">
                <div className="flex-1 rounded-[12px] border border-[rgba(245,241,230,.10)] bg-[rgba(245,241,230,.04)] px-3 py-2.5">
                  <div className="flex items-baseline gap-1 text-[20px] font-bold text-[#f5f1e6]">
                    <span className="h-2 w-2 rounded-full bg-[#46a96a] shadow-[0_0_8px_#46a96a]" />
                    <span className="tabular-nums">{ar(view.completedCount)}</span>
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-[#a9b8ad]">مكتمل</div>
                </div>
                <div className="flex-1 rounded-[12px] border border-[rgba(245,241,230,.10)] bg-[rgba(245,241,230,.04)] px-3 py-2.5">
                  <div className="flex items-baseline gap-1 text-[20px] font-bold text-[#f5f1e6]">
                    <span className="h-2 w-2 rounded-full bg-[#e1a04a] shadow-[0_0_8px_#e1a04a]" />
                    <span className="tabular-nums">{ar(view.pendingCount)}</span>
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-[#a9b8ad]">بانتظار التكميل</div>
                </div>
              </div>
            </div>
          </div>

          {view.state === "complete" ? (
            <div className="mt-[18px] flex items-center justify-center gap-2 rounded-[14px] border border-[rgba(70,169,106,.28)] bg-[rgba(70,169,106,.16)] py-3 text-[13.5px] font-semibold text-[#46a96a]">
              <span aria-hidden="true">✓</span> جميع المراكز أكملت اليوم
            </div>
          ) : null}

          <CentersList centers={view.centers} />
        </>
      )}
    </aside>
  );
}
