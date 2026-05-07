import type { ReactNode } from "react";
import { useEffect } from "react";

type ModalSize = "sm" | "md" | "lg" | "xl" | "2xl";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
}

const SIZE_CLASS: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  "2xl": "max-w-6xl",
};

export function Modal({ open, onClose, title, children, footer, size = "md" }: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-[4px]"
      style={{ backgroundColor: "rgba(10,30,10,0.4)" }}
      onClick={onClose}
    >
      <div
        className={`w-full ${SIZE_CLASS[size]} max-h-[90vh] overflow-y-auto rounded-2xl border border-surface-300 bg-white shadow-lift-green animate-fade-in-up`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sticky top-0 z-10 border-b border-surface-200 bg-white/95 px-6 py-4 backdrop-blur">
          <h2 className="text-lg font-extrabold text-surface-900">{title}</h2>
        </header>
        <div className="px-6 py-4">{children}</div>
        {footer ? (
          <footer className="flex justify-end gap-2 border-t border-surface-200 bg-surface-50 px-6 py-3 rounded-b-2xl">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
