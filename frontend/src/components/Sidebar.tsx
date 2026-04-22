import { Building2, Home, Truck, Users } from "lucide-react";
import type { ComponentType } from "react";
import { NavLink } from "react-router-dom";

const LINKS: Array<{ to: string; label: string; icon: ComponentType<{ size?: number }> }> = [
  { to: "/", label: "الرئيسية", icon: Home },
  { to: "/employees", label: "الموظفون", icon: Users },
  { to: "/vehicles", label: "المركبات", icon: Truck },
  { to: "/building", label: "المبنى", icon: Building2 },
];

export function Sidebar() {
  return (
    <nav className="h-full w-60 shrink-0 border-l border-slate-200 bg-white p-3">
      <div className="mb-4 flex items-center gap-3 px-3 pt-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-700 font-bold text-white">
          م
        </div>
        <div>
          <div className="text-base font-bold leading-tight text-slate-900">مركز</div>
          <div className="text-xs text-slate-500">لوحة تحكم القائد</div>
        </div>
      </div>
      <ul className="space-y-2">
        {LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg border px-5 py-5 text-base font-medium transition-colors ${
                    isActive
                      ? "border-brand-300 bg-brand-50 text-brand-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                  }`
                }
              >
                <Icon size={20} />
                <span>{link.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
