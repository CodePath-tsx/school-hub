# SchoolByte ERP

Complete management for your educational institution — private-school ERP
desktop app with local SQLite storage and an offline Ed25519 licence system
bound to a single machine.

## Preview

Runs directly in the browser preview against an in-memory store persisted to
`localStorage`. Default admin credentials: **`admin` / `admin`**.

Activation key for testing (wildcard, any machine, lifetime):

```
MB1.eyJjdXN0b21lciI6IkRlbW8gQWRtaW4iLCJjb21wYW55IjoiU2Nob29sQnl0ZSBEZW1vIiwibWFjaGluZUlkIjoiIiwidHlwZSI6ImxpZmV0aW1lIiwiaXNzdWVkQXQiOiIyMDI2LTA3LTI4VDAwOjQyOjEyLjU4OFoiLCJmZWF0dXJlcyI6WyJkYXNoYm9hcmQiLCJzdHVkZW50cyIsInRlYWNoZXJzIiwiZ3JvdXBzIiwiY2xhc3Nyb29tcyIsImF0dGVuZGFuY2UiLCJzdGF0aXN0aWNzIiwidXNlcnMiLCJzZXR0aW5ncyJdLCJub25jZSI6IjNtdjFSVW5PRFlvIn0.s7rTGF4jO7WkiTHdffokTVbYRVUlnNy_Li0yksVOA0O4k9XliaztmXhKgcnl2CfLU7HRc7fdFJlbbnISX3YSDw
```

Paste it on the **Licence** page after signing in.

## Licence system

Ed25519 signed keys, offline, format `MB1.<payloadB64url>.<sigB64url>`.

1. Generate your own vendor keypair (do this once, on a machine you control):
   ```bash
   node scripts/license-generator.mjs keygen
   ```
   Copy the printed base64url public key into `VENDOR_PUBLIC_KEY_B64URL` at
   the top of `src/lib/license.ts` and rebuild.

2. Issue a key for a specific customer machine:
   ```bash
   node scripts/license-generator.mjs issue \
     --machine 1A3C72956371D459 \
     --customer "Ahmed Ali" \
     --company  "ACME School" \
     --type     subscription \
     --days     365 \
     --features dashboard,students,teachers,groups,classrooms,attendance,statistics,users,settings
   ```

The customer opens the **Licence** page, copies their Hardware Blueprint
(HWID), and pastes the key back to activate. The signature is verified with
the embedded public key; you never share your private key.

## Desktop packaging (Electron)

Files under `electron/` package the SPA as a desktop app:

```bash
# 1) Install desktop deps once
bun add -d electron @electron/packager

# 2) Build the SPA and package
bunx vite build
bunx @electron/packager . "SchoolByte" \
  --platform=linux --arch=x64 \
  --out=electron-release --overwrite \
  --ignore='node_modules' --ignore='^/src' --ignore='^/public' --ignore='^/electron-release'

# 3) Archive
tar czf SchoolByte-linux-x64.tar.gz -C electron-release SchoolByte-linux-x64/
```

Cross-compile for macOS/Windows with `--platform=darwin` or
`--platform=win32` and archive as `.zip`.

For a real SQLite database in the packaged desktop build, install
`better-sqlite3` and wire it up in `electron/main.cjs` behind IPC handlers
exposed via `preload.cjs`; the React store layer in `src/lib/store.ts`
already isolates data access so you can swap the localStorage backend for
IPC calls without touching UI components.

## Users & roles

- **Admin** — full access (non-modifiable).
- **Secretary** — module access is toggleable on the **Users & Roles** page.

Roles live in the local database (`user_roles` semantics), never on the
user profile.
