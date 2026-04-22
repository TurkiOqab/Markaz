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
    <nav className="h-full w-60 shrink-0 border-l border-slate-200 bg-white px-4 py-6">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-700 font-bold text-white">
          م
        </div>
        <div>
          <div className="text-base font-bold leading-tight text-slate-900">مركز</div>
          <div className="text-xs text-slate-500">لوحة تحكم القائد</div>
        </div>
      </div>
      <ul className="space-y-1">
        {LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-brand-50 text-brand-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`
                }
              >
                <Icon size={18} />
                <span>{link.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
