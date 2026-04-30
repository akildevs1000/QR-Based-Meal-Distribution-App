const { app, BrowserWindow, ipcMain, shell } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const os = require('node:os')

const { resolvePaths } = require('./paths')
const { PhpServer } = require('./php-server')
const { isConfigured, runFirstRunSetup } = require('./setup')

const SERVER_PORT = 8000
const APP_NAME = 'QR Meal Server'

let paths = null
let phpServer = null
let setupWindow = null
let logsWindow = null
let adminWindow = null
let isQuitting = false

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const w = logsWindow || setupWindow
    if (w) { w.show(); w.focus() }
  })
  bootstrap()
}

function bootstrap() {
  app.whenReady().then(async () => {
    if (process.platform === 'win32') app.setAppUserModelId('com.akilgroup.qrmealserver')

    paths = resolvePaths()

    phpServer = new PhpServer({
      phpExe: paths.phpExe,
      backendDir: paths.backendDir,
      port: SERVER_PORT,
      host: '0.0.0.0',
    })

    if (!isConfigured(paths.backendDir)) {
      openSetupWindow()
    } else {
      phpServer.start()
      openLogsWindow()
    }
  })

  app.on('window-all-closed', () => {
    app.quit()
  })

  app.on('before-quit', async (event) => {
    if (isQuitting) return
    event.preventDefault()
    isQuitting = true
    if (phpServer) await phpServer.stop()
    app.exit(0)
  })
}

function getLanIps() {
  const ifaces = os.networkInterfaces()
  const out = []
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) out.push(iface.address)
    }
  }
  return out
}

// ---------- Setup window ----------
function openSetupWindow() {
  if (setupWindow) { setupWindow.show(); setupWindow.focus(); return }
  setupWindow = new BrowserWindow({
    width: 520,
    height: 640,
    title: `${APP_NAME} — Setup`,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload-setup.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  setupWindow.setMenu(null)
  setupWindow.loadFile(path.join(__dirname, 'setup.html'))
  setupWindow.on('closed', () => { setupWindow = null })
}

ipcMain.handle('setup:test-connection', async (_e, values) => {
  const { spawn } = require('node:child_process')
  const code = `try { new PDO('pgsql:host=${escapePhp(values.db_host)};port=${escapePhp(values.db_port)};dbname=${escapePhp(values.db_database)}', '${escapePhp(values.db_username)}', '${escapePhp(values.db_password)}'); echo 'OK'; } catch (Throwable $e) { fwrite(STDERR, $e->getMessage()); exit(1); }`
  return new Promise(resolve => {
    const proc = spawn(paths.phpExe, ['-r', code], { windowsHide: true })
    let err = ''
    proc.stderr.on('data', d => { err += d.toString() })
    proc.on('exit', code => {
      if (code === 0) resolve({ ok: true })
      else resolve({ ok: false, error: err.trim() || `exit ${code}` })
    })
    proc.on('error', e => resolve({ ok: false, error: e.message }))
  })
})

ipcMain.handle('setup:save', async (_e, values) => {
  try {
    await runFirstRunSetup({
      phpExe: paths.phpExe,
      backendDir: paths.backendDir,
      values,
      onLog: line => phpServer?.appendLog(line),
    })
    if (setupWindow) setupWindow.close()
    phpServer.start()
    openLogsWindow()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e.message }
  }
})

function escapePhp(v) {
  return String(v ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

// ---------- Logs window (also serves as the main app window) ----------
function openLogsWindow() {
  if (logsWindow) { logsWindow.show(); logsWindow.focus(); return }
  logsWindow = new BrowserWindow({
    width: 900,
    height: 600,
    title: APP_NAME,
    webPreferences: {
      preload: path.join(__dirname, 'preload-logs.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  logsWindow.setMenu(null)
  logsWindow.loadFile(path.join(__dirname, 'logs.html'))
  logsWindow.on('closed', () => { logsWindow = null })

  const onLog = line => logsWindow?.webContents.send('log:line', line)
  phpServer?.on('log', onLog)
  logsWindow.on('closed', () => phpServer?.off('log', onLog))
}

ipcMain.handle('logs:initial', () => phpServer?.getLogs() ?? [])
ipcMain.handle('server:status', () => ({
  running: phpServer?.isRunning() ?? false,
  port: SERVER_PORT,
  ips: getLanIps(),
}))
ipcMain.handle('server:restart', async () => { await phpServer?.restart() })
ipcMain.handle('server:open-admin', () => openAdminWindow())

// ---------- Admin window (loads admin/dist via file://) ----------
function openAdminWindow() {
  if (adminWindow) { adminWindow.show(); adminWindow.focus(); return }
  const indexPath = path.join(paths.adminDistDir, 'index.html')
  if (!fs.existsSync(indexPath)) {
    phpServer?.appendLog(`[admin] build not found at ${indexPath} — run \`npm run build\` in admin/`)
    return
  }
  adminWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: `${APP_NAME} — Admin`,
    webPreferences: {
      // file:// origin can't reach http://localhost:8000 with default CORS; admin
      // is trusted local code so disabling webSecurity is acceptable here.
      webSecurity: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  adminWindow.setMenu(null)
  adminWindow.loadFile(indexPath)
  // Open DevTools in dev so blank-screen problems are easy to diagnose.
  if (paths.isDev) adminWindow.webContents.openDevTools({ mode: 'detach' })
  adminWindow.on('closed', () => { adminWindow = null })
}
