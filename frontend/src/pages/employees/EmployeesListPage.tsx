import { Moon, Sun, Sunset, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ApiRequestError } from "../../api/client";
import { fetchDashboardStats } from "../../api/dashboard";
import { listEmployees } from "../../api/employees";
import { listTeams } from "../../api/teams";
import { Avatar } from "../../components/Avatar";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { SelectField } from "../../components/SelectField";
import { StatCard } from "../../components/StatCard";
import { TextField } from "../../components/TextField";
import { SHIFTS } from "../../constants/enums";
import type { DashboardStats } from "../../types/dashboard";
import type { EmployeeSummary, Shift, Team } from "../../types/models";

const PAGE_SIZE = 20;

function shiftTone(shift: Shift): "info" | "warning" | "neutral" {
  if (shift === "صباحية") return "info";
  if (shift === "مسائية") return "warning";
  return "neutral";
}

export function EmployeesListPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState<DashboardStats["employees"] | null>(null);

  const [q, setQ] = useState("");
  const [teamId, setTeamId] = useState("");
  const [shift, setShift] = useState("");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listTeams()
      .then((res) => setTeams(res.items))
      .catch(() => toast.error("تعذر تحميل الفرق"));
    fetchDashboardStats()
      .then((s) => setStats(s.employees))
      .catch(() => {
        // Silent — list still works without the stat strip values.
      });
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

  const morning = stats?.by_shift?.["صباحية"] ?? 0;
  const evening = stats?.by_shift?.["مسائية"] ?? 0;
  const night = stats?.by_shift?.["ليلية"] ?? 0;

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

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="إجمالي الموظفين"
          value={stats?.total ?? "—"}
          icon={Users}
          tone="brand"
        />
        <StatCard label="الوردية الصباحية" value={morning} icon={Sun} tone="neutral" />
        <StatCard label="الوردية المسائية" value={evening} icon={Sunset} tone="warning" />
        <StatCard label="الوردية الليلية" value={night} icon={Moon} tone="neutral" />
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
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
      </section>

      {loading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500">
          جارِ التحميل...
        </div>
      ) : employees.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white">
          <EmptyState
            title="لا يوجد موظفون"
            description="لم يتم العثور على نتائج مطابقة، أو لم يتم إضافة أي موظف بعد."
            action={
              <Link to="/employees/new">
                <Button>إضافة أول موظف</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {employees.map((emp) => (
            <Link
              key={emp.id}
              to={`/employees/${emp.id}`}
              className="group block rounded-lg border border-slate-200 bg-white p-4 transition hover:border-brand-400 hover:shadow-sm"
            >
              <div className="flex items-start gap-4">
                <Avatar name={emp.name} src={emp.photo_path} size="md" />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-slate-900 group-hover:text-brand-700">
                    {emp.name}
                  </h3>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {emp.rank} · {emp.specialty}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge tone={shiftTone(emp.shift)}>{emp.shift}</Badge>
                    <span className="text-xs text-slate-600">
                      {teamById.get(emp.team_id) ?? "—"}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </section>
      )}

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
