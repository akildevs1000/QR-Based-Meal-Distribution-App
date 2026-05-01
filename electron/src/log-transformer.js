// Translate raw stdout/stderr lines from supervised processes into user-friendly
// messages. Returns null to drop a line entirely.

function formatTs(text) {
  const d = new Date()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `[${hh}:${mm}:${ss}] ${text}`
}

function transformLogLine(raw, ctx = {}) {
  const tag = ctx.tag || 'system'
  const prefix = `(${tag})`
  ctx.state ||= {}
  const line = raw.trim()
  if (!line) return null

  // Internal supervisor messages — translate prefix + verb.
  if (line.startsWith('[supervisor]')) {
    if (line.includes('spawning')) return formatTs(`${prefix} starting…`)
    if (line.includes('php exited')) return formatTs(`${prefix} stopped.`)
    if (line.includes('restarting')) return formatTs(`${prefix} restarting…`)
    if (line.includes('spawn error')) return formatTs(`${prefix} could not start.`)
    return formatTs(`${prefix} ${line.replace(/^\[supervisor\]\s*/, '')}`)
  }
  if (line.startsWith('[setup]')) {
    return formatTs(`• ${line.replace(/^\[setup\]\s*/, '')}`)
  }

  // Useful info from the running process — keep but rephrase.
  const ready = line.match(/Server running on \[(http:\/\/[^\]]+)\]/i)
  if (ready) return formatTs(`${prefix} ready — ${ready[1]}`)

  // Queue worker output — Laravel prints lines like:
  //   "2026-04-30 19:00:00 App\Jobs\SendEmail .... DONE"
  const queueJob = line.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\s+(\S+)\s+\.+\s+(\d+ms\s+)?(DONE|FAIL|RUNNING)\s*$/)
  if (queueJob) {
    const [, name, , status] = queueJob
    const shortName = name.split('\\').pop()
    return formatTs(`${prefix} job ${shortName} → ${status.toLowerCase()}`)
  }

  // Scheduler output — Laravel prints lines like:
  //   "2026-05-01 12:23:01 Running [artisan health:check]"
  //   "....................................... 1s DONE"
  //   "  ⇂ \"C:\...\php.exe\" \"artisan\" health:check > \"NUL\" 2>&1"
  const scheduleRunning = line.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\s+Running\s+\[\S+\s+([\w:\-]+)\]/)
  if (scheduleRunning) {
    ctx.state.lastTask = scheduleRunning[1]
    return formatTs(`${prefix} task ${scheduleRunning[1]} starting…`)
  }
  const scheduleDone = line.match(/^\.+\s+(\d+(?:\.\d+)?(?:ms|s))\s+(DONE|FAIL)\s*$/)
  if (scheduleDone) {
    const name = ctx.state.lastTask || 'task'
    const verb = scheduleDone[2] === 'FAIL' ? 'failed' : 'done'
    return formatTs(`${prefix} task ${name} ${verb} in ${scheduleDone[1]}`)
  }
  // Drop the verbose shell-command line that the scheduler prints with the ⇂ prefix.
  if (/^\s*⇂\s/.test(line)) return null

  // Drop noisy lines.
  if (/Press Ctrl\+C to stop the server/i.test(line)) return null
  if (/Development Server \(.*\) started/i.test(line)) return null
  if (/^#\d+\s/.test(line)) return null
  if (/^Stack trace:/i.test(line)) return null

  // Strip framework/file paths that leak tech names.
  let clean = line
    .replace(/\b(php|php\.exe|artisan(?:\s+\w+)*|laravel(?:[-/]\w+)*|composer(?:\.\w+)*|opcache)\b/gi, '')
    .replace(/[A-Za-z]:\\[^\s'"]+\\(?:vendor|public|app|bootstrap|storage|routes)\b[^\s'"]*/gi, '')
    .replace(/\/(?:vendor|public|app|bootstrap|storage|routes)\/[^\s'"]+/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()

  if (!clean || clean.length < 2) return null
  return formatTs(`${prefix} ${clean}`)
}

module.exports = { transformLogLine, formatTs }
