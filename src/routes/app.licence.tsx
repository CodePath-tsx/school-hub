import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card, PageHeader, Badge } from "@/components/ui-kit";
import { useDb } from "@/lib/useDb";
import { db } from "@/lib/store";
import { verifyLicense, getMachineId } from "@/lib/license";
import { Key, Monitor, Mail, Phone, Globe, Copy, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/app/licence")({
  head: () => ({ meta: [{ title: "Licence — SchoolByte ERP" }] }),
  component: LicencePage,
});

// ── Owner contact (fixed) ──────────────────────────────────────────
const OWNER = {
  email: "moh.ps4075@gmail.com",
  phone: "0654160502",
  website: "https://nexora-digital-nu.vercel.app/",
};

function LicencePage() {
  const state = useDb();
  const nav = useNavigate();
  const machineId = getMachineId();
  const [input, setInput] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const active = state.license;

  async function activate() {
    setErr(null); setBusy(true);
    const res = await verifyLicense(input.trim(), machineId);
    if (!res.ok || !res.payload) { setErr(res.error ?? "Invalid license."); setBusy(false); return; }
    db.setLicense({ key: input.trim(), payload: res.payload, machineId, activatedAt: new Date().toISOString() });
    setBusy(false);
    setTimeout(() => nav({ to: "/app" }), 400);
  }
  async function copy() {
    await navigator.clipboard.writeText(machineId);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      <PageHeader
        title="Licence Infrastructure"
        subtitle={<span className="uppercase tracking-widest text-xs font-semibold">Manage system identity, credentials, and operational lifecycle</span>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: licence status + activation ── */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-10">
            {active ? (
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10 text-success" />
                </div>
                <h2 className="text-3xl font-bold">Licence Active</h2>
                <p className="text-muted-foreground mt-2">This installation is licensed and fully operational.</p>
                <div className="mt-6 grid grid-cols-2 gap-4 max-w-md mx-auto text-left">
                  <Info label="Customer" value={active.payload.customer} />
                  <Info label="Company" value={active.payload.company} />
                  <Info label="Type" value={active.payload.type} />
                  <Info label="Activated" value={new Date(active.activatedAt).toLocaleDateString()} />
                  {active.payload.expiresAt && <Info label="Expires" value={new Date(active.payload.expiresAt).toLocaleDateString()} />}
                  <Info label="Machine" value={active.payload.machineId || "(any)"} />
                </div>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Badge variant={active.payload.type === "lifetime" ? "success" : "warning"} className="text-sm px-4 py-1">
                    {active.payload.type === "lifetime" ? "Lifetime" : "Subscription"}
                  </Badge>
                </div>
                <button
                  onClick={() => { if (confirm("Deactivate this licence?")) { db.clearLicense(); db.logout(); nav({ to: "/license" }); } }}
                  className="mt-6 h-10 px-4 rounded-md border border-destructive/40 text-destructive hover:bg-destructive/5"
                >
                  Deactivate
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Key className="w-10 h-10 text-muted-foreground" />
                </div>
                <h2 className="text-3xl font-bold">No Active Key</h2>
                <p className="uppercase tracking-widest text-xs font-semibold text-muted-foreground mt-2">
                  The application requires a valid administrative key to proceed.
                </p>
              </div>
            )}
          </Card>

          {/* Hardware ID */}
          <Card className="p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <Monitor className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-lg">Hardware Blueprint</div>
                <div className="text-sm text-muted-foreground">
                  Your unique machine identifier. Share this with the vendor to obtain a licence key.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <code className="flex-1 font-mono text-sm bg-muted px-4 py-3 rounded-lg tracking-widest overflow-x-auto">
                {machineId}
              </code>
              <button
                onClick={copy}
                className="h-10 px-4 rounded-md border inline-flex items-center gap-2 hover:bg-muted"
              >
                <Copy className="w-4 h-4" />
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </Card>

          {/* Activate form */}
          {!active && (
            <Card className="p-8">
              <div className="font-bold text-lg mb-4">Activate Licence Key</div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste your MB1.xxx licence key here…"
                className="w-full h-32 px-4 py-3 border rounded-lg bg-background font-mono text-xs resize-none outline-none focus:ring-2 focus:ring-ring/40"
              />
              {err && (
                <div className="mt-3 flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle className="w-4 h-4" /> {err}
                </div>
              )}
              <button
                onClick={activate}
                disabled={busy || !input.trim()}
                className="mt-4 h-11 px-6 rounded-md bg-primary text-primary-foreground font-medium inline-flex items-center gap-2 disabled:opacity-60"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                {busy ? "Verifying…" : "Activate"}
              </button>
            </Card>
          )}

          {/* Features */}
          {active && (
            <Card className="p-8">
              <div className="font-bold text-lg mb-4">Licensed Features</div>
              <div className="flex flex-wrap gap-2">
                {active.payload.features.map((f) => (
                  <Badge key={f} variant="success" className="capitalize">{f}</Badge>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* ── Right: Support & Contact (fixed owner info) ── */}
        <Card className="p-6 h-fit">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-info/10 text-info flex items-center justify-center">
              <Monitor className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold uppercase tracking-widest">Support & Contact</div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest">SchoolByte ERP</div>
            </div>
          </div>

          <SupportRow
            icon={<Mail className="w-4 h-4" />}
            label="Official Email"
            value={OWNER.email}
            href={`mailto:${OWNER.email}`}
          />
          <SupportRow
            icon={<Phone className="w-4 h-4" />}
            label="Support Line"
            value={OWNER.phone}
            href={`tel:${OWNER.phone}`}
          />
          <SupportRow
            icon={<Globe className="w-4 h-4" />}
            label="Web Terminal"
            value={OWNER.website}
            href={OWNER.website}
          />

          <Card className="mt-6 p-4 bg-info/5 border-info/25">
            <div className="text-xs uppercase tracking-widest font-bold text-info mb-1">Operational Message</div>
            <div className="text-xs text-muted-foreground">
              For technical assistance or licence renewals, contact our support channels.
            </div>
          </Card>
        </Card>
      </div>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{label}</div>
      <div className="text-sm font-semibold capitalize">{value}</div>
    </div>
  );
}

function SupportRow({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href: string }) {
  return (
    <div className="mb-4">
      <div className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">{label}</div>
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm text-info hover:underline flex items-center gap-2 mt-0.5">
        {icon} {value}
      </a>
    </div>
  );
}
