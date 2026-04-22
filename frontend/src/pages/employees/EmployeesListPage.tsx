import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { listEmployees } from "../../api/employees";
import { listTeams } from "../../api/teams";
import { ApiRequestError } from "../../api/client";
import { SHIFTS } from "../../constants/enums";
import { Avatar } from "../../components/Avatar";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { SelectField } from "../../components/SelectField";
import { TextField } from "../../components/TextField";
import type { EmployeeSummary, Team } from "../../types/models";

const PAGE_SIZE = 20;

export function EmployeesListPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [q, setQ] = useState("");
  const [teamId, setTeamId] = useState("");
  const [shift, setShift] = useState("");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listTeams()
      .then((res) => setTeams(res.items))
      .catch(() => toast.error("تعذر تحميل الفرق"));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        q: q || undefined,
        team_id: teamId ? Number(teamId) : undefined,
        shift: (shift || undefined) as EmployeeSummary["shift"] | undefined,
        page,
        page_size: PAGE_SIZE,
      };
      const res = await listEmployees(params);
      setEmployees(res.items);
      setTotal(res.total);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "تعذر تحميل الموظفين");
    } finally {
      setLoading(false);
    }
  }, [q, teamId, shift, page]);

  useEffect(() => {
    load();
  }, [load]);

  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t.name])), [teams]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">الموظفون</h1>
          <p className="mt-1 text-sm text-slate-600">إدارة الموظفين والشهادات والتجهيزات</p>
        </div>
        <Link to="/employees/new">
          <Button>إضافة موظف</Button>
        </Link>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <TextField
            label="بحث بالاسم أو الرقم الوطني"
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
            placeholder="..."
          />
          <SelectField
            label="الفريق"
            value={teamId}
            onChange={(e) => {
              setPage(1);
              setTeamId(e.target.value);
            }}
            placeholder="كل الفرق"
            options={teams.map((t) => ({ value: t.id, label: t.name }))}
          />
          <SelectField
            label="الوردية"
            value={shift}
            onChange={(e) => {
              setPage(1);
              setShift(e.target.value);
            }}
            placeholder="كل الورديات"
            options={SHIFTS.map((s) => ({ value: s, label: s }))}
          />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white">
        {loading ? (
          <div className="p-8 text-center text-slate-500">جارِ التحميل...</div>
        ) : employees.length === 0 ? (
          <EmptyState
            title="لا يوجد موظفون"
            description="لم يتم العثور على نتائج مطابقة، أو لم يتم إضافة أي موظف بعد."
            action={
              <Link to="/employees/new">
                <Button>إضافة أول موظف</Button>
              </Link>
            }
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="w-12 px-4 py-3"></th>
                <th className="px-4 py-3 text-start font-medium">الاسم</th>
                <th className="px-4 py-3 text-start font-medium">الرتبة</th>
                <th className="px-4 py-3 text-start font-medium">التخصص</th>
                <th className="px-4 py-3 text-start font-medium">الفريق</th>
                <th className="px-4 py-3 text-start font-medium">الوردية</th>
                <th className="px-4 py-3 text-start font-medium">الرقم الوطني</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr
                  key={emp.id}
                  className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <Avatar name={emp.name} src={emp.photo_path} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/employees/${emp.id}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {emp.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{emp.rank}</td>
                  <td className="px-4 py-3 text-slate-700">{emp.specialty}</td>
                  <td className="px-4 py-3 text-slate-700">{teamById.get(emp.team_id) ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone="info">{emp.shift}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{emp.national_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {total > PAGE_SIZE ? (
        <footer className="flex items-center justify-between">
          <p className="text-sm text-slate-600">
            صفحة {page} من {totalPages} — إجمالي {total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              السابق
            </Button>
            <Button
              variant="secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              التالي
            </Button>
          </div>
        </footer>
      ) : null}
    </div>
  );
}
