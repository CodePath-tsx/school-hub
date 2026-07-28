import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { db } from "@/lib/store";
import { BookMarked, Globe, User as UserIcon, Building2, Check, ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/setup")({
  head: () => ({ meta: [{ title: "First-time Setup — SchoolByte ERP" }] }),
  beforeLoad: () => {
    if (typeof window !== "undefined" && db.setupComplete()) {
      // If already set up, don't allow re-running
    }
  },
  component: SetupWizard,
});

type Step = 1 | 2 | 3;

function SetupWizard() {
  const nav = useNavigate();
  const [step, setStep] = useState<Step>(1);

  // Step 1 — Organization
  const [schoolName, setSchoolName] = useState("");
  const [schoolPhone, setSchoolPhone] = useState("+213 ");
  const [taxId, setTaxId] = useState("");
  const [address, setAddress] = useState("");

  // Step 2 — Admin
  const [adminName, setAdminName] = useState("");
  const [adminUsername, setAdminUsername] = useState("admin");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminConfirm, setAdminConfirm] = useState("");
  const [err2, setErr2] = useState<string | null>(null);

  // Step 3 — Region
  const [language, setLanguage] = useState<"en" | "fr" | "ar">("en");
  const [currency, setCurrency] = useState("DA");
  const [timezone, setTimezone] = useState("Africa/Algiers");
  const [seedDemo, setSeedDemo] = useState(true);

  const step1Valid = schoolName.trim().length > 1;
  const step2Valid =
    adminName.trim().length > 1 &&
    adminUsername.trim().length > 1 &&
    adminPassword.length >= 6 &&
    adminPassword === adminConfirm;

  function next() {
    if (step === 1 && step1Valid) setStep(2);
    else if (step === 2) {
      setErr2(null);
      if (!adminName.trim()) return setErr2("Full name is required.");
      if (!adminUsername.trim()) return setErr2("Username is required.");
      if (adminPassword.length < 6) return setErr2("Password must be at least 6 characters.");
      if (adminPassword !== adminConfirm) return setErr2("Passwords do not match.");
      setStep(3);
    }
  }
  function prev() { if (step > 1) setStep((step - 1) as Step); }

  function finish() {
    db.completeSetup({
      org: { schoolName: schoolName.trim(), schoolPhone: schoolPhone.trim(), taxId: taxId.trim(), address: address.trim() },
      admin: { name: adminName.trim(), username: adminUsername.trim().toLowerCase(), email: adminEmail.trim(), password: adminPassword },
      region: { language, currency, timezone, seedDemo },
    });
    nav({ to: "/license", replace: true });
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:py-10">
      <div className="max-w-3xl mx-auto">
        {/* Brand */}
        <div className="flex items-center justify-center gap-3 mb-6 sm:mb-8">
          <div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">SchoolByte ERP</div>
            <div className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-muted-foreground text-center">First-time Setup</div>
          </div>
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center">
            <BookMarked className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
        </div>

        {/* Steps indicator */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
          <StepChip active={step === 1} done={step > 1} icon={<Building2 className="w-4 h-4" />} title="Organization" subtitle="Details" />
          <StepChip active={step === 2} done={step > 2} icon={<UserIcon className="w-4 h-4" />} title="Admin" subtitle="Manager account" />
          <StepChip active={step === 3} done={false} icon={<Globe className="w-4 h-4" />} title="Region" subtitle="Language & currency" />
        </div>

        {/* Card */}
        <div className="bg-card border rounded-2xl p-5 sm:p-8 shadow-sm">
          {step === 1 && (
            <>
              <h2 className="text-xl sm:text-2xl font-bold">Welcome to SchoolByte</h2>
              <p className="text-sm text-muted-foreground mt-1">Let's start with your institution details.</p>
              <div className="mt-6 space-y-4">
                <Field label="Institution name *">
                  <input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="e.g. Al Noor Academy" className={inputCls} />
                </Field>
                <Field label="Phone">
                  <input value={schoolPhone} onChange={(e) => setSchoolPhone(e.target.value)} placeholder="+213 ..." className={inputCls} />
                </Field>
                <Field label="Tax ID">
                  <input value={taxId} onChange={(e) => setTaxId(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Address">
                  <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className={`${inputCls} h-auto py-2 resize-none`} />
                </Field>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-xl sm:text-2xl font-bold">Create Administrator</h2>
              <p className="text-sm text-muted-foreground mt-1">The manager account is required. You can add more users later.</p>
              <div className="mt-6 space-y-4">
                <Field label="Full name *">
                  <input value={adminName} onChange={(e) => setAdminName(e.target.value)} className={inputCls} />
                </Field>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Username *">
                    <input value={adminUsername} onChange={(e) => setAdminUsername(e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Email">
                    <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className={inputCls} />
                  </Field>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Password (6+) *">
                    <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Confirm password *">
                    <input type="password" value={adminConfirm} onChange={(e) => setAdminConfirm(e.target.value)} className={inputCls} />
                  </Field>
                </div>
                {err2 && <div className="text-sm text-destructive">{err2}</div>}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-xl sm:text-2xl font-bold">Language & Region</h2>
              <p className="text-sm text-muted-foreground mt-1">These preferences can be changed later from Settings.</p>
              <div className="mt-6 space-y-5">
                <div>
                  <div className="text-sm font-medium mb-2">Interface language</div>
                  <div className="grid grid-cols-3 gap-2">
                    {(["en", "fr", "ar"] as const).map((l) => (
                      <button
                        key={l}
                        onClick={() => setLanguage(l)}
                        className={`h-11 rounded-lg border text-sm font-medium transition ${language === l ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"}`}
                      >
                        {l === "en" ? "English" : l === "fr" ? "Français" : "العربية"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Currency">
                    <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputCls}>
                      <option value="DA">DA — Algerian Dinar</option>
                      <option value="MAD">MAD — Moroccan Dirham</option>
                      <option value="TND">TND — Tunisian Dinar</option>
                      <option value="EUR">EUR — Euro</option>
                      <option value="USD">USD — US Dollar</option>
                    </select>
                  </Field>
                  <Field label="Timezone">
                    <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={inputCls}>
                      <option>Africa/Algiers</option>
                      <option>Africa/Casablanca</option>
                      <option>Africa/Tunis</option>
                      <option>Europe/Paris</option>
                      <option>UTC</option>
                    </select>
                  </Field>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={seedDemo} onChange={(e) => setSeedDemo(e.target.checked)} className="accent-primary w-4 h-4" />
                  Load demo data (students, teachers, groups) for exploration
                </label>
                <div className="rounded-lg bg-muted/60 border border-dashed p-3 text-xs text-muted-foreground">
                  After this step you must activate a signed Ed25519 licence key before the app becomes usable.
                </div>
              </div>
            </>
          )}

          {/* Nav */}
          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              onClick={prev}
              disabled={step === 1}
              className="h-11 px-4 rounded-lg border text-sm font-medium inline-flex items-center gap-1 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <div className="text-xs text-muted-foreground">Step {step} of 3</div>
            {step < 3 ? (
              <button
                onClick={next}
                disabled={(step === 1 && !step1Valid) || (step === 2 && !step2Valid)}
                className="h-11 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-1 disabled:opacity-50"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={finish}
                className="h-11 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-1"
              >
                <Check className="w-4 h-4" /> Finish setup
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const inputCls = "w-full h-11 px-3 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-sm font-medium mb-1.5">{label}</div>
      {children}
    </label>
  );
}

function StepChip({ active, done, icon, title, subtitle }: { active: boolean; done: boolean; icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className={`rounded-xl border px-3 py-2.5 flex items-center gap-2.5 ${active ? "border-primary bg-primary/5" : done ? "border-success/40 bg-success/5" : "border-border bg-card"}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${active ? "bg-primary text-primary-foreground" : done ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}`}>
        {done ? <Check className="w-4 h-4" /> : icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs sm:text-sm font-semibold truncate">{title}</div>
        <div className="text-[10px] sm:text-xs text-muted-foreground truncate">{subtitle}</div>
      </div>
    </div>
  );
}
