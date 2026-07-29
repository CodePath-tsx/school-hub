import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Plus, Eye, Pencil, Trash2, X, Printer } from "lucide-react";
import { useDb } from "@/lib/useDb";
import { Card, PageHeader, Badge, Avatar, ProgressBar } from "@/components/ui-kit";
import { db, fmtMoney, DAY_LABELS, type Group } from "@/lib/store";
import { printHtml, brandHeader, esc } from "@/lib/print";

export const Route = createFileRoute("/app/groups")({
  head: () => ({ meta: [{ title: "Groups — SchoolByte ERP" }] }),
  component: GroupsPage,
});

const yearLabels: Record<string, string> = {
  "1st-year-secondary": "1st Year Secondary",
  "2nd-year-secondary": "2nd Year Secondary",
  "3rd-year-secondary": "3rd Year Secondary",
  "1st-year-primary": "1st Year primary",
  "2st-year-primary": "2st Year primary",
  "3st-year-primary": "3st Year primary",
  "4st-year-primary": "4st Year primary",
  "5st-year-primary": "5st Year primary",
  "1st-year-middle": "1st Year middle"
  "2st-year-middle": "2st Year middle"
  "3st-year-middle": "3st Year middle"
  "4st-year-middle": "4st Year middle"
  
  
};

