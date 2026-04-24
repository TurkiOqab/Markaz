import { Building2, LayoutDashboard, LogOut, Truck, Users } from "lucide-react";
import type { ComponentType } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../auth/useAuth";

interface Tile {
  to: string;
  label: string;
  subtitle: string;
  icon: ComponentType<{ size?: number }>;
  iconBg: string;
  iconFg: string;
}

const TILES: Tile[] = [
  {
    to: "/control-panel",
    label: "لوحة التحكم",
    subtitle: "نظرة شاملة على المركز والإحصائيات",
    icon: LayoutDashboard,
    iconBg: "bg-brand-50 group-hover:bg-brand-100",
    iconFg: "text-brand-700",
  },
  {
    to: "/employees",
    label: "الموظفون",
    subtitle: "إدارة الطاقم والشهادات والتقييمات",
    icon: Users,
    iconBg: "bg-blue-50 group-hover:bg-blue-100",
    iconFg: "text-blue-700",
  },
  {
    to: "/vehicles",
    label: "المركبات",
    subtitle: "أسطول الإطفاء والإسعاف والصيانة",
    icon: Truck,
    iconBg: "bg-amber-50 group-hover:bg-amber-100",
    iconFg: "text-amber-700",
  },
  {
    to: "/building",
    label: "المبنى",
    subtitle: "المرافق والمخزون والتقارير",
    icon: Building2,
    iconBg: "bg-emerald-50 group-hover:bg-emerald-100",
    iconFg: "text-emerald-700",
  },
];

export function HomePage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

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
    <div className="flex h-screen flex-col border-t-2 border-brand-700 bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-700 font-bold text-white shadow-sm">
            م
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight text-slate-900">مركز</h1>
            <p className="text-xs text-slate-500">لوحة تحكم القائد</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 text-xs text-slate-500 transition-colors hover:text-slate-900"
        >
          <LogOut size={14} />
          تسجيل الخروج
        </button>
      </header>

      <nav
        aria-label="الأقسام الرئيسية"
        className="grid flex-1 grid-cols-1 gap-4 px-8 pb-8 sm:grid-cols-2 lg:grid-cols-4"
      >
        {TILES.map((tile) => (
          <TileLink key={tile.to} {...tile} />
        ))}
      </nav>
    </div>
  );
}

function TileLink({ to, label, subtitle, icon: Icon, iconBg, iconFg }: Tile) {
  return (
    <Link
      to={to}
      className="group flex h-full flex-col items-center justify-center gap-5 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg"
    >
      <div
        className={`flex h-24 w-24 items-center justify-center rounded-3xl ${iconBg} ${iconFg} transition-colors`}
      >
        <Icon size={48} />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 group-hover:text-brand-700">{label}</h2>
      <p className="max-w-xs text-sm text-slate-500">{subtitle}</p>
    </Link>
  );
}
