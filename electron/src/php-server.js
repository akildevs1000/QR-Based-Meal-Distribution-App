// Generic supervisor for a PHP child process — used for both the HTTP server
// and the queue worker. Restarts on crash, transforms output for friendly logs.
const { spawn } = require('node:child_process')
const { EventEmitter } = require('node:events')
const { transformLogLine, formatTs } = require('./log-transformer')

const MAX_LOG_LINES = 500
const RESTART_DELAY_MS = 2000

class PhpServer extends EventEmitter {
  constructor({ phpExe, backendDir, args, tag = 'server', port, host = '0.0.0.0' }) {
    super()
    this.phpExe = phpExe
    this.backendDir = backendDir
    // If port/host given, build artisan-serve args; otherwise use explicit args.
    this.args = args || ['artisan', 'serve', `--host=${host}`, `--port=${port}`]
    this.tag = tag
    this.port = port
    this.host = host
    this.child = null
    this.logs = []
    this.stopping = false
    this.restartTimer = null
    // Per-instance state the log transformer can use to thread context across
    // adjacent lines (e.g. matching scheduler "Running …" → "DONE").
    this._logCtx = { tag: this.tag, state: {} }
  }

  start() {
    if (this.child || this.restartTimer) return
    this.stopping = false
    this._spawn()
  }

  _spawn() {
    this.restartTimer = null
    this.appendLog('[supervisor] spawning')
    const child = spawn(this.phpExe, this.args, {
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

  // Setup-flow messages that should pass through unchanged (already friendly).
  pushSystemMessage(text) {
    const friendly = formatTs(text)
    this.logs.push(friendly)
    if (this.logs.length > MAX_LOG_LINES) this.logs.shift()
    this.emit('log', friendly)
  }

  appendLog(line) {
    const raw = line.toString().replace(/\r/g, '')
    for (const part of raw.split('\n')) {
      const friendly = transformLogLine(part, this._logCtx)
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