function GroupsPage() {
  const state = useDb();
  const [q, setQ] = useState("");
  const [subjF, setSubjF] = useState("");
  const [statusF, setStatusF] = useState("");
  const [yearF, setYearF] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Group | null>(null);

  const subjects = Array.from(new Set(state.groups.map((g) => g.subject)));
  const teachersById = Object.fromEntries(state.teachers.map((t) => [t.id, t]));
  const roomsById = Object.fromEntries(state.rooms.map((r) => [r.id, r]));
  const studentsByGroup = state.groups.reduce<Record<string, number>>((acc, g) => {
    acc[g.id] = state.students.filter((s) => s.groupIds.includes(g.id) && s.status === "active").length;
    return acc;
  }, {});

  const filtered = useMemo(() => state.groups.filter((g) => {
    if (q && !`${g.name} ${teachersById[g.teacherId]?.firstName ?? ""} ${g.subject}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (subjF && g.subject !== subjF) return false;
    if (statusF && g.status !== statusF) return false;
    if (yearF && g.year !== yearF) return false;
    return true;
  }), [state.groups, q, subjF, statusF, yearF, teachersById]);

  function printRoster(g: Group) {
    const s = db.all();
    const roster = s.students.filter((st) => st.groupIds.includes(g.id));
    const teacher = s.teachers.find((t) => t.id === g.teacherId);
    const room = s.rooms.find((r) => r.id === g.roomId);
    const rows = roster.map((st, i) => `<tr>
      <td>${i + 1}</td>
      <td>${esc(st.firstName)} ${esc(st.lastName)}</td>
      <td>${esc(st.parentName || "—")}</td>
      <td>${esc(st.phone || "—")}</td>
      <td>${esc(st.paymentStatus)}</td>
    </tr>`).join("");
    const body = `
      ${brandHeader(s.settings.schoolName, `Group Roster — ${g.name}`, s.settings.taxId, s.settings.schoolPhone, s.settings.address)}
      <h1>${esc(g.name)} — ${esc(g.subject)}</h1>
      <div class="kv">
        <div><b>Teacher</b><span>${teacher ? esc(`${teacher.firstName} ${teacher.lastName}`) : "—"}</span></div>
        <div><b>Room</b><span>${esc(room?.name ?? "—")}</span></div>
        <div><b>Schedule</b><span>${esc(DAY_LABELS[g.scheduleDay])} ${esc(g.scheduleTime)} (${g.durationMin} min)</span></div>
        <div><b>Year</b><span>${esc(yearLabels[g.year])}</span></div>
        <div><b>Monthly Fee</b><span>${esc(fmtMoney(g.monthlyFee, s.settings.currency))}</span></div>
        <div><b>Capacity</b><span>${roster.length} / ${g.capacity}</span></div>
      </div>
      <h2>Enrolled Students</h2>
      <table>
        <thead><tr><th>#</th><th>Name</th><th>Parent</th><th>Phone</th><th>Payment</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="5" style="text-align:center;color:#888">No students enrolled.</td></tr>`}</tbody>
      </table>`;
    printHtml(`Roster — ${g.name}`, body);
  }

  return (
    <>
      <PageHeader
        title="Groups"
        subtitle={<>Showing <b>{filtered.length}</b> of <b>{state.groups.length}</b> groups</>}
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
            <select value={statusF} onChange={(e) => setStatusF(e.target.value)} className="h-10 rounded-md border bg-card px-3">
              <option value="">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option>
            </select>
            <select value={yearF} onChange={(e) => setYearF(e.target.value)} className="h-10 rounded-md border bg-card px-3">
              <option value="">All Years</option>
              {Object.entries(yearLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <button onClick={() => setShowAdd(true)} className="h-10 px-4 rounded-md bg-primary text-primary-foreground font-medium flex items-center gap-2 hover:bg-primary/90">
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
                <th className="py-4 font-semibold">Teacher</th>
                <th className="py-4 font-semibold">Room</th>
                <th className="py-4 font-semibold">Schedule</th>
                <th className="py-4 font-semibold">Students</th>
                <th className="py-4 font-semibold">Monthly</th>
                <th className="py-4 font-semibold">Revenue</th>
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
                          <div className="text-xs text-muted-foreground">{g.subject} · {yearLabels[g.year]}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">{t ? `${t.firstName} ${t.lastName}` : "—"}</td>
                    <td className="py-3">{roomsById[g.roomId]?.name ?? "—"}</td>
                    <td className="py-3 text-xs">
                      <div>{DAY_LABELS[g.scheduleDay]}</div>
                      <div className="text-muted-foreground">{g.scheduleTime} · {g.durationMin}min · {g.sessionsPerMonth}/mo</div>
                    </td>
                    <td className="py-3 min-w-[160px]">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold">{count} / {g.capacity}</span>
                        <span className="text-muted-foreground">{pct}%</span>
                      </div>
                      <ProgressBar value={pct} tone={pct >= 80 ? "warning" : "success"} />
                    </td>
                    <td className="py-3 font-semibold">{fmtMoney(g.monthlyFee, state.settings.currency)}</td>
                    <td className="py-3 font-semibold">{fmtMoney(rev, state.settings.currency)}</td>
                    <td className="py-3 pr-6">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <button onClick={() => printRoster(g)} title="Print roster" className="p-2 rounded hover:bg-muted"><Printer className="w-4 h-4" /></button>
                        <button title="Toggle status" onClick={() => db.updateGroup(g.id, { status: g.status === "active" ? "inactive" : "active" })} className="p-2 rounded hover:bg-muted"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => setEditing(g)} className="p-2 rounded hover:bg-muted"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => confirm(`Delete group ${g.name}?`) && db.deleteGroup(g.id)} className="p-2 rounded hover:bg-destructive/10 hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={8} className="py-16 text-center text-muted-foreground">No groups match your filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {showAdd && <GroupModal onClose={() => setShowAdd(false)} />}
      {editing && <GroupModal group={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function Field({ label, children, span = 1 }: { label: string; children: React.ReactNode; span?: 1 | 2 }) {
  return <label className={`block ${span === 2 ? "sm:col-span-2" : ""}`}><div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">{label}</div>{children}</label>;
}

function GroupModal({ group, onClose }: { group?: Group; onClose: () => void }) {
  const state = useDb();
  const isEdit = !!group;
  const [name, setName] = useState(group?.name ?? "");
  const [subject, setSubject] = useState(group?.subject ?? "Mathematics");
  const [year, setYear] = useState<Group["year"]>(group?.year ?? "1st-year-secondary");
  const [teacherId, setTeacherId] = useState(group?.teacherId ?? state.teachers[0]?.id ?? "");
  const [roomId, setRoomId] = useState(group?.roomId ?? state.rooms[0]?.id ?? "");
  const [monthlyFee, setMonthlyFee] = useState(group?.monthlyFee ?? 2000);
  const [capacity, setCapacity] = useState(group?.capacity ?? 20);
  const [sessionsPerMonth, setSessionsPerMonth] = useState(group?.sessionsPerMonth ?? 8);
  const [scheduleDay, setScheduleDay] = useState<Group["scheduleDay"]>(group?.scheduleDay ?? "mon");
  const [scheduleTime, setScheduleTime] = useState(group?.scheduleTime ?? "16:00");
  const [durationMin, setDurationMin] = useState(group?.durationMin ?? 120);
  const [status, setStatus] = useState<Group["status"]>(group?.status ?? "active");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !teacherId || !roomId) { alert("Name, teacher and room are required"); return; }
    const payload = { name, subject, year, teacherId, roomId, monthlyFee: Number(monthlyFee), capacity: Number(capacity), sessionsPerMonth: Number(sessionsPerMonth), scheduleDay, scheduleTime, durationMin: Number(durationMin), status };
    if (isEdit && group) db.updateGroup(group.id, payload);
    else db.addGroup(payload);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl p-6 my-8">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-bold">{isEdit ? "Edit Group" : "New Group"}</div>
          <button type="button" onClick={onClose} className="p-1"><X className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Group Name *"><input value={name} onChange={(e) => setName(e.target.value)} required className="w-full h-10 px-3 border rounded-md bg-background" placeholder="e.g. Math G1" /></Field>
          <Field label="Subject *"><input value={subject} onChange={(e) => setSubject(e.target.value)} required className="w-full h-10 px-3 border rounded-md bg-background" /></Field>
          <Field label="Academic Year">
            <select value={year} onChange={(e) => setYear(e.target.value as any)} className="w-full h-10 px-3 border rounded-md bg-background">
              {Object.entries(yearLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Teacher *">
            <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} required className="w-full h-10 px-3 border rounded-md bg-background">
              <option value="">— Select —</option>
              {state.teachers.filter((t) => t.status === "active").map((t) => <option key={t.id} value={t.id}>{t.firstName} {t.lastName} — {t.subject}</option>)}
            </select>
          </Field>
          <Field label="Room *">
            <select value={roomId} onChange={(e) => setRoomId(e.target.value)} required className="w-full h-10 px-3 border rounded-md bg-background">
              <option value="">— Select —</option>
              {state.rooms.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.capacity} seats)</option>)}
            </select>
          </Field>
          <Field label="Monthly Fee (DA) *"><input type="number" min={0} value={monthlyFee} onChange={(e) => setMonthlyFee(Number(e.target.value))} required className="w-full h-10 px-3 border rounded-md bg-background" /></Field>
          <Field label="Capacity *"><input type="number" min={1} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} required className="w-full h-10 px-3 border rounded-md bg-background" /></Field>
          <Field label="Sessions / Month"><input type="number" min={1} max={31} value={sessionsPerMonth} onChange={(e) => setSessionsPerMonth(Number(e.target.value))} className="w-full h-10 px-3 border rounded-md bg-background" /></Field>
          <Field label="Day of Week">
            <select value={scheduleDay} onChange={(e) => setScheduleDay(e.target.value as any)} className="w-full h-10 px-3 border rounded-md bg-background">
              {Object.entries(DAY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Start Time"><input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="w-full h-10 px-3 border rounded-md bg-background" /></Field>
          <Field label="Duration (min)"><input type="number" min={30} max={240} step={15} value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value))} className="w-full h-10 px-3 border rounded-md bg-background" /></Field>
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full h-10 px-3 border rounded-md bg-background">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-md border">Cancel</button>
          <button className="h-10 px-4 rounded-md bg-primary text-primary-foreground font-medium">{isEdit ? "Save Changes" : "Create Group"}</button>
        </div>
      </form>
    </div>
  );
}
