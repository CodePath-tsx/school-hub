import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Users, BookOpen, DollarSign, ClipboardCheck, TrendingUp, TrendingDown, UserPlus, CheckSquare, Layers, BarChart3, Settings as SettingsIcon, Clock } from "lucide-react";
import { useDb } from "@/lib/useDb";
import { Card, PageHeader, Badge, Avatar } from "@/components/ui-kit";
import { db, initials, fmtMoney, fmtDate } from "@/lib/store";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend, CartesianGrid, Tooltip } from "recharts";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Dashboard — SchoolByte ERP" }] }),
  component: Dashboard,
});

function StatCard({ label, value, delta, tone, icon: Icon }: { label: string; value: string; delta?: { dir: "up" | "down" | "flat"; text: string }; tone: "success" | "info" | "warning" | "danger"; icon: any }) {
  const tones: Record<string, string> = {
    success: "bg-success/10 text-success",
    info: "bg-info/10 text-info",
    warning: "bg-warning/25 text-warning-foreground",
    danger: "bg-destructive/10 text-destructive",
  };
  return (
    <Card className="p-5 relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">{label}</div>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tones[tone]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">{value}</div>
      {delta && (
        <div className={`mt-2 flex items-center gap-1 text-sm ${delta.dir === "down" ? "text-destructive" : delta.dir === "up" ? "text-success" : "text-muted-foreground"}`}>
          {delta.dir === "up" ? <TrendingUp className="w-4 h-4" /> : delta.dir === "down" ? <TrendingDown className="w-4 h-4" /> : null}
          {delta.text}
        </div>
      )}
    </Card>
  );
}

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function Dashboard() {
  const state = useDb();
  const now = useNow();
  const totalStudents = state.students.length;
  const activeTeachers = state.teachers.filter((t) => t.status === "active").length;
  const collected = db.revenueThisMonth();
  const expected = db.expectedMonthlyRevenue();
  const attRate = db.attendanceRate(30);
  const revenue = useMemo(() => db.revenueByMonth(6), [state.payments, state.expenses]);

  const recent = [...state.students].sort((a, b) => b.enrolledAt.localeCompare(a.enrolledAt)).slice(0, 5);
  const groupsById = Object.fromEntries(state.groups.map((g) => [g.id, g]));

  const quick = [
    { to: "/app/students", label: "Add Student", icon: UserPlus, tone: "success" },
    { to: "/app/teachers", label: "Add Teacher", icon: BookOpen, tone: "info" },
    { to: "/app/attendance", label: "Attendance", icon: CheckSquare, tone: "warning" },
    { to: "/app/groups", label: "New Group", icon: Layers, tone: "info" },
    { to: "/app/statistics", label: "View Stats", icon: BarChart3, tone: "success" },
    { to: "/app/settings", label: "Settings", icon: SettingsIcon, tone: "muted" },
  ] as const;

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={<>Overview of {state.settings.schoolName || "your institution"} — {state.settings.academicYear}</>}
        right={
          <Card className="px-4 py-2 flex items-center gap-3">
            <Clock className="w-4 h-4 text-primary" />
            <div className="leading-tight">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">{now.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
              <div className="font-bold tabular-nums">{now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>
            </div>
          </Card>
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={String(totalStudents)} delta={{ dir: totalStudents > 0 ? "up" : "flat", text: `${state.students.filter(s => s.status === "active").length} active` }} tone="success" icon={Users} />
        <StatCard label="Active Teachers" value={String(activeTeachers)} delta={{ dir: "flat", text: `${state.teachers.length} total on file` }} tone="info" icon={BookOpen} />
        <StatCard label="Collected This Month" value={fmtMoney(collected, state.settings.currency)} delta={{ dir: collected >= expected ? "up" : "down", text: `of ${fmtMoney(expected, state.settings.currency)} expected` }} tone="warning" icon={DollarSign} />
        <StatCard label="Attendance Rate" value={`${attRate} %`} delta={{ dir: attRate >= 80 ? "up" : "down", text: `last 30 days` }} tone={attRate >= 80 ? "success" : "danger"} icon={ClipboardCheck} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
        <Card className="xl:col-span-2 p-6">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <div className="text-lg font-semibold">Revenue vs Expenses</div>
              <div className="text-sm text-muted-foreground">Last 6 months — actual payments recorded</div>
            </div>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenue} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="m" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickFormatter={(v) => v >= 1000 ? `${v / 1000}k` : v} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)" }} formatter={(v: number) => fmtMoney(v, state.settings.currency)} />
                <Legend iconType="circle" />
                <Bar dataKey="Revenue" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Expenses" fill="var(--color-success)" fillOpacity={0.4} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-lg font-semibold mb-4">Quick Actions</div>
          <div className="grid grid-cols-2 gap-3">
            {quick.map((q) => {
              const Icon = q.icon;
              const tones: Record<string, string> = {
                success: "bg-success/10 text-success",
                info: "bg-info/10 text-info",
                warning: "bg-warning/25 text-warning-foreground",
                muted: "bg-muted text-muted-foreground",
              };
              return (
                <Link key={q.to} to={q.to} className="p-4 rounded-xl bg-muted/40 hover:bg-muted flex flex-col items-center gap-2 transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tones[q.tone]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-medium">{q.label}</div>
                </Link>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold">Recent Registrations</div>
          <Link to="/app/students" className="text-sm text-primary hover:underline">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground border-b">
                <th className="py-3 font-semibold">Student</th>
                <th className="py-3 font-semibold">Groups</th>
                <th className="py-3 font-semibold">Enrolled</th>
                <th className="py-3 font-semibold">Monthly Fee</th>
                <th className="py-3 font-semibold">Payment</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <Avatar initials={initials(s.firstName, s.lastName)} />
                      <div className="font-semibold">{s.firstName} {s.lastName}</div>
                    </div>
                  </td>
                  <td className="py-3 text-xs">{s.groupIds.map((id) => groupsById[id]?.name).filter(Boolean).join(", ") || "—"}</td>
                  <td className="py-3">{fmtDate(s.enrolledAt)}</td>
                  <td className="py-3 font-semibold">{fmtMoney(s.monthlyFee, state.settings.currency)}</td>
                  <td className="py-3">
                    {s.paymentStatus === "paid" && <Badge tone="success" dot>Paid</Badge>}
                    {s.paymentStatus === "pending" && <Badge tone="warning" dot>Pending</Badge>}
                    {s.paymentStatus === "overdue" && <Badge tone="danger" dot>Overdue</Badge>}
                  </td>
                </tr>
              ))}
              {recent.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No students yet — add your first student.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
