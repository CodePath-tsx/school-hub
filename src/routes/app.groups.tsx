import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { useDb } from "@/lib/useDb";
import { Card, PageHeader, Badge, Avatar, ProgressBar } from "@/components/ui-kit";
import { db, fmtMoney } from "@/lib/store";

export const Route = createFileRoute("/app/groups")({
  head: () => ({ meta: [{ title: "Groups — SchoolByte ERP" }] }),
  component: GroupsPage,
});

const yearLabels: Record<string, string> = {
  "1st-year-secondary": "1st Year Secondary",
  "2nd-year-secondary": "2nd Year Secondary",
  "3rd-year-secondary": "3rd Year Secondary",
};

function GroupsPage() {
  const state = useDb();
  const [q, setQ] = useState("");
  const [subjF, setSubjF] = useState("");
  const [statusF, setStatusF] = useState("");
  const [yearF, setYearF] = useState("");

  const subjects = Array.from(new Set(state.groups.map((g) => g.subject)));
  const teachersById = Object.fromEntries(state.teachers.map((t) => [t.id, t]));
  const roomsById = Object.fromEntries(state.rooms.map((r) => [r.id, r]));
  const studentsByGroup = state.groups.reduce<Record<string, number>>((acc, g) => {
    acc[g.id] = state.students.filter((s) => s.groupId === g.id && s.status === "active").length;
    return acc;
  }, {});

  const filtered = useMemo(() => state.groups.filter((g) => {
    if (q && !`${g.name} ${teachersById[g.teacherId]?.firstName ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (subjF && g.subject !== subjF) return false;
    if (statusF && g.status !== statusF) return false;
    if (yearF && g.year !== yearF) return false;
    return true;
  }), [state.groups, q, subjF, statusF, yearF, teachersById]);

  return (
    <>
      <PageHeader
        title="Groups"
        subtitle={<>Showing <b>{filtered.length}</b> of <b>{state.groups.length}</b> groups</>}
        right={
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or teacher…" className="pl-9 pr-3 h-10 w-72 rounded-md border bg-card outline-none focus:ring-2 focus:ring-ring/30" />
            </div>
            <select value={subjF} onChange={(e) => setSubjF(e.target.value)} className="h-10 rounded-md border bg-card px-3">
              <option value="">All Subjects</option>
              {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={statusF} onChange={(e) => setStatusF(e.target.value)} className="h-10 rounded-md border bg-card px-3">
              <option value="">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option>
            </select>
            <select value={yearF} onChange={(e) => setYearF(e.target.value)} className="h-10 rounded-md border bg-card px-3">
              <option value="">All Years</option>
              {Object.entries(yearLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <button onClick={() => {
              const name = prompt("Group name"); if (!name) return;
              db.addGroup({ name, subject: "Mathematics", year: "1st-year-secondary", teacherId: state.teachers[0]?.id ?? "", roomId: state.rooms[0]?.id ?? "", monthlyFee: 2000, capacity: 25, status: "active" });
            }} className="h-10 px-4 rounded-md bg-primary text-primary-foreground font-medium flex items-center gap-2 hover:bg-primary/90">
              <Plus className="w-4 h-4" /> Add Group
            </button>
          </>
        }
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground border-b">
                <th className="py-4 px-6 font-semibold">Group</th>
                <th className="py-4 font-semibold">Subject</th>
                <th className="py-4 font-semibold">Teacher</th>
                <th className="py-4 font-semibold">Room</th>
                <th className="py-4 font-semibold">Students</th>
                <th className="py-4 font-semibold">Monthly Fee</th>
                <th className="py-4 font-semibold">Revenue</th>
                <th className="py-4 font-semibold">Status</th>
                <th className="py-4 pr-6"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((g) => {
                const count = studentsByGroup[g.id] || 0;
                const pct = g.capacity ? Math.round((count / g.capacity) * 100) : 0;
                const rev = count * g.monthlyFee;
                const t = teachersById[g.teacherId];
                return (
                  <tr key={g.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-3">
                        <Avatar initials={g.name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()} tone="success" />
                        <div>
                          <div className="font-semibold">{g.name}</div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">{yearLabels[g.year]}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">{g.subject}</td>
                    <td className="py-3">{t ? `${t.firstName} ${t.lastName}` : "—"}</td>
                    <td className="py-3">{roomsById[g.roomId]?.name ?? "—"}</td>
                    <td className="py-3 min-w-[160px]">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold">{count} / {g.capacity}</span>
                        <span className="text-muted-foreground">{pct}%</span>
                      </div>
                      <ProgressBar value={pct} tone={pct >= 80 ? "warning" : "success"} />
                    </td>
                    <td className="py-3 font-semibold">{fmtMoney(g.monthlyFee, state.settings.currency)}</td>
                    <td className="py-3 font-semibold">{fmtMoney(rev, state.settings.currency)}</td>
                    <td className="py-3">{g.status === "active" ? <Badge tone="success" dot>Active</Badge> : <Badge tone="warning" dot>Inactive</Badge>}</td>
                    <td className="py-3 pr-6">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <button className="p-2 rounded hover:bg-muted"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => db.updateGroup(g.id, { status: g.status === "active" ? "inactive" : "active" })} className="p-2 rounded hover:bg-muted"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => confirm("Delete group?") && db.deleteGroup(g.id)} className="p-2 rounded hover:bg-destructive/10 hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
