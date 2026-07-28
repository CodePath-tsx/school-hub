import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Shield, User as UserIcon, Lock, Eye, EyeOff, BookOpen, Loader2 } from "lucide-react";
import { db } from "@/lib/store";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — SchoolByte ERP" }] }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const [u, setU] = useState("admin");
  const [p, setP] = useState("admin");
  const [remember, setRemember] = useState(true);
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    await new Promise((r) => setTimeout(r, 500));
    const user = db.login(u.trim(), p);
    if (!user) {
      setErr("Invalid credentials.");
      setBusy(false);
      return;
    }
    nav({ to: db.license() ? "/app" : "/app/licence" });
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left brand panel */}
      <div className="hidden md:flex flex-col items-center justify-center bg-primary text-primary-foreground p-12">
        <div className="w-24 h-24 rounded-2xl bg-primary-foreground/10 border border-primary-foreground/15 flex items-center justify-center mb-6">
          <BookOpen className="w-12 h-12" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">SchoolByte ERP</h1>
        <p className="mt-3 text-primary-foreground/70 text-center max-w-xs">
          Complete management for your educational institution
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center p-6 md:p-12 bg-background">
        <form onSubmit={submit} className="w-full max-w-sm">
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-2xl border-2 border-primary/25 flex items-center justify-center text-primary">
              <Shield className="w-7 h-7" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center">Welcome Back</h2>
          <p className="text-center text-muted-foreground text-sm mt-1">
            Sign in to your account to continue
          </p>

          <div className="mt-8 space-y-4">
            <div>
              <label className="text-sm font-medium">Username</label>
              <div className="mt-1 relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={u}
                  onChange={(e) => setU(e.target.value)}
                  className="w-full pl-9 pr-3 h-10 rounded-md border bg-card outline-none focus:ring-2 focus:ring-ring/40"
                  autoFocus
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={show ? "text" : "password"}
                  value={p}
                  onChange={(e) => setP(e.target.value)}
                  className="w-full pl-9 pr-9 h-10 rounded-md border bg-card outline-none focus:ring-2 focus:ring-ring/40"
                />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-primary" />
              Remember me
            </label>

            {err && <div className="text-sm text-destructive">{err}</div>}

            <button
              disabled={busy}
              className="w-full h-11 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {busy ? "Signing in…" : "Sign in"}
            </button>
            <p className="text-xs text-muted-foreground text-center pt-2">
              Default admin: <span className="font-mono">admin</span> / <span className="font-mono">admin</span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
