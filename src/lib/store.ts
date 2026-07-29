// Local data store — mimics a SQLite database using localStorage so the app
// works entirely in-browser during preview. In the packaged Electron build
// the same shape is served by better-sqlite3 through the IPC bridge.

export type ID = string;

export interface User {
  id: ID;
  username: string;
  name: string;
  role: "admin" | "secretary";
  password: string;
  status: "active" | "inactive";
  createdAt: string;
  lastLogin?: string;
}
export interface Teacher {
  id: ID; firstName: string; lastName: string; phone: string; email?: string;
  subject: string;
  salaryMode: "session" | "percentage"; salaryRate: number;
  hiredAt?: string; notes?: string;
  status: "active" | "inactive";
}
export interface Room {
  id: ID; name: string; floor: "ground" | "1st" | "2nd" | "3rd";
  type: "classroom" | "lab" | "hall"; capacity: number;
  equipment?: string; notes?: string;
  status: "in-use" | "available" | "maintenance";
}
export interface Group {
  id: ID; name: string; subject: string;
  year: "1st-year-secondary" | "2nd-year-secondary" | "3rd-year-secondary";
  teacherId: ID; roomId: ID; monthlyFee: number; capacity: number;
  sessionsPerMonth: number;
  scheduleDay: "sat" | "sun" | "mon" | "tue" | "wed" | "thu" | "fri";
  scheduleTime: string; // HH:mm
  durationMin: number;
  status: "active" | "inactive";
}
export interface Student {
  id: ID; firstName: string; lastName: string; phone: string; parentName: string;
  parentPhone?: string;
  dateOfBirth?: string;
  address?: string;
  groupIds: ID[];
  monthlyFee: number; // cached sum of chosen groups
  enrolledAt: string;
  subscriptionStart: string;
  subscriptionEnd: string;
  paymentStatus: "paid" | "pending" | "overdue"; status: "active" | "inactive";
}
export interface AttendanceEntry {
  id: ID; groupId: ID; studentId: ID; date: string; state: "present" | "late" | "absent";
}
export interface Payment {
  id: ID; studentId: ID; amount: number; paidAt: string;
  method: "cash" | "card" | "transfer";
  monthsCovered: number;
  coversFrom: string; coversTo: string;
  receiptNo: string;
  note?: string;
}
export interface Expense { id: ID; label: string; amount: number; category: string; at: string }
export interface LicenseRecord {
  key: string; payload: import("./license").LicensePayload;
  machineId: string; activatedAt: string;
}
export interface Settings {
  schoolName: string; schoolPhone: string; taxId: string; address: string;
  currency: string; timezone: string; language: "en" | "fr" | "ar";
  academicYear: string;
  supportEmail: string; supportPhone: string; supportWebsite: string;
}

interface DB {
  users: User[]; teachers: Teacher[]; rooms: Room[]; groups: Group[]; students: Student[];
  attendance: AttendanceEntry[]; payments: Payment[];
  expenses: Expense[];
  license: LicenseRecord | null;
  session: { userId: ID } | null;
  settings: Settings;
  setupComplete: boolean;
  receiptCounter: number;
}

const STORAGE_KEY = "schoolbyte.db.v3";
const uid = () => Math.random().toString(36).slice(2, 10);

function addMonths(iso: string, m: number): string {
  const d = new Date(iso);
  const nd = new Date(d);
  nd.setMonth(nd.getMonth() + m);
  return nd.toISOString().slice(0, 10);
}

