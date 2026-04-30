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
    // In dev we run against the developer's installed PHP and the repo's backend folder.
    const repoRoot = path.resolve(__dirname, '..', '..')
    return {
      isDev: true,
      phpExe: process.env.PHP_BIN || 'php', // assume on PATH
      backendDir: path.join(repoRoot, 'backend'),
      adminDistDir: path.join(repoRoot, 'admin', 'dist'),
      // userData for storing first-run state during dev
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
