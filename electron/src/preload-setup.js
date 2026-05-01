const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('setupApi', {
  current: () => ipcRenderer.invoke('setup:current-config'),
  testConnection: (values) => ipcRenderer.invoke('setup:test-connection', values),
  save: (values) => ipcRenderer.invoke('setup:save', values),
})
