import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Plus, Trash2, Pencil, X, Wallet, Receipt, TrendingDown, Users2, Search, Printer,
} from "lucide-react";
import { useDb } from "@/lib/useDb";
import { Card, PageHeader, Badge } from "@/components/ui-kit";
import { db, fmtMoney, fmtDate, type Expense } from "@/lib/store";

export const Route = createFileRoute("/app/expenses")({
  head: () => ({
    meta: [
      { title: "Expenses & Payroll — SchoolByte ERP" },
      { name: "description", content: "Track teacher salaries, staff wages, purchases and running costs." },
      { property: "og:title", content: "Expenses & Payroll — SchoolByte ERP" },
      { property: "og:description", content: "Track teacher salaries, staff wages, purchases and running costs." },
    ],
  }),
  component: ExpensesPage,
});

const CATEGORIES = [
  "Teacher Salary", "Staff Salary", "Supplies", "Rent", "Utilities", "Maintenance", "Marketing", "Other",
] as const;

const toneFor: Record<string, "info" | "warning" | "success" | "muted" | "danger"> = {
  "Teacher Salary": "info",
  "Staff Salary": "info",
  Supplies: "success",
  Rent: "warning",
  Utilities: "warning",
  Maintenance: "muted",
  Marketing: "muted",
  Other: "muted",
};

function currentYm() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
}

function Stat({ icon: Icon, label, value, tone }: { icon: typeof Wallet; label: string; value: string; tone: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">{label}</div>
          <div className="text-2xl font-bold mt-2">{value}</div>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tone}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
}

