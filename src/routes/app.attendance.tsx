import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, X, Clock, CheckCircle2, XCircle, Save, Printer, HelpCircle } from "lucide-react";
import { useDb } from "@/lib/useDb";
import { Card, PageHeader, ProgressBar } from "@/components/ui-kit";
import { db, initials, DAY_LABELS, fmtDate } from "@/lib/store";
import { printHtml, brandHeader, esc } from "@/lib/print";

export const Route = createFileRoute("/app/attendance")({
  head: () => ({ meta: [{ title: "Attendance — SchoolByte ERP" }] }),
  component: AttendancePage,
});

function AttendancePage() {
  const state = useDb();
  const [groupId, setGroupId] = useState(state.groups[0]?.id ?? "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [dirty, setDirty] = useState(false);
  const [tab, setTab] = useState<"students" | "groups" | "absences" | "monthly">("students");

  const studentsInGroup = useMemo(() => state.students.filter((s) => s.groupIds.includes(groupId)), [state.students, groupId]);
  const entryFor = (sid: string) => state.attendance.find((a) => a.groupId === groupId && a.studentId === sid && a.date === date);

  const counts = useMemo(() => {
    let present = 0, absent = 0, late = 0;
    for (const s of studentsInGroup) {
      const e = entryFor(s.id);
      if (e?.state === "present") present++;
      else if (e?.state === "absent") absent++;
      else if (e?.state === "late") late++;
    }
    return { present, absent, late, remaining: studentsInGroup.length - present - absent - late };
  }, [studentsInGroup, state.attendance, date, groupId]);

  const setState = (sid: string, st: "present" | "absent" | "late") => {
    db.setAttendance(groupId, sid, date, st);
    setDirty(true);
  };
  const setAll = (st: "present" | "absent" | "late") => {
    db.bulkAttendance(groupId, date, studentsInGroup.map((s) => s.id), st);
    setDirty(true);
  };

  // Right panel — per-student rate over last 30 entries
  const rate = (sid: string) => {
    const entries = state.attendance.filter((a) => a.studentId === sid);
    if (entries.length === 0) return { rate: 100, sessions: 0, absent: 0, late: 0 };
    const sessions = entries.length;
    const absent = entries.filter((e) => e.state === "absent").length;
    const late = entries.filter((e) => e.state === "late").length;
    const present = entries.filter((e) => e.state === "present").length;
    return { rate: Math.round((present / sessions) * 100), sessions, absent, late };
  };
  const groupsById = Object.fromEntries(state.groups.map((g) => [g.id, g]));

  return (
    <>
      <PageHeader title="Attendance" />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Select Group</div>
                <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="w-full h-11 px-3 border rounded-md bg-card">
                  {state.groups.map((g) => <option key={g.id} value={g.id}>{g.name} — {g.subject}</option>)}
                </select>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 text-right">Attendance Date</div>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full h-11 px-3 border rounded-md bg-card" />
                <div className="mt-3 flex items-center justify-end gap-3 text-sm">
                  <span className={dirty ? "text-warning-foreground inline-flex items-center gap-1.5" : "text-success inline-flex items-center gap-1.5"}>
                    <span className={`w-1.5 h-1.5 rounded-full ${dirty ? "bg-warning" : "bg-success"}`} />
                    {dirty ? "Not saved" : "Saved"}
                  </span>
                  <button onClick={() => printAttendanceSheet(groupId, date)} className="h-9 px-3 rounded-md border inline-flex items-center gap-2"><Printer className="w-4 h-4" /> Print</button>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatBox label="Present" value={counts.present} pct={studentsInGroup.length ? (counts.present / studentsInGroup.length) * 100 : 0} tone="success" icon={<Check className="w-5 h-5" />} />
            <StatBox label="Absent" value={counts.absent} pct={studentsInGroup.length ? (counts.absent / studentsInGroup.length) * 100 : 0} tone="danger" icon={<X className="w-5 h-5" />} />
            <StatBox label="Late" value={counts.late} pct={studentsInGroup.length ? (counts.late / studentsInGroup.length) * 100 : 0} tone="warning" icon={<Clock className="w-5 h-5" />} />
            <StatBox label="Remaining" value={counts.remaining} pct={0} tone="info" icon={<HelpCircle className="w-5 h-5" />} noBar />
          </div>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-lg font-bold">Attendance Sheet</div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">{studentsInGroup.length} students enrolled</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setAll("present")} className="h-9 px-3 rounded-md bg-success/10 text-success inline-flex items-center gap-2 font-medium"><CheckCircle2 className="w-4 h-4" /> All Present</button>
                <button onClick={() => setAll("absent")} className="h-9 px-3 rounded-md bg-destructive/10 text-destructive inline-flex items-center gap-2 font-medium"><XCircle className="w-4 h-4" /> All Absent</button>
              </div>
            </div>

            <div className="space-y-2">
              {studentsInGroup.map((s, idx) => {
                const st = entryFor(s.id)?.state;
                return (
                  <div key={s.id} className="border rounded-xl p-3 flex items-center gap-4">
                    <div className="text-xs text-muted-foreground w-6">{idx + 1}</div>
                    <div className="w-9 h-9 rounded-full bg-warning/25 text-warning-foreground flex items-center justify-center text-xs font-bold">{initials(s.firstName, s.lastName)}</div>
                    <div className="flex-1">
                      <div className="font-semibold">{s.firstName} {s.lastName}</div>
                      <div className="text-xs text-muted-foreground">ID: #{s.id.slice(0, 3).padStart(3, "0")}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StateBtn active={st === "present"} tone="success" onClick={() => setState(s.id, "present")}>Present</StateBtn>
                      <StateBtn active={st === "late"} tone="warning" onClick={() => setState(s.id, "late")}>Late</StateBtn>
                      <StateBtn active={st === "absent"} tone="danger" onClick={() => setState(s.id, "absent")}>Absent</StateBtn>
                    </div>
                  </div>
                );
              })}
              {studentsInGroup.length === 0 && <div className="text-center py-8 text-muted-foreground">No students enrolled in this group.</div>}
            </div>

            <button
              onClick={() => setDirty(false)}
              className="mt-6 w-full h-12 rounded-xl bg-primary/70 hover:bg-primary text-primary-foreground font-semibold inline-flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Attendance
            </button>
          </Card>
        </div>

        {/* Right panel */}
        <Card className="p-6 h-fit sticky top-6">
          <div className="flex items-center gap-6 border-b -mx-6 px-6 mb-4">
            {(["students", "groups", "absences", "monthly"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`pb-3 -mb-px text-xs font-semibold uppercase tracking-widest ${tab === t ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>
                {t}
              </button>
            ))}
          </div>

          {tab === "students" && (
            <div className="space-y-3">
              <div className="grid grid-cols-[1fr_60px_1fr_60px_60px] gap-2 text-xs uppercase tracking-widest text-muted-foreground pb-2 border-b">
                <div>Student</div><div>Sess.</div><div>Rate</div><div className="text-destructive">Abs</div><div className="text-warning-foreground">Late</div>
              </div>
              {state.students.map((s) => {
                const r = rate(s.id);
                return (
                  <div key={s.id} className="grid grid-cols-[1fr_60px_1fr_60px_60px] gap-2 items-center text-sm py-1">
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{s.firstName} {s.lastName}</div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground truncate">{s.groupIds.map((id) => groupsById[id]?.name).filter(Boolean).join(", ")}</div>
                    </div>
                    <div className="font-semibold">{r.sessions}</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1"><ProgressBar value={r.rate} tone={r.rate >= 80 ? "success" : r.rate >= 50 ? "warning" : "danger"} /></div>
                      <div className={`text-xs font-bold ${r.rate >= 80 ? "text-success" : r.rate >= 50 ? "text-warning-foreground" : "text-destructive"}`}>{r.rate}%</div>
                    </div>
                    <div className="font-bold text-destructive">{r.absent}</div>
                    <div className="font-bold text-warning-foreground">{r.late}</div>
                  </div>
                );
              })}
              <div className="pt-2 flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
                <span>Last recalculated: {new Date().toLocaleTimeString()}</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-success" /> Live statistics</span>
              </div>
            </div>
          )}

          {tab === "groups" && (
            <div className="space-y-2 text-sm">
              {state.groups.map((g) => {
                const cnt = state.attendance.filter((a) => a.groupId === g.id).length;
                return <div key={g.id} className="flex justify-between border-b py-2"><span className="font-medium">{g.name}</span><span className="text-muted-foreground">{cnt} entries</span></div>;
              })}
            </div>
          )}
          {tab === "absences" && (
            <div className="space-y-2 text-sm">
              {state.attendance.filter((a) => a.state === "absent").slice(-10).reverse().map((a) => {
                const s = state.students.find((x) => x.id === a.studentId);
                return <div key={a.id} className="flex justify-between border-b py-2"><span>{s?.firstName} {s?.lastName}</span><span className="text-muted-foreground">{a.date}</span></div>;
              })}
              {state.attendance.filter((a) => a.state === "absent").length === 0 && <div className="text-muted-foreground text-center py-4">No absences recorded.</div>}
            </div>
          )}
          {tab === "monthly" && <div className="text-sm text-muted-foreground text-center py-8">Monthly reports coming soon.</div>}
        </Card>
      </div>
    </>
  );
}

function StateBtn({ active, tone, onClick, children }: { active: boolean; tone: "success" | "warning" | "danger"; onClick: () => void; children: React.ReactNode }) {
  const tones: Record<string, string> = {
    success: active ? "bg-success text-success-foreground" : "bg-success/10 text-success hover:bg-success/20",
    warning: active ? "bg-warning text-warning-foreground" : "bg-warning/15 text-warning-foreground hover:bg-warning/25",
    danger: active ? "bg-destructive text-destructive-foreground" : "bg-destructive/10 text-destructive hover:bg-destructive/20",
  };
  return <button onClick={onClick} className={`h-9 px-3 rounded-md text-xs font-semibold uppercase tracking-widest ${tones[tone]}`}>{children}</button>;
}

function StatBox({ label, value, pct, tone, icon, noBar }: { label: string; value: number; pct: number; tone: "success" | "danger" | "warning" | "info"; icon: React.ReactNode; noBar?: boolean }) {
  const tones: Record<string, { bg: string; ic: string; bar: any }> = {
    success: { bg: "bg-success/10", ic: "bg-success text-success-foreground", bar: "success" },
    danger: { bg: "bg-destructive/10", ic: "bg-destructive text-destructive-foreground", bar: "danger" },
    warning: { bg: "bg-warning/20", ic: "bg-warning text-warning-foreground", bar: "warning" },
    info: { bg: "bg-info/10", ic: "bg-info text-info-foreground", bar: "primary" },
  };
  const t = tones[tone];
  return (
    <Card className={`p-5 ${t.bg} border-none`}>
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className={`w-8 h-8 rounded-lg ${t.ic} flex items-center justify-center`}>{icon}</div>
      </div>
      <div className="text-4xl font-bold mt-3">{value}</div>
      {!noBar && (<div className="mt-3"><div className="text-xs text-muted-foreground mb-1">{Math.round(pct)}% of group</div><ProgressBar value={pct} tone={t.bar} /></div>)}
      {noBar && <div className="text-xs uppercase tracking-widest text-muted-foreground mt-3">Needs attention</div>}
    </Card>
  );
}

function printAttendanceSheet(groupId: string, date: string) {
  const s = db.all();
  const g = s.groups.find((x) => x.id === groupId);
  if (!g) return;
  const teacher = s.teachers.find((t) => t.id === g.teacherId);
  const room = s.rooms.find((r) => r.id === g.roomId);
  const students = s.students.filter((st) => st.groupIds.includes(groupId));
  const stateFor = (sid: string) => s.attendance.find((a) => a.groupId === groupId && a.studentId === sid && a.date === date)?.state ?? "";
  const rows = students.map((st, i) => {
    const cur = stateFor(st.id);
    const cell = (v: string) => `<td style="text-align:center;font-weight:${cur === v ? 700 : 400};color:${cur === v ? "#2f5a3f" : "#bbb"}">${cur === v ? "\u25CF" : "\u25CB"}</td>`;
    return `<tr><td>${i + 1}</td><td>${esc(st.firstName)} ${esc(st.lastName)}</td>${cell("present")}${cell("late")}${cell("absent")}<td></td></tr>`;
  }).join("");
  const body = `${brandHeader(s.settings.schoolName, "Attendance Sheet", s.settings.taxId, s.settings.schoolPhone, s.settings.address)}
    <h1>${esc(g.name)} — ${esc(g.subject)}</h1>
    <div class="kv">
      <div><b>Date</b><span>${esc(fmtDate(date))}</span></div>
      <div><b>Schedule</b><span>${esc(DAY_LABELS[g.scheduleDay])} ${esc(g.scheduleTime)}</span></div>
      <div><b>Teacher</b><span>${teacher ? esc(`${teacher.firstName} ${teacher.lastName}`) : "—"}</span></div>
      <div><b>Room</b><span>${esc(room?.name ?? "—")}</span></div>
    </div>
    <table style="margin-top:12px"><thead><tr><th>#</th><th>Student</th><th style="text-align:center">Present</th><th style="text-align:center">Late</th><th style="text-align:center">Absent</th><th>Signature</th></tr></thead>
    <tbody>${rows || `<tr><td colspan="6" style="text-align:center;color:#888">No students enrolled.</td></tr>`}</tbody></table>
    <div class="sig"><div><div class="line">Teacher Signature</div></div><div><div class="line">Administration</div></div></div>`;
  printHtml(`Attendance — ${g.name} ${date}`, body);
}
