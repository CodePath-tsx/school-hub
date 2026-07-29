import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, PageHeader } from "@/components/ui-kit";
import { useDb } from "@/lib/useDb";
import { db } from "@/lib/store";
import { Save, RotateCcw, Trash2, Building2, Phone, Hash, MapPin, Globe, DollarSign, Calendar, Languages } from "lucide-react";

export const Route = createFileRoute("/app/settings")({
  head: () => ({ meta: [{ title: "Settings — SchoolByte ERP" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const state = useDb();
  const [form, setForm] = useState(state.settings);
  const [saved, setSaved] = useState(false);

  function save() {
    db.updateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="Institution & system configuration" />

      <div className="space-y-6">
        {/* Institution Identity */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <Building2 className="w-5 h-5 text-primary" />
            <div className="text-lg font-bold">Institution Identity</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="School Name" icon={<Building2 className="w-4 h-4" />}>
              <input
                value={form.schoolName}
                onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
                placeholder="e.g. Al Noor Academy"
                className="w-full h-10 px-3 border rounded-md bg-background outline-none focus:ring-2 focus:ring-ring/30"
              />
            </Field>
            <Field label="Phone" icon={<Phone className="w-4 h-4" />}>
              <input
                value={form.schoolPhone}
                onChange={(e) => setForm({ ...form, schoolPhone: e.target.value })}
                placeholder="+213 555 000 000"
                className="w-full h-10 px-3 border rounded-md bg-background outline-none focus:ring-2 focus:ring-ring/30"
              />
            </Field>
            <Field label="Tax ID / NIF" icon={<Hash className="w-4 h-4" />}>
              <input
                value={form.taxId}
                onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                placeholder="e.g. 12345678901"
                className="w-full h-10 px-3 border rounded-md bg-background outline-none focus:ring-2 focus:ring-ring/30"
              />
            </Field>
            <Field label="Academic Year" icon={<Calendar className="w-4 h-4" />}>
              <input
                value={form.academicYear}
                onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                placeholder="e.g. 2025–2026"
                className="w-full h-10 px-3 border rounded-md bg-background outline-none focus:ring-2 focus:ring-ring/30"
              />
            </Field>
            <Field label="Address" icon={<MapPin className="w-4 h-4" />} className="md:col-span-2">
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Street, City, Wilaya"
                className="w-full h-10 px-3 border rounded-md bg-background outline-none focus:ring-2 focus:ring-ring/30"
              />
            </Field>
          </div>
        </Card>

        {/* Region & Currency */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <Globe className="w-5 h-5 text-primary" />
            <div className="text-lg font-bold">Region & Currency</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Currency" icon={<DollarSign className="w-4 h-4" />}>
              <input
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                placeholder="DA"
                className="w-full h-10 px-3 border rounded-md bg-background outline-none focus:ring-2 focus:ring-ring/30"
              />
            </Field>
            <Field label="Timezone" icon={<Globe className="w-4 h-4" />}>
              <select
                value={form.timezone}
                onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                className="w-full h-10 px-3 border rounded-md bg-background outline-none focus:ring-2 focus:ring-ring/30"
              >
                <option value="Africa/Algiers">Africa/Algiers (GMT+1)</option>
                <option value="Africa/Tunis">Africa/Tunis (GMT+1)</option>
                <option value="Africa/Casablanca">Africa/Casablanca (GMT+1)</option>
                <option value="Africa/Cairo">Africa/Cairo (GMT+2)</option>
                <option value="Europe/Paris">Europe/Paris (GMT+1/+2)</option>
                <option value="UTC">UTC</option>
              </select>
            </Field>
            <Field label="Language" icon={<Languages className="w-4 h-4" />}>
              <select
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value as "en" | "fr" | "ar" })}
                className="w-full h-10 px-3 border rounded-md bg-background outline-none focus:ring-2 focus:ring-ring/30"
              >
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="ar">العربية</option>
              </select>
            </Field>
          </div>
        </Card>

        {/* Save */}
        <div className="flex justify-end">
          <button
            onClick={save}
            className="h-11 px-6 rounded-md bg-primary text-primary-foreground font-medium inline-flex items-center gap-2 hover:bg-primary/90 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saved ? "Saved ✓" : "Save Changes"}
          </button>
        </div>

        {/* Danger Zone */}
        <Card className="p-6 border-destructive/30">
          <div className="text-lg font-bold mb-1 text-destructive">Danger Zone</div>
          <div className="text-sm text-muted-foreground mb-4">These actions are irreversible. Proceed with caution.</div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => confirm("Reset all data to demo seed?") && db.reset()}
              className="h-10 px-4 rounded-md border border-warning text-warning-foreground inline-flex items-center gap-2 hover:bg-warning/10"
            >
              <RotateCcw className="w-4 h-4" /> Reset to demo data
            </button>
            <button
              onClick={() => confirm("This will wipe ALL data permanently. Continue?") && db.wipe()}
              className="h-10 px-4 rounded-md bg-destructive text-destructive-foreground inline-flex items-center gap-2 hover:bg-destructive/90"
            >
              <Trash2 className="w-4 h-4" /> Wipe all data
            </button>
          </div>
        </Card>
      </div>
    </>
  );
}

function Field({
  label,
  icon,
  children,
  className = "",
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1">
        {icon}
        {label}
      </div>
      {children}
    </label>
  );
}
