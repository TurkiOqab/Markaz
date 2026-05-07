import { Flame, ListOrdered } from "lucide-react";
import { NavLink } from "react-router-dom";

const TABS = [
  { to: "/incidents", label: "سجل الحوادث", icon: ListOrdered, end: true },
  { to: "/incidents/heatmap", label: "الخريطة الحرارية", icon: Flame, end: false },
];

export function IncidentsTabs() {
  return (
    <div className="flex w-fit items-center gap-1 rounded-2xl border border-surface-300 bg-white p-1 shadow-soft-green">
      {TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) =>
            `inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
              isActive
                ? "bg-gradient-to-l from-brand-500 to-brand-700 text-white shadow-soft-green"
                : "text-surface-700 hover:bg-brand-50"
            }`
          }
        >
          <t.icon size={14} />
          {t.label}
        </NavLink>
      ))}
    </div>
  );
}
