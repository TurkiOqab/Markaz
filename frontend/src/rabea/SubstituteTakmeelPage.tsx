import { ArrowRight, ClipboardList } from "lucide-react";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { today } from "../lib/clock";
import type { CenterTakmeel } from "./takmeelMock";
import { isRabeaMode } from "./rabeaSession";
import { getPendingCenters, saveSubstituteTakmeel } from "./rabeaTakmeelStore";
import type { SubstituteFields } from "./rabeaTakmeelStore";

const AR = "٠١٢٣٤٥٦٧٨٩";
const ar = (s: string | number) => String(s).replace(/\d/g, (d) => AR[Number(d)]);
const DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];
const pad = (n: number) => String(n).padStart(2, "0");
function longDate(d: Date) {
  return `${DAYS[d.getDay()]} ${ar(d.getDate())} ${MONTHS[d.getMonth()]} ${ar(d.getFullYear())}`;
}
function clock(d: Date) {
  const h = d.getHours() % 12 || 12;
  const s = d.getHours() >= 12 ? "م" : "ص";
  return `${ar(pad(h))}:${ar(pad(d.getMinutes()))} ${s}`;
}

const TEAMS = ["أ", "ب", "ج"] as const;
const NUMERIC: { key: keyof SubstituteFields; label: string }[] = [
  { key: "totalForce", label: "القوة الكاملة" },
  { key: "firefighters", label: "الإطفاء" },
  { key: "drivers", label: "السائقين" },
  { key: "rescue", label: "الإنقاذ" },
  { key: "divers", label: "الغواصين" },
  { key: "trainers", label: "المدربين" },
  { key: "onMission", label: "المهمة" },
  { key: "absent", label: "الغياب" },
  { key: "suspended", label: "الموقوفين" },
  { key: "catering", label: "الإعاشة" },
];

type Values = Record<keyof SubstituteFields, string>;
const EMPTY_VALUES = Object.fromEntries(
  NUMERIC.map((f) => [f.key, ""]),
) as Values;

const PANEL =
  "rounded-[22px] border border-[rgba(245,241,230,.16)] bg-[linear-gradient(180deg,rgba(245,241,230,.04),rgba(245,241,230,.02)),rgba(6,26,16,.55)] p-[22px] shadow-[0_30px_80px_-30px_rgba(0,0,0,.55),inset_0_1px_0_rgba(245,241,230,.06)] backdrop-blur-[8px]";
const GOLD_BTN =
  "group inline-flex items-center gap-2.5 rounded-full bg-injaz-gold-soft px-8 py-[16px] text-[15px] font-semibold tracking-wide text-[#0d3a24] shadow-[0_12px_32px_rgba(232,217,184,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_44px_rgba(232,217,184,0.28)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-injaz-gold-soft disabled:hover:shadow-[0_12px_32px_rgba(232,217,184,0.18)]";
const GHOST_BTN =
  "inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/5 px-6 py-[16px] text-[14px] font-semibold text-white/85 transition-colors hover:bg-white/10";

