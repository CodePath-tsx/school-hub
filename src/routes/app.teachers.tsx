import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Plus, Eye, Pencil, Trash2, X } from "lucide-react";
import { useDb } from "@/lib/useDb";
import { Card, PageHeader, Badge, Avatar } from "@/components/ui-kit";
import { db, initials, fmtMoney, fmtDate, type Teacher } from "@/lib/store";

export const Route = createFileRoute("/app/teachers")({
  head: () => ({ meta: [{ title: "Teachers — SchoolByte ERP" }] }),
  component: TeachersPage,
});

function TeachersPage() {
  const state = useDb();
  const [q, setQ] = useState("");
  const [subjF, setSubjF] = useState("");
  const [modeF, setModeF] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [viewing, setViewing] = useState<Teacher | null>(null);

  const subjects = Array.from(new Set(state.teachers.map((t) => t.subject)));
  const groupsByTeacher = state.teachers.reduce<Record<string, number>>((acc, t) => {
    acc[t.id] = state.groups.filter((g) => g.teacherId === t.id).length;
    return acc;
  }, {});
  const estMonthly = (t: Teacher) => {
    if (t.status !== "active") return 0;
    const tgroups = state.groups.filter((g) => g.teacherId === t.id);
    if (t.salaryMode === "session") {
      return tgroups.reduce((a, g) => a + g.sessionsPerMonth * t.salaryRate, 0);
    }
    const rev = tgroups.reduce((acc, g) => {
      const count = state.students.filter((s) => s.groupIds.includes(g.id) && s.status === "active").length;
      return acc + count * g.monthlyFee;
    }, 0);
    return Math.round(rev * (t.salaryRate / 100));
  };

  const filtered = useMemo(() => state.teachers.filter((t) => {
    const s = `${t.firstName} ${t.lastName} ${t.subject} ${t.phone}`.toLowerCase();
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
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="pl-9 pr-3 h-10 w-56 sm:w-72 rounded-md border bg-card outline-none focus:ring-2 focus:ring-ring/30" />
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
            <button onClick={() => setShowAdd(true)} className="h-10 px-4 rounded-md bg-primary text-primary-foreground font-medium flex items-center gap-2 hover:bg-primary/90">
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
                <th className="py-4 font-semibold">Salary</th>
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
                  <td className="py-3">
                    <div>{t.phone || "—"}</div>
                    {t.email && <div className="text-xs text-muted-foreground">{t.email}</div>}
                  </td>
                  <td className="py-3"><Badge tone="info">{groupsByTeacher[t.id] || 0} group{(groupsByTeacher[t.id] || 0) === 1 ? "" : "s"}</Badge></td>
                  <td className="py-3">
                    {t.salaryMode === "session"
                      ? <span className="inline-flex items-center gap-2"><Badge tone="info">Session</Badge> <span className="font-semibold">{t.salaryRate} DA</span></span>
                      : <span className="inline-flex items-center gap-2"><Badge tone="warning">Percentage</Badge> <span className="font-semibold">{t.salaryRate}%</span></span>}
                  </td>
                  <td className="py-3 font-semibold">{fmtMoney(estMonthly(t), state.settings.currency)}</td>
                  <td className="py-3">{t.status === "active" ? <Badge tone="success" dot>Active</Badge> : <Badge tone="warning" dot>Inactive</Badge>}</td>
                  <td className="py-3 pr-6">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <button onClick={() => setViewing(t)} className="p-2 rounded hover:bg-muted"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => setEditing(t)} className="p-2 rounded hover:bg-muted"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => confirm(`Delete ${t.firstName} ${t.lastName}?`) && db.deleteTeacher(t.id)} className="p-2 rounded hover:bg-destructive/10 hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="py-16 text-center text-muted-foreground">No teachers match your filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {showAdd && <TeacherModal onClose={() => setShowAdd(false)} />}
      {editing && <TeacherModal teacher={editing} onClose={() => setEditing(null)} />}
      {viewing && <ViewTeacherModal teacher={viewing} onClose={() => setViewing(null)} />}
    </>
  );
}

function Field({ label, children, span = 1 }: { label: string; children: React.ReactNode; span?: 1 | 2 }) {
  return <label className={`block ${span === 2 ? "sm:col-span-2" : ""}`}><div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">{label}</div>{children}</label>;
}

