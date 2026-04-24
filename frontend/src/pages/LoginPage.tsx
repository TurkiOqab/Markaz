import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ApiRequestError } from "../api/client";
import { useAuth } from "../auth/useAuth";
import { Button } from "../components/Button";
import { TextField } from "../components/TextField";

export function LoginPage() {
  const { loading, setupComplete, authenticated, login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">جارِ التحميل...</p>
      </main>
    );
  }
  if (!setupComplete) {
    return <Navigate to="/setup" replace />;
  }
  if (authenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(username, password);
      navigate("/", { replace: true });
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : "فشل تسجيل الدخول";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen border-t-2 border-brand-700">
      {/* Brand panel — hidden on mobile */}
      <aside className="relative hidden flex-col items-center justify-center overflow-hidden bg-brand-700 p-12 text-white md:flex md:w-1/2">
        {/* subtle radial glow pattern */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.15) 0%, transparent 45%), radial-gradient(circle at 80% 80%, rgba(0,0,0,0.25) 0%, transparent 50%)",
          }}
          aria-hidden
        />
        <div className="relative z-10 flex flex-col items-center gap-6 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-white/25 bg-white/10 text-4xl font-bold backdrop-blur-sm">
            م
          </div>
          <div>
            <h1 className="text-5xl font-black tracking-tight">مركز</h1>
            <p className="mt-2 text-base text-white/80">لوحة تحكم القائد</p>
          </div>
          <div className="mt-4 h-1 w-16 rounded-full bg-white/40" />
          <p className="max-w-xs text-sm leading-relaxed text-white/75">
            إدارة الموظفين والمركبات والمبنى في مكان واحد.
          </p>
        </div>
      </aside>

      {/* Form side */}
      <section className="flex flex-1 items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-6">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm space-y-5 rounded-xl border border-slate-200 bg-white p-8 shadow-sm"
        >
          <header className="md:hidden">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-700 text-2xl font-bold text-white">
              م
            </div>
          </header>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">تسجيل الدخول</h2>
            <p className="mt-1 text-sm text-slate-500">مرحباً مجدداً في مركز</p>
            <div className="mt-3 h-1 w-12 rounded-full bg-brand-700" />
          </div>

          <TextField
            label="اسم المستخدم"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
          <TextField
            label="كلمة المرور"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          <Button type="submit" loading={submitting} className="w-full">
            تسجيل الدخول
          </Button>
        </form>
      </section>
    </main>
  );
}
