export function WelcomeFooter() {
  return (
    <footer className="flex items-center justify-between border-t border-[rgba(245,241,230,.10)] pt-3.5 text-[11.5px] text-[#7b8a80]">
      <div className="flex items-center gap-3">
        <span>نظام إنجاز</span>
        <span className="h-[3px] w-[3px] rounded-full bg-[#7b8a80]" />
        <span>شعبة العمليات</span>
        <span className="h-[3px] w-[3px] rounded-full bg-[#7b8a80]" />
        <span>
          الإصدار <span className="font-mono">2.4.1</span>
        </span>
      </div>
    </footer>
  );
}
