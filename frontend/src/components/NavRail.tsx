import {
  ArrowRightLeft,
  Building2,
  LayoutDashboard,
  LogOut,
  Siren,
  Truck,
  Users,
  Wrench,
} from "lucide-react";
import type { ComponentType } from "react";
import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { listProxyBalances, PROXIES_CHANGED_EVENT } from "../api/proxies";
import { useAuth } from "../auth/useAuth";

type BadgeTone = "danger" | "warning" | "info";

interface RailItem {
  to: string;
  label: string;
  icon: ComponentType<{ size?: number }>;
  end?: boolean;
  badgeTone?: BadgeTone;
  /** Key into the dynamic counts map (e.g. "proxies"). */
  badgeKey?: "proxies";
}

const ITEMS: RailItem[] = [
  { to: "/", label: "الرئيسية", icon: LayoutDashboard, end: true },
  { to: "/incidents", label: "سجل الحوادث", icon: Siren },
  {
    to: "/proxies",
    label: "الوكالات",
    icon: ArrowRightLeft,
    badgeTone: "warning",
    badgeKey: "proxies",
  },
  { to: "/employees", label: "الموظفون والفرق", icon: Users },
  { to: "/vehicles", label: "المركبات", icon: Truck },
  { to: "/equipment", label: "المعدات", icon: Wrench },
  { to: "/building", label: "المبنى", icon: Building2 },
];

function dotColor(tone: BadgeTone): string {
  return tone === "danger" ? "bg-red-500" : tone === "warning" ? "bg-amber-500" : "bg-blue-500";
}

function badgePillClasses(tone: BadgeTone): string {
  return tone === "danger"
    ? "bg-red-50 text-red-700 ring-red-200"
    : tone === "warning"
      ? "bg-amber-50 text-amber-700 ring-amber-200"
      : "bg-blue-50 text-blue-700 ring-blue-200";
}

export function NavRail() {
  const [expanded, setExpanded] = useState(false);
  const [proxiesPending, setProxiesPending] = useState(0);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    const fetchCount = () => {
      listProxyBalances()
        .then((res) => {
          if (active) setProxiesPending(res.total_pending);
        })
        .catch(() => undefined);
    };
    fetchCount();
    const onChange = () => fetchCount();
    window.addEventListener(PROXIES_CHANGED_EVENT, onChange);
    return () => {
      active = false;
      window.removeEventListener(PROXIES_CHANGED_EVENT, onChange);
    };
  }, []);

  const counts: Record<NonNullable<RailItem["badgeKey"]>, number> = {
    proxies: proxiesPending,
  };

  async function handleLogout() {
    try {
      await logout();
      toast.success("تم تسجيل الخروج");
      navigate("/login", { replace: true });
    } catch {
      toast.error("تعذر تسجيل الخروج");
    }
  }

  return (
    <>
      <div
        aria-hidden
        className={`pointer-events-none fixed inset-0 z-30 transition-all duration-300 ease-rail ${
          expanded
            ? "bg-[rgba(10,30,10,0.18)] backdrop-blur-[3px]"
            : "bg-transparent backdrop-blur-0"
        }`}
      />

      <nav
        aria-label="القائمة الرئيسية"
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className={`fixed top-1/2 z-40 -translate-y-1/2 overflow-hidden rounded-[28px] border border-brand-100 bg-white/95 shadow-lift-green backdrop-blur-md transition-[width] duration-[280ms] ease-rail ${
          expanded ? "w-[230px]" : "w-[62px]"
        }`}
        style={{ right: "16px" }}
      >
        <div className="flex items-center gap-3 px-3 pt-4 pb-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-base font-black text-white shadow-soft-green transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift-green hover:border-brand-300">
            إ
          </div>
          {expanded ? (
            <div className="flex min-w-0 flex-col animate-fade-in-up">
              <span className="text-sm font-extrabold leading-tight text-surface-900">
                إنجاز
              </span>
              <span className="text-[10px] font-medium text-surface-500">
                لوحة تحكم المركز
              </span>
            </div>
          ) : null}
        </div>

        <ul className="flex flex-col gap-1 px-2 pb-2">
          {ITEMS.map((item) => {
            const liveCount = item.badgeKey ? counts[item.badgeKey] : 0;
            const showDot = !!item.badgeTone && (item.badgeKey ? liveCount > 0 : true);
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `relative flex items-center gap-3 rounded-2xl px-2.5 py-2.5 text-sm font-bold transition-colors duration-200 ${
                      isActive
                        ? "bg-gradient-to-l from-brand-500 to-brand-700 text-white shadow-soft-green transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift-green hover:border-brand-300"
                        : "text-surface-900 hover:bg-brand-50"
                    }`
                  }
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center">
                    <item.icon size={20} />
                  </span>
                  {expanded ? (
                    <span className="flex min-w-0 flex-1 items-center justify-between gap-2 animate-fade-in-up">
                      <span className="truncate">{item.label}</span>
                      {item.badgeKey && liveCount > 0 ? (
                        <span
                          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-extrabold tabular-nums ring-1 ring-inset ${badgePillClasses(item.badgeTone ?? "info")}`}
                        >
                          {liveCount}
                        </span>
                      ) : null}
                    </span>
                  ) : null}
                  {!expanded && showDot && item.badgeTone ? (
                    <span
                      className={`absolute end-1.5 top-1.5 h-2 w-2 rounded-full animate-pulse-soft ${dotColor(item.badgeTone)}`}
                    />
                  ) : null}
                </NavLink>
              </li>
            );
          })}
        </ul>

        <div className="mx-3 mb-2 h-px bg-surface-200" />

        <div className="px-2 pb-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-2xl px-2.5 py-2.5 text-sm font-bold text-surface-500 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center">
              <LogOut size={18} />
            </span>
            {expanded ? (
              <span className="truncate animate-fade-in-up">تسجيل الخروج</span>
            ) : null}
          </button>
        </div>
      </nav>
    </>
  );
}
