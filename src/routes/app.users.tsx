import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Plus, Key, Pencil, Trash2, AlertTriangle, Check, X } from "lucide-react";
import { useDb } from "@/lib/useDb";
import { Card, PageHeader, Badge, Avatar } from "@/components/ui-kit";
import { db, initials, fmtDate } from "@/lib/store";

export const Route = createFileRoute("/app/users")({
  head: () => ({ meta: [{ title: "Users & Roles — SchoolByte ERP" }] }),
  component: UsersPage,
});

const MODULES: { key: string; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "students", label: "Students" },
  { key: "teachers", label: "Teachers" },
  { key: "groups", label: "Groups" },
  { key: "classrooms", label: "Classrooms" },
  { key: "attendance", label: "Attendance" },
  { key: "statistics", label: "Statistics" },
  { key: "users", label: "Users & Roles" },
  { key: "settings", label: "Settings" },
  { key: "licence", label: "Licence" },
];

function UsersPage() {
  const state = useDb();
  const [q, setQ] = useState("");
  const [roleF, setRoleF] = useState("");
  const [statusF, setStatusF] = useState("");
  const me = state.session ? state.users.find((u) => u.id === state.session!.userId) : null;

  const [perms, setPerms] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem("schoolbyte.perms") || "") || {}; } catch { return { dashboard: true, students: true, groups: true, attendance: true }; }
  });
  const togglePerm = (k: string) => {
    const next = { ...perms, [k]: !perms[k] };
    setPerms(next);
    localStorage.setItem("schoolbyte.perms", JSON.stringify(next));
  };

  const filtered = useMemo(() => state.users.filter((u) => {
    if (q && !`${u.name} ${u.username}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (roleF && u.role !== roleF) return false;
    if (statusF && u.status !== statusF) return false;
    return true;
  }), [state.users, q, roleF, statusF]);

  return (
    <>
      <PageHeader
        title="Users & Roles"
        subtitle={<>Showing <b>{filtered.length}</b> of <b>{state.users.length}</b> users</>}
        right={
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by username or name…" className="pl-9 pr-3 h-10 w-72 rounded-md border bg-card outline-none focus:ring-2 focus:ring-ring/30" />
            </div>
            <select value={roleF} onChange={(e) => setRoleF(e.target.value)} className="h-10 rounded-md border bg-card px-3">
              <option value="">All Roles</option><option value="admin">Admin</option><option value="secretary">Secretary</option>
            </select>
            <select value={statusF} onChange={(e) => setStatusF(e.target.value)} className="h-10 rounded-md border bg-card px-3">
              <option value="">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option>
            </select>
            <button onClick={() => {
              const username = prompt("Username"); if (!username) return;
              const name = prompt("Full name") ?? username;
              db.addUser({ username, name, role: "secretary", password: "changeme", status: "active" });
            }} className="h-10 px-4 rounded-md bg-success text-success-foreground font-medium flex items-center gap-2 hover:bg-success/90">
              <Plus className="w-4 h-4" /> Add User
            </button>
          </>
        }
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground border-b">
                <th className="py-4 px-6 font-semibold">User</th>
                <th className="py-4 font-semibold">Role</th>
                <th className="py-4 font-semibold">Status</th>
                <th className="py-4 font-semibold">Created</th>
                <th className="py-4 font-semibold">Last Login</th>
                <th className="py-4 pr-6"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="py-3 px-6">
                    <div className="flex items-center gap-3">
                      <Avatar initials={initials(u.name.split(" ")[0], u.name.split(" ")[1] ?? "")} tone={u.role === "admin" ? "primary" : "success"} />
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          {u.name}
                          {me?.id === u.id && <span className="text-[10px] bg-success/15 text-success px-1.5 py-0.5 rounded uppercase tracking-widest font-bold">You</span>}
                        </div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">@{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    {u.role === "admin" ? <Badge tone="info" dot>Admin</Badge> : <Badge tone="success" dot>Secretary</Badge>}
                  </td>
                  <td className="py-3">{u.status === "active" ? <Badge tone="success">Active</Badge> : <Badge tone="muted">Inactive</Badge>}</td>
                  <td className="py-3 uppercase tracking-widest text-xs font-semibold">{fmtDate(u.createdAt)}</td>
                  <td className="py-3 font-semibold">{u.lastLogin ? new Date(u.lastLogin).toLocaleString("en-US", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).replace(",", "") : "—"}</td>
                  <td className="py-3 pr-6">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <button className="p-2 rounded hover:bg-muted"><Key className="w-4 h-4" /></button>
                      <button onClick={() => db.updateUser(u.id, { status: u.status === "active" ? "inactive" : "active" })} className="p-2 rounded hover:bg-muted"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => me?.id !== u.id && confirm("Delete user?") && db.deleteUser(u.id)} className="p-2 rounded hover:bg-destructive/10 hover:text-destructive disabled:opacity-30" disabled={me?.id === u.id}><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-8">
        <div className="text-xl font-bold">Role Permissions</div>
        <div className="text-sm text-muted-foreground mb-4">Define modular access levels for different school personnel</div>

        <Card className="p-4 mb-4 bg-warning/15 border-warning/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-warning/40 text-warning-foreground flex items-center justify-center"><AlertTriangle className="w-5 h-5" /></div>
            <div className="text-sm font-semibold uppercase tracking-widest text-warning-foreground">Admins have total system access (non-modifiable). Secretary permissions can be tailored to their specific workflow.</div>
          </div>
        </Card>

        <Card>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground border-b">
                <th className="py-4 px-6 font-semibold">Capability Module</th>
                <th className="py-4 font-semibold text-center">Admin</th>
                <th className="py-4 font-semibold text-center">Secretary</th>
              </tr>
            </thead>
            <tbody>
              {MODULES.map((m) => (
                <tr key={m.key} className="border-b last:border-0">
                  <td className="py-3 px-6 font-medium">{m.label}</td>
                  <td className="py-3 text-center"><Check className="w-5 h-5 inline text-success" /></td>
                  <td className="py-3 text-center">
                    <button onClick={() => togglePerm(m.key)} className={`w-10 h-6 rounded-full transition-colors relative ${perms[m.key] ? "bg-success" : "bg-muted"}`}>
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${perms[m.key] ? "left-4" : "left-0.5"}`} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
