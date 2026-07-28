// Preload script — currently a no-op because all data lives in the renderer
// (localStorage). If you want to swap the renderer store for a real
// better-sqlite3 database in Electron main, expose IPC handlers here via
// contextBridge and mirror the API defined in src/lib/store.ts.
const { contextBridge } = require("electron");
contextBridge.exposeInMainWorld("schoolbyte", {
  platform: process.platform,
  version: "1.0.0",
});
