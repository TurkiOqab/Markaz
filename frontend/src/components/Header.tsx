import { Home, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../auth/useAuth";
import { Button } from "./Button";

export function Header() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      toast.success("تم تسجيل الخروج");
      navigate("/login", { replace: true });
    } catch {
      toast.error("تعذر تسجيل الخروج");
    }
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 border-t-2 border-t-brand-700 bg-white px-6">
      <Link
        to="/"
        className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-700 text-sm font-bold text-white">
          م
        </div>
        <span className="text-sm font-semibold text-slate-900">مركز</span>
      </Link>
      <div className="flex items-center gap-2">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-brand-700"
        >
          <Home size={16} />
          الرئيسية
        </Link>
        <Button variant="secondary" onClick={handleLogout}>
          <LogOut size={16} />
          تسجيل الخروج
        </Button>
      </div>
    </header>
  );
}
