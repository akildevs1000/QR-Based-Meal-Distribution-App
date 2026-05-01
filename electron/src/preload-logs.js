const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('logsApi', {
  initial: () => ipcRenderer.invoke('logs:initial'),
  status: () => ipcRenderer.invoke('server:status'),
  start: () => ipcRenderer.invoke('server:start'),
  stop: () => ipcRenderer.invoke('server:stop'),
  restart: () => ipcRenderer.invoke('server:restart'),
  openAdmin: () => ipcRenderer.invoke('server:open-admin'),
  openSetup: () => ipcRenderer.invoke('server:open-setup'),
  availableLogDates: () => ipcRenderer.invoke('server:available-log-dates'),
  downloadLogs: (range) => ipcRenderer.invoke('server:download-logs', range),
  version: () => ipcRenderer.invoke('app:version'),
  onLine: (cb) => ipcRenderer.on('log:line', (_e, line) => cb(line)),
})
