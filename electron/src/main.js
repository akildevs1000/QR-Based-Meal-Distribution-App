const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const os = require('node:os')

const { resolvePaths } = require('./paths')
const { PhpServer } = require('./php-server')
const { isConfigured, runFirstRunSetup, readCurrentConfig } = require('./setup')
const { FileLogger } = require('./file-logger')

const SERVER_PORT = 8000
const APP_NAME = 'Meal Distribution App'
// 48×48 favicon for in-window use (taskbar / title bar). The 1024×1024
// build/icon.png is reserved for electron-builder to generate the installer
// + .exe ICO; using it for BrowserWindow.icon scales poorly to 16/32px.
const APP_ICON = path.join(__dirname, '..', 'build', 'favicon.png')

let paths = null
let phpServer = null
let queueWorker = null
let scheduler = null
let fileLogger = null
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
    if (process.platform === 'win32') app.setAppUserModelId('com.akilgroup.mealdistributionapp')

    paths = resolvePaths()

    // Persist supervisor logs alongside Laravel's own logs in <backend>/storage/logs/.
    // Single folder for everything; daily rotation, 7-day retention.
    fileLogger = new FileLogger({
      dir: path.join(paths.backendDir, 'storage', 'logs'),
      retentionDays: 7,
    })

    phpServer = new PhpServer({
      tag: 'server',
      phpExe: paths.phpExe,
      backendDir: paths.backendDir,
      port: SERVER_PORT,
      host: '0.0.0.0',
    })

    // Background queue worker — processes jobs from the `jobs` table
    // (database queue driver). Runs independently of the HTTP server so
    // future notifications, exports, or async work just works.
    queueWorker = new PhpServer({
      tag: 'worker',
      phpExe: paths.phpExe,
      backendDir: paths.backendDir,
      args: [
        'artisan', 'queue:work',
        '--sleep=3',
        '--tries=3',
        '--backoff=10',
        '--max-time=3600', // recycle the worker every hour to avoid memory creep
      ],
    })

    // Background scheduler — runs Laravel's task scheduler in foreground,
    // ticking every minute. Replaces the traditional `* * * * * artisan schedule:run`
    // cron entry. Define schedules in routes/console.php (or Console/Kernel.php).
    scheduler = new PhpServer({
      tag: 'cron',
      phpExe: paths.phpExe,
      backendDir: paths.backendDir,
      args: ['artisan', 'schedule:work'],
    })

    // Pipe worker + scheduler logs into the same stream the logs window reads.
    const forwardLog = line => {
      phpServer?.logs.push(line)
      if (phpServer?.logs.length > 500) phpServer.logs.shift()
      phpServer?.emit('log', line)
    }
    queueWorker.on('log', forwardLog)
    scheduler.on('log', forwardLog)

    // Mirror everything to the on-disk log file too.
    phpServer.on('log', line => fileLogger?.write(line))
    queueWorker.on('log', line => fileLogger?.write(line))
    scheduler.on('log', line => fileLogger?.write(line))

    if (!isConfigured(paths.backendDir)) {
      openSetupWindow()
    } else {
      phpServer.start()
      queueWorker.start()
      scheduler.start()
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
    await Promise.all([
      phpServer ? phpServer.stop() : Promise.resolve(),
      queueWorker ? queueWorker.stop() : Promise.resolve(),
      scheduler ? scheduler.stop() : Promise.resolve(),
    ])
    fileLogger?.close()
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
    icon: APP_ICON,
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

ipcMain.handle('setup:current-config', () => {
  if (!paths) return {}
  return readCurrentConfig(paths.backendDir)
})

ipcMain.handle('setup:test-connection', async (_e, values) => {
  const { spawn } = require('node:child_process')
  // First try to connect to the target DB. If it doesn't exist yet but the
  // credentials are valid (verified by connecting to the always-present
  // `postgres` meta DB), report a friendly "will-be-created" status so the
  // user knows it's safe to proceed.
  const tryConnect = (db) => new Promise(resolve => {
    const code = `try { new PDO('pgsql:host=${escapePhp(values.db_host)};port=${escapePhp(values.db_port)};dbname=${escapePhp(db)}', '${escapePhp(values.db_username)}', '${escapePhp(values.db_password)}'); echo 'OK'; } catch (Throwable $e) { fwrite(STDERR, $e->getMessage()); exit(1); }`
    const proc = spawn(paths.phpExe, ['-r', code], { windowsHide: true })
    let err = ''
    proc.stderr.on('data', d => { err += d.toString() })
    proc.on('exit', exit => resolve({ ok: exit === 0, error: err.trim() }))
    proc.on('error', e => resolve({ ok: false, error: e.message }))
  })

  const target = await tryConnect(values.db_database)
  if (target.ok) return { ok: true, message: 'Connected.' }

  // Distinguish "DB missing" from "auth failed" by retrying against `postgres`.
  const meta = await tryConnect('postgres')
  if (meta.ok && /database .* does not exist/i.test(target.error)) {
    return { ok: true, message: `Database "${values.db_database}" will be created on save.` }
  }
  return { ok: false, error: target.error || 'Connection failed.' }
})

ipcMain.handle('setup:save', async (_e, values) => {
  try {
    // If anything's running (reconfigure case), stop it first so the new .env
    // takes effect when we restart below.
    if (phpServer?.isRunning() || phpServer?.isStarting()) await phpServer.stop()
    if (queueWorker?.isRunning() || queueWorker?.isStarting()) await queueWorker.stop()
    if (scheduler?.isRunning() || scheduler?.isStarting()) await scheduler.stop()
    await runFirstRunSetup({
      phpExe: paths.phpExe,
      backendDir: paths.backendDir,
      values,
      onLog: line => phpServer?.appendLog(line),
    })
    if (setupWindow) setupWindow.close()
    phpServer.start()
    queueWorker.start()
    scheduler.start()
    // If admin is open, close it. Its localStorage token belongs to the OLD
    // database and a reload here would race the not-yet-ready PHP server (the
    // window would render blank). User can reopen Admin from the Logs window
    // once the server status dot turns green.
    if (adminWindow) {
      adminWindow.close()
    }
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
    icon: APP_ICON,
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
  starting: phpServer?.isStarting() ?? false,
  port: SERVER_PORT,
  ips: getLanIps(),
}))
ipcMain.handle('server:start', () => {
  phpServer?.start()
  queueWorker?.start()
  scheduler?.start()
})
ipcMain.handle('server:stop', async () => {
  await Promise.all([phpServer?.stop(), queueWorker?.stop(), scheduler?.stop()])
})
ipcMain.handle('server:restart', async () => {
  await Promise.all([phpServer?.restart(), queueWorker?.restart(), scheduler?.restart()])
})
ipcMain.handle('server:open-setup', () => openSetupWindow())
ipcMain.handle('server:open-admin', () => openAdminWindow())
// Single folder, two file-name patterns:
//   server-YYYY-MM-DD.log   — written by Electron supervisor
//   laravel-YYYY-MM-DD.log  — written by Laravel
// Returns the union of dates seen across both patterns.
function logDir() { return path.join(paths.backendDir, 'storage', 'logs') }

ipcMain.handle('server:available-log-dates', () => {
  const dir = logDir()
  if (!fs.existsSync(dir)) return []
  const dates = new Set()
  for (const n of fs.readdirSync(dir)) {
    const m = n.match(/^(?:server|laravel)-(\d{4}-\d{2}-\d{2})\.log$/)
    if (m) dates.add(m[1])
    // Pre-rotation single-file laravel.log shows up under today's date.
    else if (n === 'laravel.log') dates.add(new Date().toISOString().slice(0, 10))
  }
  return Array.from(dates).sort()
})

ipcMain.handle('server:download-logs', async (_e, { from, to } = {}) => {
  const dir = logDir()
  if (!fs.existsSync(dir)) return { ok: false, error: 'No log folder yet.' }

  const inRange = (date) => (!from || date >= from) && (!to || date <= to)
  const today = new Date().toISOString().slice(0, 10)

  // Collect both server-*.log and laravel-*.log files in the date range,
  // plus the legacy single-file laravel.log when "today" is in range.
  const sources = []
  for (const n of fs.readdirSync(dir)) {
    const m = n.match(/^(server|laravel)-(\d{4}-\d{2}-\d{2})\.log$/)
    if (m && inRange(m[2])) {
      sources.push({ kind: m[1], date: m[2], path: path.join(dir, n) })
    } else if (n === 'laravel.log' && inRange(today)) {
      sources.push({ kind: 'laravel', date: today, path: path.join(dir, n), legacy: true })
    }
  }
  if (sources.length === 0) return { ok: false, error: 'No logs in that date range.' }

  const owner = logsWindow || setupWindow || null
  const stamp = (from && to) ? (from === to ? from : `${from}_to_${to}`) : today
  const result = await dialog.showSaveDialog(owner, {
    title: 'Save Server Logs',
    defaultPath: `MealDistributionApp-logs-${stamp}.txt`,
    filters: [{ name: 'Text', extensions: ['txt', 'log'] }],
  })
  if (result.canceled || !result.filePath) return { ok: false, canceled: true }

  // Sort by date ascending, then server-before-laravel within a day so the
  // process events come before the app events that happened during that day.
  sources.sort((a, b) => a.date.localeCompare(b.date) || a.kind.localeCompare(b.kind))

  const out = fs.createWriteStream(result.filePath, { encoding: 'utf8' })
  for (const f of sources) {
    const label = f.legacy ? `${f.kind} (legacy single-file)` : `${f.kind} ${f.date}`
    out.write(`\n========== ${label} ==========\n`)
    out.write(fs.readFileSync(f.path, 'utf8'))
  }
  await new Promise(r => out.end(r))
  return { ok: true, path: result.filePath, count: sources.length }
})

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
    icon: APP_ICON,
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
