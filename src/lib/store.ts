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
  id: ID; firstName: string; lastName: string; phone: string; subject: string;
  salaryMode: "session" | "percentage"; salaryRate: number; status: "active" | "inactive";
}
export interface Room {
  id: ID; name: string; floor: "ground" | "1st" | "2nd" | "3rd";
  type: "classroom" | "lab" | "hall"; capacity: number;
  status: "in-use" | "available" | "maintenance";
}
export interface Group {
  id: ID; name: string; subject: string;
  year: "1st-year-secondary" | "2nd-year-secondary" | "3rd-year-secondary";
  teacherId: ID; roomId: ID; monthlyFee: number; capacity: number; status: "active" | "inactive";
}
export interface Student {
  id: ID; firstName: string; lastName: string; phone: string; parentName: string;
  groupId: ID; monthlyFee: number; enrolledAt: string;
  paymentStatus: "paid" | "pending" | "overdue"; status: "active" | "inactive";
}
export interface AttendanceEntry {
  id: ID; groupId: ID; studentId: ID; date: string; state: "present" | "late" | "absent";
}
export interface Payment { id: ID; studentId: ID; month: string; amount: number; paidAt: string; }
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
  expenses: { id: ID; label: string; amount: number; category: string; at: string }[];
  license: LicenseRecord | null;
  session: { userId: ID } | null;
  settings: Settings;
  setupComplete: boolean;
}

const STORAGE_KEY = "schoolbyte.db.v2";
const uid = () => Math.random().toString(36).slice(2, 10);

function demoData() {
  const teachers: Teacher[] = [
    { id: "t1", firstName: "Mourad", lastName: "Djebbar", phone: "0550111222", subject: "Mathematics", salaryMode: "session", salaryRate: 800, status: "active" },
    { id: "t2", firstName: "Samira", lastName: "Khelil", phone: "0661333444", subject: "Physics", salaryMode: "percentage", salaryRate: 30, status: "active" },
    { id: "t3", firstName: "Bilal", lastName: "Amrani", phone: "0770555666", subject: "English", salaryMode: "session", salaryRate: 700, status: "active" },
    { id: "t4", firstName: "Nadia", lastName: "Bensalem", phone: "0550777888", subject: "Science", salaryMode: "percentage", salaryRate: 25, status: "active" },
    { id: "t5", firstName: "Hamza", lastName: "Ouchene", phone: "0661999000", subject: "Mathematics", salaryMode: "session", salaryRate: 800, status: "inactive" },
  ];
  const rooms: Room[] = [
    { id: "r1", name: "Room 101", floor: "ground", type: "classroom", capacity: 25, status: "in-use" },
    { id: "r2", name: "Room 102", floor: "ground", type: "classroom", capacity: 20, status: "in-use" },
    { id: "r3", name: "Room 103", floor: "1st", type: "classroom", capacity: 30, status: "in-use" },
    { id: "r4", name: "Lab A", floor: "1st", type: "lab", capacity: 18, status: "in-use" },
    { id: "r5", name: "Room 201", floor: "2nd", type: "classroom", capacity: 28, status: "available" },
    { id: "r6", name: "Hall B", floor: "ground", type: "hall", capacity: 60, status: "maintenance" },
  ];
  const groups: Group[] = [
    { id: "g1", name: "Math G1", subject: "Mathematics", year: "3rd-year-secondary", teacherId: "t1", roomId: "r1", monthlyFee: 2500, capacity: 25, status: "active" },
    { id: "g2", name: "Physics G2", subject: "Physics", year: "2nd-year-secondary", teacherId: "t2", roomId: "r2", monthlyFee: 3000, capacity: 20, status: "active" },
    { id: "g3", name: "English G1", subject: "English", year: "1st-year-secondary", teacherId: "t3", roomId: "r3", monthlyFee: 2000, capacity: 30, status: "active" },
    { id: "g4", name: "Science G3", subject: "Science", year: "3rd-year-secondary", teacherId: "t4", roomId: "r4", monthlyFee: 2800, capacity: 18, status: "active" },
    { id: "g5", name: "Math G2", subject: "Mathematics", year: "1st-year-secondary", teacherId: "t1", roomId: "r1", monthlyFee: 2500, capacity: 25, status: "inactive" },
  ];
  const students: Student[] = [
    { id: "s1", firstName: "Youcef", lastName: "Benali", phone: "0550123456", parentName: "Ahmed Benali", groupId: "g1", monthlyFee: 2500, enrolledAt: "2024-09-01", paymentStatus: "paid", status: "active" },
    { id: "s2", firstName: "Amira", lastName: "Hadj", phone: "0661234567", parentName: "Karim Hadj", groupId: "g2", monthlyFee: 3000, enrolledAt: "2024-09-01", paymentStatus: "pending", status: "active" },
    { id: "s3", firstName: "Karim", lastName: "Meziane", phone: "0770987654", parentName: "Nour Meziane", groupId: "g1", monthlyFee: 2500, enrolledAt: "2024-10-15", paymentStatus: "overdue", status: "active" },
    { id: "s4", firstName: "Sara", lastName: "Boudaoud", phone: "0550456789", parentName: "Fatima Boudaoud", groupId: "g3", monthlyFee: 2000, enrolledAt: "2025-01-10", paymentStatus: "paid", status: "active" },
    { id: "s5", firstName: "Rami", lastName: "Oulhadj", phone: "0661098765", parentName: "Samir Oulhadj", groupId: "g2", monthlyFee: 3000, enrolledAt: "2025-02-01", paymentStatus: "paid", status: "active" },
    { id: "s6", firstName: "Lina", lastName: "Ferhat", phone: "0770123456", parentName: "Omar Ferhat", groupId: "g4", monthlyFee: 2800, enrolledAt: "2025-01-20", paymentStatus: "pending", status: "inactive" },
    { id: "s7", firstName: "Nour", lastName: "Belhadj", phone: "0550222333", parentName: "Ali Belhadj", groupId: "g2", monthlyFee: 3000, enrolledAt: "2024-09-05", paymentStatus: "paid", status: "active" },
    { id: "s8", firstName: "Sami", lastName: "Kaci", phone: "0661444555", parentName: "Yacine Kaci", groupId: "g2", monthlyFee: 3000, enrolledAt: "2024-09-05", paymentStatus: "paid", status: "active" },
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
  };
}

