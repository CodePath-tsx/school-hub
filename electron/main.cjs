const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const os = require("os");
const crypto = require("crypto");

let store = null;
try {
  store = require("./db.cjs");
} catch (err) {
  console.error("better-sqlite3 unavailable, falling back to renderer storage:", err.message);
}

function stableMachineId() {
  const cpu = (os.cpus()[0] || {}).model || "cpu";
  const raw = `${os.hostname()}|${os.platform()}|${os.arch()}|${cpu}|${os.totalmem()}`;
  return crypto.createHash("sha256").update(raw).digest("hex").slice(0, 16).toUpperCase();
}

function registerIpc() {
  ipcMain.on("db:read", (e) => {
    try { e.returnValue = store ? store.read() : null; } catch { e.returnValue = null; }
  });
  ipcMain.on("db:write", (e, json) => {
    try { e.returnValue = store ? store.write(json) : false; } catch { e.returnValue = false; }
  });
  ipcMain.on("db:backup", (e) => {
    try { e.returnValue = store ? store.backup() : false; } catch { e.returnValue = false; }
  });
  ipcMain.on("db:path", (e) => {
    try { e.returnValue = store ? store.file() : null; } catch { e.returnValue = null; }
  });
  ipcMain.on("machine:id", (e) => { e.returnValue = stableMachineId(); });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: "SchoolByte ERP",
    icon: path.join(__dirname, "..", "build", "icon.png"),
    autoHideMenuBar: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });
  win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
}

app.whenReady().then(() => {
  if (store) {
    try { store.init(app.getPath("userData")); }
    catch (err) { console.error("SQLite init failed:", err.message); store = null; }
  }
  registerIpc();
  createWindow();
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
