import { Link } from "react-router-dom";

const CARDS = [
  {
    to: "/employees",
    title: "الموظفون",
    description: "إدارة الموظفين والشهادات والتجهيزات والتقييمات",
  },
  {
    to: "/vehicles",
    title: "المركبات",
    description: "إدارة المركبات والصيانة والمعدات والفحوصات",
  },
  {
    to: "/building",
    title: "المبنى",
    description: "إدارة الغرف والمخزون والصيانة والتقارير",
  },
];

export function DashboardPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">أهلاً وسهلاً</h1>
        <p className="mt-2 text-slate-600">اختر أحد الأقسام للبدء</p>
      </header>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {CARDS.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-400 hover:shadow-md"
          >
            <h2 className="text-lg font-semibold text-slate-900">{card.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
