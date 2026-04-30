#!/usr/bin/env node
// Spawn N PHP worker processes in parallel, each running M scan ops.
// Aggregates throughput and latency percentiles across workers.
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const WORKERS = parseInt(process.env.WORKERS || process.argv[2] || '10', 10)
const OPS = parseInt(process.env.OPS || process.argv[3] || '200', 10)
const POOL = parseInt(process.env.POOL || '200', 10)
const LABEL = process.env.LABEL || ''

function runWorker(id) {
  return new Promise((resolve, reject) => {
    const proc = spawn('php', [path.join(__dirname, 'worker.php'), String(id), String(OPS), String(POOL)], {
      cwd: __dirname,
      shell: false,
    })
    let out = '', err = ''
    proc.stdout.on('data', d => { out += d.toString() })
    proc.stderr.on('data', d => { err += d.toString() })
    proc.on('close', code => {
      if (code !== 0) return reject(new Error(`worker ${id} exit=${code} stderr=${err}`))
      try {
        const lines = out.trim().split('\n').filter(Boolean)
        const summary = JSON.parse(lines[lines.length - 1])
        resolve(summary)
      } catch (e) {
        reject(new Error(`worker ${id} bad json: ${out}`))
      }
    })
  })
}

const t0 = Date.now()
console.log(`[${LABEL}] launching ${WORKERS} workers x ${OPS} ops each = ${WORKERS * OPS} total scans`)
const results = await Promise.all(Array.from({ length: WORKERS }, (_, i) => runWorker(i)))
const wall = (Date.now() - t0) / 1000

const totalOps = results.reduce((s, r) => s + r.ops, 0)
const totalAllowed = results.reduce((s, r) => s + r.allowed, 0)
const totalErrors = results.reduce((s, r) => s + r.errors, 0)
const allP50 = results.map(r => r.p50_ms).sort((a, b) => a - b)
const allP95 = results.map(r => r.p95_ms).sort((a, b) => a - b)
const allP99 = results.map(r => r.p99_ms).sort((a, b) => a - b)
const allMax = Math.max(...results.map(r => r.max_ms))
const median = a => a[Math.floor(a.length / 2)]

const overallTput = (totalOps / wall).toFixed(1)
console.log(JSON.stringify({
  label: LABEL,
  workers: WORKERS,
  ops_per_worker: OPS,
  total_ops: totalOps,
  allowed: totalAllowed,
  errors: totalErrors,
  wall_clock_s: +wall.toFixed(2),
  throughput_ops_s: +overallTput,
  worker_p50_median_ms: +median(allP50).toFixed(2),
  worker_p95_median_ms: +median(allP95).toFixed(2),
  worker_p99_median_ms: +median(allP99).toFixed(2),
  worst_max_ms: +allMax.toFixed(2),
}, null, 2))