function demoData() {
  const teachers: Teacher[] = [
    { id: "t1", firstName: "Mourad", lastName: "Djebbar", phone: "0550111222", email: "mourad@school.dz", subject: "Mathematics", salaryMode: "session", salaryRate: 800, hiredAt: "2023-09-01", status: "active" },
    { id: "t2", firstName: "Samira", lastName: "Khelil", phone: "0661333444", email: "samira@school.dz", subject: "Physics", salaryMode: "percentage", salaryRate: 30, hiredAt: "2023-09-01", status: "active" },
    { id: "t3", firstName: "Bilal", lastName: "Amrani", phone: "0770555666", subject: "English", salaryMode: "session", salaryRate: 700, hiredAt: "2024-02-15", status: "active" },
    { id: "t4", firstName: "Nadia", lastName: "Bensalem", phone: "0550777888", subject: "Science", salaryMode: "percentage", salaryRate: 25, hiredAt: "2024-09-01", status: "active" },
  ];
  const rooms: Room[] = [
    { id: "r1", name: "Room 101", floor: "ground", type: "classroom", capacity: 25, equipment: "Whiteboard, Projector", status: "in-use" },
    { id: "r2", name: "Room 102", floor: "ground", type: "classroom", capacity: 20, equipment: "Whiteboard", status: "in-use" },
    { id: "r3", name: "Room 103", floor: "1st", type: "classroom", capacity: 30, equipment: "Whiteboard, Projector, PC", status: "in-use" },
    { id: "r4", name: "Lab A", floor: "1st", type: "lab", capacity: 18, equipment: "Physics lab kit", status: "in-use" },
    { id: "r5", name: "Room 201", floor: "2nd", type: "classroom", capacity: 28, equipment: "Whiteboard", status: "available" },
    { id: "r6", name: "Hall B", floor: "ground", type: "hall", capacity: 60, equipment: "Stage, Audio", status: "maintenance" },
  ];
  const groups: Group[] = [
    { id: "g1", name: "Math G1", subject: "Mathematics", year: "3rd-year-secondary", teacherId: "t1", roomId: "r1", monthlyFee: 2500, capacity: 25, sessionsPerMonth: 8, scheduleDay: "mon", scheduleTime: "16:00", durationMin: 120, status: "active" },
    { id: "g2", name: "Physics G2", subject: "Physics", year: "2nd-year-secondary", teacherId: "t2", roomId: "r2", monthlyFee: 3000, capacity: 20, sessionsPerMonth: 8, scheduleDay: "tue", scheduleTime: "17:00", durationMin: 120, status: "active" },
    { id: "g3", name: "English G1", subject: "English", year: "1st-year-secondary", teacherId: "t3", roomId: "r3", monthlyFee: 2000, capacity: 30, sessionsPerMonth: 4, scheduleDay: "wed", scheduleTime: "15:00", durationMin: 90, status: "active" },
    { id: "g4", name: "Science G3", subject: "Science", year: "3rd-year-secondary", teacherId: "t4", roomId: "r4", monthlyFee: 2800, capacity: 18, sessionsPerMonth: 6, scheduleDay: "thu", scheduleTime: "16:30", durationMin: 120, status: "active" },
  ];
  const today = new Date().toISOString().slice(0, 10);
  const students: Student[] = [
    { id: "s1", firstName: "Youcef", lastName: "Benali", phone: "0550123456", parentName: "Ahmed Benali", parentPhone: "0550999888", groupIds: ["g1", "g2"], monthlyFee: 5500, enrolledAt: "2025-09-01", subscriptionStart: "2026-07-01", subscriptionEnd: addMonths(today, 1), paymentStatus: "paid", status: "active" },
    { id: "s2", firstName: "Amira", lastName: "Hadj", phone: "0661234567", parentName: "Karim Hadj", groupIds: ["g2"], monthlyFee: 3000, enrolledAt: "2025-09-01", subscriptionStart: "2026-07-15", subscriptionEnd: "2026-08-15", paymentStatus: "pending", status: "active" },
    { id: "s3", firstName: "Karim", lastName: "Meziane", phone: "0770987654", parentName: "Nour Meziane", groupIds: ["g1"], monthlyFee: 2500, enrolledAt: "2025-10-15", subscriptionStart: "2026-06-15", subscriptionEnd: "2026-07-15", paymentStatus: "overdue", status: "active" },
    { id: "s4", firstName: "Sara", lastName: "Boudaoud", phone: "0550456789", parentName: "Fatima Boudaoud", groupIds: ["g3"], monthlyFee: 2000, enrolledAt: "2026-01-10", subscriptionStart: "2026-07-10", subscriptionEnd: addMonths(today, 1), paymentStatus: "paid", status: "active" },
    { id: "s5", firstName: "Rami", lastName: "Oulhadj", phone: "0661098765", parentName: "Samir Oulhadj", groupIds: ["g2", "g4"], monthlyFee: 5800, enrolledAt: "2026-02-01", subscriptionStart: "2026-07-05", subscriptionEnd: addMonths(today, 1), paymentStatus: "paid", status: "active" },
  ];
  return { teachers, rooms, groups, students };
}

