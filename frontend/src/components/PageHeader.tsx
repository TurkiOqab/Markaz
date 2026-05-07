import { ChevronRight } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { Link } from "react-router-dom";

type IconTone = "brand" | "blue" | "amber" | "emerald" | "slate";

const toneClass: Record<IconTone, string> = {
  brand: "bg-brand-50 text-brand-700",
  blue: "bg-blue-50 text-blue-700",
  amber: "bg-amber-50 text-amber-700",
  emerald: "bg-emerald-50 text-emerald-700",
  slate: "bg-surface-100 text-surface-900",
};

interface Props {
  title: string;
  subtitle?: string;
  icon?: ComponentType<{ size?: number }>;
  iconTone?: IconTone;
  actions?: ReactNode;
  backLink?: { to: string; label: string };
}

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  iconTone = "brand",
  actions,
  backLink,
}: Props) {
  return (
    <header className="space-y-3 pb-1">
      {backLink ? (
        <Link
          to={backLink.to}
          className="inline-flex items-center gap-1 text-sm text-surface-500 transition-colors hover:text-brand-700"
        >
          <ChevronRight size={14} />
          {backLink.label}
        </Link>
      ) : null}
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          {Icon ? (
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${toneClass[iconTone]}`}
            >
              <Icon size={24} />
            </div>
          ) : null}
          <div className="min-w-0">
            <h1 className="truncate text-[26px] font-black tracking-tight text-surface-900">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-1 truncate text-sm text-surface-500">{subtitle}</p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      <div className="h-1 w-20 rounded-full bg-gradient-to-l from-brand-500 to-brand-700" />
    </header>
  );
}
