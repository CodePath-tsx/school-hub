# SchoolDigital ERP — Desktop App Plan

A private-school ERP desktop application matching the design in the uploaded screenshots, packaged as an Electron app with a local `better-sqlite3` database and an offline Ed25519 license system tied to one machine.

Entirely in English. Dark green + cream theme from screenshots.

## Scope (what will be built)

**Auth & Licensing**

- Login screen (`Welcome Back`, username/password, remember-me) — matches IMG_7469.
- Local admin auth using bcrypt hashes in SQLite. Default: `admin` / `admin`.
- Licence page (IMG_7468): shows Hardware Blueprint (HWID), activation input `XXXX-XXXX-XXXX-XXXX` style, Support & Contact panel, and gates the app until activated.
- Ed25519 license verification exactly matching the provided `license-generator.mjs`:
  - Format `MB1.<payloadB64url>.<sigB64url>`.
  - `VENDOR_PUBLIC_KEY_B64URL` embedded in `src/core/license.ts`.
  - Validates signature, machineId (or wildcard `""`), expiry, and features.
  - Stores the license and issued-at fingerprint in SQLite; app won't run if HWID no longer matches.
- HWID = SHA-256 of `os.hostname + primary MAC + cpu model + platform` (stable per machine).

**Pages (mirroring screenshots exactly)**

1. **Dashboard** (IMG_7460): 4 stat cards (Total Students, Active Teachers, Monthly Revenue DA, Attendance Rate), Revenue Overview bar chart (6 months, Revenue vs Expenses), Quick Actions grid (Add Student, Add Teacher, Attendance, New Group, View Stats, Settings), Recent Registrations table.
2. **Students** (IMG_7461): table with avatar initials, name+phone, parent, group chip, monthly fee (DA), enrolled date, payment status (Paid/Pending/Overdue), status (Active/Inactive), row actions (view/edit/delete), search + filters (All Groups, All Status), table/grid toggle, "+ Add Student".
3. **Teachers** (IMG_7462): teacher rows with subject, phone, groups count, salary mode (Session/Percentage) with rate, estimated monthly, status, actions.
4. **Groups** (IMG_7463): group, subject, teacher, room, students progress bar, monthly fee, revenue, status, filters (Subject/Status/Year).
5. **Classrooms** (IMG_7466): room, type (Classroom/Lab/Hall), capacity seats, groups, occupancy progress %, status (In Use/Available/Maintenance).
6. **Attendance** (IMG_7465): group + date picker, Present/Absent/Late/Remaining counters, "All Present"/"All Absent" bulk actions, per-student row with Present/Late/Absent buttons, right-panel tabs (Students/Groups/Absences/Monthly) with live per-student attendance rate.
7. **Statistics**: revenue trends, attendance trends, top groups/teachers, expenses.
8. **Users & Roles** (IMG_7467): user list with role (Admin/Secretary), status, created, last login; role permissions matrix (Admin = full, Secretary = configurable per capability module).
9. **Settings**: school name, currency (DA), academic year, backup/restore SQLite DB.
10. **Licence** (IMG_7468): activation + support & contact.

**Sidebar** (all pages): SchoolByte ERP logo, sections MAIN / ACADEMIC / MANAGEMENT / SYSTEM, current-user footer with power (logout) button. Exactly matches screenshots (dark green `#0f3d2e`-ish sidebar, active item highlighted).

## Technical details

**Stack**

**حلل مشروع GitHub الذي أرسلته لك و أخذ مبداء البيانات وإعداد التطبيق و الترخيص و الأدوار و الأشياء الباقية ضروري**

- Electron main + preload (contextIsolation) + React renderer via existing TanStack Start dev preview.
- For desktop packaging: `electron/main.cjs` loading `dist/index.html` (SPA build). Vite `base: './'`.
- `better-sqlite3` in the main process; renderer talks to it via IPC (`window.api.*`) exposed by preload.
- Ed25519 verification runs in main process using Node `crypto`.
- Charts: `recharts`.
- UI: existing shadcn + Tailwind v4 tokens tuned to the screenshot palette.

**Database schema (SQLite)**

```
users(id, username UNIQUE, name, role, password_hash, status, created_at, last_login)
students(id, first_name, last_name, phone, parent_name, group_id, monthly_fee, enrolled_at, payment_status, status)
teachers(id, first_name, last_name, phone, subject, salary_mode, salary_rate, status)
groups(id, name, subject, year, teacher_id, room_id, monthly_fee, status)
rooms(id, name, floor, type, capacity, status)
group_students(group_id, student_id)
attendance(id, group_id, student_id, date, state)  -- present|late|absent
payments(id, student_id, month, amount, paid_at)
expenses(id, label, amount, category, at)
settings(key, value)
license(id, key, payload_json, machine_id, activated_at)
role_permissions(role, module, allowed)
```

All tables seeded with demo data matching the screenshots (Youcef Benali, Amira Hadj, Mourad Djebbar, Room 101, Math G1, etc.) so the UI renders identically on first launch.

**License system**

- `scripts/license-generator.mjs` shipped exactly as provided.
- `src/core/license.ts` (renderer-safe types) + `electron/license.cjs` (verifier using embedded public key).
- On launch: if no valid license row → route to `/activate`. Machine ID displayed for copy. Admin pastes `MB1...` key → main verifies signature + machineId match + not expired → persists to `license` table.
- On every launch: re-verify signature and HWID; if HWID drifted, block with "License bound to another machine".

**Packaging**

- Dev: `bun run dev` runs Vite preview (browser). Electron entry runs against the built `dist/`.
- Prod: `@electron/packager` builds `SchoolByte-linux-x64` (+ optional darwin/win32 zip). Archives to `/mnt/documents/`.

**Design tokens (src/styles.css)**

- Primary green `oklch(0.32 0.06 155)` (dark forest), primary-foreground cream.
- Background `oklch(0.985 0.005 90)` cream, sidebar `oklch(0.28 0.05 155)`.
- Status colors: success green, warning amber, danger red, info blue — matches badges in screenshots.
- Font: Inter for body, tight tracking uppercase labels (`Manage system identity...`) for section subtitles.

## Deliverables

- Working Electron desktop app packaged as `.tar.gz` in `/mnt/documents/` after build.
- Full source in the project with all pages listed above, seeded DB, and license flow.
- `scripts/license-generator.mjs` for the vendor (you) to issue keys offline.
- README explaining: run `node scripts/license-generator.mjs keygen`, paste public key, then issue keys with `--machine <HWID>`.

## Not included (unless you ask)

- Cloud sync / multi-device.
- Windows/macOS installers (`.exe`, `.dmg`) — sandbox can't produce those; `.zip` cross-builds only.
- Auto-updates.
- Printing/PDF report generation beyond the existing browser Print button on Attendance.

## Confirmations needed before I start

1. Currency stays **DA (Algerian Dinar)** as in the screenshots?
2. Default admin credentials `admin` / `admin` OK for first launch (forced change on first login)?
3. OK to ship demo data matching the screenshots on first run, cleared once real data is entered?