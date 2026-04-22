import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
      <span className="text-sm text-slate-500">مركز الدفاع المدني</span>
      <Button variant="secondary" onClick={handleLogout}>
        <LogOut size={16} />
        تسجيل الخروج
      </Button>
    </header>
  );
}
