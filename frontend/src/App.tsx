import { useEffect, useState } from 'react';

export default function App() {
  const [healthStatus, setHealthStatus] = useState<string>('...');

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((json) => setHealthStatus(json?.data?.status ?? 'unknown'))
      .catch(() => setHealthStatus('offline'));
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 text-slate-900">
      <h1 className="text-4xl font-bold">مرحباً بك في مركز</h1>
      <p className="text-lg text-slate-600">
        حالة الخادم: <span className="font-semibold">{healthStatus}</span>
      </p>
    </main>
  );
}
