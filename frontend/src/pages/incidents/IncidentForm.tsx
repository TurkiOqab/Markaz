import { MapPin, Plus, Siren, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "../../components/Button";
import { LocationPicker } from "../../components/LocationPicker";
import { PageHeader } from "../../components/PageHeader";
import { SelectField } from "../../components/SelectField";
import { TextField } from "../../components/TextField";
import type { IncidentDetails, IncidentTeamRow, IncidentType } from "../../types/models";

const INCIDENT_TYPES: IncidentType[] = ["حريق", "إنقاذ", "إسعاف", "أخرى"];
const CONTACT_METHODS = ["حضوري", "هاتف", "لاسلكي", "خلوي"];
const PLACE_CATEGORIES = ["سكني", "تجاري", "دوائر حكومية"];
const PLACE_SUBTYPES: Record<string, string[]> = {
  "سكني": ["قصر", "فيلا", "منزل", "منزل شعبي", "شقة", "أخرى"],
  "تجاري": [
    "الملابس الجاهزة والكماليات",
    "قطع الغيار بأنواعها",
    "الأواني المنزلية",
    "صالات العرض",
    "أخرى",
  ],
  "دوائر حكومية": [
    "وزارة",
    "قطاع عسكري",
    "قطاع مدني",
    "مؤسسة أو شركة حكومية",
    "مسجد",
    "أخرى",
  ],
};
const WEATHER_OPTIONS = [
  "نهار", "ليل", "صحو", "غائم", "ممطر", "ضباب", "غبار", "مانع للرؤية", "غير مانع للرؤية",
];
const SITE_INFO_OPTIONS = [
  "مكان شاهق الارتفاع", "مكان منخفض", "طريق وعر", "طريق جبلي",
  "طريق سهل", "طريق ضيق", "طريق غير معبد", "طريق مرصوف بالحجارة",
];
const LICENSE_STATUSES = ["مرخص", "غير مرخص"];
const TEAM_TYPES = ["فرق إطفاء", "فرق إنقاذ", "فرق إسعاف", "فرق أخرى"];
const AGENCIES = [
  "الإمارة", "خبراء الأدلة الجنائية", "خبراء مسرح الجريمة", "الدوريات الأمنية",
  "المرور", "الشرطة", "البلدية", "الطبيب الشرعي", "الهلال الأحمر",
  "وزارة الصحة", "شركة الكهرباء", "شركة الغاز الأهلية",
  "وزارة البيئة والمياه والزراعة", "وزارة النقل",
  "لجنة المباني الآيلة للسقوط", "هيئة الأمر بالمعروف والنهي عن المنكر",
];

import {
  nowIsoLocalMinute as nowLocalDateTime,
  nowTimeHHMM as nowTime,
  todayIso as todayLocal,
} from "../../lib/clock";
function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function emptyTeamRow(): IncidentTeamRow {
  return {
    team_type: "فرق إطفاء",
    name_code: "",
    departure_time: "",
    arrival_time: "",
    return_time: "",
  };
}

export interface IncidentFormState {
  occurredAt: string;
  type: IncidentType;
  receivingEntity: string;
  reportDate: string;
  reportTime: string;
  classMain: string;
  classSub: string;
  reporterName: string;
  reporterNat: string;
  reporterAge: string;
  reporterId: string;
  reporterWork: string;
  contactMethod: string;
  contactPhone: string;
  description: string;
  placeCategory: string;
  placeSubtype: string;
  locRegion: string;
  locCity: string;
  locGov: string;
  locCenter: string;
  locDistrict: string;
  locStreet: string;
  weather: string[];
  weatherOther: string;
  siteInfo: string[];
  siteInfoOther: string;
  licenseStatus: string;
  licenseNumber: string;
  licenseDate: string;
  dispatchedTeams: IncidentTeamRow[];
  supportTeams: IncidentTeamRow[];
  agencies: string[];
  agenciesOther: string;
  operationSummary: string;
  latitude: number | null;
  longitude: number | null;
}

export function emptyFormState(): IncidentFormState {
  return {
    occurredAt: nowLocalDateTime(),
    type: "حريق",
    receivingEntity: "",
    reportDate: todayLocal(),
    reportTime: nowTime(),
    classMain: "",
    classSub: "",
    reporterName: "",
    reporterNat: "",
    reporterAge: "",
    reporterId: "",
    reporterWork: "",
    contactMethod: "هاتف",
    contactPhone: "",
    description: "",
    placeCategory: "سكني",
    placeSubtype: "",
    locRegion: "",
    locCity: "",
    locGov: "",
    locCenter: "",
    locDistrict: "",
    locStreet: "",
    weather: [],
    weatherOther: "",
    siteInfo: [],
    siteInfoOther: "",
    licenseStatus: "",
    licenseNumber: "",
    licenseDate: "",
    dispatchedTeams: [],
    supportTeams: [],
    agencies: [],
    agenciesOther: "",
    operationSummary: "",
    latitude: null,
    longitude: null,
  };
}

function isStateComplete(s: IncidentFormState): boolean {
  const must = [
    s.receivingEntity, s.reportDate, s.reportTime, s.classMain, s.classSub,
    s.reporterName, s.reporterNat, s.reporterAge, s.reporterId, s.reporterWork,
    s.contactMethod, s.contactPhone, s.description, s.placeCategory, s.placeSubtype,
    s.locRegion, s.locCity, s.locGov, s.locCenter, s.locDistrict, s.locStreet,
    s.licenseStatus, s.operationSummary,
  ];
  if (must.some((v) => !String(v).trim())) return false;
  if (s.weather.length === 0) return false;
  if (s.siteInfo.length === 0) return false;
  if (s.dispatchedTeams.length === 0) return false;
  if (s.agencies.length === 0) return false;
  return true;
}

export interface IncidentSubmitPayload {
  occurred_at: string;
  type: IncidentType;
  location: string;
  description: string;
  reporter_name: string | null;
  status: "مكتمل" | "غير مكتمل";
  details: IncidentDetails;
  latitude: number | null;
  longitude: number | null;
}

interface IncidentFormProps {
  title: string;
  subtitle?: string;
  initial: IncidentFormState;
  submitLabel: string;
  onSubmit: (payload: IncidentSubmitPayload) => Promise<void>;
}

export function IncidentForm({
  title,
  subtitle,
  initial,
  submitLabel,
  onSubmit,
}: IncidentFormProps) {
  const navigate = useNavigate();
  const [s, setS] = useState<IncidentFormState>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const set = <K extends keyof IncidentFormState>(k: K, v: IncidentFormState[K]) =>
    setS((prev) => ({ ...prev, [k]: v }));

  const subtypeOptions = useMemo(
    () => PLACE_SUBTYPES[s.placeCategory] ?? [],
    [s.placeCategory],
  );
  const isComplete = useMemo(() => isStateComplete(s), [s]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!s.description.trim()) {
      toast.error("مضمون البلاغ مطلوب");
      return;
    }
    setSubmitting(true);
    try {
      const location =
        [s.locRegion, s.locCity, s.locGov, s.locDistrict, s.locStreet]
          .filter(Boolean)
          .join(" - ") || s.locCity || "—";
      const details: IncidentDetails = {
        receiving_entity: s.receivingEntity || undefined,
        report_date: s.reportDate || undefined,
        report_time: s.reportTime || undefined,
        classification_main: s.classMain || undefined,
        classification_sub: s.classSub || undefined,
        reporter_nationality: s.reporterNat || undefined,
        reporter_age: s.reporterAge || undefined,
        reporter_id: s.reporterId || undefined,
        reporter_workplace: s.reporterWork || undefined,
        contact_method: s.contactMethod || undefined,
        contact_phone: s.contactPhone || undefined,
        place_category: s.placeCategory || undefined,
        place_subtype: s.placeSubtype || undefined,
        location_region: s.locRegion || undefined,
        location_city: s.locCity || undefined,
        location_governorate: s.locGov || undefined,
        location_center: s.locCenter || undefined,
        location_district: s.locDistrict || undefined,
        location_main_street: s.locStreet || undefined,
        weather_conditions: s.weather,
        weather_other: s.weatherOther || undefined,
        site_info: s.siteInfo,
        site_info_other: s.siteInfoOther || undefined,
        license_status: s.licenseStatus || undefined,
        license_number: s.licenseNumber || undefined,
        license_date: s.licenseDate || undefined,
        dispatched_teams: s.dispatchedTeams,
        support_teams: s.supportTeams,
        participating_agencies: s.agencies,
        agencies_other: s.agenciesOther || undefined,
        operation_summary: s.operationSummary || undefined,
      };
      await onSubmit({
        occurred_at: new Date(s.occurredAt).toISOString(),
        type: s.type,
        location: location.slice(0, 300),
        description: s.description.trim(),
        reporter_name: s.reporterName.trim() || null,
        status: isComplete ? "مكتمل" : "غير مكتمل",
        details,
        latitude: s.latitude,
        longitude: s.longitude,
      });
    } catch {
      // onSubmit handles its own error toasts
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        subtitle={subtitle}
        icon={Siren}
        iconTone="brand"
        backLink={{ to: "/incidents", label: "العودة لسجل الحوادث" }}
        actions={
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${
              isComplete
                ? "bg-brand-50 text-brand-700 ring-brand-200"
                : "bg-amber-50 text-amber-700 ring-amber-200"
            }`}
          >
            {isComplete ? "مكتمل" : "غير مكتمل"}
          </span>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Section title="1. إجراءات تلقي البلاغ" tone="brand">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SelectField
              label="نوع الحادث"
              value={s.type}
              onChange={(e) => set("type", e.target.value as IncidentType)}
              options={INCIDENT_TYPES.map((t) => ({ value: t, label: t }))}
            />
            <TextField
              label="وقت وقوع الحادث"
              type="datetime-local"
              value={s.occurredAt}
              onChange={(e) => set("occurredAt", e.target.value)}
              required
            />
            <TextField label="جهة تلقي البلاغ" value={s.receivingEntity} onChange={(e) => set("receivingEntity", e.target.value)} />
            <TextField label="تاريخ البلاغ (هجري)" value={s.reportDate} onChange={(e) => set("reportDate", e.target.value)} placeholder="yyyy-mm-dd" />
            <TextField label="وقت البلاغ" type="time" value={s.reportTime} onChange={(e) => set("reportTime", e.target.value)} />
            <div />
            <TextField label="رمز التصنيف الرئيسي" value={s.classMain} onChange={(e) => set("classMain", e.target.value)} />
            <TextField label="رمز التصنيف الفرعي" value={s.classSub} onChange={(e) => set("classSub", e.target.value)} />
          </div>

          <SubHeader>معلومات المُبلِّغ</SubHeader>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextField label="الاسم" value={s.reporterName} onChange={(e) => set("reporterName", e.target.value)} />
            <TextField label="الجنسية" value={s.reporterNat} onChange={(e) => set("reporterNat", e.target.value)} />
            <TextField label="العمر" type="number" min={0} value={s.reporterAge} onChange={(e) => set("reporterAge", e.target.value)} />
            <TextField label="رقم الهوية" value={s.reporterId} onChange={(e) => set("reporterId", e.target.value)} />
            <TextField label="جهة العمل" value={s.reporterWork} onChange={(e) => set("reporterWork", e.target.value)} />
            <SelectField label="وسيلة البلاغ" value={s.contactMethod} onChange={(e) => set("contactMethod", e.target.value)} options={CONTACT_METHODS.map((m) => ({ value: m, label: m }))} />
            <TextField label="رقم هاتف الاتصال" value={s.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
          </div>

          <Textarea
            label="مضمون البلاغ"
            value={s.description}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
            required
          />
        </Section>

        <Section title="2. إجراءات جمع المعلومات عن الموقع المتضرر" tone="info">
          <SubHeader>نوع المكان</SubHeader>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SelectField
              label="الفئة"
              value={s.placeCategory}
              onChange={(e) => {
                set("placeCategory", e.target.value);
                set("placeSubtype", "");
              }}
              options={PLACE_CATEGORIES.map((c) => ({ value: c, label: c }))}
            />
            <SelectField
              label="النوع التفصيلي"
              value={s.placeSubtype}
              onChange={(e) => set("placeSubtype", e.target.value)}
              placeholder="اختر النوع"
              options={subtypeOptions.map((o) => ({ value: o, label: o }))}
            />
          </div>

          <SubHeader>موقع الحادث</SubHeader>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <TextField label="المنطقة" value={s.locRegion} onChange={(e) => set("locRegion", e.target.value)} />
            <TextField label="المدينة" value={s.locCity} onChange={(e) => set("locCity", e.target.value)} />
            <TextField label="المحافظة" value={s.locGov} onChange={(e) => set("locGov", e.target.value)} />
            <TextField label="المركز" value={s.locCenter} onChange={(e) => set("locCenter", e.target.value)} />
            <TextField label="الحي" value={s.locDistrict} onChange={(e) => set("locDistrict", e.target.value)} />
            <TextField label="الشارع الرئيسي" value={s.locStreet} onChange={(e) => set("locStreet", e.target.value)} />
          </div>

          <SubHeader>الموقع الجغرافي</SubHeader>
          <div className="rounded-xl border border-surface-300 bg-surface-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm text-surface-900">
                <MapPin size={16} className="text-brand-700" />
                {s.latitude != null && s.longitude != null ? (
                  <span className="tabular-nums">
                    {s.latitude.toFixed(6)}, {s.longitude.toFixed(6)}
                  </span>
                ) : (
                  <span className="text-surface-500">لم يُحدَّد بعد</span>
                )}
              </div>
              <div className="flex gap-2">
                {s.latitude != null && s.longitude != null ? (
                  <button
                    type="button"
                    onClick={() => {
                      set("latitude", null);
                      set("longitude", null);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-surface-300 bg-white px-2.5 py-1 text-xs font-bold text-surface-500 hover:bg-surface-100"
                  >
                    <X size={12} />
                    مسح
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-white px-2.5 py-1 text-xs font-bold text-brand-700 hover:bg-brand-50"
                >
                  <MapPin size={12} />
                  تحديد على الخريطة
                </button>
              </div>
            </div>
          </div>

          <SubHeader>حالة الجو وقت مباشرة الحادث</SubHeader>
          <CheckGroup options={WEATHER_OPTIONS} selected={s.weather} onChange={(v) => set("weather", v)} />
          <TextField label="أخرى — حالة الجو" value={s.weatherOther} onChange={(e) => set("weatherOther", e.target.value)} />

          <SubHeader>معلومات أخرى عن الموقع</SubHeader>
          <CheckGroup options={SITE_INFO_OPTIONS} selected={s.siteInfo} onChange={(v) => set("siteInfo", v)} />
          <TextField label="أخرى — معلومات الموقع" value={s.siteInfoOther} onChange={(e) => set("siteInfoOther", e.target.value)} />

          <SubHeader>ترخيص الموقع (للمنشآت الخاضعة للإشراف الوقائي)</SubHeader>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <SelectField
              label="الحالة"
              value={s.licenseStatus}
              onChange={(e) => set("licenseStatus", e.target.value)}
              placeholder="—"
              options={LICENSE_STATUSES.map((o) => ({ value: o, label: o }))}
            />
            <TextField label="رقم ترخيص الدفاع المدني" value={s.licenseNumber} onChange={(e) => set("licenseNumber", e.target.value)} />
            <TextField label="تاريخ الترخيص (هجري)" value={s.licenseDate} onChange={(e) => set("licenseDate", e.target.value)} placeholder="yyyy-mm-dd" />
          </div>
        </Section>

        <Section title="3. إجراءات مباشرة الحادث" tone="warning">
          <SubHeader>الفرق المنتقلة لحظة تلقي البلاغ</SubHeader>
          <TeamTable rows={s.dispatchedTeams} onChange={(v) => set("dispatchedTeams", v)} />

          <SubHeader>الفرق المساندة لدعم الموقف</SubHeader>
          <TeamTable rows={s.supportTeams} onChange={(v) => set("supportTeams", v)} />

          <SubHeader>الجهات المشاركة بالحادث</SubHeader>
          <CheckGroup options={AGENCIES} selected={s.agencies} onChange={(v) => set("agencies", v)} columns={2} />
          <TextField label="أخرى — جهة مشاركة" value={s.agenciesOther} onChange={(e) => set("agenciesOther", e.target.value)} />

          <SubHeader>ملخص سير العمليات ونتائجه</SubHeader>
          <Textarea
            label=""
            value={s.operationSummary}
            onChange={(e) => set("operationSummary", e.target.value)}
            rows={4}
          />
        </Section>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => navigate("/incidents")} disabled={submitting}>
            إلغاء
          </Button>
          <Button type="submit" loading={submitting}>
            {submitLabel}
          </Button>
        </div>
      </form>

      <LocationPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        initialLat={s.latitude}
        initialLng={s.longitude}
        onConfirm={(lat, lng) => {
          set("latitude", lat);
          set("longitude", lng);
        }}
      />
    </div>
  );
}

function Section({ title, tone, children }: { title: string; tone: "brand" | "info" | "warning"; children: ReactNode }) {
  const stripe =
    tone === "brand" ? "bg-gradient-to-l from-brand-500 to-brand-700"
      : tone === "info" ? "bg-blue-600"
        : "bg-amber-500";
  return (
    <section className="relative overflow-hidden rounded-2xl border border-surface-300 bg-white p-6 shadow-soft-green transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift-green hover:border-brand-300">
      <div className={`absolute inset-x-0 top-0 h-[3px] ${stripe}`} />
      <h2 className="mb-4 text-base font-extrabold text-surface-900">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function SubHeader({ children }: { children: ReactNode }) {
  return (
    <h3 className="mt-2 border-b border-surface-200 pb-1 text-xs font-bold uppercase tracking-wider text-surface-500">
      {children}
    </h3>
  );
}

function Textarea({
  label, value, onChange, rows = 3, required = false,
}: {
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      {label ? <span className="text-sm font-medium text-surface-900">{label}</span> : null}
      <textarea
        value={value}
        onChange={onChange}
        required={required}
        rows={rows}
        className="rounded-md border border-surface-300 bg-white px-3 py-2 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
      />
    </label>
  );
}

function CheckGroup({
  options, selected, onChange, columns = 3,
}: {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  columns?: 2 | 3;
}) {
  function toggle(opt: string) {
    if (selected.includes(opt)) onChange(selected.filter((o) => o !== opt));
    else onChange([...selected, opt]);
  }
  const cols = columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 md:grid-cols-3";
  return (
    <div className={`grid grid-cols-1 gap-1 ${cols}`}>
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <label
            key={opt}
            className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
              active
                ? "border-brand-300 bg-brand-50 text-brand-700"
                : "border-surface-300 bg-white text-surface-900 hover:bg-brand-50/40"
            }`}
          >
            <input type="checkbox" checked={active} onChange={() => toggle(opt)} className="h-4 w-4 accent-brand-600" />
            <span className="truncate">{opt}</span>
          </label>
        );
      })}
    </div>
  );
}

