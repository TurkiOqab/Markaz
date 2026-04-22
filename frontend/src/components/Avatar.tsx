interface Props {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
}

const sizes = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-24 w-24 text-2xl" };

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "؟";
  if (parts.length === 1) return parts[0][0];
  return parts[0][0] + parts[parts.length - 1][0];
}

export function Avatar({ name, src, size = "md" }: Props) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizes[size]} rounded-full border border-slate-200 object-cover`}
      />
    );
  }
  return (
    <div
      className={`${sizes[size]} flex items-center justify-center rounded-full bg-slate-200 font-semibold text-slate-600`}
      aria-label={name}
    >
      {initials(name)}
    </div>
  );
}
