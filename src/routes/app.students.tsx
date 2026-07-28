import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Plus, Eye, Pencil, Trash2, X } from "lucide-react";
import { useDb } from "@/lib/useDb";
import { Card, PageHeader, Badge, Avatar } from "@/components/ui-kit";
import { db, initials, fmtMoney, fmtDate } from "@/lib/store";

export const Route = createFileRoute("/app/students")({
  head: () => ({ meta: [{ title: "Students — SchoolByte ERP" }] }),
  component: StudentsPage,
});

function StudentsPage() {
  const state = useDb();
  const [q, setQ] = useState("");
  const [groupF, setGroupF] = useState("");
  const [statusF, setStatusF] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const groupsById = Object.fromEntries(state.groups.map((g) => [g.id, g]));

  const filtered = useMemo(() => state.students.filter((s) => {
    const t = `${s.firstName} ${s.lastName} ${s.phone}`.toLowerCase();
    if (q && !t.includes(q.toLowerCase())) return false;
    if (groupF && s.groupId !== groupF) return false;
    if (statusF && s.status !== statusF) return false;
    return true;
  }), [state.students, q, groupF, statusF]);

  return (
    <>
      <PageHeader
        title="Students"
        subtitle={<>Showing <b>{filtered.length}</b> of <b>{state.students.length}</b> students</>}
        right={
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or phone…" className="pl-9 pr-3 h-10 w-72 rounded-md border bg-card outline-none focus:ring-2 focus:ring-ring/30" />
            </div>
            <select value={groupF} onChange={(e) => setGroupF(e.target.value)} className="h-10 rounded-md border bg-card px-3">
              <option value="">All Groups</option>
              {state.groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <select value={statusF} onChange={(e) => setStatusF(e.target.value)} className="h-10 rounded-md border bg-card px-3">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button onClick={() => setShowAdd(true)} className="h-10 px-4 rounded-md bg-primary text-primary-foreground font-medium flex items-center gap-2 hover:bg-primary/90">
              <Plus className="w-4 h-4" /> Add Student
            </button>
          </>
        }
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground border-b">
                <th className="py-4 px-6 font-semibold">Student</th>
                <th className="py-4 font-semibold">Parent</th>
                <th className="py-4 font-semibold">Group</th>
                <th className="py-4 font-semibold">Monthly Fee</th>
                <th className="py-4 font-semibold">Enrolled</th>
                <th className="py-4 font-semibold">Payment</th>
                <th className="py-4 font-semibold">Status</th>
                <th className="py-4 pr-6"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="py-3 px-6">
                    <div className="flex items-center gap-3">
                      <Avatar initials={initials(s.firstName, s.lastName)} />
                      <div>
                        <div className="font-semibold">{s.firstName} {s.lastName}</div>
                        <div className="text-xs text-muted-foreground">{s.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">{s.parentName}</td>
                  <td className="py-3"><Badge tone="info">{groupsById[s.groupId]?.name ?? "-"}</Badge></td>
                  <td className="py-3 font-semibold">{fmtMoney(s.monthlyFee, state.settings.currency)}</td>
                  <td className="py-3">{fmtDate(s.enrolledAt)}</td>
                  <td className="py-3">
                    {s.paymentStatus === "paid" && <Badge tone="success" dot>Paid</Badge>}
                    {s.paymentStatus === "pending" && <Badge tone="warning" dot>Pending</Badge>}
                    {s.paymentStatus === "overdue" && <Badge tone="danger" dot>Overdue</Badge>}
                  </td>
                  <td className="py-3">
                    {s.status === "active" ? <Badge tone="success">Active</Badge> : <Badge tone="muted">Inactive</Badge>}
                  </td>
                  <td className="py-3 pr-6">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <button className="p-2 rounded hover:bg-muted"><Eye className="w-4 h-4" /></button>
                      <button className="p-2 rounded hover:bg-muted"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => confirm("Delete student?") && db.deleteStudent(s.id)} className="p-2 rounded hover:bg-destructive/10 hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="py-16 text-center text-muted-foreground">No students match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showAdd && <AddStudentModal onClose={() => setShowAdd(false)} />}
    </>
  );
}

function AddStudentModal({ onClose }: { onClose: () => void }) {
  const state = useDb();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [parentName, setParentName] = useState("");
  const [groupId, setGroupId] = useState(state.groups[0]?.id ?? "");
  const [monthlyFee, setMonthlyFee] = useState(state.groups[0]?.monthlyFee ?? 2000);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    db.addStudent({
      firstName, lastName, phone, parentName, groupId,
      monthlyFee: Number(monthlyFee),
      enrolledAt: new Date().toISOString().slice(0, 10),
      paymentStatus: "pending",
      status: "active",
    });
    onClose();
  }
  return (
    <div className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="bg-card rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-bold">Add Student</div>
          <button type="button" onClick={onClose} className="p-1"><X className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="First Name"><input value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="w-full h-10 px-3 border rounded-md bg-background" /></Field>
          <Field label="Last Name"><input value={lastName} onChange={(e) => setLastName(e.target.value)} required className="w-full h-10 px-3 border rounded-md bg-background" /></Field>
          <Field label="Phone"><input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full h-10 px-3 border rounded-md bg-background" /></Field>
          <Field label="Parent"><input value={parentName} onChange={(e) => setParentName(e.target.value)} className="w-full h-10 px-3 border rounded-md bg-background" /></Field>
          <Field label="Group">
            <select value={groupId} onChange={(e) => { setGroupId(e.target.value); const g = state.groups.find((g) => g.id === e.target.value); if (g) setMonthlyFee(g.monthlyFee); }} className="w-full h-10 px-3 border rounded-md bg-background">
              {state.groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </Field>
          <Field label="Monthly Fee (DA)"><input type="number" value={monthlyFee} onChange={(e) => setMonthlyFee(Number(e.target.value))} className="w-full h-10 px-3 border rounded-md bg-background" /></Field>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-md border">Cancel</button>
          <button className="h-10 px-4 rounded-md bg-primary text-primary-foreground">Create</button>
        </div>
      </form>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block col-span-1"><div className="text-xs font-semibold text-muted-foreground mb-1">{label}</div>{children}</label>;
}
