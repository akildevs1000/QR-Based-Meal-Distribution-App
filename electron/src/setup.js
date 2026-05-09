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

// Reads current values that we manage, so the Settings form can show what's
// actually configured rather than placeholder defaults.
function readCurrentConfig(backendDir) {
  const envPath = path.join(backendDir, '.env')
  if (!fs.existsSync(envPath)) return {}
  const env = fs.readFileSync(envPath, 'utf8')
  const grab = (key) => {
    const m = env.match(new RegExp(`^${key}=(.*)$`, 'm'))
    return m ? m[1].trim() : ''
  }
  return {
    db_host: grab('DB_HOST') || '127.0.0.1',
    db_port: grab('DB_PORT') || '5432',
    db_database: grab('DB_DATABASE'),
    db_username: grab('DB_USERNAME'),
    // Pre-fill the password from .env. It's already stored plain-text on disk
    // there (Laravel's normal config behavior); showing it in the Settings
    // form doesn't expose anything that wasn't already visible to the customer.
    db_password: grab('DB_PASSWORD'),
    app_url: grab('APP_URL') || 'http://localhost:8000',
  }
}

// Writes/updates the .env. Existing .env values for keys we DON'T manage
// (CACHE_STORE, MAIL_HOST, REDIS_HOST, etc.) are preserved untouched.
// Falls back to .env.example only for first-time installs where no .env exists.
function writeEnv(backendDir, values) {
  const envPath = path.join(backendDir, '.env')
  const examplePath = path.join(backendDir, '.env.example')
  let template = ''
  if (fs.existsSync(envPath)) {
    template = fs.readFileSync(envPath, 'utf8')
  } else if (fs.existsSync(examplePath)) {
    template = fs.readFileSync(examplePath, 'utf8')
  }

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
      template += (template.endsWith('\n') ? '' : '\n') + `${key}=${val}\n`
    }
  }

  fs.writeFileSync(envPath, template, 'utf8')
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

// Counts rows in a table via `php -r`. Returns -1 if the table doesn't exist
// or any other error fires — used to safely probe whether seed/admin steps
// have already been done.
async function countRows({ phpExe, values, table }) {
  const host = escapePhp(values.db_host)
  const port = escapePhp(values.db_port || '5432')
  const user = escapePhp(values.db_username)
  const pass = escapePhp(values.db_password)
  const db   = escapePhp(values.db_database)
  const tbl  = escapePhp(table)
  const code = `
    try {
      $pdo = new PDO('pgsql:host=${host};port=${port};dbname=${db}', '${user}', '${pass}',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
      $stmt = $pdo->query('SELECT COUNT(*) FROM "' . str_replace('"', '', '${tbl}') . '"');
      echo (int)$stmt->fetchColumn();
    } catch (Throwable $e) {
      echo -1;
    }
  `
  const out = await runPhpInline(phpExe, code).catch(() => '-1')
  return parseInt(out, 10)
}

// Creates the single admin user only if no row with that email exists yet.
// Bypasses mass-assignment and casts — we Hash::make() explicitly and assign
// every column directly so the user is correct regardless of how the model
// is configured.
async function createAdminUser({ phpExe, backendDir, onLog }) {
  const code = [
    `$u = \\App\\Models\\User::where('email', 'admin@example.com')->first();`,
    `if ($u) { echo 'EXISTS'; } else {`,
    `$u = new \\App\\Models\\User();`,
    `$u->name = 'Admin';`,
    `$u->email = 'admin@example.com';`,
    `$u->password = \\Illuminate\\Support\\Facades\\Hash::make('password');`,
    `$u->role = 'admin';`,
    `$u->active = true;`,
    `$u->save();`,
    `echo 'CREATED';`,
    `}`,
  ].join(' ')
  let captured = ''
  await runArtisan(phpExe, backendDir, ['tinker', '--execute=' + code], (line) => {
    captured += line
    onLog?.(line)
  })
  if (captured.includes('CREATED')) onLog?.('[setup] admin user created (admin@example.com / password)')
  else onLog?.('[setup] admin user already exists — left untouched')
}

async function runFirstRunSetup({ phpExe, backendDir, values, onLog }) {
  onLog?.('[setup] checking database')
  await ensureDatabaseExists({ phpExe, values, onLog })

  onLog?.('[setup] writing config')
  writeEnv(backendDir, values)

  // APP_KEY is per-install; only generate one if .env doesn't have a non-stub
  // value yet. Customers connecting to an existing DB might already have one.
  const envPath = path.join(backendDir, '.env')
  const env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : ''
  if (!/APP_KEY=base64:[A-Za-z0-9+/=]+/.test(env)) {
    onLog?.('[setup] generating app key')
    await runArtisan(phpExe, backendDir, ['key:generate', '--force'], onLog)
  } else {
    onLog?.('[setup] app key already set — kept as-is')
  }

  // Migrate is idempotent — Laravel skips migrations already recorded in the
  // `migrations` table — so it's safe to run against either a fresh DB or one
  // that's already populated.
  onLog?.('[setup] running migrations')
  await runArtisan(phpExe, backendDir, ['migrate', '--force'], onLog)

  // Only seed the permission catalog if it's empty. Re-running PermissionSeeder
  // on a populated DB could create duplicates depending on its implementation.
  const permCount = await countRows({ phpExe, values, table: 'permissions' })
  if (permCount <= 0) {
    onLog?.('[setup] seeding permissions and roles')
    await runArtisan(phpExe, backendDir, ['db:seed', '--class=PermissionSeeder', '--force'], onLog)
  } else {
    onLog?.(`[setup] permissions already seeded (${permCount} rows) — skipped`)
  }

  await createAdminUser({ phpExe, backendDir, onLog })
  onLog?.('[setup] complete')
}

module.exports = { isConfigured, runFirstRunSetup, readCurrentConfig }
