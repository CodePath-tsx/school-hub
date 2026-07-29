import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Plus, Eye, Pencil, Trash2, X, DollarSign, Printer, RefreshCw } from "lucide-react";
import { useDb } from "@/lib/useDb";
import { Card, PageHeader, Badge, Avatar } from "@/components/ui-kit";
import { db, initials, fmtMoney, fmtDate, DAY_LABELS, type Student, type Payment } from "@/lib/store";
import { printHtml, brandHeader, esc } from "@/lib/print";

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
  const [editing, setEditing] = useState<Student | null>(null);
  const [paying, setPaying] = useState<Student | null>(null);
  const [viewing, setViewing] = useState<Student | null>(null);

  const groupsById = Object.fromEntries(state.groups.map((g) => [g.id, g]));

  const filtered = useMemo(() => state.students.filter((s) => {
    const t = `${s.firstName} ${s.lastName} ${s.phone} ${s.parentName}`.toLowerCase();
    if (q && !t.includes(q.toLowerCase())) return false;
    if (groupF && !s.groupIds.includes(groupF)) return false;
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
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="pl-9 pr-3 h-10 w-56 sm:w-72 rounded-md border bg-card outline-none focus:ring-2 focus:ring-ring/30" />
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
                <th className="py-4 font-semibold">Groups</th>
                <th className="py-4 font-semibold">Monthly Fee</th>
                <th className="py-4 font-semibold">Subscription</th>
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
                  <td className="py-3">
                    <div>{s.parentName || "—"}</div>
                    {s.parentPhone && <div className="text-xs text-muted-foreground">{s.parentPhone}</div>}
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1 max-w-[220px]">
                      {s.groupIds.map((id) => <Badge key={id} tone="info">{groupsById[id]?.name ?? "?"}</Badge>)}
                      {s.groupIds.length === 0 && "—"}
                    </div>
                  </td>
                  <td className="py-3 font-semibold">{fmtMoney(s.monthlyFee, state.settings.currency)}</td>
                  <td className="py-3 text-xs">
                    <div>From <b>{fmtDate(s.subscriptionStart)}</b></div>
                    <div>To <b>{fmtDate(s.subscriptionEnd)}</b></div>
                  </td>
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
                      <button onClick={() => setPaying(s)} title="Record payment" className="p-2 rounded hover:bg-success/10 hover:text-success"><DollarSign className="w-4 h-4" /></button>
                      <button onClick={() => setViewing(s)} title="View & print card" className="p-2 rounded hover:bg-muted"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => setEditing(s)} title="Edit" className="p-2 rounded hover:bg-muted"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => confirm(`Delete ${s.firstName} ${s.lastName}?`) && db.deleteStudent(s.id)} title="Delete" className="p-2 rounded hover:bg-destructive/10 hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
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

      {showAdd && <StudentModal onClose={() => setShowAdd(false)} />}
      {editing && <StudentModal student={editing} onClose={() => setEditing(null)} />}
      {paying && <PaymentModal student={paying} onClose={() => setPaying(null)} />}
      {viewing && <ViewStudentModal student={viewing} onClose={() => setViewing(null)} />}
    </>
  );
}

function Field({ label, children, span = 1 }: { label: string; children: React.ReactNode; span?: 1 | 2 }) {
  return (
    <label className={`block ${span === 2 ? "sm:col-span-2" : "col-span-1"}`}>
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">{label}</div>
      {children}
    </label>
  );
}

