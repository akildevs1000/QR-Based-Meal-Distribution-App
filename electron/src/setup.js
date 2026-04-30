// First-run setup: writes .env from a template and runs `php artisan key:generate`
// + `php artisan migrate --force` against the customer-supplied Postgres credentials.
const { spawn } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

function isConfigured(backendDir) {
  const envPath = path.join(backendDir, '.env')
  if (!fs.existsSync(envPath)) return false
  const env = fs.readFileSync(envPath, 'utf8')
  // Heuristic: must have an APP_KEY and a non-empty DB_DATABASE.
  return /APP_KEY=base64:[A-Za-z0-9+/=]+/.test(env)
    && /DB_CONNECTION=pgsql/.test(env)
    && /DB_DATABASE=\w+/.test(env)
}

function writeEnv(backendDir, values) {
  const examplePath = path.join(backendDir, '.env.example')
  const targetPath = path.join(backendDir, '.env')
  let template = fs.existsSync(examplePath)
    ? fs.readFileSync(examplePath, 'utf8')
    : ''

  const replacements = {
    APP_ENV: 'production',
    APP_DEBUG: 'false',
    APP_URL: values.app_url || 'http://localhost:8000',
    DB_CONNECTION: 'pgsql',
    DB_HOST: values.db_host,
    DB_PORT: values.db_port || '5432',
    DB_DATABASE: values.db_database,
    DB_USERNAME: values.db_username,
    DB_PASSWORD: values.db_password,
  }

  for (const [key, val] of Object.entries(replacements)) {
    const re = new RegExp(`^${key}=.*$`, 'm')
    if (re.test(template)) {
      template = template.replace(re, `${key}=${val}`)
    } else {
      template += `\n${key}=${val}`
    }
  }

  fs.writeFileSync(targetPath, template, 'utf8')
}

function runArtisan(phpExe, backendDir, args, onLog) {
  return new Promise((resolve, reject) => {
    const proc = spawn(phpExe, ['artisan', ...args], {
      cwd: backendDir,
      windowsHide: true,
    })
    let stderr = ''
    proc.stdout.on('data', d => onLog?.(d.toString()))
    proc.stderr.on('data', d => { stderr += d.toString(); onLog?.(d.toString()) })
    proc.on('exit', code => {
      if (code === 0) resolve()
      else reject(new Error(`php artisan ${args.join(' ')} failed (exit ${code}): ${stderr}`))
    })
    proc.on('error', reject)
  })
}

async function runFirstRunSetup({ phpExe, backendDir, values, onLog }) {
  onLog?.('[setup] writing .env')
  writeEnv(backendDir, values)
  onLog?.('[setup] generating app key')
  await runArtisan(phpExe, backendDir, ['key:generate', '--force'], onLog)
  onLog?.('[setup] running migrations')
  await runArtisan(phpExe, backendDir, ['migrate', '--force'], onLog)
  // Seed only on a totally fresh DB. We don't know if the customer wants seed
  // data, so skip seeding by default. (Setup UI can offer a checkbox later.)
  onLog?.('[setup] complete')
}

module.exports = { isConfigured, runFirstRunSetup }
