interface Props {
  completedLabel: string; // "١"
  totalLabel: string;     // "٢"
  dash: string;           // "213.63 427.26"
  circumference: number;  // 427.26
}

export function CountRing({ completedLabel, totalLabel, dash }: Props) {
  return (
    <div
      className="relative h-40 w-40 max-[980px]:h-[130px] max-[980px]:w-[130px]"
      role="img"
      aria-label={`${completedLabel} من ${totalLabel} مركز أكمل التكميل`}
    >
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
        <circle
          cx="80"
          cy="80"
          r="68"
          fill="none"
          stroke="rgba(245,241,230,.08)"
          strokeWidth="12"
        />
        <circle
          cx="80"
          cy="80"
          r="68"
          fill="none"
          stroke="url(#rabea-ring)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={dash}
          className="motion-safe:[transition:stroke-dasharray_1.1s_ease-out]"
        />
        <defs>
          <linearGradient id="rabea-ring" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#46a96a" />
            <stop offset="100%" stopColor="#d9c79a" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="font-display text-[56px] font-extrabold leading-none tracking-tight text-[#f5f1e6] tabular-nums max-[980px]:text-[46px]">
          {completedLabel}
          <span className="text-[28px] font-semibold text-[#a9b8ad]"> / {totalLabel}</span>
        </div>
        <div className="mt-1.5 text-[11px] tracking-[0.02em] text-[#a9b8ad]">
          مركز أكمل اليوم
        </div>
      </div>
    </div>
  );
}
