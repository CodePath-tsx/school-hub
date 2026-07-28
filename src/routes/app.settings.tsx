import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, PageHeader } from "@/components/ui-kit";
import { useDb } from "@/lib/useDb";
import { db } from "@/lib/store";
import { Save, RotateCcw, Trash2 } from "lucide-react";

export const Route = createFileRoute("/app/settings")({
  head: () => ({ meta: [{ title: "Settings — SchoolByte ERP" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const state = useDb();
  const [form, setForm] = useState(state.settings);

  return (
    <>
      <PageHeader title="Settings" subtitle="Institution configuration" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="text-lg font-bold mb-4">Institution</div>
          <div className="space-y-3">
            <Field label="School Name"><input value={form.schoolName} onChange={(e) => setForm({ ...form, schoolName: e.target.value })} className="w-full h-10 px-3 border rounded-md bg-background" /></Field>
            <Field label="Currency"><input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="w-full h-10 px-3 border rounded-md bg-background" /></Field>
            <Field label="Academic Year"><input value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} className="w-full h-10 px-3 border rounded-md bg-background" /></Field>
          </div>
          <button onClick={() => db.updateSettings(form)} className="mt-6 h-10 px-4 rounded-md bg-primary text-primary-foreground inline-flex items-center gap-2"><Save className="w-4 h-4" /> Save Changes</button>
        </Card>

        <Card className="p-6">
          <div className="text-lg font-bold mb-4">Support Contact</div>
          <div className="space-y-3">
            <Field label="Support Email"><input value={form.supportEmail} onChange={(e) => setForm({ ...form, supportEmail: e.target.value })} className="w-full h-10 px-3 border rounded-md bg-background" /></Field>
            <Field label="Support Phone"><input value={form.supportPhone} onChange={(e) => setForm({ ...form, supportPhone: e.target.value })} className="w-full h-10 px-3 border rounded-md bg-background" /></Field>
            <Field label="Website"><input value={form.supportWebsite} onChange={(e) => setForm({ ...form, supportWebsite: e.target.value })} className="w-full h-10 px-3 border rounded-md bg-background" /></Field>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2 border-destructive/30">
          <div className="text-lg font-bold mb-1 text-destructive">Danger Zone</div>
          <div className="text-sm text-muted-foreground mb-4">Reset the local database. Cannot be undone.</div>
          <div className="flex gap-3">
            <button onClick={() => confirm("Reset all data to seed?") && db.reset()} className="h-10 px-4 rounded-md border border-warning text-warning-foreground inline-flex items-center gap-2"><RotateCcw className="w-4 h-4" /> Reset to demo data</button>
            <button onClick={() => confirm("Wipe ALL data?") && db.wipe()} className="h-10 px-4 rounded-md bg-destructive text-destructive-foreground inline-flex items-center gap-2"><Trash2 className="w-4 h-4" /> Wipe all data</button>
          </div>
        </Card>
      </div>
    </>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">{label}</div>{children}</label>;
}
