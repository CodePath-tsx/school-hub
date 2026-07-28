import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card, PageHeader, Badge } from "@/components/ui-kit";
import { useDb } from "@/lib/useDb";
import { db } from "@/lib/store";
import { verifyLicense, getMachineId } from "@/lib/license";
import { Key, Monitor, Mail, Phone, Globe, Copy, CheckCircle2, Instagram, Facebook, Linkedin, Loader2, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/app/licence")({
  head: () => ({ meta: [{ title: "Licence — SchoolByte ERP" }] }),
  component: LicencePage,
});

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
                <button onClick={() => confirm("Deactivate this licence?") && db.clearLicense()} className="mt-6 h-10 px-4 rounded-md border border-destructive/40 text-destructive hover:bg-destructive/5">Deactivate</button>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Key className="w-10 h-10 text-muted-foreground" />
                </div>
                <h2 className="text-3xl font-bold">No Active Key</h2>
                <p className="uppercase tracking-widest text-xs font-semibold text-muted-foreground mt-2">The application requires a valid administrative key to proceed.</p>
              </div>
            )}
          </Card>

          <Card className="p-8">
            <div className="text-xs uppercase tracking-widest font-bold flex items-center gap-2 mb-1"><Key className="w-4 h-4" /> System Activation</div>
            <div className="uppercase tracking-widest text-xs text-muted-foreground mb-6">Enter your cryptographically signed asset key to unlock production features.</div>
            <div className="flex flex-col md:flex-row gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="MB1.xxxxxxxxxxxxx.yyyyyyyyyyyyy"
                className="flex-1 h-14 px-4 rounded-lg border-2 border-dashed bg-background text-center tracking-widest font-mono outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary"
              />
              <button onClick={activate} disabled={busy || !input.trim()} className="h-14 px-8 rounded-lg bg-primary/70 hover:bg-primary text-primary-foreground font-bold uppercase tracking-widest disabled:opacity-50 inline-flex items-center gap-2">
                {busy && <Loader2 className="w-4 h-4 animate-spin" />} Activate
              </button>
            </div>
            {err && <div className="mt-3 text-sm text-destructive inline-flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {err}</div>}
            <div className="mt-8">
              <div className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">Hardware Blueprint (HWID)</div>
              <div className="flex items-center gap-2 mt-2">
                <code className="font-mono text-lg font-bold flex-1 select-all">{machineId}</code>
                <button onClick={copy} className="p-2 rounded hover:bg-muted">{copied ? <CheckCircle2 className="w-5 h-5 text-success" /> : <Copy className="w-5 h-5" />}</button>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">Send this identifier to your vendor so they can issue a machine-bound licence.</div>
            </div>
          </Card>
        </div>

        <Card className="p-6 h-fit">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-info/10 text-info flex items-center justify-center"><Monitor className="w-6 h-6" /></div>
            <div>
              <div className="text-sm font-bold uppercase tracking-widest">Support & Contact</div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest">Ambyte Agency</div>
            </div>
          </div>

          <SupportRow icon={<Mail className="w-4 h-4" />} label="Official Email" value={state.settings.supportEmail} href={`mailto:${state.settings.supportEmail}`} />
          <SupportRow icon={<Phone className="w-4 h-4" />} label="Support Line" value={state.settings.supportPhone} href={`tel:${state.settings.supportPhone}`} />
          <SupportRow icon={<Globe className="w-4 h-4" />} label="Web Terminal" value={state.settings.supportWebsite} href={`https://${state.settings.supportWebsite}`} />

          <div className="mt-6 text-xs uppercase tracking-widest font-semibold text-muted-foreground">Digital Presence</div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <SocialBtn icon={<Instagram className="w-4 h-4" />} label="IG" />
            <SocialBtn icon={<Facebook className="w-4 h-4" />} label="FB" />
            <SocialBtn icon={<Linkedin className="w-4 h-4" />} label="IN" />
          </div>

          <Card className="mt-6 p-4 bg-info/5 border-info/25">
            <div className="text-xs uppercase tracking-widest font-bold text-info mb-1">Operational Message</div>
            <div className="text-xs text-muted-foreground">For technical assistance or licence renewals, contact our regional support channels.</div>
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
      <div className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground flex items-center gap-1">{label}</div>
      <a href={href} className="text-sm text-info hover:underline flex items-center gap-2 mt-0.5">{icon} {value}</a>
    </div>
  );
}
function SocialBtn({ icon, label }: { icon: React.ReactNode; label: string }) {
  return <button className="h-9 rounded-lg bg-muted hover:bg-muted/70 text-xs font-bold uppercase tracking-widest inline-flex items-center justify-center gap-1.5">{icon} {label}</button>;
}
