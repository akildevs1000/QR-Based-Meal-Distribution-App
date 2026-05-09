// Resolves runtime paths in BOTH dev and packaged contexts.
//
// Dev:        php = D:\...\.config\herd-lite\bin\php.exe   (system install)
//             backend = ../backend
// Packaged:   php = <install>/resources/php/php.exe
//             backend = <install>/resources/backend
const path = require('node:path')
const fs = require('node:fs')
const { app } = require('electron')

function resolvePaths() {
  const isDev = !app.isPackaged

  if (isDev) {
    // In dev we run against the bundled PHP at electron/resources/php/php.exe
    // (same binary that ships to customers — guaranteed-consistent VC version)
    // and the repo's backend folder. PHP_BIN env var still wins if set, so a
    // dev can override with a different PHP install for testing.
    const repoRoot = path.resolve(__dirname, '..', '..')
    const bundledDevPhp = path.join(__dirname, '..', 'resources', 'php', 'php.exe')
    return {
      isDev: true,
      phpExe: process.env.PHP_BIN
        || (fs.existsSync(bundledDevPhp) ? bundledDevPhp : 'php'),
      backendDir: path.join(repoRoot, 'backend'),
      adminDistDir: path.join(repoRoot, 'admin', 'dist'),
      stateDir: app.getPath('userData'),
    }
  }

  // Packaged: extraResources are placed under process.resourcesPath
  const phpExe = path.join(process.resourcesPath, 'php', 'php.exe')
  const bundledBackend = path.join(process.resourcesPath, 'backend')
  // We copy the backend out of the read-only resources folder into userData
  // so Laravel can write to storage/, bootstrap/cache/, .env, etc.
  const writableBackend = path.join(app.getPath('userData'), 'backend')

  if (!fs.existsSync(writableBackend)) {
    fs.mkdirSync(path.dirname(writableBackend), { recursive: true })
    copyRecursive(bundledBackend, writableBackend)
  }

  return {
    isDev: false,
    phpExe,
    backendDir: writableBackend,
    bundledBackendDir: bundledBackend,
    adminDistDir: path.join(process.resourcesPath, 'admin'),
    stateDir: app.getPath('userData'),
  }
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src)
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true })
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry))
    }
  } else {
    fs.copyFileSync(src, dest)
  }
}

module.exports = { resolvePaths }
