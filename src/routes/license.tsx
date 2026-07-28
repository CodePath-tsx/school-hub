import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { db } from "@/lib/store";
import { verifyLicense, getMachineId } from "@/lib/license";
import { Key, Copy, CheckCircle2, Loader2, AlertTriangle, ShieldCheck, Cpu } from "lucide-react";

export const Route = createFileRoute("/license")({
  head: () => ({ meta: [{ title: "Activate Licence — SchoolByte ERP" }] }),
  component: LicensePublic,
});

function LicensePublic() {
  const nav = useNavigate();
  const machineId = getMachineId();
  const [input, setInput] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  // Redirect if no setup yet or already licensed
  useEffect(() => {
    if (!db.setupComplete()) nav({ to: "/setup", replace: true });
    else if (db.license()) nav({ to: "/login", replace: true });
  }, [nav]);

  async function activate() {
    setErr(null); setBusy(true);
    const res = await verifyLicense(input.trim(), machineId);
    if (!res.ok || !res.payload) { setErr(res.error ?? "Invalid license."); setBusy(false); return; }
    db.setLicense({ key: input.trim(), payload: res.payload, machineId, activatedAt: new Date().toISOString() });
    setBusy(false);
    nav({ to: "/login", replace: true });
  }
  async function copy() {
    await navigator.clipboard.writeText(machineId);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:py-12">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center">
            <ShieldCheck className="w-7 h-7" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-center">Application Licence</h1>
        <p className="text-sm text-muted-foreground text-center mt-1.5 max-w-md mx-auto">
          Enter your signed Ed25519 licence key issued by the vendor to unlock the application on this machine.
        </p>

        <div className="mt-8 bg-card border rounded-2xl p-5 sm:p-7 shadow-sm">
          <div className="rounded-xl bg-muted/60 border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4 text-primary" />
              <div className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">Machine ID (HWID)</div>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-base sm:text-lg font-bold select-all break-all">{machineId}</code>
              <button onClick={copy} className="shrink-0 h-9 w-9 rounded-md border hover:bg-muted flex items-center justify-center" title="Copy">
                {copied ? <CheckCircle2 className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="text-xs text-muted-foreground mt-2">Share this ID with the vendor so they can issue a licence bound to your device.</div>
          </div>

          <div className="mt-6">
            <div className="text-sm font-medium mb-2">Licence key</div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="MB1.eyJj............XYZ.SIGNATURE_BASE64URL"
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border bg-background font-mono text-xs sm:text-sm outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary resize-none"
            />
            <div className="text-xs text-muted-foreground mt-1.5">Starts with <code>MB1.</code> and carries an Ed25519 signature. Unsigned keys are rejected.</div>
          </div>

          {err && (
            <div className="mt-4 text-sm text-destructive inline-flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {err}
            </div>
          )}

          <button
            onClick={activate}
            disabled={busy || !input.trim()}
            className="mt-6 w-full h-12 rounded-lg bg-primary text-primary-foreground font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
            Verify & Activate
          </button>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-6">
          No access to the app is granted until a valid licence key is verified.
        </p>
      </div>
    </div>
  );
}