function emptyDB(): DB {
  return {
    users: [],
    teachers: [], rooms: [], groups: [], students: [],
    attendance: [], payments: [],
    expenses: [],
    license: null,
    session: null,
    settings: {
      schoolName: "",
      schoolPhone: "",
      taxId: "",
      address: "",
      currency: "DA",
      timezone: "Africa/Algiers",
      language: "en",
      academicYear: "2025 / 2026",
      supportEmail: "contact@ambyte-agency.com",
      supportPhone: "+213 556 648 005",
      supportWebsite: "ambyte-agency.com",
    },
    setupComplete: false,
    receiptCounter: 1000,
  };
}

let cache: DB | null = null;

function migrate(raw: any): DB {
  const base = emptyDB();
  const s: DB = { ...base, ...raw, settings: { ...base.settings, ...(raw.settings ?? {}) } };
  // Ensure arrays
  s.students = (s.students ?? []).map((st: any) => ({
    ...st,
    groupIds: st.groupIds ?? (st.groupId ? [st.groupId] : []),
    subscriptionStart: st.subscriptionStart ?? st.enrolledAt ?? new Date().toISOString().slice(0, 10),
    subscriptionEnd: st.subscriptionEnd ?? addMonths(st.enrolledAt ?? new Date().toISOString().slice(0, 10), 1),
  }));
  s.groups = (s.groups ?? []).map((g: any) => ({
    sessionsPerMonth: 8, scheduleDay: "mon", scheduleTime: "16:00", durationMin: 120, ...g,
  }));
  s.payments = s.payments ?? [];
  s.receiptCounter = s.receiptCounter ?? 1000;
  return s;
}

function load(): DB {
  if (cache) return cache;
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      cache = migrate(JSON.parse(raw));
      return cache!;
    }
  } catch { /* ignore */ }
  cache = emptyDB();
  save();
  return cache;
}

function save() {
  if (!cache) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    for (const l of listeners) l();
  } catch { /* ignore */ }
}

const listeners = new Set<() => void>();
export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function refreshPaymentStatus(s: Student) {
  const today = new Date().toISOString().slice(0, 10);
  if (s.subscriptionEnd < today) s.paymentStatus = "overdue";
  else if (s.subscriptionEnd <= addMonths(today, 0)) s.paymentStatus = "pending";
  else s.paymentStatus = "paid";
}

