import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ApiRequestError } from "../api/client";
import { useAuth } from "../auth/useAuth";
import { Button } from "../components/Button";
import { TextField } from "../components/TextField";

export function SetupPage() {
  const { loading, setupComplete, setup } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return <FullPageLoader />;
  }
  if (setupComplete) {
    return <Navigate to="/login" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("كلمتا المرور غير متطابقتين");
      return;
    }
    if (password.length < 10) {
      toast.error("يجب أن تكون كلمة المرور 10 أحرف على الأقل");
      return;
    }
    setSubmitting(true);
    try {
      await setup(username, password);
      toast.success("تم إنشاء الحساب");
      navigate("/", { replace: true });
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : "فشل الإعداد";
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
          <h1 className="text-2xl font-bold text-slate-900">مرحباً بك في مركز</h1>
          <p className="mt-2 text-sm text-slate-600">قم بإنشاء حساب القائد لأول مرة</p>
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
          autoComplete="new-password"
        />
        <TextField
          label="تأكيد كلمة المرور"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          autoComplete="new-password"
        />

        <Button type="submit" loading={submitting} className="w-full">
          إنشاء الحساب
        </Button>
      </form>
    </main>
  );
}

function FullPageLoader() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-slate-500">جارِ التحميل...</p>
    </main>
  );
}
