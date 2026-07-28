import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { useDb } from "@/lib/useDb";
import { Card, PageHeader, Badge, Avatar } from "@/components/ui-kit";
import { db, initials, fmtMoney } from "@/lib/store";

export const Route = createFileRoute("/app/teachers")({
  head: () => ({ meta: [{ title: "Teachers — SchoolByte ERP" }] }),
  component: TeachersPage,
});

function TeachersPage() {
  const state = useDb();
  const [q, setQ] = useState("");
  const [subjF, setSubjF] = useState("");
  const [modeF, setModeF] = useState("");

  const subjects = Array.from(new Set(state.teachers.map((t) => t.subject)));
  const groupsByTeacher = state.teachers.reduce<Record<string, number>>((acc, t) => {
    acc[t.id] = state.groups.filter((g) => g.teacherId === t.id).length;
    return acc;
  }, {});
  const estMonthly = (t: typeof state.teachers[number]) => {
    if (t.status !== "active") return 0;
    if (t.salaryMode === "session") {
      return t.salaryRate * 5 * (groupsByTeacher[t.id] || 0);
    }
    const rev = state.groups.filter((g) => g.teacherId === t.id).reduce((acc, g) => {
      const count = state.students.filter((s) => s.groupId === g.id && s.status === "active").length;
      return acc + count * g.monthlyFee;
    }, 0);
    return Math.round(rev * (t.salaryRate / 100));
  };

  const filtered = useMemo(() => state.teachers.filter((t) => {
    const s = `${t.firstName} ${t.lastName} ${t.subject}`.toLowerCase();
    if (q && !s.includes(q.toLowerCase())) return false;
    if (subjF && t.subject !== subjF) return false;
    if (modeF && t.salaryMode !== modeF) return false;
    return true;
  }), [state.teachers, q, subjF, modeF]);

  return (
    <>
      <PageHeader
        title="Teachers"
        subtitle={<>Showing <b>{filtered.length}</b> of <b>{state.teachers.length}</b> teachers</>}
        right={
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or subject…" className="pl-9 pr-3 h-10 w-72 rounded-md border bg-card outline-none focus:ring-2 focus:ring-ring/30" />
            </div>
            <select value={subjF} onChange={(e) => setSubjF(e.target.value)} className="h-10 rounded-md border bg-card px-3">
              <option value="">All Subjects</option>
              {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={modeF} onChange={(e) => setModeF(e.target.value)} className="h-10 rounded-md border bg-card px-3">
              <option value="">All Modes</option>
              <option value="session">Session</option>
              <option value="percentage">Percentage</option>
            </select>
            <button onClick={() => {
              const first = prompt("First name"); if (!first) return;
              const last = prompt("Last name") ?? "";
              db.addTeacher({ firstName: first, lastName: last, phone: "", subject: "Mathematics", salaryMode: "session", salaryRate: 800, status: "active" });
            }} className="h-10 px-4 rounded-md bg-primary text-primary-foreground font-medium flex items-center gap-2 hover:bg-primary/90">
              <Plus className="w-4 h-4" /> Add Teacher
            </button>
          </>
        }
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground border-b">
                <th className="py-4 px-6 font-semibold">Teacher</th>
                <th className="py-4 font-semibold">Phone</th>
                <th className="py-4 font-semibold">Groups</th>
                <th className="py-4 font-semibold">Salary Mode</th>
                <th className="py-4 font-semibold">Est. Monthly</th>
                <th className="py-4 font-semibold">Status</th>
                <th className="py-4 pr-6"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="py-3 px-6">
                    <div className="flex items-center gap-3">
                      <Avatar initials={initials(t.firstName, t.lastName)} tone="info" />
                      <div>
                        <div className="font-semibold">{t.firstName} {t.lastName}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">{t.subject}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">{t.phone || "—"}</td>
                  <td className="py-3"><Badge tone="info">{groupsByTeacher[t.id] || 0} group{(groupsByTeacher[t.id] || 0) === 1 ? "" : "s"}</Badge></td>
                  <td className="py-3">
                    {t.salaryMode === "session" ? (
                      <span className="inline-flex items-center gap-2"><Badge tone="info">Session</Badge> <span className="text-warning-foreground font-semibold">{t.salaryRate} DA</span></span>
                    ) : (
                      <span className="inline-flex items-center gap-2"><Badge tone="warning">Percentage</Badge> <span className="text-warning-foreground font-semibold">{t.salaryRate}%</span></span>
                    )}
                  </td>
                  <td className="py-3 font-semibold">{fmtMoney(estMonthly(t), state.settings.currency)}</td>
                  <td className="py-3">{t.status === "active" ? <Badge tone="success" dot>Active</Badge> : <Badge tone="warning" dot>Inactive</Badge>}</td>
                  <td className="py-3 pr-6">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <button className="p-2 rounded hover:bg-muted"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => db.updateTeacher(t.id, { status: t.status === "active" ? "inactive" : "active" })} className="p-2 rounded hover:bg-muted"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => confirm("Delete teacher?") && db.deleteTeacher(t.id)} className="p-2 rounded hover:bg-destructive/10 hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                    </div>
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
