import { ArrowUpDown } from "lucide-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}

export function SortSelect({ value, onChange, options }: Props) {
  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-surface-300 bg-white px-3 py-2">
      <ArrowUpDown size={14} className="text-surface-500" />
      <span className="text-xs text-surface-500">ترتيب:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-transparent text-sm font-medium text-surface-900 focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
