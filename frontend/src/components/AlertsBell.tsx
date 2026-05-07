import { Bell } from "lucide-react";
import { useState } from "react";
import { AlertsPopover, useAlertsCount } from "./AlertsPopover";

export function AlertsBell() {
  const [open, setOpen] = useState(false);
  const count = useAlertsCount();
  const has = count > 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`التنبيهات${has ? ` (${count})` : ""}`}
        title="التنبيهات"
        style={{ left: "16px", top: "16px" }}
        className={`fixed z-40 flex h-11 w-11 items-center justify-center rounded-full border bg-white shadow-soft-green transition-all hover:shadow-lift-green ${
          open
            ? "border-amber-300 text-amber-700"
            : has
              ? "border-amber-200 text-amber-700"
              : "border-surface-300 text-surface-500"
        }`}
      >
        <Bell size={20} />
        {has ? (
          <span
            style={{ right: "-4px", top: "-4px" }}
            className="absolute flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-extrabold tabular-nums text-white shadow ring-2 ring-white"
          >
            {count}
          </span>
        ) : null}
      </button>

      <AlertsPopover open={open} onClose={() => setOpen(false)} anchorLeft={16} anchorTop={68} />
    </>
  );
}
