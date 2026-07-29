const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  db: {
    getAll: (table) => ipcRenderer.invoke('db/getAll', table),
    insert: (table, row) => ipcRenderer.invoke('db/insert', table, row),
    update: (table, id, row) => ipcRenderer.invoke('db/update', table, id, row),
    delete: (table, id) => ipcRenderer.invoke('db/delete', table, id),
    query: (sql, params) => ipcRenderer.invoke('db/query', sql, params)
  }
});
