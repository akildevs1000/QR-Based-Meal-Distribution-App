// Background server supervisor — spawns the local server process, restarts on crash,
// and pipes its output through a friendly-text transformer so users never see
// raw stack traces or framework/tooling names.
const { spawn } = require('node:child_process')
const { EventEmitter } = require('node:events')

const MAX_LOG_LINES = 500
const RESTART_DELAY_MS = 2000

// Translate raw stdout/stderr lines into user-friendly messages.
// Returns null to drop the line entirely.
function transformLogLine(raw) {
  const line = raw.trim()
  if (!line) return null

  // Lines emitted by our own supervisor — translate prefix.
  if (line.startsWith('[supervisor]')) {
    if (line.includes('spawning')) return formatTs('Starting server…')
    if (line.includes('php exited')) return formatTs('Server stopped.')
    if (line.includes('restarting')) return formatTs('Restarting server…')
    if (line.includes('spawn error')) return formatTs('Could not start the server.')
    return formatTs(line.replace(/^\[supervisor\]\s*/, ''))
  }
  // Setup-time messages from the first-run flow.
  if (line.startsWith('[setup]')) {
    return formatTs(line.replace(/^\[setup\]\s*/, '• '))
  }

  // Useful info lines from the running server — keep but rephrase.
  const ready = line.match(/Server running on \[(http:\/\/[^\]]+)\]/i)
  if (ready) return formatTs(`Ready — ${ready[1]}`)

  // Drop noisy lines that mention nothing actionable.
  if (/Press Ctrl\+C to stop the server/i.test(line)) return null
  if (/Development Server \(.*\) started/i.test(line)) return null

  // Hide raw stack traces — keep first line of an exception, drop the rest.
  if (/^#\d+\s/.test(line)) return null
  if (/^Stack trace:/i.test(line)) return null

  // Strip any framework/file path that leaks tech names (php, laravel, artisan, vendor/).
  // We replace those spans with a neutral marker so the rest of the message stays usable.
  let clean = line
    .replace(/\b(php|php\.exe|artisan(?:\s+\w+)*|laravel(?:[-/]\w+)*|composer(?:\.\w+)*|opcache)\b/gi, '')
    .replace(/[A-Za-z]:\\[^\s'"]+\\(?:vendor|public|app|bootstrap|storage|routes)\b[^\s'"]*/gi, '')
    .replace(/\/(?:vendor|public|app|bootstrap|storage|routes)\/[^\s'"]+/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()

  if (!clean || clean.length < 2) return null
  return formatTs(clean)
}

function formatTs(text) {
  const d = new Date()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `[${hh}:${mm}:${ss}] ${text}`
}

class PhpServer extends EventEmitter {
  constructor({ phpExe, backendDir, port = 8000, host = '0.0.0.0' }) {
    super()
    this.phpExe = phpExe
    this.backendDir = backendDir
    this.port = port
    this.host = host
    this.child = null
    this.logs = []
    this.stopping = false
    this.restartTimer = null
  }

  start() {
    if (this.child || this.restartTimer) return
    this.stopping = false
    this._spawn()
  }

  _spawn() {
    this.restartTimer = null
    this.appendLog('[supervisor] spawning')
    const args = ['artisan', 'serve', `--host=${this.host}`, `--port=${this.port}`]
    const child = spawn(this.phpExe, args, {
      cwd: this.backendDir,
      env: { ...process.env, APP_ENV: process.env.APP_ENV || 'production' },
      windowsHide: true,
    })
    this.child = child

    child.stdout.on('data', d => this.appendLog(d.toString()))
    child.stderr.on('data', d => this.appendLog(d.toString()))
    child.on('exit', (code, signal) => {
      this.appendLog(`[supervisor] php exited code=${code} signal=${signal}`)
      this.child = null
      this.emit('exit', { code, signal })
      if (!this.stopping) {
        this.appendLog('[supervisor] restarting')
        this.restartTimer = setTimeout(() => this._spawn(), RESTART_DELAY_MS)
      }
    })
    child.on('error', err => {
      this.appendLog(`[supervisor] spawn error: ${err.message}`)
      this.emit('error', err)
    })

    this.emit('started')
  }

  async stop() {
    this.stopping = true
    if (this.restartTimer) {
      clearTimeout(this.restartTimer)
      this.restartTimer = null
    }
    if (!this.child) return
    return new Promise(resolve => {
      const child = this.child
      const onExit = () => resolve()
      child.once('exit', onExit)
      try { child.kill() } catch {}
      // Hard kill after 3s if it didn't exit gracefully.
      setTimeout(() => {
        if (this.child) {
          try { this.child.kill('SIGKILL') } catch {}
        }
        resolve()
      }, 3000)
    })
  }

  async restart() {
    await this.stop()
    this.start()
  }

  // System-level message produced by Electron itself (setup steps, status notes).
  // Always shown verbatim so internal Electron flow can communicate to the user.
  pushSystemMessage(text) {
    const friendly = formatTs(text)
    this.logs.push(friendly)
    if (this.logs.length > MAX_LOG_LINES) this.logs.shift()
    this.emit('log', friendly)
  }

  appendLog(line) {
    const raw = line.toString().replace(/\r/g, '')
    for (const part of raw.split('\n')) {
      const friendly = transformLogLine(part)
      if (friendly === null) continue
      this.logs.push(friendly)
      if (this.logs.length > MAX_LOG_LINES) this.logs.shift()
      this.emit('log', friendly)
    }
  }

  getLogs() {
    return this.logs.slice()
  }

  isRunning() {
    return this.child !== null
  }

  isStarting() {
    return this.restartTimer !== null
  }
}

module.exports = { PhpServer }
