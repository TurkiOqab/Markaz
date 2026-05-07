import type { ComponentType, ReactNode } from "react";

interface Props {
  label: string;
  value: ReactNode;
  sublabel?: ReactNode;
  icon: ComponentType<{ size?: number }>;
  tone?: "neutral" | "brand" | "warning" | "danger" | "info";
}

const tones = {
  neutral: { bg: "bg-surface-100", fg: "text-surface-500", stripe: "bg-surface-300" },
  brand:   { bg: "bg-brand-50",    fg: "text-brand-700",   stripe: "bg-brand-600" },
  warning: { bg: "bg-amber-50",    fg: "text-amber-700",   stripe: "bg-amber-500" },
  danger:  { bg: "bg-red-50",      fg: "text-red-700",     stripe: "bg-red-600" },
  info:    { bg: "bg-blue-50",     fg: "text-blue-700",    stripe: "bg-blue-600" },
};

export function StatCard({ label, value, sublabel, icon: Icon, tone = "neutral" }: Props) {
  const t = tones[tone];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-surface-300 bg-white p-5 shadow-soft-green transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift-green hover:border-brand-300">
      <div className={`absolute inset-x-0 top-0 h-[3px] ${t.stripe}`} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-surface-500">{label}</p>
          <p className="mt-2 text-4xl font-black tabular-nums tracking-tight text-surface-900">
            {value}
          </p>
          {sublabel ? <p className="mt-1 text-xs text-surface-500">{sublabel}</p> : null}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${t.bg} ${t.fg}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}
