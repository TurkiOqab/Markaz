import type { ComponentType, ReactNode } from "react";

interface Props {
  label: string;
  value: ReactNode;
  sublabel?: ReactNode;
  icon: ComponentType<{ size?: number }>;
  tone?: "neutral" | "brand" | "warning" | "danger";
}

const tones = {
  neutral: { bg: "bg-slate-100", fg: "text-slate-700" },
  brand: { bg: "bg-brand-100", fg: "text-brand-700" },
  warning: { bg: "bg-amber-100", fg: "text-amber-700" },
  danger: { bg: "bg-red-100", fg: "text-red-700" },
};

export function StatCard({ label, value, sublabel, icon: Icon, tone = "neutral" }: Props) {
  const t = tones[tone];
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-600">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          {sublabel ? <p className="mt-1 text-xs text-slate-500">{sublabel}</p> : null}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${t.bg} ${t.fg}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}
