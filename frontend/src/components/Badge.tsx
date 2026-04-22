import type { ReactNode } from "react";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const tones: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  danger: "bg-red-50 text-red-700 ring-red-200",
  info: "bg-blue-50 text-blue-700 ring-blue-200",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function vehicleStatusTone(status: string): Tone {
  if (status === "في الخدمة") return "success";
  if (status === "صيانة") return "warning";
  if (status === "خارج الخدمة") return "danger";
  return "neutral";
}

export function roomStatusTone(status: string): Tone {
  if (status === "جاهزة") return "success";
  if (status === "صيانة") return "warning";
  return "neutral";
}

export function maintenanceStatusTone(status: string): Tone {
  if (status === "مكتمل") return "success";
  if (status === "قيد التنفيذ") return "info";
  if (status === "مجدول") return "neutral";
  if (status === "ملغي") return "danger";
  return "neutral";
}

export function inspectionResultTone(result: string): Tone {
  if (result === "ناجح") return "success";
  if (result === "يحتاج صيانة") return "warning";
  if (result === "غير صالح") return "danger";
  return "neutral";
}

export function conditionTone(condition: string): Tone {
  if (condition === "ممتاز") return "success";
  if (condition === "جيد") return "info";
  if (condition === "متوسط") return "warning";
  if (condition === "تالف") return "danger";
  return "neutral";
}
