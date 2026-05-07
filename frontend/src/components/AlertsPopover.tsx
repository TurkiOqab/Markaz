import {
  AlertTriangle,
  ArrowRightLeft,
  Bell,
  CalendarClock,
  Package,
  Siren,
  Truck,
  X,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchDashboardStats } from "../api/dashboard";
import { listIncidents } from "../api/incidents";
import { listProxyBalances, PROXIES_CHANGED_EVENT } from "../api/proxies";
import type { DashboardStats } from "../types/dashboard";
import type { Incident, ProxyBalance } from "../types/models";

type Severity = "danger" | "warning" | "info";

interface Alert {
  key: string;
  severity: Severity;
  icon: ComponentType<{ size?: number }>;
  title: string;
  detail: ReactNode;
  link?: { to: string; label: string };
}

const ICON_BG: Record<Severity, string> = {
  danger: "bg-red-50 text-red-700",
  warning: "bg-amber-50 text-amber-700",
  info: "bg-blue-50 text-blue-700",
};

const SEVERITY_RANK: Record<Severity, number> = { danger: 0, warning: 1, info: 2 };

function buildAlerts(
  stats: DashboardStats,
  proxyBalances: ProxyBalance[],
  incompleteIncidents: Incident[],
): Alert[] {
  const out: Alert[] = [];

  for (const inc of incompleteIncidents) {
    out.push({
      key: `inc-${inc.id}`,
      severity: "warning",
      icon: Siren,
      title: `حادث غير مكتمل: ${inc.type} — ${inc.location}`,
      detail: "أكمل الحقول الناقصة لتغيير الحالة إلى مكتمل",
      link: { to: `/incidents/${inc.id}`, label: "فتح" },
    });
  }

  for (const v of stats.attention.vehicles_out) {
    out.push({
      key: `veh-${v.id}`,
      severity: v.status === "خارج الخدمة" ? "danger" : "warning",
      icon: Truck,
      title: `${v.plate_number} ${v.status === "خارج الخدمة" ? "خارج الخدمة" : "في الصيانة"}`,
      detail: v.status,
      link: { to: `/vehicles/${v.id}`, label: "فتح" },
    });
  }

  for (const c of stats.attention.expiring_certs) {
    const expired = c.days_until < 0;
    out.push({
      key: `cert-${c.employee_id}-${c.cert_name}`,
      severity: expired ? "danger" : c.days_until <= 14 ? "danger" : "warning",
      icon: CalendarClock,
      title: expired
        ? `شهادة منتهية: ${c.cert_name}`
        : `${c.cert_name} ينتهي خلال ${c.days_until} يوم`,
      detail: c.employee_name,
      link: { to: `/employees/${c.employee_id}`, label: "فتح" },
    });
  }

  for (const i of stats.attention.low_stock) {
    out.push({
      key: `stock-${i.id}`,
      severity: i.quantity === 0 ? "danger" : "warning",
      icon: Package,
      title: `مخزون منخفض: ${i.item_name}`,
      detail: `${i.quantity} / ${i.min_threshold}`,
      link: { to: "/building", label: "فتح" },
    });
  }

  if (stats.maintenance.open_count > 0) {
    out.push({
      key: "maint-open",
      severity: "info",
      icon: AlertTriangle,
      title: `${stats.maintenance.open_count} عملية صيانة مفتوحة`,
      detail: "مجدولة أو قيد التنفيذ",
    });
  }

  for (const b of proxyBalances) {
    if (b.count >= 2) {
      out.push({
        key: `proxy-${b.substitute_id}`,
        severity: "warning",
        icon: ArrowRightLeft,
        title: `${b.substitute_name}: ${b.count} وكالات معلّقة`,
        detail: b.team_name ?? "",
        link: { to: "/proxies", label: "فتح" },
      });
    }
  }

  return out.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
}

interface AlertsData {
  alerts: Alert[];
  loading: boolean;
}

