import { Pencil, Siren, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ApiRequestError } from "../../api/client";
import { deleteIncident, getIncident } from "../../api/incidents";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { Loader } from "../../components/Loader";
import { PageHeader } from "../../components/PageHeader";
import type { Incident, IncidentDetails, IncidentTeamRow } from "../../types/models";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    getIncident(Number(id))
      .then((d) => active && setIncident(d))
      .catch((err) =>
        toast.error(err instanceof ApiRequestError ? err.message : "تعذر تحميل الحادث"),
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  async function handleDelete() {
    if (!incident) return;
    try {
      await deleteIncident(incident.id);
      toast.success("تم حذف الحادث");
      navigate("/incidents", { replace: true });
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "تعذر الحذف");
    }
  }

  if (loading) return <Loader fullPage />;
  if (!incident) return null;
  const d: IncidentDetails = incident.details ?? {};

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${incident.type} — ${incident.location}`}
        subtitle={formatDateTime(incident.occurred_at)}
        icon={Siren}
        iconTone="brand"
        backLink={{ to: "/incidents", label: "العودة لسجل الحوادث" }}
        actions={
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${
                incident.status === "مكتمل"
                  ? "bg-brand-50 text-brand-700 ring-brand-200"
                  : "bg-amber-50 text-amber-700 ring-amber-200"
              }`}
            >
              {incident.status}
            </span>
            <Link to={`/incidents/${incident.id}/edit`}>
              <Button variant="secondary">
                <Pencil size={16} />
                تعديل
              </Button>
            </Link>
            <Button variant="danger" onClick={() => setConfirmOpen(true)}>
              <Trash2 size={16} />
              حذف
            </Button>
          </div>
        }
      />

      <Section title="1. تلقي البلاغ" stripe="brand">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="success">{incident.type}</Badge>
        </div>
        <Grid>
          <Field label="جهة تلقي البلاغ" value={d.receiving_entity} />
          <Field label="تاريخ البلاغ" value={d.report_date} />
          <Field label="وقت البلاغ" value={d.report_time} />
          <Field label="رمز التصنيف الرئيسي" value={d.classification_main} />
          <Field label="رمز التصنيف الفرعي" value={d.classification_sub} />
        </Grid>
        <h3 className="mt-2 text-xs font-bold text-surface-500">معلومات المُبلِّغ</h3>
        <Grid>
          <Field label="الاسم" value={incident.reporter_name} />
          <Field label="الجنسية" value={d.reporter_nationality} />
          <Field label="العمر" value={d.reporter_age} />
          <Field label="رقم الهوية" value={d.reporter_id} />
          <Field label="جهة العمل" value={d.reporter_workplace} />
          <Field label="وسيلة البلاغ" value={d.contact_method} />
          <Field label="رقم الاتصال" value={d.contact_phone} />
        </Grid>
        <Block label="مضمون البلاغ" value={incident.description} />
      </Section>

      <Section title="2. معلومات الموقع" stripe="info">
        <Grid>
          <Field label="فئة المكان" value={d.place_category} />
          <Field label="نوع المكان" value={d.place_subtype} />
          <Field label="المنطقة" value={d.location_region} />
          <Field label="المدينة" value={d.location_city} />
          <Field label="المحافظة" value={d.location_governorate} />
          <Field label="المركز" value={d.location_center} />
          <Field label="الحي" value={d.location_district} />
          <Field label="الشارع الرئيسي" value={d.location_main_street} />
        </Grid>
        <ChipList label="حالة الجو" items={d.weather_conditions} other={d.weather_other} />
        <ChipList label="معلومات الموقع" items={d.site_info} other={d.site_info_other} />
        <Grid>
          <Field label="حالة الترخيص" value={d.license_status} />
          <Field label="رقم الترخيص" value={d.license_number} />
          <Field label="تاريخ الترخيص" value={d.license_date} />
        </Grid>
      </Section>

      <Section title="3. مباشرة الحادث" stripe="warning">
        <h3 className="text-xs font-bold text-surface-500">الفرق المنتقلة</h3>
        <TeamTableView rows={d.dispatched_teams} />

        <h3 className="mt-2 text-xs font-bold text-surface-500">الفرق المساندة</h3>
        <TeamTableView rows={d.support_teams} />

        <ChipList
          label="الجهات المشاركة"
          items={d.participating_agencies}
          other={d.agencies_other}
        />
        <Block label="ملخص سير العمليات" value={d.operation_summary} />
      </Section>

      <ConfirmDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="حذف الحادث؟"
        message="سيتم حذف سجل الحادث نهائياً. لا يمكن التراجع."
        confirmLabel="حذف"
        destructive
      />
    </div>
  );
}

function Section({
  title,
  stripe,
  children,
}: {
  title: string;
  stripe: "brand" | "info" | "warning";
  children: ReactNode;
}) {
  const stripeClass =
    stripe === "brand"
      ? "bg-gradient-to-l from-brand-500 to-brand-700"
      : stripe === "info"
        ? "bg-blue-600"
        : "bg-amber-500";
  return (
    <section className="relative overflow-hidden rounded-2xl border border-surface-300 bg-white p-6 shadow-soft-green transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift-green hover:border-brand-300">
      <div className={`absolute inset-x-0 top-0 h-[3px] ${stripeClass}`} />
      <h2 className="mb-3 text-base font-extrabold text-surface-900">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Grid({ children }: { children: ReactNode }) {
  return (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
      {children}
    </dl>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-wider text-surface-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-bold text-surface-900">
        {value && String(value).trim() ? value : "—"}
      </dd>
    </div>
  );
}

function Block({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-bold text-surface-500">{label}</p>
      <p className="mt-1 whitespace-pre-line rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-900">
        {value && String(value).trim() ? value : "—"}
      </p>
    </div>
  );
}

function ChipList({
  label,
  items,
  other,
}: {
  label: string;
  items?: string[];
  other?: string;
}) {
  const list = items ?? [];
  if (list.length === 0 && !other) {
    return <Field label={label} value={undefined} />;
  }
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-surface-500">
        {label}
      </p>
      <div className="mt-1 flex flex-wrap gap-1">
        {list.map((it) => (
          <span
            key={it}
            className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-700 ring-1 ring-inset ring-brand-200"
          >
            {it}
          </span>
        ))}
        {other ? (
          <span className="rounded-full bg-surface-100 px-2 py-0.5 text-[11px] font-bold text-surface-900">
            {other}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function TeamTableView({ rows }: { rows?: IncidentTeamRow[] }) {
  if (!rows || rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-surface-300 bg-surface-50 px-4 py-3 text-center text-xs text-surface-500">
        لا يوجد
      </p>
    );
  }
  return (
    <div className="overflow-hidden rounded-lg border border-surface-300 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-right text-sm">
          <thead className="border-b border-surface-200 bg-surface-100 text-[10px] font-bold text-surface-500">
            <tr>
              <th className="px-3 py-2">النوع</th>
              <th className="px-3 py-2">الاسم/الرمز</th>
              <th className="px-3 py-2">التحرك</th>
              <th className="px-3 py-2">الوصول</th>
              <th className="px-3 py-2">العودة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-200">
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="px-3 py-2 font-bold text-surface-900">{r.team_type}</td>
                <td className="px-3 py-2 text-surface-900">{r.name_code || "—"}</td>
                <td className="px-3 py-2 tabular-nums text-surface-500">
                  {r.departure_time || "—"}
                </td>
                <td className="px-3 py-2 tabular-nums text-surface-500">
                  {r.arrival_time || "—"}
                </td>
                <td className="px-3 py-2 tabular-nums text-surface-500">
                  {r.return_time || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
