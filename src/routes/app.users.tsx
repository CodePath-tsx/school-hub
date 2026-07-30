import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Plus, Pencil, Trash2, AlertTriangle, Check, X, Eye, EyeOff, UserCog } from "lucide-react";
import { useDb } from "@/lib/useDb";
import { Card, PageHeader, Badge, Avatar } from "@/components/ui-kit";
import { db, initials, fmtDate } from "@/lib/store";

export const Route = createFileRoute("/app/users")({
  head: () => ({ meta: [{ title: "Users & Roles — SchoolByte ERP" }] }),
  component: UsersPage,
});

const MODULES: { key: string; label: string; desc: string }[] = [
  { key: "dashboard",   label: "Dashboard",     desc: "View statistics overview" },
  { key: "students",    label: "Students",       desc: "Manage student records & payments" },
  { key: "teachers",    label: "Teachers",       desc: "Manage teacher profiles" },
  { key: "groups",      label: "Groups",         desc: "Manage groups & rosters" },
  { key: "classrooms",  label: "Classrooms",     desc: "Manage room assignments" },
  { key: "attendance",  label: "Attendance",     desc: "Record & view attendance" },
  { key: "statistics",  label: "Statistics",     desc: "Access detailed analytics" },
  { key: "users",       label: "Users & Roles",  desc: "Manage system users" },
  { key: "settings",    label: "Settings",       desc: "Edit institution settings" },
  { key: "licence",     label: "Licence",        desc: "View licence information" },
];

const PERMS_KEY = "schoolbyte.secretaryPerms";

function loadPerms(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(PERMS_KEY);
    if (raw) return JSON.parse(raw) as Record<string, boolean>;
  } catch { /* ignore */ }
  // Default: secretary gets these modules
  const defaults: Record<string, boolean> = {};
  MODULES.forEach((m) => {
    defaults[m.key] = ["dashboard", "students", "groups", "attendance", "teachers"].includes(m.key);
  });
  return defaults;
}

function savePerms(p: Record<string, boolean>) {
  localStorage.setItem(PERMS_KEY, JSON.stringify(p));
}

