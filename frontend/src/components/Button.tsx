import type { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
}

const variants = {
  primary:
    "bg-gradient-to-l from-brand-500 to-brand-700 text-white shadow-soft-green hover:shadow-lift-green hover:brightness-105 disabled:from-brand-300 disabled:to-brand-400 disabled:shadow-none",
  secondary:
    "bg-white text-surface-900 border border-brand-200 hover:bg-brand-50 disabled:text-surface-500 disabled:border-surface-300",
  danger:
    "bg-red-600 text-white shadow-sm hover:bg-red-700 disabled:bg-red-300",
};

export function Button({
  variant = "primary",
  loading = false,
  disabled,
  className = "",
  children,
  ...rest
}: Props) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...rest}
    >
      {loading ? "..." : children}
    </button>
  );
}
