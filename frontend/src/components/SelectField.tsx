import { useId } from "react";
import type { SelectHTMLAttributes } from "react";

interface Props extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label: string;
  error?: string;
  options: Array<{ value: string | number; label: string }>;
  placeholder?: string;
}

export function SelectField({
  label,
  error,
  options,
  placeholder,
  id,
  className = "",
  ...rest
}: Props) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  return (
    <label htmlFor={selectId} className="flex flex-col gap-1">
      <span className="text-sm font-medium text-surface-900">{label}</span>
      <select
        id={selectId}
        className={`rounded-md border bg-white px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-surface-500 ${
          error ? "border-red-400" : "border-surface-300"
        } ${className}`}
        {...rest}
      >
        {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error ? <span className="text-sm text-red-600">{error}</span> : null}
    </label>
  );
}