export function SubstituteTakmeelPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<CenterTakmeel | null>(null);
  const [team, setTeam] = useState("");
  const [values, setValues] = useState<Values>({ ...EMPTY_VALUES });
  const [note, setNote] = useState("");
  const [c1, setC1] = useState(false);
  const [c2, setC2] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!isRabeaMode()) {
    return <Navigate to="/login" replace />;
  }

  const now = today();
  const pending = getPendingCenters();

  function resetForm() {
    setTeam("");
    setValues({ ...EMPTY_VALUES });
    setNote("");
    setC1(false);
    setC2(false);
    setShowModal(false);
  }

  // ---- Success screen ----
  if (saved && selected) {
    return (
      <Shell now={now} navigate={navigate}>
        <div className={`mx-auto max-w-[560px] text-center ${PANEL}`}>
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-[rgba(70,169,106,.3)] bg-[rgba(70,169,106,.14)] text-[26px] text-[#46a96a]">
            ✅
          </div>
          <h2 className="m-0 mb-3 text-[20px] font-bold text-[#46a96a]">
            ✅ تم رفع التكميل بنجاح
          </h2>
          <p className="m-0 mb-1 text-[14px] leading-relaxed text-[#e6dfcc]">
            تم رفع تكميل مركز {selected.id} - {selected.region} باسمك بالنيابة عن{" "}
            {selected.responsible}.
          </p>
          <p className="m-0 mb-6 text-[12.5px] text-[#a9b8ad]">
            تم تسجيل العملية. (الإشعار الفعلي لمدير المركز ضمن لوحة لاحقة)
          </p>
          <button
            type="button"
            onClick={() => navigate("/operations-welcome")}
            className={GOLD_BTN}
          >
            العودة للصفحة الترحيبية
          </button>
        </div>
      </Shell>
    );
  }

  // ---- Center list ----
  if (!selected) {
    return (
      <Shell now={now} navigate={navigate}>
        <PageHead
          title="تكميل المراكز المعلّقة"
          subtitle="تكميل بالنيابة عن المراكز التي لم ترفع التكميل"
        />
        <div
          className="mb-6 flex items-start gap-2.5 rounded-[14px] border border-[rgba(225,160,74,.3)] bg-[rgba(225,160,74,.08)] p-3.5 text-[12.5px] leading-relaxed text-[#e6dfcc]"
        >
          <span aria-hidden="true">⚠️</span>
          <span>
            هذا التكميل سيُسجّل باسمك (ربيع - مدير شعبة العمليات) كتكميل بديل، ولا يمكن
            لمدير المركز تعديله بعد رفعه.
          </span>
        </div>

        {pending.length === 0 ? (
          <div className={`mx-auto max-w-[560px] text-center ${PANEL}`}>
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-[rgba(70,169,106,.3)] bg-[rgba(70,169,106,.14)] text-[26px] text-[#46a96a]">
              ✅
            </div>
            <p className="m-0 mb-1 text-[16px] font-semibold text-[#46a96a]">
              ✅ كل المراكز رفعت التكميل اليوم
            </p>
            <p className="m-0 mb-6 text-[12.5px] text-[#a9b8ad]">
              لا توجد مراكز معلّقة حالياً
            </p>
            <button
              type="button"
              onClick={() => navigate("/operations-welcome")}
              className={GHOST_BTN}
            >
              العودة للصفحة الترحيبية
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#a9b8ad]">
              اختر المركز لرفع تكميله:
            </p>
            {pending.map((c) => (
              <div
                key={c.id}
                className={`flex flex-wrap items-center justify-between gap-4 ${PANEL}`}
              >
                <div>
                  <div className="mb-1 flex items-center gap-2 text-[15px] font-semibold text-[#f5f1e6]">
                    <span
                      className="grid h-[26px] w-[26px] place-items-center rounded-full bg-[rgba(225,160,74,.16)] text-[#e1a04a]"
                      aria-hidden="true"
                    >
                      ⏳
                    </span>
                    مركز {c.id} - {c.region}
                  </div>
                  <div className="text-[12px] leading-relaxed text-[#a9b8ad]">
                    المسؤول: {c.responsible} · آخر تواصل: لا يوجد
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setSelected(c);
                  }}
                  className={GOLD_BTN}
                >
                  اختيار هذا المركز
                  <ArrowRight
                    size={16}
                    aria-hidden="true"
                    className="transition-transform duration-200 group-hover:-translate-x-1"
                  />
                </button>
              </div>
            ))}
          </div>
        )}
      </Shell>
    );
  }

  // ---- Form ----
  const nums = NUMERIC.reduce(
    (acc, f) => {
      acc[f.key] = Number(values[f.key]);
      return acc;
    },
    {} as Record<keyof SubstituteFields, number>,
  );
  const allFilled = NUMERIC.every(
    (f) =>
      values[f.key] !== "" &&
      Number.isFinite(nums[f.key]) &&
      nums[f.key] >= 0,
  );
  const total = nums.totalForce;
  const specialties =
    nums.firefighters + nums.drivers + nums.rescue + nums.divers + nums.trainers;
  const statusSum = nums.onMission + nums.absent + nums.suspended + nums.catering;
  const present = allFilled ? total - statusSum : null;

  const errors: string[] = [];
  if (!allFilled) errors.push("يرجى ملء جميع الحقول الإلزامية");
  else {
    if (total <= 0) errors.push("القوة الكاملة يجب أن تكون أكبر من 0");
    if (specialties > total || statusSum > total)
      errors.push("العدد الكلي للتخصصات أكبر من القوة الكاملة");
  }
  if (!team) errors.push("يرجى اختيار الفرقة المستلمة");
  if (!c1 || !c2) errors.push("يرجى تأكيد كلا المربعين قبل الحفظ");

  const isValid =
    allFilled &&
    total > 0 &&
    specialties <= total &&
    statusSum <= total &&
    !!team;
  const saveDisabled = !isValid || !c1 || !c2;

  function doSave() {
    if (!selected || saveDisabled) return;
    const d = today();
    saveSubstituteTakmeel({
      centerId: selected.id,
      team,
      fields: { ...nums },
      presentCount: present as number,
      note: note.trim(),
      submittedBy: "ربيع",
      isSubstitute: true,
      originalResponsible: selected.responsible,
      locked: true,
      submittedAt: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
      createdAtIso: d.toISOString(),
    });
    setSaved(true);
  }

  return (
    <Shell now={now} navigate={navigate}>
      <button
        type="button"
        onClick={() => setSelected(null)}
        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] text-[#a9b8ad] transition-colors hover:text-[#e6dfcc]"
      >
        <ArrowRight size={14} aria-hidden="true" /> رجوع لقائمة المراكز
      </button>

      <h2 className="m-0 mb-1 flex items-center gap-2.5 font-display text-[26px] font-extrabold tracking-tight text-[#f5f1e6]">
        <ClipboardList size={22} aria-hidden="true" className="text-[#e8d9b8]" />
        تكميل مركز {selected.id} - {selected.region}
      </h2>
      <p className="m-0 mb-5 text-[13px] text-[#a9b8ad]">
        المسؤول: {selected.responsible}
      </p>

      <div className={`${PANEL} flex flex-col gap-6`}>
        <div>
          <div className="mb-2 text-[13px] font-semibold text-[#e6dfcc]">
            الفرقة المستلمة اليوم:
          </div>
          <div className="flex flex-wrap gap-2">
            {TEAMS.map((t) => (
              <label
                key={t}
                className={`cursor-pointer rounded-full border px-5 py-2 text-[13px] font-semibold transition-colors ${
                  team === t
                    ? "border-injaz-gold-soft bg-[rgba(232,217,184,.14)] text-[#e8d9b8]"
                    : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
                }`}
              >
                <input
                  type="radio"
                  name="team"
                  className="sr-only"
                  checked={team === t}
                  onChange={() => setTeam(t)}
                />
                الفرقة {t}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {NUMERIC.map((f) => (
            <label
              key={f.key}
              className="flex items-center justify-between gap-3 rounded-[12px] border border-[rgba(245,241,230,.10)] bg-[rgba(245,241,230,.025)] px-3.5 py-2.5"
            >
              <span className="text-[13px] text-[#e6dfcc]">{f.label}</span>
              <input
                type="number"
                min={0}
                aria-label={f.label}
                value={values[f.key]}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [f.key]: e.target.value }))
                }
                className="w-24 rounded-[10px] border border-[rgba(245,241,230,.14)] bg-[rgba(6,26,16,.55)] px-2.5 py-1.5 text-center text-[15px] font-bold tabular-nums text-white outline-none transition-colors focus:border-injaz-gold-soft"
              />
            </label>
          ))}
          <div className="flex items-center justify-between gap-3 rounded-[12px] border border-[rgba(232,217,184,.28)] bg-[rgba(232,217,184,.07)] px-3.5 py-2.5 sm:col-span-2">
            <span className="text-[13px] font-semibold text-[#e8d9b8]">
              العدد الموجود (محسوب تلقائياً)
            </span>
            <span className="w-24 text-center text-[16px] font-bold tabular-nums text-[#e8d9b8]">
              {present === null ? "—" : ar(present)}
            </span>
          </div>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold text-[#e6dfcc]">
            ملاحظات (اختيارية)
          </span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="مثال: مدير المركز في إجازة طارئة، تم رفع التكميل نيابة عنه"
            className="w-full rounded-[12px] border border-[rgba(245,241,230,.14)] bg-[rgba(6,26,16,.55)] px-3.5 py-2.5 text-[13px] text-white outline-none transition-colors placeholder:text-[#5b6b62] focus:border-injaz-gold-soft"
          />
        </label>

        <div className="flex flex-col gap-2.5">
          <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-[#e6dfcc]">
            <input
              type="checkbox"
              checked={c1}
              onChange={(e) => setC1(e.target.checked)}
              className="h-4 w-4 accent-[#e8d9b8]"
            />
            أؤكد أن البيانات المُدخلة صحيحة ومطابقة للواقع
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-[#e6dfcc]">
            <input
              type="checkbox"
              checked={c2}
              onChange={(e) => setC2(e.target.checked)}
              className="h-4 w-4 accent-[#e8d9b8]"
            />
            أؤكد أنني تواصلت مع المركز للحصول على البيانات
          </label>
        </div>

        {errors.length > 0 ? (
          <ul className="m-0 list-disc space-y-0.5 pr-5 text-[12px] text-[#ff8a7a]">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={saveDisabled}
            onClick={() => setShowModal(true)}
            className={GOLD_BTN}
          >
            حفظ التكميل
            <ArrowRight
              size={16}
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:-translate-x-1"
            />
          </button>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className={GHOST_BTN}
          >
            إلغاء
          </button>
        </div>
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div className={`w-full max-w-[440px] text-center ${PANEL}`}>
            <h3 className="m-0 mb-3 flex items-center justify-center gap-2 text-[17px] font-bold text-[#f5f1e6]">
              <ClipboardList size={18} aria-hidden="true" className="text-[#e8d9b8]" />
              تأكيد رفع التكميل
            </h3>
            <p className="m-0 mb-2 text-[13px] leading-relaxed text-[#e6dfcc]">
              ستقوم برفع التكميل لمركز {selected.id} - {selected.region} بالنيابة عن{" "}
              {selected.responsible}.
            </p>
            <p className="m-0 mb-6 text-[12px] text-[#ff8a7a]">
              ⚠️ هذا الإجراء لا يمكن التراجع عنه ولا يمكن لمدير المركز تعديله لاحقاً
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className={GHOST_BTN}
              >
                إلغاء
              </button>
              <button type="button" onClick={doSave} className={GOLD_BTN}>
                نعم، تأكيد
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Shell>
  );
}

// ---------- Shared identity shell (matches OperationsWelcomePage) ----------

function Shell({
  children,
  now,
  navigate,
}: {
  children: React.ReactNode;
  now: Date;
  navigate: ReturnType<typeof useNavigate>;
}) {
  return (
    <main
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#0a2818] via-[#0d3a24] to-[#14502f] px-7 py-[22px] text-[#f5f1e6] max-[560px]:px-4"
    >
      <BrandBackdrop />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 1200px 800px at 50% 50%, transparent 0%, rgba(10,40,24,0.4) 100%)",
        }}
      />
      <div className="relative z-10 mx-auto w-full max-w-[1000px]">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="إنجاز"
              className="h-11 w-11 flex-none rounded-xl object-contain"
            />
            <div>
              <div className="text-[14.5px] font-bold tracking-tight text-[#f5f1e6]">
                نظام إنجاز
              </div>
              <div className="mt-px text-[11.5px] text-[#a9b8ad]">
                لوحة شعبة العمليات
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 text-[12.5px] text-[#a9b8ad]">
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(245,241,230,.10)] bg-[rgba(245,241,230,.04)] px-[11px] py-1.5">
              📅 {longDate(now)}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(245,241,230,.10)] bg-[rgba(245,241,230,.04)] px-[11px] py-1.5 tabular-nums">
              ⏰ {clock(now)}
            </span>
          </div>
        </header>

        <button
          type="button"
          onClick={() => navigate("/operations-welcome")}
          className="mb-3 inline-flex items-center gap-1.5 text-[12.5px] text-[#a9b8ad] transition-colors hover:text-[#e6dfcc]"
        >
          <ArrowRight size={14} aria-hidden="true" /> رجوع للصفحة الترحيبية
        </button>

        {children}
      </div>
    </main>
  );
}