function TeacherModal({ teacher, onClose }: { teacher?: Teacher; onClose: () => void }) {
  const isEdit = !!teacher;
  const [firstName, setFirstName] = useState(teacher?.firstName ?? "");
  const [lastName, setLastName] = useState(teacher?.lastName ?? "");
  const [phone, setPhone] = useState(teacher?.phone ?? "");
  const [email, setEmail] = useState(teacher?.email ?? "");
  const [subject, setSubject] = useState(teacher?.subject ?? "Mathematics");
  const [salaryMode, setSalaryMode] = useState<Teacher["salaryMode"]>(teacher?.salaryMode ?? "session");
  const [salaryRate, setSalaryRate] = useState(teacher?.salaryRate ?? 800);
  const [hiredAt, setHiredAt] = useState(teacher?.hiredAt ?? new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState(teacher?.notes ?? "");
  const [status, setStatus] = useState<Teacher["status"]>(teacher?.status ?? "active");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !subject.trim()) { alert("Name and subject are required"); return; }
    const payload = { firstName, lastName, phone, email, subject, salaryMode, salaryRate: Number(salaryRate), hiredAt, notes, status };
    if (isEdit && teacher) db.updateTeacher(teacher.id, payload);
    else db.addTeacher(payload);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl p-6 my-8">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-bold">{isEdit ? "Edit Teacher" : "New Teacher"}</div>
          <button type="button" onClick={onClose} className="p-1"><X className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="First Name *"><input value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="w-full h-10 px-3 border rounded-md bg-background" /></Field>
          <Field label="Last Name *"><input value={lastName} onChange={(e) => setLastName(e.target.value)} required className="w-full h-10 px-3 border rounded-md bg-background" /></Field>
          <Field label="Phone"><input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full h-10 px-3 border rounded-md bg-background" /></Field>
          <Field label="Email"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-10 px-3 border rounded-md bg-background" /></Field>
          <Field label="Subject *"><input value={subject} onChange={(e) => setSubject(e.target.value)} required className="w-full h-10 px-3 border rounded-md bg-background" /></Field>
          <Field label="Hired On"><input type="date" value={hiredAt} onChange={(e) => setHiredAt(e.target.value)} className="w-full h-10 px-3 border rounded-md bg-background" /></Field>
          <Field label="Salary Mode">
            <select value={salaryMode} onChange={(e) => setSalaryMode(e.target.value as any)} className="w-full h-10 px-3 border rounded-md bg-background">
              <option value="session">Per Session (DA)</option>
              <option value="percentage">Percentage of Group Revenue (%)</option>
            </select>
          </Field>
          <Field label={salaryMode === "session" ? "Rate per Session (DA)" : "Percentage (%)"}>
            <input type="number" min={0} value={salaryRate} onChange={(e) => setSalaryRate(Number(e.target.value))} className="w-full h-10 px-3 border rounded-md bg-background" />
          </Field>
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full h-10 px-3 border rounded-md bg-background">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
          <Field label="Notes" span={2}><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-md bg-background" /></Field>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-md border">Cancel</button>
          <button className="h-10 px-4 rounded-md bg-primary text-primary-foreground font-medium">{isEdit ? "Save Changes" : "Create Teacher"}</button>
        </div>
      </form>
    </div>
  );
}

function ViewTeacherModal({ teacher, onClose }: { teacher: Teacher; onClose: () => void }) {
  const state = useDb();
  const groups = state.groups.filter((g) => g.teacherId === teacher.id);
  return (
    <div className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-card rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-lg font-bold">{teacher.firstName} {teacher.lastName}</div>
            <div className="text-sm text-muted-foreground">{teacher.subject}</div>
          </div>
          <button onClick={onClose} className="p-1"><X className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div><b>Phone:</b> {teacher.phone || "—"}</div>
          <div><b>Email:</b> {teacher.email || "—"}</div>
          <div><b>Hired:</b> {teacher.hiredAt ? fmtDate(teacher.hiredAt) : "—"}</div>
          <div><b>Salary:</b> {teacher.salaryMode === "session" ? `${teacher.salaryRate} DA / session` : `${teacher.salaryRate}%`}</div>
          {teacher.notes && <div className="col-span-2"><b>Notes:</b> {teacher.notes}</div>}
        </div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Groups ({groups.length})</div>
        <div className="border rounded-md divide-y max-h-60 overflow-y-auto">
          {groups.map((g) => (
            <div key={g.id} className="p-3 flex justify-between text-sm">
              <div>{g.name} — {g.subject}</div>
              <div className="font-semibold">{fmtMoney(g.monthlyFee, state.settings.currency)}</div>
            </div>
          ))}
          {groups.length === 0 && <div className="p-3 text-center text-muted-foreground text-sm">No groups assigned.</div>}
        </div>
      </div>
    </div>
  );
}