function useAlertsData(open: boolean): AlertsData {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [balances, setBalances] = useState<ProxyBalance[]>([]);
  const [incompleteIncidents, setIncompleteIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useMemo(
    () => () => {
      setLoading(true);
      Promise.all([
        fetchDashboardStats(),
        listProxyBalances(),
        listIncidents({ status: "غير مكتمل", page_size: 100 }),
      ])
        .then(([s, b, inc]) => {
          setStats(s);
          setBalances(b.items);
          setIncompleteIncidents(inc.items);
        })
        .catch(() => undefined)
        .finally(() => setLoading(false));
    },
    [],
  );

  useEffect(() => {
    if (!open) return;
    load();
  }, [open, load]);

  useEffect(() => {
    function onChange() {
      if (open) load();
    }
    window.addEventListener(PROXIES_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(PROXIES_CHANGED_EVENT, onChange);
  }, [open, load]);

  const alerts = useMemo(
    () => (stats ? buildAlerts(stats, balances, incompleteIncidents) : []),
    [stats, balances, incompleteIncidents],
  );
  return { alerts, loading };
}

export function useAlertsCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    function refresh() {
      Promise.all([
        fetchDashboardStats(),
        listProxyBalances(),
        listIncidents({ status: "غير مكتمل", page_size: 100 }),
      ])
        .then(([s, b, inc]) => {
          if (!active) return;
          setCount(buildAlerts(s, b.items, inc.items).length);
        })
        .catch(() => undefined);
    }
    refresh();
    const onChange = () => refresh();
    window.addEventListener(PROXIES_CHANGED_EVENT, onChange);
    const interval = window.setInterval(refresh, 60_000);
    return () => {
      active = false;
      window.removeEventListener(PROXIES_CHANGED_EVENT, onChange);
      window.clearInterval(interval);
    };
  }, []);

  return count;
}

interface PopoverProps {
  open: boolean;
  onClose: () => void;
  anchorRight?: number;
  anchorLeft?: number;
  anchorTop?: number;
}

export function AlertsPopover({
  open,
  onClose,
  anchorRight,
  anchorLeft,
  anchorTop = 68,
}: PopoverProps) {
  const { alerts, loading } = useAlertsData(open);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className="fixed inset-0 z-40 bg-[rgba(10,30,10,0.18)] backdrop-blur-[3px] animate-fade-in-up"
      />
      <div
        role="dialog"
        aria-label="التنبيهات"
        style={{
          ...(anchorLeft !== undefined ? { left: `${anchorLeft}px` } : {}),
          ...(anchorRight !== undefined ? { right: `${anchorRight}px` } : {}),
          top: `${anchorTop}px`,
        }}
        className="fixed z-50 w-[340px] max-h-[80vh] overflow-hidden rounded-2xl border border-surface-300 bg-white shadow-lift-green animate-fade-in-up flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-surface-200 bg-surface-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-amber-600" />
            <h3 className="text-sm font-extrabold text-surface-900">
              التنبيهات
              {alerts.length > 0 ? (
                <span className="ms-2 text-xs font-bold text-surface-500">
                  ({alerts.length})
                </span>
              ) : null}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="rounded-md p-1 text-surface-500 hover:bg-surface-100 hover:text-surface-900"
          >
            <X size={14} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {loading && alerts.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-surface-500">
              جارِ التحميل...
            </p>
          ) : alerts.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-surface-500">
              لا توجد تنبيهات. كل شيء على ما يرام.
            </p>
          ) : (
            <ul className="divide-y divide-surface-200">
              {alerts.map((a) => (
                <AlertRow key={a.key} alert={a} onAction={onClose} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

function AlertRow({ alert, onAction }: { alert: Alert; onAction: () => void }) {
  const Icon = alert.icon;
  const body = (
    <div className="flex items-start gap-3 px-4 py-3 text-right transition-colors hover:bg-brand-50">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${ICON_BG[alert.severity]}`}
      >
        <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-extrabold text-surface-900">{alert.title}</p>
        {alert.detail ? (
          <p className="mt-0.5 truncate text-[11px] text-surface-500">{alert.detail}</p>
        ) : null}
      </div>
    </div>
  );
  if (alert.link) {
    return (
      <li>
        <Link to={alert.link.to} onClick={onAction} className="block">
          {body}
        </Link>
      </li>
    );
  }
  return <li>{body}</li>;
}