export const db = {
  all(): DB { return load(); },
  reset() { cache = emptyDB(); save(); },
  wipe() {
    const s = load();
    s.students = []; s.teachers = []; s.groups = []; s.rooms = [];
    s.attendance = []; s.payments = []; s.expenses = [];
    save();
  },

  setupComplete(): boolean { return load().setupComplete; },
  completeSetup(input: {
    org: { schoolName: string; schoolPhone: string; taxId: string; address: string };
    admin: { name: string; username: string; email?: string; password: string };
    region: { language: "en" | "fr" | "ar"; currency: string; timezone: string; seedDemo: boolean };
  }) {
    const s = load();
    s.settings = {
      ...s.settings,
      schoolName: input.org.schoolName,
      schoolPhone: input.org.schoolPhone,
      taxId: input.org.taxId,
      address: input.org.address,
      language: input.region.language,
      currency: input.region.currency,
      timezone: input.region.timezone,
    };
    s.users = [{
      id: uid(),
      username: input.admin.username,
      name: input.admin.name,
      role: "admin",
      password: input.admin.password,
      status: "active",
      createdAt: new Date().toISOString(),
    }];
    if (input.region.seedDemo) {
      const d = demoData();
      s.teachers = d.teachers; s.rooms = d.rooms; s.groups = d.groups; s.students = d.students;
    }
    s.setupComplete = true;
    save();
  },

  login(username: string, password: string): User | null {
    const s = load();
    const u = s.users.find((x) => x.username.toLowerCase() === username.toLowerCase() && x.password === password && x.status === "active");
    if (!u) return null;
    u.lastLogin = new Date().toISOString();
    s.session = { userId: u.id };
    save();
    return u;
  },
  logout() { const s = load(); s.session = null; save(); },
  currentUser(): User | null {
    const s = load();
    if (!s.session) return null;
    return s.users.find((u) => u.id === s.session!.userId) ?? null;
  },

  setLicense(rec: LicenseRecord) { const s = load(); s.license = rec; save(); },
  clearLicense() { const s = load(); s.license = null; save(); },
  license(): LicenseRecord | null { return load().license; },

  // Students
  computeStudentFee(groupIds: ID[]): number {
    const s = load();
    return groupIds.reduce((sum, gid) => sum + (s.groups.find((g) => g.id === gid)?.monthlyFee ?? 0), 0);
  },
  addStudent(p: Omit<Student, "id" | "monthlyFee" | "paymentStatus"> & { monthlyFee?: number }) {
    const s = load();
    const monthlyFee = p.monthlyFee ?? this.computeStudentFee(p.groupIds);
    const student: Student = {
      ...p, id: uid(), monthlyFee, paymentStatus: "pending",
    };
    refreshPaymentStatus(student);
    s.students.push(student);
    save();
    return student;
  },
  updateStudent(id: ID, patch: Partial<Student>) {
    const s = load();
    const i = s.students.findIndex(x => x.id === id);
    if (i < 0) return;
    s.students[i] = { ...s.students[i], ...patch };
    if (patch.groupIds && !patch.monthlyFee) {
      s.students[i].monthlyFee = this.computeStudentFee(patch.groupIds);
    }
    refreshPaymentStatus(s.students[i]);
    save();
  },
  deleteStudent(id: ID) { const s = load(); s.students = s.students.filter(x => x.id !== id); save(); },

  // Payments
  recordPayment(studentId: ID, months: number, method: Payment["method"] = "cash", note?: string): Payment | null {
    const s = load();
    const st = s.students.find((x) => x.id === studentId);
    if (!st) return null;
    const today = new Date();
    const startBase = st.subscriptionEnd && st.subscriptionEnd > today.toISOString().slice(0, 10) ? st.subscriptionEnd : today.toISOString().slice(0, 10);
    const coversFrom = startBase;
    const coversTo = addMonths(coversFrom, months);
    s.receiptCounter += 1;
    const p: Payment = {
      id: uid(),
      studentId,
      amount: st.monthlyFee * months,
      paidAt: new Date().toISOString(),
      method,
      monthsCovered: months,
      coversFrom, coversTo,
      receiptNo: `RCP-${s.receiptCounter}`,
      note,
    };
    s.payments.push(p);
    st.subscriptionStart = st.subscriptionStart || coversFrom;
    st.subscriptionEnd = coversTo;
    refreshPaymentStatus(st);
    save();
    return p;
  },

  // Teachers
  addTeacher(p: Omit<Teacher, "id">) { const s = load(); s.teachers.push({ ...p, id: uid() }); save(); },
  updateTeacher(id: ID, patch: Partial<Teacher>) { const s = load(); const i = s.teachers.findIndex(x => x.id === id); if (i >= 0) { s.teachers[i] = { ...s.teachers[i], ...patch }; save(); } },
  deleteTeacher(id: ID) { const s = load(); s.teachers = s.teachers.filter(x => x.id !== id); save(); },

  // Groups
  addGroup(p: Omit<Group, "id">) { const s = load(); s.groups.push({ ...p, id: uid() }); save(); },
  updateGroup(id: ID, patch: Partial<Group>) { const s = load(); const i = s.groups.findIndex(x => x.id === id); if (i >= 0) { s.groups[i] = { ...s.groups[i], ...patch }; save(); } },
  deleteGroup(id: ID) { const s = load(); s.groups = s.groups.filter(x => x.id !== id); save(); },

  // Rooms
  addRoom(p: Omit<Room, "id">) { const s = load(); s.rooms.push({ ...p, id: uid() }); save(); },
  updateRoom(id: ID, patch: Partial<Room>) { const s = load(); const i = s.rooms.findIndex(x => x.id === id); if (i >= 0) { s.rooms[i] = { ...s.rooms[i], ...patch }; save(); } },
  deleteRoom(id: ID) { const s = load(); s.rooms = s.rooms.filter(x => x.id !== id); save(); },

  // Users
  addUser(p: Omit<User, "id" | "createdAt">) { const s = load(); s.users.push({ ...p, id: uid(), createdAt: new Date().toISOString() }); save(); },
  updateUser(id: ID, patch: Partial<User>) { const s = load(); const i = s.users.findIndex(x => x.id === id); if (i >= 0) { s.users[i] = { ...s.users[i], ...patch }; save(); } },
  deleteUser(id: ID) { const s = load(); s.users = s.users.filter(x => x.id !== id); save(); },

  // Attendance
  setAttendance(groupId: ID, studentId: ID, date: string, state: AttendanceEntry["state"]) {
    const s = load();
    const i = s.attendance.findIndex(a => a.groupId === groupId && a.studentId === studentId && a.date === date);
    if (i >= 0) s.attendance[i].state = state;
    else s.attendance.push({ id: uid(), groupId, studentId, date, state });
    save();
  },
  bulkAttendance(groupId: ID, date: string, studentIds: ID[], state: AttendanceEntry["state"]) {
    for (const sid of studentIds) this.setAttendance(groupId, sid, date, state);
  },

  updateSettings(patch: Partial<Settings>) { const s = load(); s.settings = { ...s.settings, ...patch }; save(); },

  // Analytics
  revenueThisMonth(): number {
    const s = load();
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return s.payments.filter((p) => p.paidAt.startsWith(ym)).reduce((a, p) => a + p.amount, 0);
  },
  expectedMonthlyRevenue(): number {
    const s = load();
    return s.students.filter((st) => st.status === "active").reduce((a, st) => a + st.monthlyFee, 0);
  },
  attendanceRate(days = 30): number {
    const s = load();
    const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
    const recent = s.attendance.filter((a) => a.date >= cutoff);
    if (recent.length === 0) return 0;
    const present = recent.filter((a) => a.state === "present").length;
    return Math.round((present / recent.length) * 100);
  },
  revenueByMonth(monthsBack = 6): { m: string; Revenue: number; Expenses: number }[] {
    const s = load();
    const out: { m: string; Revenue: number; Expenses: number }[] = [];
    const now = new Date();
    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const rev = s.payments.filter((p) => p.paidAt.startsWith(ym)).reduce((a, p) => a + p.amount, 0);
      const exp = s.expenses.filter((e) => e.at.startsWith(ym)).reduce((a, e) => a + e.amount, 0);
      out.push({ m: d.toLocaleString("en-US", { month: "short" }), Revenue: rev, Expenses: exp });
    }
    return out;
  },
};

export function initials(first: string, last: string) {
  return (first[0] ?? "").toUpperCase() + (last[0] ?? "").toUpperCase();
}
export function fmtMoney(n: number, currency = "DA") {
  return `${n.toLocaleString("en-US")} ${currency}`;
}
export function fmtDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
export function fmtDateTime(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
export const DAY_LABELS: Record<string, string> = {
  sat: "Saturday", sun: "Sunday", mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday",
};
