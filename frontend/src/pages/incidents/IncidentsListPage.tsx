import { Flame, ShieldAlert, Siren } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ApiRequestError } from "../../api/client";
import { listIncidents } from "../../api/incidents";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { Loader } from "../../components/Loader";
import { PageHeader } from "../../components/PageHeader";
import { SelectField } from "../../components/SelectField";
import { StatCard } from "../../components/StatCard";
import { INCIDENT_TYPES } from "../../constants/enums";
import type { Incident, IncidentType } from "../../types/models";
import { IncidentsTabs } from "./IncidentsTabs";

const PAGE_SIZE = 20;
const STATUS_OPTIONS = [
  { value: "مكتمل", label: "مكتمل فقط" },
  { value: "غير مكتمل", label: "غير مكتمل فقط" },
];

export function typeStripeColor(t: string): string {
  if (t === "حريق") return "bg-red-600";
  if (t === "إنقاذ") return "bg-blue-600";
  if (t === "إسعاف") return "bg-amber-500";
  return "bg-gradient-to-l from-brand-500 to-brand-700";
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("ar-EG", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function IncidentsListPage() {
  const [items, setItems] = useState<Incident[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [type, setType] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listIncidents({
        type: (type || undefined) as IncidentType | undefined,
        status: statusFilter || undefined,
        page,
        page_size: PAGE_SIZE,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "تعذر تحميل الحوادث");
    } finally {
      setLoading(false);
    }
  }, [type, statusFilter, page]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const c = { fire: 0, rescue: 0, incomplete: 0 };
    for (const i of items) {
      if (i.type === "حريق") c.fire++;
      if (i.type === "إنقاذ") c.rescue++;
      if (i.status === "غير مكتمل") c.incomplete++;
    }
    return c;
  }, [items]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <PageHeader
        title="سجل الحوادث"
        subtitle="تسجيل ومتابعة جميع الحوادث والاستجابات"
        icon={Siren}
        iconTone="brand"
        actions={
          <Link to="/incidents/new">
            <Button>تسجيل حادث</Button>
          </Link>
        }
      />

      <IncidentsTabs />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="إجمالي الحوادث" value={total} icon={Siren} tone="brand" />
        <StatCard label="حرائق" value={counts.fire} icon={Flame} tone="danger" />
        <StatCard label="إنقاذ" value={counts.rescue} icon={ShieldAlert} tone="info" />
        <StatCard label="غير مكتملة" value={counts.incomplete} icon={Siren} tone="warning" />
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <SelectField
          label="النوع"
          value={type}
          onChange={(e) => {
            setPage(1);
            setType(e.target.value);
          }}
          placeholder="كل الأنواع"
          options={INCIDENT_TYPES.map((t) => ({ value: t, label: t }))}
        />
        <SelectField
          label="حالة الإكمال"
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value);
          }}
          placeholder="الكل"
          options={STATUS_OPTIONS}
        />
      </section>

      {loading ? (
        <Loader />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Siren}
          title="لا يوجد حوادث مسجّلة"
          description="ابدأ بتسجيل أول حادث"
          action={
            <Link to="/incidents/new">
              <Button>تسجيل حادث</Button>
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {items.map((inc) => (
            <li key={inc.id}>
              <Link
                to={`/incidents/${inc.id}`}
                className="relative block overflow-hidden rounded-2xl border border-surface-300 bg-white p-4 shadow-soft-green transition hover:border-brand-300 hover:shadow-lift-green"
              >
                <div className={`absolute inset-x-0 top-0 h-[3px] ${typeStripeColor(inc.type)}`} />
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <Siren size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-extrabold text-surface-900">
                        {inc.type} — {inc.location}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${
                          inc.status === "مكتمل"
                            ? "bg-brand-50 text-brand-700 ring-brand-200"
                            : "bg-amber-50 text-amber-700 ring-amber-200"
                        }`}
                      >
                        {inc.status}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-surface-500">{inc.description}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-surface-500">
                      <span>{formatDateTime(inc.occurred_at)}</span>
                      {inc.response_minutes != null ? (
                        <span>الاستجابة: {inc.response_minutes} د</span>
                      ) : null}
                      {inc.personnel_count != null ? (
                        <span>الطاقم: {inc.personnel_count}</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {total > PAGE_SIZE ? (
        <footer className="flex items-center justify-between">
          <p className="text-sm text-surface-500">
            صفحة {page} من {totalPages} — إجمالي {total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              السابق
            </Button>
            <Button
              variant="secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              التالي
            </Button>
          </div>
        </footer>
      ) : null}
    </div>
  );
}
