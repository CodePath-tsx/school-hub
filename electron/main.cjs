const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';
const db = require('./db.cjs');

function createWindow() {
  const iconPath = path.join(__dirname, '..', 'build', 'icons', 'icon.svg');

  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    icon: iconPath
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  db.init();
  createWindow();

  ipcMain.handle('db/getAll', (e, table) => db.getAll(table));
  ipcMain.handle('db/insert', (e, table, row) => db.insert(table, row));
  ipcMain.handle('db/update', (e, table, id, row) => db.update(table, id, row));
  ipcMain.handle('db/delete', (e, table, id) => db.delete(table, id));
  ipcMain.handle('db/query', (e, sql, params) => db.query(sql, params));
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