function PageHead({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <div className="mb-3 inline-flex items-center gap-2 self-start text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d9c79a] before:h-px before:w-[22px] before:bg-[rgba(217,199,154,.4)] before:content-[''] after:h-px after:w-[22px] after:bg-[rgba(217,199,154,.4)] after:content-['']">
        INJAZ · OPERATIONS CENTER
      </div>
      <h1 className="m-0 font-display text-[clamp(30px,4.4vw,52px)] font-extrabold leading-[1.08] tracking-[-.02em] text-[#f5f1e6]">
        {title}
      </h1>
      <p className="m-0 mt-2 text-[14px] text-[#a9b8ad]">{subtitle}</p>
    </div>
  );
}

function BrandBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 flex items-center justify-center opacity-[0.18]"
    >
      <div
        className="relative w-[78%] max-w-[1100px] animate-shape-drift-slow"
        style={{ filter: "drop-shadow(0 30px 80px rgba(0,0,0,0.4))" }}
      >
        <img src="/shape.webp" alt="" className="block h-auto w-full" />
        <svg
          viewBox="0 0 306 237"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          <defs>
            <linearGradient id="rabeaSubGlint" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#e8d9b8" stopOpacity="0" />
              <stop offset="50%" stopColor="#e8d9b8" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#e8d9b8" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="rabeaSubGlintSoft" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#e8d9b8" stopOpacity="0" />
              <stop offset="50%" stopColor="#e8d9b8" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#e8d9b8" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect x="0" y="80" width="110" height="0.8" fill="url(#rabeaSubGlintSoft)">
            <animate attributeName="x" values="-40;220;-40" dur="11s" repeatCount="indefinite" />
          </rect>
          <rect x="0" y="125" width="140" height="1" fill="url(#rabeaSubGlint)">
            <animate
              attributeName="x"
              values="-50;230;-50"
              dur="9s"
              repeatCount="indefinite"
              begin="-3s"
            />
          </rect>
          <rect x="0" y="170" width="100" height="0.8" fill="url(#rabeaSubGlintSoft)">
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