function TeamTable({
  rows, onChange,
}: {
  rows: IncidentTeamRow[];
  onChange: (next: IncidentTeamRow[]) => void;
}) {
  function update(i: number, patch: Partial<IncidentTeamRow>) {
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function remove(i: number) {
    onChange(rows.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([...rows, emptyTeamRow()]);
  }
  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-lg border border-surface-300 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-right text-sm">
            <thead className="border-b border-surface-200 bg-surface-100 text-[11px] font-bold text-surface-500">
              <tr>
                <th className="px-3 py-2">نوع الفرقة</th>
                <th className="px-3 py-2">الاسم والرمز الكودي</th>
                <th className="px-3 py-2">وقت التحرك</th>
                <th className="px-3 py-2">وقت الوصول</th>
                <th className="px-3 py-2">وقت العودة</th>
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-center text-xs text-surface-500">
                    لا توجد فرق. اضغط "إضافة صف" أدناه.
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={i}>
                    <td className="px-2 py-1.5">
                      <select value={r.team_type} onChange={(e) => update(i, { team_type: e.target.value })}
                        className="w-full rounded border border-surface-300 bg-white px-2 py-1 text-sm">
                        {TEAM_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="text" value={r.name_code} onChange={(e) => update(i, { name_code: e.target.value })}
                        className="w-full rounded border border-surface-300 bg-white px-2 py-1 text-sm" />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="time" value={r.departure_time} onChange={(e) => update(i, { departure_time: e.target.value })}
                        className="w-full rounded border border-surface-300 bg-white px-2 py-1 text-sm" />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="time" value={r.arrival_time} onChange={(e) => update(i, { arrival_time: e.target.value })}
                        className="w-full rounded border border-surface-300 bg-white px-2 py-1 text-sm" />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="time" value={r.return_time} onChange={(e) => update(i, { return_time: e.target.value })}
                        className="w-full rounded border border-surface-300 bg-white px-2 py-1 text-sm" />
                    </td>
                    <td className="px-2 py-1.5">
                      <button type="button" onClick={() => remove(i)} title="حذف الصف"
                        className="rounded border border-red-200 p-1 text-red-600 hover:bg-red-50">
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-xs font-bold text-brand-700 transition-colors hover:bg-brand-50"
      >
        <Plus size={12} />
        إضافة صف
      </button>
    </div>
  );
}

// Build IncidentFormState from a saved Incident (for editing).
export function stateFromIncident(inc: {
  occurred_at: string;
  type: IncidentType;
  reporter_name: string | null;
  description: string;
  details: IncidentDetails | null;
  latitude: number | null;
  longitude: number | null;
}): IncidentFormState {
  const d = inc.details ?? {};
  // Convert ISO datetime to local datetime-local format
  const occurredAt = (() => {
    try {
      const dt = new Date(inc.occurred_at);
      return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
    } catch {
      return nowLocalDateTime();
    }
  })();
  return {
    occurredAt,
    type: inc.type,
    receivingEntity: d.receiving_entity ?? "",
    reportDate: d.report_date ?? "",
    reportTime: d.report_time ?? "",
    classMain: d.classification_main ?? "",
    classSub: d.classification_sub ?? "",
    reporterName: inc.reporter_name ?? "",
    reporterNat: d.reporter_nationality ?? "",
    reporterAge: d.reporter_age ?? "",
    reporterId: d.reporter_id ?? "",
    reporterWork: d.reporter_workplace ?? "",
    contactMethod: d.contact_method ?? "هاتف",
    contactPhone: d.contact_phone ?? "",
    description: inc.description,
    placeCategory: d.place_category ?? "سكني",
    placeSubtype: d.place_subtype ?? "",
    locRegion: d.location_region ?? "",
    locCity: d.location_city ?? "",
    locGov: d.location_governorate ?? "",
    locCenter: d.location_center ?? "",
    locDistrict: d.location_district ?? "",
    locStreet: d.location_main_street ?? "",
    weather: d.weather_conditions ?? [],
    weatherOther: d.weather_other ?? "",
    siteInfo: d.site_info ?? [],
    siteInfoOther: d.site_info_other ?? "",
    licenseStatus: d.license_status ?? "",
    licenseNumber: d.license_number ?? "",
    licenseDate: d.license_date ?? "",
    dispatchedTeams: d.dispatched_teams ?? [],
    supportTeams: d.support_teams ?? [],
    agencies: d.participating_agencies ?? [],
    agenciesOther: d.agencies_other ?? "",
    operationSummary: d.operation_summary ?? "",
    latitude: inc.latitude,
    longitude: inc.longitude,
  };
}
