const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('setupApi', {
  testConnection: (values) => ipcRenderer.invoke('setup:test-connection', values),
  save: (values) => ipcRenderer.invoke('setup:save', values),
})
