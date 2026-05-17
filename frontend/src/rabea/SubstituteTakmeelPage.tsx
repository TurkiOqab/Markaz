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
      <Shell>
        <div className="mx-auto max-w-[520px] rounded-[18px] border border-[rgba(70,169,106,.28)] bg-[rgba(70,169,106,.12)] p-7 text-center">
          <h2 className="m-0 mb-3 text-[18px] font-bold text-[#46a96a]">
            ✅ تم رفع التكميل بنجاح
          </h2>
          <p className="m-0 mb-1 text-[14px] leading-relaxed text-[#e6dfcc]">
            تم رفع تكميل مركز {selected.id} - {selected.region} باسمك بالنيابة عن{" "}
            {selected.responsible}.
          </p>
          <p className="m-0 mb-5 text-[12.5px] text-[#a9b8ad]">
            تم تسجيل العملية. (الإشعار الفعلي لمدير المركز ضمن لوحة لاحقة)
          </p>
          <button
            type="button"
            onClick={() => navigate("/operations-welcome")}
            className="rounded-full bg-injaz-gold-soft px-7 py-3 text-[14px] font-semibold text-[#0d3a24] transition-colors hover:bg-white"
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
      <Shell>
        <Header navigate={navigate} now={now} />
        {pending.length === 0 ? (
          <div className="mx-auto max-w-[520px] rounded-[18px] border border-[rgba(70,169,106,.28)] bg-[rgba(70,169,106,.12)] p-8 text-center">
            <p className="m-0 mb-1 text-[15px] font-semibold text-[#46a96a]">
              ✅ كل المراكز رفعت التكميل اليوم
            </p>
            <p className="m-0 mb-5 text-[12.5px] text-[#a9b8ad]">
              لا توجد مراكز معلّقة حالياً
            </p>
            <button
              type="button"
              onClick={() => navigate("/operations-welcome")}
              className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[13px] font-semibold text-white/85 hover:bg-white/10"
            >
              العودة للصفحة الترحيبية
            </button>
          </div>
        ) : (
          <div className="mx-auto flex max-w-[640px] flex-col gap-3">
            <p className="m-0 text-[13px] text-[#a9b8ad]">اختر المركز لرفع تكميله:</p>
            {pending.map((c) => (
              <div
                key={c.id}
                className="rounded-[14px] border border-[rgba(245,241,230,.12)] bg-[rgba(245,241,230,.04)] p-4"
              >
                <div className="mb-1 flex items-center gap-2 text-[14px] font-semibold text-[#f5f1e6]">
                  <span aria-hidden="true">⏳</span>
                  مركز {c.id} - {c.region}
                </div>
                <div className="mb-3 text-[12px] leading-relaxed text-[#a9b8ad]">
                  المسؤول: {c.responsible} · آخر تواصل: لا يوجد
                </div>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setSelected(c);
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-injaz-gold-soft px-5 py-2.5 text-[13px] font-semibold text-[#0d3a24] transition-colors hover:bg-white"
                >
                  اختيار هذا المركز
                  <ArrowRight size={15} aria-hidden="true" />
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
    <Shell>
      <button
        type="button"
        onClick={() => setSelected(null)}
        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] text-[#a9b8ad] hover:text-[#e6dfcc]"
      >
        <ArrowRight size={14} aria-hidden="true" /> رجوع لقائمة المراكز
      </button>

      <div className="mx-auto max-w-[680px]">
        <h2 className="m-0 mb-1 text-[18px] font-bold text-[#f5f1e6]">
          📋 تكميل مركز {selected.id} - {selected.region}
        </h2>
        <p className="m-0 mb-5 text-[12.5px] text-[#a9b8ad]">
          المسؤول: {selected.responsible}
        </p>

        <div className="mb-5">
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

        <div className="mb-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {NUMERIC.map((f) => (
            <label key={f.key} className="flex items-center justify-between gap-3 rounded-[10px] border border-[rgba(245,241,230,.12)] bg-[rgba(6,26,16,.45)] px-3 py-2">
              <span className="text-[13px] text-[#e6dfcc]">{f.label}</span>
              <input
                type="number"
                min={0}
                aria-label={f.label}
                value={values[f.key]}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [f.key]: e.target.value }))
                }
                className="w-24 rounded-[8px] border border-[rgba(245,241,230,.15)] bg-[rgba(6,26,16,.6)] px-2 py-1.5 text-center text-[14px] font-bold text-white outline-none focus:border-injaz-gold-soft"
              />
            </label>
          ))}
          <div className="flex items-center justify-between gap-3 rounded-[10px] border border-[rgba(232,217,184,.25)] bg-[rgba(232,217,184,.06)] px-3 py-2 sm:col-span-2">
            <span className="text-[13px] font-semibold text-[#e8d9b8]">
              العدد الموجود (محسوب تلقائياً)
            </span>
            <span className="w-24 text-center text-[15px] font-bold tabular-nums text-[#e8d9b8]">
              {present === null ? "—" : ar(present)}
            </span>
          </div>
        </div>

        <label className="mb-5 block">
          <span className="mb-1.5 block text-[13px] text-[#e6dfcc]">ملاحظات (اختيارية)</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="مثال: مدير المركز في إجازة طارئة، تم رفع التكميل نيابة عنه"
            className="w-full rounded-[10px] border border-[rgba(245,241,230,.15)] bg-[rgba(6,26,16,.6)] px-3 py-2 text-[13px] text-white outline-none placeholder:text-[#5b6b62] focus:border-injaz-gold-soft"
          />
        </label>

        <div className="mb-4 rounded-[10px] border border-[rgba(225,160,74,.3)] bg-[rgba(225,160,74,.08)] p-3 text-[12px] leading-relaxed text-[#e6dfcc]">
          ⚠️ هذا التكميل سيُسجّل باسمك (ربيع - مدير شعبة العمليات) كتكميل بديل، ولا
          يمكن لمدير المركز تعديله بعد رفعه.
        </div>

        <div className="mb-4 flex flex-col gap-2">
          <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-[#e6dfcc]">
            <input type="checkbox" checked={c1} onChange={(e) => setC1(e.target.checked)} />
            أؤكد أن البيانات المُدخلة صحيحة ومطابقة للواقع
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-[#e6dfcc]">
            <input type="checkbox" checked={c2} onChange={(e) => setC2(e.target.checked)} />
            أؤكد أنني تواصلت مع المركز للحصول على البيانات
          </label>
        </div>

        {errors.length > 0 ? (
          <ul className="mb-4 list-disc space-y-0.5 pr-5 text-[12px] text-[#ff8a7a]">
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
            className="inline-flex items-center gap-2 rounded-full bg-injaz-gold-soft px-7 py-3 text-[14px] font-semibold text-[#0d3a24] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            حفظ التكميل
            <ArrowRight size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="rounded-full border border-white/15 px-6 py-3 text-[14px] font-semibold text-white/85 hover:bg-white/5"
          >
            إلغاء
          </button>
        </div>
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-black/55 p-4">
          <div className="w-full max-w-[420px] rounded-[16px] border border-[rgba(245,241,230,.16)] bg-[#0c2a1a] p-6 text-center">
            <h3 className="m-0 mb-3 flex items-center justify-center gap-2 text-[16px] font-bold text-[#f5f1e6]">
              <ClipboardList size={18} aria-hidden="true" /> تأكيد رفع التكميل
            </h3>
            <p className="m-0 mb-2 text-[13px] leading-relaxed text-[#e6dfcc]">
              ستقوم برفع التكميل لمركز {selected.id} - {selected.region} بالنيابة عن{" "}
              {selected.responsible}.
            </p>
            <p className="m-0 mb-5 text-[12px] text-[#ff8a7a]">
              ⚠️ هذا الإجراء لا يمكن التراجع عنه ولا يمكن لمدير المركز تعديله لاحقاً
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-full border border-white/15 px-5 py-2.5 text-[13px] font-semibold text-white/85 hover:bg-white/5"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={doSave}
                className="rounded-full bg-injaz-gold-soft px-5 py-2.5 text-[13px] font-semibold text-[#0d3a24] hover:bg-white"
              >
                نعم، تأكيد
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#0a2818] via-[#0d3a24] to-[#14502f] px-7 py-7 text-[#f5f1e6] max-[560px]:px-4"
    >
      <div className="mx-auto max-w-[1100px]">{children}</div>
    </main>
  );
}

function Header({
  navigate,
  now,
}: {
  navigate: ReturnType<typeof useNavigate>;
  now: Date;
}) {
  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => navigate("/operations-welcome")}
        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] text-[#a9b8ad] hover:text-[#e6dfcc]"
      >
        <ArrowRight size={14} aria-hidden="true" /> رجوع للصفحة الترحيبية
      </button>
      <h1 className="m-0 mb-1 flex items-center gap-2.5 font-display text-[28px] font-extrabold tracking-tight text-[#f5f1e6]">
        <ClipboardList size={24} aria-hidden="true" className="text-[#e8d9b8]" />
        تكميل المراكز المعلّقة
      </h1>
      <p className="m-0 mb-4 text-[13px] text-[#a9b8ad]">
        تكميل بالنيابة عن المراكز التي لم ترفع التكميل
      </p>
      <div className="flex flex-wrap gap-4 text-[12.5px] text-[#a9b8ad]">
        <span>📅 {longDate(now)}</span>
        <span className="tabular-nums">⏰ {clock(now)}</span>
      </div>
    </div>
  );
}
