// Persists supervisor log lines to disk with daily rotation + N-day retention.
// One file per UTC-local day in `<dir>/server-YYYY-MM-DD.log` — written into
// the same folder Laravel uses for `laravel-YYYY-MM-DD.log` so there's a single
// place to look for everything. Older files are pruned automatically on each
// rotation tick so disk usage stays bounded.
const fs = require('node:fs')
const path = require('node:path')

const DEFAULT_RETENTION_DAYS = 7

function dayKey(d = new Date()) {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

class FileLogger {
  constructor({ dir, retentionDays = DEFAULT_RETENTION_DAYS } = {}) {
    this.dir = dir
    this.retentionDays = retentionDays
    this.currentDay = null
    this.stream = null
    fs.mkdirSync(dir, { recursive: true })
    this._openTodayStream()
    // Check rotation every 60s — cheap, and handles the day boundary without
    // waiting for the next log line.
    this._rotateTimer = setInterval(() => this._maybeRotate(), 60_000)
  }

  _openTodayStream() {
    const day = dayKey()
    if (this.currentDay === day && this.stream) return
    if (this.stream) try { this.stream.end() } catch {}
    this.currentDay = day
    const filePath = path.join(this.dir, `server-${day}.log`)
    this.stream = fs.createWriteStream(filePath, { flags: 'a', encoding: 'utf8' })
    this.stream.on('error', () => { /* swallow — disk full / permission etc. */ })
    this._prune()
  }

  _maybeRotate() {
    if (this.currentDay !== dayKey()) this._openTodayStream()
  }

  _prune() {
    try {
      const cutoff = Date.now() - this.retentionDays * 24 * 60 * 60 * 1000
      for (const name of fs.readdirSync(this.dir)) {
        if (!/^server-\d{4}-\d{2}-\d{2}\.log$/.test(name)) continue
        const full = path.join(this.dir, name)
        const stat = fs.statSync(full)
        if (stat.mtimeMs < cutoff) {
          try { fs.unlinkSync(full) } catch {}
        }
      }
    } catch {
      // Pruning failures are non-fatal.
    }
  }

  write(line) {
    if (!this.stream) return
    try { this.stream.write(line.endsWith('\n') ? line : line + '\n') } catch {}
  }

  close() {
    if (this._rotateTimer) {
      clearInterval(this._rotateTimer)
      this._rotateTimer = null
    }
    if (this.stream) {
      try { this.stream.end() } catch {}
      this.stream = null
    }
  }

  currentFilePath() {
    return this.stream?.path
  }
}

module.exports = { FileLogger }
