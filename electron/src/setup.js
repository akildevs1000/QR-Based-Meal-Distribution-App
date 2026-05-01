// First-run setup:
//   1. Auto-creates the target Postgres database if missing.
//   2. Writes .env, generates APP_KEY, runs migrations.
//   3. Seeds ONLY the permission/role catalog (needed for the app to function).
//   4. Creates a single admin user (admin@example.com / password).
//   No demo employees / meal logs / etc. — clean install.
const { spawn } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

function isConfigured(backendDir) {
  const envPath = path.join(backendDir, '.env')
  if (!fs.existsSync(envPath)) return false
  const env = fs.readFileSync(envPath, 'utf8')
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
    APP_TIMEZONE: 'Asia/Dubai',
    APP_URL: values.app_url || 'http://localhost:8000',
    LOG_CHANNEL: 'daily',
    LOG_DAILY_DAYS: '14',
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

// Run a small inline PHP snippet via `php -r` and return its stdout.
// stderr non-empty + non-zero exit ⇒ throws.
function runPhpInline(phpExe, code) {
  return new Promise((resolve, reject) => {
    const proc = spawn(phpExe, ['-r', code], { windowsHide: true })
    let stdout = '', stderr = ''
    proc.stdout.on('data', d => { stdout += d.toString() })
    proc.stderr.on('data', d => { stderr += d.toString() })
    proc.on('exit', exit => {
      if (exit === 0) resolve(stdout.trim())
      else reject(new Error(stderr.trim() || `php -r exited ${exit}`))
    })
    proc.on('error', reject)
  })
}

function escapePhp(v) {
  return String(v ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

// Validates a Postgres identifier — letters / digits / underscores only, must
// start with a letter or underscore. Anything else is rejected so we never
// have to worry about escaping a name into a CREATE DATABASE statement.
function assertSafeIdent(name, label = 'database name') {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    throw new Error(`Invalid ${label}: must use only letters, digits, and underscores.`)
  }
}

// Connects to the user's Postgres server (using the always-present `postgres`
// meta database) and creates the target DB if it doesn't already exist.
async function ensureDatabaseExists({ phpExe, values, onLog }) {
  assertSafeIdent(values.db_database, 'database name')
  const host = escapePhp(values.db_host)
  const port = escapePhp(values.db_port || '5432')
  const user = escapePhp(values.db_username)
  const pass = escapePhp(values.db_password)
  const target = values.db_database // already validated above

  const code = `
    try {
      $pdo = new PDO('pgsql:host=${host};port=${port};dbname=postgres', '${user}', '${pass}',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    } catch (Throwable $e) {
      fwrite(STDERR, 'Cannot connect to Postgres: ' . $e->getMessage());
      exit(1);
    }
    $stmt = $pdo->prepare('SELECT 1 FROM pg_database WHERE datname = ?');
    $stmt->execute(['${escapePhp(target)}']);
    if ($stmt->fetchColumn()) {
      echo 'EXISTS';
    } else {
      $pdo->exec('CREATE DATABASE "${target}"');
      echo 'CREATED';
    }
  `
  const result = await runPhpInline(phpExe, code)
  if (result === 'CREATED') onLog?.(`[setup] created database "${target}"`)
  else onLog?.(`[setup] database "${target}" already exists`)
}

// Creates (or refreshes) the single admin user. Permissions/roles must already
// be seeded before calling this so the user can be linked to the admin role.
async function createAdminUser({ phpExe, backendDir, onLog }) {
  // Run via `artisan tinker --execute` so Laravel's password-hashing cast and
  // model events fire correctly.
  const code = `\\App\\Models\\User::updateOrCreate(['email' => 'admin@example.com'], ['name' => 'Admin', 'password' => 'password', 'role' => 'admin', 'active' => true]); echo 'OK';`
  await runArtisan(phpExe, backendDir, ['tinker', '--execute=' + code], onLog)
  onLog?.('[setup] admin user ready (admin@example.com / password)')
}

async function runFirstRunSetup({ phpExe, backendDir, values, onLog }) {
  onLog?.('[setup] checking database')
  await ensureDatabaseExists({ phpExe, values, onLog })
  onLog?.('[setup] writing config')
  writeEnv(backendDir, values)
  onLog?.('[setup] generating app key')
  await runArtisan(phpExe, backendDir, ['key:generate', '--force'], onLog)
  onLog?.('[setup] running migrations')
  await runArtisan(phpExe, backendDir, ['migrate', '--force'], onLog)
  onLog?.('[setup] seeding permissions and roles')
  await runArtisan(phpExe, backendDir, ['db:seed', '--class=PermissionSeeder', '--force'], onLog)
  await createAdminUser({ phpExe, backendDir, onLog })
  onLog?.('[setup] complete — login: admin@example.com / password')
}

module.exports = { isConfigured, runFirstRunSetup }