function StudentModal({ student, onClose }: { student?: Student; onClose: () => void }) {
  const state = useDb();
  const isEdit = !!student;
  const [firstName, setFirstName] = useState(student?.firstName ?? "");
  const [lastName, setLastName] = useState(student?.lastName ?? "");
  const [phone, setPhone] = useState(student?.phone ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(student?.dateOfBirth ?? "");
  const [address, setAddress] = useState(student?.address ?? "");
  const [parentName, setParentName] = useState(student?.parentName ?? "");
  const [parentPhone, setParentPhone] = useState(student?.parentPhone ?? "");
  const [groupIds, setGroupIds] = useState<string[]>(student?.groupIds ?? []);
  const today = new Date().toISOString().slice(0, 10);
  const [subscriptionStart, setSubscriptionStart] = useState(student?.subscriptionStart ?? today);
  const [subscriptionEnd, setSubscriptionEnd] = useState(student?.subscriptionEnd ?? new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().slice(0, 10));
  const [status, setStatus] = useState<"active" | "inactive">(student?.status ?? "active");

  const monthlyFee = useMemo(() => db.computeStudentFee(groupIds), [groupIds]);

  const toggleGroup = (id: string) => {
    setGroupIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) { alert("First and last name are required"); return; }
    if (groupIds.length === 0) { alert("Select at least one group"); return; }
    if (isEdit && student) {
      db.updateStudent(student.id, { firstName, lastName, phone, dateOfBirth, address, parentName, parentPhone, groupIds, subscriptionStart, subscriptionEnd, status });
      onClose();
    } else {
      const s = db.addStudent({
        firstName, lastName, phone, parentName, parentPhone, dateOfBirth, address,
        groupIds, enrolledAt: today, subscriptionStart, subscriptionEnd, status,
      });
      printStudentCard(s.id);
      onClose();
    }
  }

  function printStudentCard(sid: string) {
    const st = db.all().students.find((x) => x.id === sid);
    if (!st) return;
    printSubscriptionCard(st);
  }

  return (
    <div className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl p-6 my-8">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-bold">{isEdit ? "Edit Student" : "New Student"}</div>
          <button type="button" onClick={onClose} className="p-1"><X className="w-5 h-5" /></button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="First Name *"><input value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="w-full h-10 px-3 border rounded-md bg-background" /></Field>
          <Field label="Last Name *"><input value={lastName} onChange={(e) => setLastName(e.target.value)} required className="w-full h-10 px-3 border rounded-md bg-background" /></Field>
          <Field label="Phone"><input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full h-10 px-3 border rounded-md bg-background" /></Field>
          <Field label="Date of Birth"><input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="w-full h-10 px-3 border rounded-md bg-background" /></Field>
          <Field label="Address" span={2}><input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full h-10 px-3 border rounded-md bg-background" /></Field>
          <Field label="Parent / Guardian Name"><input value={parentName} onChange={(e) => setParentName(e.target.value)} className="w-full h-10 px-3 border rounded-md bg-background" /></Field>
          <Field label="Parent Phone"><input value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} className="w-full h-10 px-3 border rounded-md bg-background" /></Field>

          <Field label="Subscription Start *"><input type="date" value={subscriptionStart} onChange={(e) => setSubscriptionStart(e.target.value)} required className="w-full h-10 px-3 border rounded-md bg-background" /></Field>
          <Field label="Subscription End *"><input type="date" value={subscriptionEnd} onChange={(e) => setSubscriptionEnd(e.target.value)} required className="w-full h-10 px-3 border rounded-md bg-background" /></Field>

          <Field label="Status" span={2}>
            <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full h-10 px-3 border rounded-md bg-background">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
        </div>

        <div className="mt-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Groups / Subjects *</div>
          <div className="border rounded-md p-3 max-h-56 overflow-y-auto space-y-1">
            {state.groups.length === 0 && <div className="text-sm text-muted-foreground">No groups defined yet. Create groups first.</div>}
            {state.groups.map((g) => {
              const t = state.teachers.find((x) => x.id === g.teacherId);
              const checked = groupIds.includes(g.id);
              return (
                <label key={g.id} className={`flex items-center gap-3 p-2 rounded cursor-pointer ${checked ? "bg-primary/10" : "hover:bg-muted"}`}>
                  <input type="checkbox" checked={checked} onChange={() => toggleGroup(g.id)} className="w-4 h-4" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{g.name} — {g.subject}</div>
                    <div className="text-xs text-muted-foreground">{t ? `${t.firstName} ${t.lastName}` : "No teacher"} · {DAY_LABELS[g.scheduleDay]} {g.scheduleTime}</div>
                  </div>
                  <div className="text-sm font-semibold">{fmtMoney(g.monthlyFee, state.settings.currency)}</div>
                </label>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between p-3 rounded-md bg-primary/5 border border-primary/20">
          <div className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Monthly Fee Total</div>
          <div className="text-2xl font-bold text-primary">{fmtMoney(monthlyFee, state.settings.currency)}</div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-md border">Cancel</button>
          <button className="h-10 px-4 rounded-md bg-primary text-primary-foreground font-medium inline-flex items-center gap-2">
            {!isEdit && <Printer className="w-4 h-4" />}
            {isEdit ? "Save Changes" : "Create & Print Card"}
          </button>
        </div>
      </form>
    </div>
  );
}

function PaymentModal({ student, onClose }: { student: Student; onClose: () => void }) {
  const state = useDb();
  const [months, setMonths] = useState(1);
  const [method, setMethod] = useState<Payment["method"]>("cash");
  const [note, setNote] = useState("");

  const total = student.monthlyFee * months;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = db.recordPayment(student.id, months, method, note);
    if (p) {
      const st = db.all().students.find((x) => x.id === student.id)!;
      printPaymentReceipt(st, p);
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-lg font-bold">Record Payment</div>
            <div className="text-sm text-muted-foreground">{student.firstName} {student.lastName}</div>
          </div>
          <button type="button" onClick={onClose} className="p-1"><X className="w-5 h-5" /></button>
        </div>

        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Current subscription ends</div>
        <div className="font-semibold mb-4">{fmtDate(student.subscriptionEnd)}</div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Months to add">
            <input type="number" min={1} max={24} value={months} onChange={(e) => setMonths(Math.max(1, Number(e.target.value)))} required className="w-full h-10 px-3 border rounded-md bg-background" />
          </Field>
          <Field label="Method">
            <select value={method} onChange={(e) => setMethod(e.target.value as any)} className="w-full h-10 px-3 border rounded-md bg-background">
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="transfer">Transfer</option>
            </select>
          </Field>
          <Field label="Note (optional)" span={2}><input value={note} onChange={(e) => setNote(e.target.value)} className="w-full h-10 px-3 border rounded-md bg-background" /></Field>
        </div>

        <div className="mt-4 flex items-center justify-between p-3 rounded-md bg-success/10 border border-success/30">
          <div className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Amount</div>
          <div className="text-2xl font-bold text-success">{fmtMoney(total, state.settings.currency)}</div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-md border">Cancel</button>
          <button className="h-10 px-4 rounded-md bg-success text-success-foreground font-medium inline-flex items-center gap-2">
            <Printer className="w-4 h-4" /> Confirm & Print Receipt
          </button>
        </div>
      </form>
    </div>
  );
}

function ViewStudentModal({ student, onClose }: { student: Student; onClose: () => void }) {
  const state = useDb();
  const groups = state.groups.filter((g) => student.groupIds.includes(g.id));
  const payments = state.payments.filter((p) => p.studentId === student.id).sort((a, b) => b.paidAt.localeCompare(a.paidAt));

  return (
    <div className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl p-6 my-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-lg font-bold">{student.firstName} {student.lastName}</div>
            <div className="text-sm text-muted-foreground">{student.phone}</div>
          </div>
          <button onClick={onClose} className="p-1"><X className="w-5 h-5" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div><b>Parent:</b> {student.parentName || "—"}</div>
          <div><b>Parent phone:</b> {student.parentPhone || "—"}</div>
          <div><b>Enrolled:</b> {fmtDate(student.enrolledAt)}</div>
          <div><b>Subscription:</b> {fmtDate(student.subscriptionStart)} → {fmtDate(student.subscriptionEnd)}</div>
          <div className="col-span-2"><b>Monthly Fee:</b> {fmtMoney(student.monthlyFee, state.settings.currency)}</div>
        </div>

        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Enrolled Groups</div>
        <div className="border rounded-md divide-y mb-4">
          {groups.map((g) => {
            const t = state.teachers.find((x) => x.id === g.teacherId);
            return (
              <div key={g.id} className="p-3 flex justify-between text-sm">
                <div>
                  <div className="font-medium">{g.name} — {g.subject}</div>
                  <div className="text-xs text-muted-foreground">{t ? `${t.firstName} ${t.lastName}` : "—"} · {DAY_LABELS[g.scheduleDay]} {g.scheduleTime}</div>
                </div>
                <div className="font-semibold">{fmtMoney(g.monthlyFee, state.settings.currency)}</div>
              </div>
            );
          })}
        </div>

        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Payment History</div>
        <div className="border rounded-md max-h-40 overflow-y-auto">
          {payments.length === 0 && <div className="p-3 text-sm text-muted-foreground text-center">No payments recorded.</div>}
          {payments.map((p) => (
            <div key={p.id} className="p-3 flex justify-between text-sm border-b last:border-0">
              <div>
                <div className="font-medium">{p.receiptNo} — {p.monthsCovered} month(s)</div>
                <div className="text-xs text-muted-foreground">{fmtDate(p.paidAt)} · {p.method}</div>
              </div>
              <div className="font-semibold">{fmtMoney(p.amount, state.settings.currency)}</div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => printSubscriptionCard(student)} className="h-10 px-4 rounded-md border inline-flex items-center gap-2"><Printer className="w-4 h-4" /> Print Card</button>
        </div>
      </div>
    </div>
  );
}

// ---------- Print builders ----------

export function printSubscriptionCard(student: Student) {
  const s = db.all();
  const groups = s.groups.filter((g) => student.groupIds.includes(g.id));
  const teachersById = Object.fromEntries(s.teachers.map((t) => [t.id, t]));
  const roomsById = Object.fromEntries(s.rooms.map((r) => [r.id, r]));
  const cur = s.settings.currency;

  const rows = groups.map((g) => {
    const t = teachersById[g.teacherId];
    return `<tr>
      <td>${esc(g.subject)}</td>
      <td>${esc(g.name)}</td>
      <td>${t ? esc(`${t.firstName} ${t.lastName}`) : "—"}</td>
      <td>${esc(roomsById[g.roomId]?.name ?? "—")}</td>
      <td>${esc(DAY_LABELS[g.scheduleDay])} ${esc(g.scheduleTime)}</td>
      <td style="text-align:right">${esc(fmtMoney(g.monthlyFee, cur))}</td>
    </tr>`;
  }).join("");

  const body = `
    ${brandHeader(s.settings.schoolName, "Student Subscription Card", s.settings.taxId, s.settings.schoolPhone, s.settings.address)}
    <h1>${esc(student.firstName)} ${esc(student.lastName)}</h1>
    <div class="badge">Academic Year ${esc(s.settings.academicYear)}</div>
    <div class="kv">
      <div><b>Student Phone</b><span>${esc(student.phone) || "—"}</span></div>
      <div><b>Date of Birth</b><span>${student.dateOfBirth ? esc(fmtDate(student.dateOfBirth)) : "—"}</span></div>
      <div><b>Parent / Guardian</b><span>${esc(student.parentName) || "—"}</span></div>
      <div><b>Parent Phone</b><span>${esc(student.parentPhone ?? "") || "—"}</span></div>
      <div><b>Address</b><span>${esc(student.address ?? "") || "—"}</span></div>
      <div><b>Enrolled</b><span>${esc(fmtDate(student.enrolledAt))}</span></div>
      <div><b>Subscription Start</b><span>${esc(fmtDate(student.subscriptionStart))}</span></div>
      <div><b>Subscription End</b><span>${esc(fmtDate(student.subscriptionEnd))}</span></div>
    </div>

    <h2>Enrolled Subjects &amp; Groups</h2>
    <table>
      <thead><tr>
        <th>Subject</th><th>Group</th><th>Teacher</th><th>Room</th><th>Schedule</th><th style="text-align:right">Monthly</th>
      </tr></thead>
      <tbody>${rows || `<tr><td colspan="6" style="text-align:center;color:#888">No groups.</td></tr>`}
      <tr class="row-strong"><td colspan="5" style="text-align:right">Total Monthly Fee</td><td style="text-align:right">${esc(fmtMoney(student.monthlyFee, cur))}</td></tr>
      </tbody>
    </table>

    <div class="sig">
      <div><div class="line">Administration</div></div>
      <div><div class="line">Parent Signature</div></div>
    </div>

    <div class="foot">
      <span>Printed by ${esc(db.currentUser()?.name ?? "—")}</span>
      <span>${esc(new Date().toLocaleString("en-US"))}</span>
    </div>
  `;
  printHtml(`Card — ${student.firstName} ${student.lastName}`, body);
}

export function printPaymentReceipt(student: Student, payment: Payment) {
  const s = db.all();
  const groups = s.groups.filter((g) => student.groupIds.includes(g.id));
  const cur = s.settings.currency;
  const rows = groups.map((g) =>
    `<tr><td>${esc(g.subject)}</td><td>${esc(g.name)}</td><td style="text-align:right">${esc(fmtMoney(g.monthlyFee, cur))}</td></tr>`
  ).join("");

  const body = `
    ${brandHeader(s.settings.schoolName, "Payment Receipt", s.settings.taxId, s.settings.schoolPhone, s.settings.address)}
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <h1 style="margin-bottom:2px">${esc(student.firstName)} ${esc(student.lastName)}</h1>
        <div style="color:#666">Parent: ${esc(student.parentName) || "—"} · Phone: ${esc(student.phone) || "—"}</div>
      </div>
      <div style="text-align:right">
        <div class="badge">${esc(payment.receiptNo)}</div>
        <div style="margin-top:4px;font-size:11px;color:#666">Paid on ${esc(new Date(payment.paidAt).toLocaleString("en-US"))}</div>
      </div>
    </div>

    <div class="kv" style="margin-top:14px">
      <div><b>Payment Method</b><span>${esc(payment.method.toUpperCase())}</span></div>
      <div><b>Months Covered</b><span>${payment.monthsCovered}</span></div>
      <div><b>Coverage From</b><span>${esc(fmtDate(payment.coversFrom))}</span></div>
      <div><b>Coverage Until</b><span>${esc(fmtDate(payment.coversTo))}</span></div>
    </div>

    <h2>Subjects Paid For</h2>
    <table>
      <thead><tr><th>Subject</th><th>Group</th><th style="text-align:right">Monthly Fee</th></tr></thead>
      <tbody>${rows}
      <tr class="row-strong"><td colspan="2" style="text-align:right">Monthly Total × ${payment.monthsCovered}</td><td style="text-align:right">${esc(fmtMoney(student.monthlyFee * payment.monthsCovered, cur))}</td></tr>
      </tbody>
    </table>

    <div class="total">
      <div>
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#666">Total Paid</div>
        ${payment.note ? `<div style="font-size:11px;color:#555;margin-top:2px">Note: ${esc(payment.note)}</div>` : ""}
      </div>
      <div class="amt">${esc(fmtMoney(payment.amount, cur))}</div>
    </div>

    <div class="sig">
      <div><div class="line">Cashier — ${esc(db.currentUser()?.name ?? "—")}</div></div>
      <div><div class="line">Signature</div></div>
    </div>
  `;
  printHtml(`Receipt — ${payment.receiptNo}`, body);
}
