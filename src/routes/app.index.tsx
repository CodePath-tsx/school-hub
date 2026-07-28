import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, BookOpen, DollarSign, ClipboardCheck, TrendingUp, TrendingDown, UserPlus, Plus, CheckSquare, Layers, BarChart3, Settings as SettingsIcon } from "lucide-react";
import { useDb } from "@/lib/useDb";
import { Card, PageHeader, Badge, Avatar } from "@/components/ui-kit";
import { initials, fmtMoney, fmtDate } from "@/lib/store";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend, CartesianGrid, Tooltip } from "recharts";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Dashboard — SchoolByte ERP" }] }),
  component: Dashboard,
});

const revenue = [
  { m: "Oct", Revenue: 145000, Expenses: 62000 },
  { m: "Nov", Revenue: 162000, Expenses: 65000 },
  { m: "Dec", Revenue: 148000, Expenses: 68000 },
  { m: "Jan", Revenue: 175000, Expenses: 70000 },
  { m: "Feb", Revenue: 170000, Expenses: 68000 },
  { m: "Mar", Revenue: 184500, Expenses: 72000 },
];

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
      <div className="mt-3 text-4xl font-bold tracking-tight">{value}</div>
      {delta && (
        <div className={`mt-2 flex items-center gap-1 text-sm ${delta.dir === "down" ? "text-destructive" : "text-success"}`}>
          {delta.dir === "up" ? <TrendingUp className="w-4 h-4" /> : delta.dir === "down" ? <TrendingDown className="w-4 h-4" /> : null}
          {delta.text}
        </div>
      )}
    </Card>
  );
}

function Dashboard() {
  const state = useDb();
  const totalStudents = state.students.length;
  const activeTeachers = state.teachers.filter((t) => t.status === "active").length;
  const monthlyRevenue = state.students.filter(s => s.status === "active").reduce((a, s) => a + s.monthlyFee, 0);
  const attRate = 91;

  const recent = [...state.students].slice(-4).reverse();
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
      <PageHeader title="Dashboard" subtitle="Overview of your institution" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={String(totalStudents)} delta={{ dir: "up", text: `+${Math.max(1, Math.floor(totalStudents / 15))} this month` }} tone="success" icon={Users} />
        <StatCard label="Active Teachers" value={String(activeTeachers)} delta={{ dir: "flat", text: "No change" }} tone="info" icon={BookOpen} />
        <StatCard label="Monthly Revenue" value={fmtMoney(monthlyRevenue, state.settings.currency)} delta={{ dir: "up", text: "+12% vs last month" }} tone="warning" icon={DollarSign} />
        <StatCard label="Attendance Rate" value={`${attRate} %`} delta={{ dir: "down", text: "-3% this week" }} tone="danger" icon={ClipboardCheck} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
        <Card className="xl:col-span-2 p-6">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <div className="text-lg font-semibold">Revenue Overview</div>
              <div className="text-sm text-muted-foreground">Last 6 months</div>
            </div>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenue} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="m" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickFormatter={(v) => v >= 1000 ? `${v / 1000}k` : v} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)" }} />
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
                <th className="py-3 font-semibold">Student Name</th>
                <th className="py-3 font-semibold">Group</th>
                <th className="py-3 font-semibold">Last Payment</th>
                <th className="py-3 font-semibold">Amount</th>
                <th className="py-3 font-semibold">Status</th>
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
                  <td className="py-3">{groupsById[s.groupId]?.name ?? "-"}</td>
                  <td className="py-3">{fmtDate(s.enrolledAt)}</td>
                  <td className="py-3 font-semibold">{fmtMoney(s.monthlyFee, state.settings.currency)}</td>
                  <td className="py-3">
                    {s.paymentStatus === "paid" && <Badge tone="success" dot>Paid</Badge>}
                    {s.paymentStatus === "pending" && <Badge tone="warning" dot>Pending</Badge>}
                    {s.paymentStatus === "overdue" && <Badge tone="danger" dot>Overdue</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
