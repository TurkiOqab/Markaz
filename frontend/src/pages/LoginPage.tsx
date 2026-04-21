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
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg bg-white p-8 shadow-sm border border-slate-200 space-y-5"
      >
        <header>
          <h1 className="text-2xl font-bold text-slate-900">تسجيل الدخول</h1>
          <p className="mt-2 text-sm text-slate-600">مرحباً مجدداً في مركز</p>
        </header>

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
    </main>
  );
}
