import { Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface WidgetDef {
  key: string;
  label: string;
}

export interface WidgetGroup {
  title: string;
  widgets: WidgetDef[];
}

interface Props {
  groups: WidgetGroup[];
  visible: Record<string, boolean>;
  onToggle: (key: string, value: boolean) => void;
  onReset: () => void;
}

export function DashboardSettings({ groups, visible, onToggle, onReset }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-surface-300 bg-white text-surface-500 hover:bg-surface-100"
        aria-label="إعدادات لوحة التحكم"
        title="تخصيص"
      >
        <Settings size={18} />
      </button>

      {open ? (
        <div className="absolute end-0 top-11 z-20 w-72 rounded-lg border border-surface-300 bg-white p-4 shadow-lg">
          <header className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-surface-900">تخصيص اللوحة</h3>
            <button
              type="button"
              onClick={onReset}
              className="text-xs text-brand-700 hover:underline"
            >
              إعادة التعيين
            </button>
          </header>
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {groups.map((group) => (
              <section key={group.title}>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-surface-500">
                  {group.title}
                </h4>
                <ul className="space-y-1">
                  {group.widgets.map((w) => (
                    <li key={w.key}>
                      <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-surface-100">
                        <input
                          type="checkbox"
                          checked={visible[w.key] ?? true}
                          onChange={(e) => onToggle(w.key, e.target.checked)}
                          className="h-4 w-4 rounded border-surface-300 text-brand-700 focus:ring-brand-500"
                        />
                        <span className="text-surface-900">{w.label}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