// ─── Add / Edit User Modal ────────────────────────────────────────────────────
function UserModal({
  mode,
  initial,
  onClose,
}: {
  mode: "add" | "edit";
  initial?: { id: string; name: string; username: string; role: "admin" | "secretary"; status: "active" | "inactive" };
  onClose: () => void;
}) {
  const [name, setName]         = useState(initial?.name ?? "");
  const [username, setUsername] = useState(initial?.username ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole]         = useState<"admin" | "secretary">(initial?.role ?? "secretary");
  const [status, setStatus]     = useState<"active" | "inactive">(initial?.status ?? "active");
  const [showPw, setShowPw]     = useState(false);
  const [err, setErr]           = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!name.trim())     return setErr("Full name is required.");
    if (!username.trim()) return setErr("Username is required.");
    if (mode === "add" && !password) return setErr("Password is required.");

    if (mode === "add") {
      db.addUser({ username: username.trim(), name: name.trim(), role, password, status });
    } else if (initial) {
      db.updateUser(initial.id, {
        name: name.trim(),
        username: username.trim(),
        role,
        status,
        ...(password ? { password } : {}),
      });
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="text-lg font-bold">{mode === "add" ? "Add New User" : "Edit User"}</div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <Field label="Full Name">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ahmed Benali" className={inputCls} autoFocus />
          </Field>
          <Field label="Username">
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. ahmed.b" className={inputCls} />
          </Field>
          <Field label={mode === "add" ? "Password" : "New Password (leave blank to keep)"}>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "edit" ? "Leave blank to keep current" : "Min. 6 characters"}
                className={`${inputCls} pr-10`}
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Role">
              <select value={role} onChange={(e) => setRole(e.target.value as "admin" | "secretary")} className={inputCls}>
                <option value="secretary">Secretary</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
            <Field label="Status">
              <select value={status} onChange={(e) => setStatus(e.target.value as "active" | "inactive")} className={inputCls}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
          </div>

          {err && <div className="text-sm text-destructive flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> {err}</div>}

          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 h-10 rounded-md bg-primary text-primary-foreground font-medium">
              {mode === "add" ? "Create User" : "Save Changes"}
            </button>
            <button type="button" onClick={onClose} className="h-10 px-4 rounded-md border">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls = "w-full h-10 px-3 border rounded-md bg-background outline-none focus:ring-2 focus:ring-ring/30 text-sm";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">{label}</div>
      {children}
    </label>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function UsersPage() {
  const state = useDb();
  const [q, setQ]           = useState("");
  const [roleF, setRoleF]   = useState("");
  const [statusF, setStatusF] = useState("");
  const [modal, setModal]   = useState<null | "add" | { id: string; name: string; username: string; role: "admin" | "secretary"; status: "active" | "inactive" }>(null);
  const me = state.session ? state.users.find((u) => u.id === state.session!.userId) : null;

  const [perms, setPerms] = useState<Record<string, boolean>>(loadPerms);

  function togglePerm(k: string) {
    const next = { ...perms, [k]: !perms[k] };
    setPerms(next);
    savePerms(next);
  }

  function resetPerms() {
    const defaults: Record<string, boolean> = {};
    MODULES.forEach((m) => {
      defaults[m.key] = ["dashboard", "students", "groups", "attendance", "teachers"].includes(m.key);
    });
    setPerms(defaults);
    savePerms(defaults);
  }

  const filtered = useMemo(() => state.users.filter((u) => {
    if (q && !`${u.name} ${u.username}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (roleF   && u.role   !== roleF)   return false;
    if (statusF && u.status !== statusF) return false;
    return true;
  }), [state.users, q, roleF, statusF]);

  return (
    <>
      {modal && (
        modal === "add"
          ? <UserModal mode="add" onClose={() => setModal(null)} />
          : <UserModal mode="edit" initial={modal} onClose={() => setModal(null)} />
      )}

      <PageHeader
        title="Users & Roles"
        subtitle={<>Showing <b>{filtered.length}</b> of <b>{state.users.length}</b> users</>}
        right={
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by username or name…"
                className="pl-9 pr-3 h-10 w-64 rounded-md border bg-card outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <select value={roleF} onChange={(e) => setRoleF(e.target.value)} className="h-10 rounded-md border bg-card px-3 text-sm">
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="secretary">Secretary</option>
            </select>
            <select value={statusF} onChange={(e) => setStatusF(e.target.value)} className="h-10 rounded-md border bg-card px-3 text-sm">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button
              onClick={() => setModal("add")}
              className="h-10 px-4 rounded-md bg-success text-success-foreground font-medium flex items-center gap-2 hover:bg-success/90"
            >
              <Plus className="w-4 h-4" /> Add User
            </button>
          </>
        }
      />

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground border-b">
                <th className="py-4 px-6 font-semibold">User</th>
                <th className="py-4 font-semibold">Role</th>
                <th className="py-4 font-semibold">Status</th>
                <th className="py-4 font-semibold hidden md:table-cell">Created</th>
                <th className="py-4 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="py-3 px-6">
                    <div className="flex items-center gap-3">
                      <Avatar initials={initials(u.name.split(" ")[0] ?? "U", u.name.split(" ")[1] ?? "")} />
                      <div>
                        <div className="font-semibold">{u.name}</div>
                        <div className="text-xs text-muted-foreground">@{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <Badge tone={u.role === "admin" ? "info" : "default"}>{u.role}</Badge>
                  </td>
                  <td className="py-3">
                    <Badge tone={u.status === "active" ? "success" : "default"}>{u.status}</Badge>
                  </td>
                  <td className="py-3 text-muted-foreground hidden md:table-cell">{fmtDate(u.createdAt)}</td>
                  <td className="py-3 px-6">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => setModal({ id: u.id, name: u.name, username: u.username, role: u.role, status: u.status })}
                        className="p-2 rounded hover:bg-muted"
                        title="Edit user"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => me?.id !== u.id && confirm(`Delete ${u.name}?`) && db.deleteUser(u.id)}
                        disabled={me?.id === u.id || u.role === "admin"}
                        className="p-2 rounded hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
                        title={u.role === "admin" ? "Cannot delete admin" : "Delete user"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">No users match the current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Permissions */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-xl font-bold flex items-center gap-2"><UserCog className="w-5 h-5 text-primary" /> Role Permissions</div>
            <div className="text-sm text-muted-foreground">Define modular access levels for secretary accounts</div>
          </div>
          <button
            onClick={resetPerms}
            className="h-9 px-3 rounded-md border text-sm inline-flex items-center gap-1.5 hover:bg-muted"
          >
            Reset to defaults
          </button>
        </div>

        <Card className="p-4 mb-4 bg-warning/15 border-warning/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-warning/40 text-warning-foreground flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-sm font-semibold uppercase tracking-widest text-warning-foreground">
              Admins have unrestricted access. Secretary access can be toggled per module below.
            </div>
          </div>
        </Card>

        <Card>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground border-b">
                <th className="py-4 px-6 font-semibold">Module</th>
                <th className="py-4 px-3 font-semibold text-xs hidden md:table-cell">Description</th>
                <th className="py-4 font-semibold text-center">Admin</th>
                <th className="py-4 font-semibold text-center">Secretary</th>
              </tr>
            </thead>
            <tbody>
              {MODULES.map((m) => (
                <tr key={m.key} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="py-3 px-6 font-medium">{m.label}</td>
                  <td className="py-3 px-3 text-muted-foreground text-xs hidden md:table-cell">{m.desc}</td>
                  <td className="py-3 text-center">
                    <Check className="w-5 h-5 inline text-success" />
                  </td>
                  <td className="py-3 text-center">
                    <button
                      onClick={() => togglePerm(m.key)}
                      className={`w-11 h-6 rounded-full transition-colors relative inline-flex items-center ${perms[m.key] ? "bg-success" : "bg-muted"}`}
                      title={perms[m.key] ? "Revoke access" : "Grant access"}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${perms[m.key] ? "left-5" : "left-0.5"}`} />
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
