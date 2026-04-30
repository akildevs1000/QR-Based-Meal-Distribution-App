const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('logsApi', {
  initial: () => ipcRenderer.invoke('logs:initial'),
  status: () => ipcRenderer.invoke('server:status'),
  restart: () => ipcRenderer.invoke('server:restart'),
  openAdmin: () => ipcRenderer.invoke('server:open-admin'),
  onLine: (cb) => ipcRenderer.on('log:line', (_e, line) => cb(line)),
})
