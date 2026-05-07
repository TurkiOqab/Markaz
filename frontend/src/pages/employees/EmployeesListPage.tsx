import { Award, Plus, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ApiRequestError } from "../../api/client";
import { fetchDashboardStats } from "../../api/dashboard";
import { listEmployees } from "../../api/employees";
import { listTeams } from "../../api/teams";
import { Avatar } from "../../components/Avatar";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { Loader } from "../../components/Loader";
import { PageHeader } from "../../components/PageHeader";
import { SelectField } from "../../components/SelectField";
import { TextField } from "../../components/TextField";
import type { DashboardStats } from "../../types/dashboard";
import type { EmployeeSummary, Team } from "../../types/models";

const TEAM_TONES: Array<{ ring: string; bg: string; text: string }> = [
  { ring: "ring-brand-300", bg: "bg-brand-50", text: "text-brand-700" },
  { ring: "ring-blue-300", bg: "bg-blue-50", text: "text-blue-700" },
  { ring: "ring-amber-300", bg: "bg-amber-50", text: "text-amber-700" },
  { ring: "ring-red-300", bg: "bg-red-50", text: "text-red-700" },
];

function teamTone(teamId: number) {
  return TEAM_TONES[teamId % TEAM_TONES.length];
}

export function EmployeesListPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [stats, setStats] = useState<DashboardStats["employees"] | null>(null);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [teamId, setTeamId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, teamRes] = await Promise.all([
        listEmployees({ page: 1, page_size: 200 }),
        listTeams(),
      ]);
      setEmployees(empRes.items);
      setTeams(teamRes.items);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "تعذر تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    fetchDashboardStats()
      .then((s) => setStats(s.employees))
      .catch(() => undefined);
  }, [load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return employees.filter((e) => {
      if (teamId && String(e.team_id) !== teamId) return false;
      if (!needle) return true;
      return (
        e.name.toLowerCase().includes(needle) ||
        e.national_id.toLowerCase().includes(needle)
      );
    });
  }, [employees, teamId, q]);

  const groups = useMemo(() => {
    const byTeam = new Map<number, EmployeeSummary[]>();
    for (const e of filtered) {
      const arr = byTeam.get(e.team_id) ?? [];
      arr.push(e);
      byTeam.set(e.team_id, arr);
    }
    return teams
      .filter((t) => byTeam.has(t.id))
      .map((t) => ({ team: t, members: byTeam.get(t.id)! }));
  }, [filtered, teams]);

  const teamSummaries = useMemo(() => {
    const map = new Map<number, EmployeeSummary[]>();
    for (const e of employees) {
      const arr = map.get(e.team_id) ?? [];
      arr.push(e);
      map.set(e.team_id, arr);
    }
    return teams.map((t) => {
      const members = map.get(t.id) ?? [];
      const ratings = members.map((m) => m.rating_score).filter((r): r is number => r != null);
      const avg = ratings.length ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length) : null;
      return { team: t, count: members.length, avg };
    });
  }, [employees, teams]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="الموظفون والفرق"
        icon={Users}
        iconTone="brand"
        actions={
          <Link to="/employees/new">
            <Button>
              <Plus size={16} />
              إضافة موظف
            </Button>
          </Link>
        }
      />

      {/* Team summary chips */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {teamSummaries.map(({ team, count, avg }) => {
          const tone = teamTone(team.id);
          return (
            <div
              key={team.id}
              className={`flex items-center justify-between gap-3 rounded-2xl border border-surface-300 bg-white p-4 shadow-soft-green ring-1 ring-inset ${tone.ring}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${tone.bg} ${tone.text} text-lg font-black`}
                >
                  {team.name}
                </div>
                <div>
                  <p className="text-sm font-extrabold text-surface-900">الفرقة {team.name}</p>
                  <p className="text-[11px] text-surface-500">{count} عضو</p>
                </div>
              </div>
              <div className="text-end">
                <p className="text-[10px] font-bold uppercase tracking-wider text-surface-500">
                  متوسط التقييم
                </p>
                <p className={`text-2xl font-black tabular-nums ${avg != null ? scoreTextColor(avg) : "text-surface-500"}`}>
                  {avg ?? "—"}
                </p>
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <TextField
          label="بحث بالاسم أو الرقم الوطني"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="..."
        />
        <SelectField
          label="الفرقة"
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          placeholder="كل الفرق"
          options={teams.map((t) => ({ value: t.id, label: t.name }))}
        />
      </section>

      {loading ? (
        <Loader />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="لا يوجد موظفون"
          description="لم يتم العثور على نتائج مطابقة، أو لم يتم إضافة أي موظف بعد."
          action={
            <Link to="/employees/new">
              <Button>إضافة أول موظف</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {groups.map(({ team, members }) => (
            <section key={team.id}>
              <header className="mb-3 flex items-baseline justify-between gap-3">
                <h2 className="text-base font-extrabold text-surface-900">
                  الفرقة {team.name}
                </h2>
                <span className="text-xs text-surface-500">{members.length} عضو</span>
              </header>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {members.map((m) => (
                  <EmployeeCard key={m.id} emp={m} teamName={team.name} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {stats ? (
        <p className="text-center text-[11px] text-surface-500">
          إجمالي موظفي المركز: {stats.total}
        </p>
      ) : null}
    </div>
  );
}

function scoreTextColor(score: number): string {
  if (score >= 90) return "text-brand-700";
  if (score >= 80) return "text-blue-700";
  if (score >= 70) return "text-amber-700";
  return "text-red-700";
}

function scoreStrokeColor(score: number): string {
  if (score >= 90) return "#1a7a3a";
  if (score >= 80) return "#2563eb";
  if (score >= 70) return "#d97706";
  return "#dc2626";
}

function EmployeeCard({ emp, teamName }: { emp: EmployeeSummary; teamName: string }) {
  const tone = teamTone(emp.team_id);
  const score = emp.rating_score;
  const certNames = emp.certification_names ?? [];
  return (
    <Link
      to={`/employees/${emp.id}`}
      className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-surface-300 bg-white p-4 shadow-soft-green transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lift-green"
    >
      <div className={`absolute inset-x-0 top-0 h-[3px] ${stripeForScore(score)}`} />

      <div className="flex items-start gap-3">
        <div className={`shrink-0 rounded-full p-0.5 ring-2 ${tone.ring}`}>
          <Avatar
            name={emp.name}
            src={emp.photo_path ? `/uploads/${emp.photo_path}` : null}
            size="md"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-extrabold text-surface-900 group-hover:text-brand-700">
            {emp.name}
          </h3>
          <p className="mt-0.5 truncate text-[11px] text-surface-500">
            {emp.rank} • {emp.specialty}
          </p>
          <p className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${tone.bg} ${tone.text}`}>
            الفرقة {teamName}
          </p>
        </div>
        <RatingDonut score={score} />
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-surface-200 pt-3 text-center">
        <Stat label="شهادات" value={emp.certifications_count} />
        <Stat label="رصيد وكالات" value={emp.proxy_balance} tone={emp.proxy_balance >= 2 ? "amber" : "neutral"} />
      </div>

      {certNames.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {certNames.slice(0, 3).map((name, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700 ring-1 ring-inset ring-brand-200"
              title={name}
            >
              <Award size={10} />
              {name}
            </span>
          ))}
          {certNames.length > 3 ? (
            <span className="text-[10px] font-bold text-surface-500">
              +{certNames.length - 3}
            </span>
          ) : null}
        </div>
      ) : null}
    </Link>
  );
}

function stripeForScore(score: number | null): string {
  if (score == null) return "bg-surface-300";
  if (score >= 90) return "bg-brand-600";
  if (score >= 80) return "bg-blue-600";
  if (score >= 70) return "bg-amber-500";
  return "bg-red-600";
}

function Stat({ label, value, tone = "neutral" }: { label: string; value: number; tone?: "neutral" | "amber" }) {
  const toneCls = tone === "amber" ? "text-amber-700" : "text-surface-900";
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-surface-500">{label}</p>
      <p className={`mt-0.5 text-base font-black tabular-nums ${toneCls}`}>{value}</p>
    </div>
  );
}

function RatingDonut({ score }: { score: number | null }) {
  const size = 56;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const value = score ?? 0;
  const dash = (value / 100) * circumference;
  const color = score != null ? scoreStrokeColor(score) : "#e2ede2";
  const textColor = score != null ? scoreTextColor(score) : "text-surface-500";

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#eaf2ea"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-sm font-black tabular-nums leading-none ${textColor}`}>
          {score ?? "—"}
        </span>
        <span className="text-[8px] font-bold text-surface-500">/ 100</span>
      </div>
    </div>
  );
}
