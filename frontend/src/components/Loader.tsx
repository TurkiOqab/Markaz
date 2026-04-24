interface Props {
  message?: string;
  fullPage?: boolean;
  size?: "sm" | "md";
}

const sizes = {
  sm: "h-5 w-5 border-2",
  md: "h-7 w-7 border-[3px]",
};

export function Loader({ message = "جارِ التحميل...", fullPage, size = "md" }: Props) {
  const content = (
    <div className="flex items-center gap-3 text-slate-500">
      <div
        className={`${sizes[size]} animate-spin rounded-full border-slate-200 border-t-brand-700`}
        aria-hidden
      />
      {message ? <span className="text-sm">{message}</span> : null}
    </div>
  );
  if (fullPage) {
    return (
      <main className="flex min-h-screen items-center justify-center border-t-2 border-brand-700 bg-gradient-to-b from-slate-50 to-slate-100">
        {content}
      </main>
    );
  }
  return <div className="flex items-center justify-center py-8">{content}</div>;
}
