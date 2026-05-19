import {
  ArrowLeft,
  BarChart3,
  Bell,
  Calendar,
  Clock,
  FileText,
  MapPin,
  Play,
  Printer,
  Square,
  Target,
  UserCheck,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { today } from "../lib/clock";
import { deriveShift } from "./dutyShift";
import { getDutyMock } from "./dutyMock";
import type { AlertLevel } from "./dutyMock";
import { isWajebMode } from "./wajebSession";
import { InjazAuraBackdrop } from "../components/InjazAuraBackdrop";

const AR = "٠١٢٣٤٥٦٧٨٩";
const ar = (s: string | number) =>
  String(s).replace(/\d/g, (d) => AR[Number(d)]);

const DAYS = [
  "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت",
];
const MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

const pad2 = (n: number) => String(n).padStart(2, "0");

function hm12(d: Date) {
  const h24 = d.getHours();
  let h = h24 % 12;
  if (h === 0) h = 12;
  return `${ar(h)}:${ar(pad2(d.getMinutes()))}`;
}
// "٣:٢٨ م" / "٨:٠٠ ص"
function timeShort(d: Date): string {
  return `${hm12(d)} ${d.getHours() < 12 ? "ص" : "م"}`;
}
// "٨:٠٠ صباحاً"
function timeLong(d: Date): string {
  return `${hm12(d)} ${d.getHours() < 12 ? "صباحاً" : "مساءً"}`;
}
// "الإثنين ١٨ مايو"
function dayDate(d: Date): string {
  return `${DAYS[d.getDay()]} ${ar(d.getDate())} ${MONTHS[d.getMonth()]}`;
}
// "الأحد · ١٧ مايو ٢٠٢٦"
function longDate(d: Date): string {
  return `${DAYS[d.getDay()]} · ${ar(d.getDate())} ${MONTHS[d.getMonth()]} ${ar(d.getFullYear())}`;
}

const PANEL =
  "rounded-[22px] border border-[rgba(245,241,230,.16)] bg-[linear-gradient(180deg,rgba(245,241,230,.04),rgba(245,241,230,.02)),rgba(6,26,16,.55)] shadow-[0_30px_80px_-30px_rgba(0,0,0,.55),inset_0_1px_0_rgba(245,241,230,.06)] backdrop-blur-[8px] overflow-hidden";

const GOLD_BTN =
  "group inline-flex items-center justify-center gap-2.5 rounded-[12px] bg-[linear-gradient(180deg,#e8d8aa,#d9c79a)] px-5 py-3 text-[14px] font-semibold text-[#1d160a] shadow-[0_10px_30px_-10px_rgba(217,199,154,.45),inset_0_1px_0_rgba(255,255,255,.4),inset_0_-1px_0_rgba(0,0,0,.10)] transition-[filter] duration-150 hover:brightness-105";

const GHOST_BTN =
  "inline-flex items-center justify-center gap-2.5 rounded-[12px] border border-[rgba(245,241,230,.16)] bg-transparent px-5 py-3 text-[14px] font-semibold text-[#e6dfcc] transition-colors hover:bg-[rgba(245,241,230,.04)]";

const ALERT: Record<
  AlertLevel,
  { label: string; dot: string; val: string }
> = {
  normal: {
    label: "عادي",
    dot: "bg-[#46a96a]",
    val: "border-[rgba(70,169,106,.28)] bg-[rgba(70,169,106,.16)]",
  },
  elevated: {
    label: "متأهب",
    dot: "bg-[#e1a04a]",
    val: "border-[rgba(225,160,74,.28)] bg-[rgba(225,160,74,.16)]",
  },
  critical: {
    label: "طارئ",
    dot: "bg-[#e56050]",
    val: "border-[rgba(229,96,80,.30)] bg-[rgba(229,96,80,.16)]",
  },
};

function PulseDot({ color }: { color: string }) {
  return (
    <span className={`relative inline-block h-[7px] w-[7px] rounded-full ${color}`}>
      <span
        aria-hidden="true"
        className={`absolute -inset-[3px] rounded-full ${color} opacity-40 animate-status-pulse`}
      />
    </span>
  );
}

function SectionHead({
  icon,
  title,
  metaEnd,
}: {
  icon: React.ReactNode;
  title: string;
  metaEnd?: string;
}) {
  return (
    <div className="mb-3.5 flex items-center gap-2.5">
      <span className="grid h-[30px] w-[30px] place-items-center rounded-[9px] bg-[rgba(217,199,154,.14)] text-[#d9c79a]">
        {icon}
      </span>
      <h2 className="m-0 text-[13.5px] font-semibold text-[#e6dfcc]">{title}</h2>
      {metaEnd ? (
        <span className="ms-auto text-[11.5px] text-[#a9b8ad]">{metaEnd}</span>
      ) : null}
    </div>
  );
}

export function DutyWelcomePage() {
  const [now, setNow] = useState(() => today());

  useEffect(() => {
    const id = window.setInterval(() => setNow(today()), 60000);
    return () => window.clearInterval(id);
  }, []);

  if (!isWajebMode()) {
    return <Navigate to="/login" replace />;
  }

  const d = getDutyMock();
  const shift = deriveShift(d.shiftStart, d.shiftEnd, now);
  const alert = ALERT[d.alertLevel];

  return (
    <main
      dir="rtl"
      className="relative min-h-screen overflow-hidden text-[#f5f1e6] animate-welcome-reveal"
    >
      <InjazAuraBackdrop />

      <div className="relative mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-7 pb-8 pt-[22px] max-[600px]:px-4">
        {/* ---- Top bar ---- */}
        <header className="flex min-h-[44px] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative grid h-11 w-11 flex-none place-items-center rounded-full border-[1.5px] border-[#d9c79a] shadow-[inset_0_0_0_4px_rgba(217,199,154,.10)]">
              <span
                aria-hidden="true"
                className="absolute inset-[6px] rounded-full border border-dashed border-[rgba(217,199,154,.55)]"
              />
              <span className="font-display text-[18px] font-extrabold leading-none text-[#d9c79a]">
                إ
              </span>
            </div>
            <div>
              <div className="text-[14.5px] font-bold tracking-[-.01em] text-[#f5f1e6]">
                نظام إنجاز
              </div>
              <div className="mt-px text-[11.5px] text-[#a9b8ad]">
                لوحة تحكم العمليات
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-[12.5px] text-[#a9b8ad]">
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(245,241,230,.10)] bg-[rgba(245,241,230,.04)] py-1 pe-1 ps-3">
              <span className="text-[11.5px] font-medium text-[#a9b8ad]">
                حالة الإنذار
              </span>
              <span className="h-3.5 w-px bg-[rgba(245,241,230,.10)]" />
              <PulseDot color={alert.dot} />
              <span
                className={`rounded-full border px-2.5 py-[3px] text-[12.5px] font-semibold text-[#f5f1e6] ${alert.val}`}
              >
                {alert.label}
              </span>
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(245,241,230,.10)] bg-[rgba(245,241,230,.04)] px-[11px] py-1.5">
              <Calendar size={13} aria-hidden="true" />
              {longDate(now)}
            </span>
            <button
              type="button"
              aria-label="التنبيهات"
              className="relative grid h-[34px] w-[34px] place-items-center rounded-[10px] border border-[rgba(245,241,230,.10)] bg-[rgba(245,241,230,.04)] text-[#e6dfcc] transition-colors hover:bg-[rgba(245,241,230,.07)]"
            >
              <Bell size={16} aria-hidden="true" />
              {d.notificationCount > 0 ? (
                <span className="absolute -end-1 -top-1 grid h-4 min-w-[16px] place-items-center rounded-full border-2 border-[#061a10] bg-[#e1a04a] px-1 text-[10px] font-bold text-[#1a0f04]">
                  {ar(d.notificationCount)}
                </span>
              ) : null}
            </button>
          </div>
        </header>

        {/* ---- Stage ---- */}
        <main className="grid grid-cols-[1.05fr_1fr] items-center gap-8 max-[1020px]:grid-cols-1 max-[1020px]:gap-6">
          {/* Right: greeting */}
          <section className="flex flex-col gap-[22px]">
            <div className="inline-flex items-center gap-2 self-start text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d9c79a] before:h-px before:w-[22px] before:bg-[rgba(217,199,154,.4)] before:content-[''] after:h-px after:w-[22px] after:bg-[rgba(217,199,154,.4)] after:content-['']">
              INJAZ · DUTY OFFICER
            </div>

            <h1 className="m-0 font-display text-[clamp(38px,5.2vw,70px)] font-extrabold leading-[1.05] tracking-[-.025em] text-[#f5f1e6]">
              مرحباً بعودتك،
              <br />
              <span className="bg-[linear-gradient(180deg,#e8d8aa,#d9c79a)] bg-clip-text text-transparent">
                واجب {ar(d.dutyNumber)}
              </span>
            </h1>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[rgba(245,241,230,.10)] bg-[rgba(245,241,230,.04)] px-[11px] py-[5px] text-[12.5px] font-medium text-[#e6dfcc]">
                <UserCheck size={13} aria-hidden="true" className="text-[#a9b8ad]" />
                {d.officerName}
              </span>
              {!shift.ended ? (
                <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-[rgba(70,169,106,.28)] bg-[rgba(70,169,106,.16)] px-[11px] py-[5px] text-[12.5px] font-semibold text-[#f5f1e6]">
                  <PulseDot color="bg-[#46a96a]" />
                  استلامك نشط الآن
                </span>
              ) : null}
            </div>

            <p className="m-0 mt-0.5 max-w-[540px] text-[15.5px] leading-[1.7] text-[#e6dfcc] [&_b]:font-semibold [&_b]:text-[#e8d8aa]">
              {d.guidance}
            </p>

            <div className="mt-1.5 flex flex-wrap items-center gap-3">
              <button type="button" className={GOLD_BTN}>
                دخول إلى لوحة التحكم
                <ArrowLeft
                  size={16}
                  aria-hidden="true"
                  className="transition-transform duration-200 group-hover:-translate-x-1"
                />
              </button>
              <button type="button" className={GHOST_BTN}>
                <Square size={14} aria-hidden="true" />
                إنهاء الاستلام وإصدار التقرير
              </button>
            </div>
          </section>

          {/* Left: main panel */}
          <aside className={PANEL}>
            {/* Section 1: shift counter */}
            <div className="border-b border-dashed border-[rgba(245,241,230,.16)] px-[22px] py-5">
              <SectionHead
                icon={<Clock size={16} aria-hidden="true" />}
                title="استلامك"
                metaEnd={`بدأت ${timeShort(d.shiftStart)}`}
              />
              <div className="px-0 pb-1.5 pt-1 text-center">
                <div className="text-[12px] tracking-[0.04em] text-[#a9b8ad]">
                  المتبقي من الاستلام
                </div>
                <div className="my-1.5 font-display text-[clamp(36px,4.4vw,56px)] font-extrabold leading-[1.05] tracking-[-.02em] text-[#f5f1e6]">
                  <span>{ar(shift.hoursLeft)}</span>
                  <span className="mx-1.5 text-[0.42em] font-semibold text-[#a9b8ad]">
                    ساعة
                  </span>
                  <span>{ar(shift.minutesLeft)}</span>
                  <span className="mx-1.5 text-[0.42em] font-semibold text-[#a9b8ad]">
                    دقيقة
                  </span>
                </div>
                <div className="text-[12.5px] text-[#a9b8ad]">
                  ينتهي عند{" "}
                  <b className="font-semibold text-[#e6dfcc]">
                    {timeLong(d.shiftEnd)}
                  </b>{" "}
                  — {dayDate(d.shiftEnd)}
                </div>
              </div>
              <div className="mt-3.5 h-1.5 overflow-hidden rounded-full bg-[rgba(245,241,230,.06)]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#d9c79a_0%,#46a96a_100%)]"
                  style={{ width: `${shift.percentElapsed}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-[#a9b8ad]">
                <span>{timeShort(d.shiftStart)}</span>
                <span>أُكمل {ar(shift.percentElapsed)}٪ من الاستلام</span>
                <span>{timeShort(d.shiftEnd)}</span>
              </div>
            </div>

            {/* Section 2: incidents */}
            <div className="border-b border-dashed border-[rgba(245,241,230,.16)] px-[22px] py-5">
              <SectionHead
                icon={<BarChart3 size={16} aria-hidden="true" />}
                title="حوادث منذ بداية الاستلام"
              />
              <div className="grid grid-cols-[auto_1fr_auto] items-center gap-[18px] max-[600px]:grid-cols-[auto_1fr]">
                <div className="min-w-[56px] text-center font-display text-[64px] font-extrabold leading-none tracking-[-.02em]">
                  <span className="bg-[linear-gradient(180deg,#e8d8aa,#d9c79a)] bg-clip-text text-transparent">
                    {ar(d.incidents.count)}
                  </span>
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-[#f5f1e6]">
                    حالات مُسجَّلة
                  </div>
                  <button
                    type="button"
                    className="group mt-3 inline-flex items-center gap-1.5 p-0 text-[12.5px] font-semibold text-[#d9c79a] transition-colors hover:text-[#e8d8aa]"
                  >
                    عرض الحوادث
                    <ArrowLeft
                      size={14}
                      aria-hidden="true"
                      className="transition-transform duration-200 group-hover:-translate-x-1"
                    />
                  </button>
                </div>
                <div
                  aria-hidden="true"
                  className="flex h-9 items-end gap-[3px] max-[600px]:col-span-full max-[600px]:justify-center"
                >
                  {d.incidents.trend.map((h, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-[2px] ${
                        d.incidents.peak.includes(i)
                          ? "bg-[#d9c79a]"
                          : "bg-[rgba(217,199,154,.14)]"
                      }`}
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Section 3: surprise visit */}
            <div className="border-b border-dashed border-[rgba(245,241,230,.16)] px-[22px] py-5">
              <SectionHead
                icon={<Target size={16} aria-hidden="true" />}
                title="زيارتك الميدانية لليوم"
              />
              <div className="grid grid-cols-[38px_1fr] items-center gap-3.5 rounded-[14px] border border-[rgba(245,241,230,.10)] bg-[rgba(245,241,230,.03)] px-4 py-3.5">
                <div className="grid h-[38px] w-[38px] place-items-center rounded-[11px] bg-[rgba(217,199,154,.14)] text-[#d9c79a]">
                  <MapPin size={18} aria-hidden="true" />
                </div>
                <div>
                  <div className="text-[17px] font-bold tracking-[-.01em] text-[#f5f1e6]">
                    {d.surpriseVisit.centerName}
                  </div>
                  <div className="mt-0.5 text-[12px] text-[#a9b8ad]">
                    مدير المركز:{" "}
                    <b className="font-medium text-[#e6dfcc]">
                      {d.surpriseVisit.managerName}
                    </b>
                  </div>
                </div>
              </div>
              <div className="mt-3.5 flex gap-2.5">
                <button
                  type="button"
                  className={`${GOLD_BTN} px-3.5 py-2 text-[13px]`}
                >
                  <Play size={13} aria-hidden="true" />
                  ابدأ الزيارة
                </button>
                <button
                  type="button"
                  className={`${GHOST_BTN} px-3.5 py-2 text-[13px]`}
                >
                  <Printer size={13} aria-hidden="true" />
                  طباعة النموذج
                </button>
              </div>
            </div>

            {/* Section 4: handover group — READ ONLY (set by Rabea) */}
            <div className="px-[22px] py-5">
              <SectionHead
                icon={<Users size={16} aria-hidden="true" />}
                title="مجموعة الاستلام"
                metaEnd="استلام اليوم"
              />
              <div className="grid grid-cols-[1fr_1.2fr] gap-3.5 max-[760px]:grid-cols-1">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-medium text-[#e6dfcc]">
                    الموثّق المستلم
                  </span>
                  <div className="flex items-center gap-2 rounded-[10px] border border-[rgba(245,241,230,.10)] bg-[rgba(245,241,230,.04)] px-3 py-2.5 text-[13.5px] text-[#f5f1e6]">
                    <FileText
                      size={14}
                      aria-hidden="true"
                      className="flex-none text-[#d9c79a]"
                    />
                    <span>{d.handover.documenter}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-medium text-[#e6dfcc]">
                    مجموعة الإشراف
                  </span>
                  <ul className="m-0 flex min-h-[78px] list-none flex-col gap-1.5 rounded-[10px] border border-[rgba(245,241,230,.10)] bg-[rgba(245,241,230,.04)] px-3 py-2.5 text-[13px] leading-[1.6] text-[#f5f1e6]">
                    {d.handover.supervision.map((name) => (
                      <li key={name} className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="inline-block h-1 w-1 flex-none rounded-full bg-[#d9c79a]"
                        />
                        {name}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </aside>
        </main>

        {/* ---- Footer ---- */}
        <footer className="mt-2 flex items-center justify-between border-t border-[rgba(245,241,230,.10)] pt-3.5 text-[11.5px] text-[#7b8a80]">
          <div className="flex items-center gap-3">
            <span>نظام إنجاز</span>
            <span className="h-[3px] w-[3px] rounded-full bg-[#7b8a80]" />
            <span>لوحة الواجب</span>
            <span className="h-[3px] w-[3px] rounded-full bg-[#7b8a80]" />
            <span>
              الإصدار <span className="font-mono">2.4.1</span>
            </span>
          </div>
        </footer>
      </div>
    </main>
  );
}
