import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

interface Props<K extends string> {
  label: string;
  columnKey: K;
  active: K | null;
  direction: "asc" | "desc";
  onSort: (key: K) => void;
}

export function SortHeader<K extends string>({
  label,
  columnKey,
  active,
  direction,
  onSort,
}: Props<K>) {
  const isActive = active === columnKey;
  const Icon = !isActive ? ArrowUpDown : direction === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={() => onSort(columnKey)}
      className={`inline-flex items-center gap-1.5 font-medium transition-colors ${
        isActive ? "text-slate-900" : "text-slate-600 hover:text-slate-900"
      }`}
    >
      <span>{label}</span>
      <Icon size={14} className={isActive ? "text-slate-900" : "text-slate-400"} />
    </button>
  );
}
