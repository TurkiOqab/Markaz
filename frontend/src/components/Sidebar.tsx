import { NavLink } from "react-router-dom";

const LINKS: Array<{ to: string; label: string }> = [
  { to: "/", label: "الرئيسية" },
  { to: "/employees", label: "الموظفون" },
  { to: "/vehicles", label: "المركبات" },
  { to: "/building", label: "المبنى" },
];

export function Sidebar() {
  return (
    <nav className="h-full w-60 shrink-0 border-l border-slate-200 bg-white p-4">
      <div className="mb-8 px-2">
        <span className="text-xl font-bold text-slate-900">مركز</span>
      </div>
      <ul className="space-y-1">
        {LINKS.map((link) => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