let cache: DB | null = null;

function load(): DB {
  if (cache) return cache;
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      cache = { ...emptyDB(), ...JSON.parse(raw) };
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

export const db = {
  all(): DB { return load(); },
  reset() { cache = emptyDB(); save(); },
  wipe() {
    const s = load();
    s.students = []; s.teachers = []; s.groups = []; s.rooms = [];
    s.attendance = []; s.payments = []; s.expenses = [];
    save();
  },

  // Setup
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

  // Session / auth
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

  // License
  setLicense(rec: LicenseRecord) { const s = load(); s.license = rec; save(); },
  clearLicense() { const s = load(); s.license = null; save(); },
  license(): LicenseRecord | null { return load().license; },

  // CRUD helpers
  addStudent(p: Omit<Student, "id">) { const s = load(); s.students.push({ ...p, id: uid() }); save(); },
  updateStudent(id: ID, patch: Partial<Student>) { const s = load(); const i = s.students.findIndex(x=>x.id===id); if(i>=0){s.students[i]={...s.students[i],...patch};save();} },
  deleteStudent(id: ID) { const s = load(); s.students = s.students.filter(x=>x.id!==id); save(); },

  addTeacher(p: Omit<Teacher, "id">) { const s = load(); s.teachers.push({ ...p, id: uid() }); save(); },
  updateTeacher(id: ID, patch: Partial<Teacher>) { const s = load(); const i = s.teachers.findIndex(x=>x.id===id); if(i>=0){s.teachers[i]={...s.teachers[i],...patch};save();} },
  deleteTeacher(id: ID) { const s = load(); s.teachers = s.teachers.filter(x=>x.id!==id); save(); },

  addGroup(p: Omit<Group, "id">) { const s = load(); s.groups.push({ ...p, id: uid() }); save(); },
  updateGroup(id: ID, patch: Partial<Group>) { const s = load(); const i = s.groups.findIndex(x=>x.id===id); if(i>=0){s.groups[i]={...s.groups[i],...patch};save();} },
  deleteGroup(id: ID) { const s = load(); s.groups = s.groups.filter(x=>x.id!==id); save(); },

  addRoom(p: Omit<Room, "id">) { const s = load(); s.rooms.push({ ...p, id: uid() }); save(); },
  updateRoom(id: ID, patch: Partial<Room>) { const s = load(); const i = s.rooms.findIndex(x=>x.id===id); if(i>=0){s.rooms[i]={...s.rooms[i],...patch};save();} },
  deleteRoom(id: ID) { const s = load(); s.rooms = s.rooms.filter(x=>x.id!==id); save(); },

  addUser(p: Omit<User, "id" | "createdAt">) { const s = load(); s.users.push({ ...p, id: uid(), createdAt: new Date().toISOString() }); save(); },
  updateUser(id: ID, patch: Partial<User>) { const s = load(); const i = s.users.findIndex(x=>x.id===id); if(i>=0){s.users[i]={...s.users[i],...patch};save();} },
  deleteUser(id: ID) { const s = load(); s.users = s.users.filter(x=>x.id!==id); save(); },

  setAttendance(groupId: ID, studentId: ID, date: string, state: AttendanceEntry["state"]) {
    const s = load();
    const i = s.attendance.findIndex(a => a.groupId===groupId && a.studentId===studentId && a.date===date);
    if (i>=0) s.attendance[i].state = state;
    else s.attendance.push({ id: uid(), groupId, studentId, date, state });
    save();
  },
  bulkAttendance(groupId: ID, date: string, studentIds: ID[], state: AttendanceEntry["state"]) {
    for (const sid of studentIds) this.setAttendance(groupId, sid, date, state);
  },

  updateSettings(patch: Partial<Settings>) { const s = load(); s.settings = { ...s.settings, ...patch }; save(); },
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
