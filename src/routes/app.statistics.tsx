import { createFileRoute } from "@tanstack/react-router";
import { useDb } from "@/lib/useDb";
import { Card, PageHeader } from "@/components/ui-kit";
import { fmtMoney } from "@/lib/store";
import { LineChart, Line, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";

export const Route = createFileRoute("/app/statistics")({
  head: () => ({ meta: [{ title: "Statistics — SchoolByte ERP" }] }),
  component: StatisticsPage,
});

const trend = [
  { m: "Oct", students: 96, revenue: 145 },
  { m: "Nov", students: 104, revenue: 162 },
  { m: "Dec", students: 108, revenue: 148 },
  { m: "Jan", students: 116, revenue: 175 },
  { m: "Feb", students: 120, revenue: 170 },
  { m: "Mar", students: 124, revenue: 184.5 },
];

function StatisticsPage() {
  const state = useDb();
  const totalRev = state.students.filter((s) => s.status === "active").reduce((a, s) => a + s.monthlyFee, 0);
  const bySubject = state.groups.reduce<Record<string, number>>((acc, g) => {
    const c = state.students.filter((s) => s.groupId === g.id).length;
    acc[g.subject] = (acc[g.subject] || 0) + c;
    return acc;
  }, {});
  const pieData = Object.entries(bySubject).map(([name, value]) => ({ name, value }));
  const COLORS = ["var(--color-primary)", "var(--color-info)", "var(--color-warning)", "var(--color-success)", "var(--color-destructive)"];

  return (
    <>
      <PageHeader title="Statistics" subtitle="Institution performance overview" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-6"><div className="text-xs uppercase tracking-widest text-muted-foreground">Total Revenue (Month)</div><div className="text-3xl font-bold mt-2">{fmtMoney(totalRev, state.settings.currency)}</div></Card>
        <Card className="p-6"><div className="text-xs uppercase tracking-widest text-muted-foreground">Active Students</div><div className="text-3xl font-bold mt-2">{state.students.filter(s => s.status === "active").length}</div></Card>
        <Card className="p-6"><div className="text-xs uppercase tracking-widest text-muted-foreground">Active Groups</div><div className="text-3xl font-bold mt-2">{state.groups.filter(g => g.status === "active").length}</div></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="text-lg font-semibold mb-4">Student Growth</div>
          <div className="h-72">
            <ResponsiveContainer><LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="m" fontSize={12} /><YAxis fontSize={12} />
              <Tooltip /><Line type="monotone" dataKey="students" stroke="var(--color-primary)" strokeWidth={3} />
            </LineChart></ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-lg font-semibold mb-4">Students per Subject</div>
          <div className="h-72">
            <ResponsiveContainer><PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90} label>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend /><Tooltip />
            </PieChart></ResponsiveContainer>
          </div>
        </Card>
      </div>
    </>
  );
}
