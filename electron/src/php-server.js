// Supervises the PHP child process that serves the Laravel app.
// Spawns `php artisan serve --host=0.0.0.0 --port=N` and restarts on crash.
const { spawn } = require('node:child_process')
const { EventEmitter } = require('node:events')
const path = require('node:path')

const MAX_LOG_LINES = 500
const RESTART_DELAY_MS = 2000

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
    if (this.child) return
    this.stopping = false
    this._spawn()
  }

  _spawn() {
    const args = ['artisan', 'serve', `--host=${this.host}`, `--port=${this.port}`]
    this.appendLog(`[supervisor] spawning ${this.phpExe} ${args.join(' ')} (cwd=${this.backendDir})`)
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
        this.appendLog(`[supervisor] restarting in ${RESTART_DELAY_MS}ms…`)
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
      // Best-effort graceful kill on Windows.
      try { child.kill() } catch {}
      // Hard kill after 3s if still alive.
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

  appendLog(line) {
    const entry = line.toString().replace(/\r/g, '')
    for (const part of entry.split('\n')) {
      if (part.length === 0) continue
      this.logs.push(part)
      if (this.logs.length > MAX_LOG_LINES) this.logs.shift()
      this.emit('log', part)
    }
  }

  getLogs() {
    return this.logs.slice()
  }

  isRunning() {
    return this.child !== null
  }
}

module.exports = { PhpServer }
