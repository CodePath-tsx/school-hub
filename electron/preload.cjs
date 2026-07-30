// Bridge between the renderer store (src/lib/store.ts) and the better-sqlite3
// database that lives in the Electron main process.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("schoolbyte", {
  platform: process.platform,
  version: "1.0.0",
  // Synchronous so the renderer store can hydrate during its first read.
  dbRead: () => ipcRenderer.sendSync("db:read"),
  dbWrite: (json) => ipcRenderer.sendSync("db:write", json),
  dbBackup: () => ipcRenderer.sendSync("db:backup"),
  dbPath: () => ipcRenderer.sendSync("db:path"),
  machineId: () => ipcRenderer.sendSync("machine:id"),
});