function ExpensesPage() {
  const state = useDb();
  const currency = state.settings.currency;
  const [ym, setYm] = useState(currentYm());
  const [q, setQ] = useState("");
  const [catF, setCatF] = useState("");
  const [editing, setEditing] = useState<Expense | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [prefill, setPrefill] = useState<Partial<Expense> | null>(null);

  const monthExpenses = useMemo(
    () =>
      state.expenses
        .filter((e) => e.at.startsWith(ym))
        .filter((e) => (catF ? e.category === catF : true))
        .filter((e) =>
          q
            ? `${e.label} ${e.payee ?? ""} ${e.category}`.toLowerCase().includes(q.toLowerCase())
            : true,
        )
        .sort((a, b) => (a.at < b.at ? 1 : -1)),
    [state.expenses, ym, catF, q],
  );

  const total = monthExpenses.reduce((a, e) => a + e.amount, 0);
  const byCat = db.expensesByCategory(ym);
  const payroll = db.teacherPayroll(ym);
  const salaryTotal = state.expenses
    .filter((e) => e.at.startsWith(ym) && (e.category === "Teacher Salary" || e.category === "Staff Salary"))
    .reduce((a, e) => a + e.amount, 0);
  const revenue = state.payments.filter((p) => p.paidAt.startsWith(ym)).reduce((a, p) => a + p.amount, 0);
  const net = revenue - state.expenses.filter((e) => e.at.startsWith(ym)).reduce((a, e) => a + e.amount, 0);

  const months = useMemo(() => {
    const out: string[] = [];
    const n = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(n.getFullYear(), n.getMonth() - i, 1);
      out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return out;
  }, []);

  function openNew(pre?: Partial<Expense>) {
    setEditing(null);
    setPrefill(pre ?? null);
    setShowForm(true);
  }

  return (
    <>
      <PageHeader
        title="Expenses & Payroll"
        subtitle={
          <>
            <b>{monthExpenses.length}</b> entries in {ym} · Total <b>{fmtMoney(total, currency)}</b>
          </>
        }
        right={
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search…"
                className="pl-9 pr-3 h-10 w-48 sm:w-64 rounded-md border bg-card outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <select value={ym} onChange={(e) => setYm(e.target.value)} className="h-10 rounded-md border bg-card px-3">
              {months.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select value={catF} onChange={(e) => setCatF(e.target.value)} className="h-10 rounded-md border bg-card px-3">
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={() => window.print()} className="h-10 px-3 rounded-md border bg-card flex items-center gap-2 hover:bg-muted">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button
              onClick={() => openNew()}
              className="h-10 px-4 rounded-md bg-primary text-primary-foreground font-medium flex items-center gap-2 hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" /> Add Expense
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <Stat icon={TrendingDown} label="Total Expenses" value={fmtMoney(total, currency)} tone="bg-destructive/10 text-destructive" />
        <Stat icon={Users2} label="Salaries Paid" value={fmtMoney(salaryTotal, currency)} tone="bg-info/12 text-info" />
        <Stat icon={Receipt} label="Revenue Collected" value={fmtMoney(revenue, currency)} tone="bg-success/12 text-success" />
        <Stat icon={Wallet} label="Net Result" value={fmtMoney(net, currency)} tone={net >= 0 ? "bg-success/12 text-success" : "bg-destructive/10 text-destructive"} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <div className="p-5 border-b font-bold">Expense Entries — {ym}</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground border-b">
                  <th className="py-4 px-6 font-semibold">Label</th>
                  <th className="py-4 font-semibold">Category</th>
                  <th className="py-4 font-semibold">Payee</th>
                  <th className="py-4 font-semibold">Date</th>
                  <th className="py-4 font-semibold">Amount</th>
                  <th className="py-4 pr-6"></th>
                </tr>
              </thead>
              <tbody>
                {monthExpenses.map((e) => (
                  <tr key={e.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="py-3 px-6">
                      <div className="font-semibold">{e.label}</div>
                      {e.note && <div className="text-xs text-muted-foreground">{e.note}</div>}
                    </td>
                    <td className="py-3"><Badge tone={toneFor[e.category] ?? "muted"}>{e.category}</Badge></td>
                    <td className="py-3 text-muted-foreground">{e.payee || "—"}</td>
                    <td className="py-3 text-muted-foreground">{fmtDate(e.at)}</td>
                    <td className="py-3 font-bold">{fmtMoney(e.amount, currency)}</td>
                    <td className="py-3 pr-6">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <button onClick={() => { setEditing(e); setPrefill(null); setShowForm(true); }} className="p-2 rounded hover:bg-muted"><Pencil className="w-4 h-4" /></button>
                        <button
                          onClick={() => confirm(`Delete "${e.label}"?`) && db.deleteExpense(e.id)}
                          className="p-2 rounded hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {monthExpenses.length === 0 && (
                  <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">No expenses recorded for this month.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <div className="p-5 border-b font-bold">Breakdown by Category</div>
          <div className="p-5 space-y-3">
            {byCat.length === 0 && <div className="text-sm text-muted-foreground">Nothing recorded yet.</div>}
            {byCat.map((c) => (
              <div key={c.category}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium">{c.category}</span>
                  <span className="font-bold">{fmtMoney(c.total, currency)}</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${total ? (c.total / total) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="p-5 border-b flex items-center justify-between">
          <div className="font-bold">Teacher Payroll — {ym}</div>
          <div className="text-xs text-muted-foreground">Per-session rate or share of collected fees</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground border-b">
                <th className="py-4 px-6 font-semibold">Teacher</th>
                <th className="py-4 font-semibold">Mode</th>
                <th className="py-4 font-semibold">Sessions</th>
                <th className="py-4 font-semibold">Collected</th>
                <th className="py-4 font-semibold">Due</th>
                <th className="py-4 font-semibold">Paid</th>
                <th className="py-4 pr-6"></th>
              </tr>
            </thead>
            <tbody>
              {payroll.map((p) => {
                const remaining = p.due - p.paid;
                return (
                  <tr key={p.teacherId} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="py-3 px-6 font-semibold">{p.name}</td>
                    <td className="py-3">
                      <Badge tone={p.mode === "session" ? "info" : "warning"}>
                        {p.mode === "session" ? `${fmtMoney(p.rate, currency)} / session` : `${p.rate}% of fees`}
                      </Badge>
                    </td>
                    <td className="py-3">{p.sessions}</td>
                    <td className="py-3">{fmtMoney(p.collected, currency)}</td>
                    <td className="py-3 font-bold">{fmtMoney(p.due, currency)}</td>
                    <td className="py-3">{fmtMoney(p.paid, currency)}</td>
                    <td className="py-3 pr-6">
                      {remaining > 0 ? (
                        <button
                          onClick={() =>
                            openNew({
                              label: `Salary — ${p.name} (${ym})`,
                              amount: remaining,
                              category: "Teacher Salary",
                              payee: p.name,
                              teacherId: p.teacherId,
                            })
                          }
                          className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
                        >
                          Pay {fmtMoney(remaining, currency)}
                        </button>
                      ) : (
                        <Badge tone="success" dot>Settled</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
              {payroll.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">No active teachers.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showForm && (
        <ExpenseModal
          initial={editing ?? prefill ?? undefined}
          isEdit={!!editing}
          defaultMonth={ym}
          onClose={() => { setShowForm(false); setEditing(null); setPrefill(null); }}
        />
      )}
    </>
  );
}

function ExpenseModal({
  initial, isEdit, defaultMonth, onClose,
}: {
  initial?: Partial<Expense>;
  isEdit: boolean;
  defaultMonth: string;
  onClose: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [label, setLabel] = useState(initial?.label ?? "");
  const [amount, setAmount] = useState(String(initial?.amount ?? ""));
  const [category, setCategory] = useState(String(initial?.category ?? "Supplies"));
  const [payee, setPayee] = useState(initial?.payee ?? "");
  const [at, setAt] = useState(initial?.at ?? (today.startsWith(defaultMonth) ? today : `${defaultMonth}-01`));
  const [method, setMethod] = useState<Expense["method"]>(initial?.method ?? "cash");
  const [note, setNote] = useState(initial?.note ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!label.trim() || !Number.isFinite(value) || value <= 0) return;
    const payload = {
      label: label.trim(),
      amount: value,
      category,
      payee: payee.trim() || undefined,
      teacherId: initial?.teacherId,
      at,
      method,
      note: note.trim() || undefined,
    };
    if (isEdit && initial?.id) db.updateExpense(initial.id, payload);
    else db.addExpense(payload);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto">
      <form onSubmit={submit} className="bg-card rounded-2xl border w-full max-w-lg my-8">
        <div className="flex items-center justify-between p-5 border-b">
          <div className="font-bold text-lg">{isEdit ? "Edit Expense" : "Add Expense"}</div>
          <button type="button" onClick={onClose} className="p-2 rounded hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="text-sm sm:col-span-2">
            <span className="font-medium">Label *</span>
            <input value={label} onChange={(e) => setLabel(e.target.value)} required placeholder="e.g. September salary — Mourad"
              className="mt-1 w-full h-10 rounded-md border bg-background px-3 outline-none focus:ring-2 focus:ring-ring/30" />
          </label>
          <label className="text-sm">
            <span className="font-medium">Amount *</span>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} required type="number" min="1"
              className="mt-1 w-full h-10 rounded-md border bg-background px-3 outline-none focus:ring-2 focus:ring-ring/30" />
          </label>
          <label className="text-sm">
            <span className="font-medium">Category *</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full h-10 rounded-md border bg-background px-3">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="text-sm">
            <span className="font-medium">Payee</span>
            <input value={payee} onChange={(e) => setPayee(e.target.value)} placeholder="Teacher / staff / supplier"
              className="mt-1 w-full h-10 rounded-md border bg-background px-3 outline-none focus:ring-2 focus:ring-ring/30" />
          </label>
          <label className="text-sm">
            <span className="font-medium">Date *</span>
            <input value={at} onChange={(e) => setAt(e.target.value)} type="date" required
              className="mt-1 w-full h-10 rounded-md border bg-background px-3" />
          </label>
          <label className="text-sm">
            <span className="font-medium">Payment Method</span>
            <select value={method} onChange={(e) => setMethod(e.target.value as Expense["method"])} className="mt-1 w-full h-10 rounded-md border bg-background px-3">
              <option value="cash">Cash</option><option value="card">Card</option><option value="transfer">Transfer</option>
            </select>
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="font-medium">Note</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring/30" />
          </label>
        </div>
        <div className="p-5 border-t flex justify-end gap-3">
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-md border">Cancel</button>
          <button type="submit" className="h-10 px-5 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90">
            {isEdit ? "Save Changes" : "Add Expense"}
          </button>
        </div>
      </form>
    </div>
  );
}
