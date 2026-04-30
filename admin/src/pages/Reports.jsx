import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { useSites } from '../api/queries'
import Select from '../components/Select'
import DateRangePicker from '../components/DateRangePicker'
import DatePicker from '../components/DatePicker'

const apiOrigin = (import.meta.env.VITE_API_BASE || 'http://localhost:8000/api').replace(/\/api\/?$/, '')
const pictureUrl = (path) => (path ? `${apiOrigin}/storage/${path}` : null)

const dateFmt = new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', hour12: true })

const resultBadge = (r) => {
  const base = 'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border '
  if (r === 'allowed') return base + 'bg-green-900/40 text-green-400 border-green-800/50'
  if (r === 'denied') return base + 'bg-red-900/40 text-red-400 border-red-800/50'
  return base + 'bg-yellow-900/40 text-yellow-400 border-yellow-800/50'
}

const REPORT_ICONS = {
  'daily-transaction':     'today',
  'by-supplier':           'local_shipping',
  'by-location':           'apartment',
  'duplicate-eligibility': 'rule',
  'remarks':               'chat',
  'request-comparison':    'compare_arrows',
  'complaints':            'report',
}

function todayIso() { return new Date().toISOString().slice(0, 10) }
function firstOfMonthIso() {
  const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10)
}

export default function Reports() {
  const [from, setFrom] = useState(firstOfMonthIso())
  const [to, setTo] = useState(todayIso())
  const [siteId, setSiteId] = useState('')
  const [reportKey, setReportKey] = useState('')
  const [result, setResult] = useState(null)
  const [running, setRunning] = useState(null)
  const [error, setError] = useState(null)
  const { data: sitesData } = useSites({ all: 1 })
  const sites = sitesData?.data ?? []

  const { data: catalog, isLoading: catalogLoading } = useQuery({
    queryKey: ['reports-catalog'],
    queryFn: async () => (await api.get('/reports')).data,
    staleTime: 300_000,
  })
  const items = catalog?.data ?? []
  const selectedReport = items.find(r => r.key === reportKey)
  const isDaily = reportKey === 'daily-transaction'

  const canRun = !!reportKey && !!from && !!to

  const run = async (format, reportArg, overrides = {}) => {
    const report = reportArg || selectedReport
    if (!report) return
    setError(null)
    setRunning(format)
    try {
      const params = {
        from: overrides.from ?? from,
        to: overrides.to ?? to,
        format,
      }
      if (siteId) params.site_id = siteId
      if (format === 'json') {
        const res = await api.get(`/reports/${report.key}`, { params })
        setResult({ report, data: res.data })
      } else {
        const res = await api.get(`/reports/${report.key}`, {
          params, responseType: 'blob',
        })
        const ext = format === 'xlsx' ? 'xlsx' : format === 'pdf' ? 'pdf' : 'csv'
        const mime = res.headers['content-type'] || 'application/octet-stream'
        const blob = new Blob([res.data], { type: mime })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${report.key}-${from}_to_${to}.${ext}`
        document.body.appendChild(a); a.click(); a.remove()
        URL.revokeObjectURL(url)
      }
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Report failed')
    } finally {
      setRunning(null)
    }
  }

  const autoRanRef = useRef(false)
  useEffect(() => {
    if (autoRanRef.current || items.length === 0) return
    const def = items.find(r => r.key === 'daily-transaction') || items[0]
    if (!def) return
    autoRanRef.current = true
    setReportKey(def.key)
    let runFrom = from, runTo = to
    if (def.key === 'daily-transaction') {
      const t = todayIso()
      setFrom(t)
      setTo(t)
      runFrom = t
      runTo = t
    }
    run('json', def, { from: runFrom, to: runTo })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  useEffect(() => {
    if (isDaily && from !== to) setTo(from)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDaily])

  const reportOptions = items.map(r => ({
    value: r.key,
    label: (
      <span className="flex items-center gap-2">
        <span className="material-symbols-outlined text-blue-300" style={{ fontSize: 16 }}>{REPORT_ICONS[r.key] || 'assessment'}</span>
        <span>{r.name}</span>
      </span>
    ),
    searchText: r.name,
  }))

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-md mb-lg">
        <div className="min-w-0">
          <h1 className="font-h1 text-h1 text-slate-100">Reports</h1>
          <p className="font-body-md text-body-md text-slate-400 mt-1">Pick filters and a report, then export to Excel or PDF.</p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-sm mb-md">
        {isDaily ? (
          <DatePicker
            value={from}
            onChange={(v) => { setFrom(v); setTo(v) }}
            placeholder="Pick a date"
            className="w-48"
          />
        ) : (
          <DateRangePicker
            value={{ from, to }}
            onChange={({ from: f, to: t }) => { setFrom(f); setTo(t) }}
            placeholder="Pick a date range"
            className="w-64"
          />
        )}
        <Select
          value={siteId}
          onChange={setSiteId}
          searchable
          className="w-56"
          options={[
            { value: '', label: 'All sites' },
            ...sites.map(s => ({ value: String(s.id), label: `${s.site_code} — ${s.name}` })),
          ]}
        />
        <Select
          value={reportKey}
          onChange={setReportKey}
          searchable
          placeholder={catalogLoading ? 'Loading…' : 'Choose a report…'}
          options={reportOptions}
          className="w-64"
        />
        <button
          onClick={() => run('json')}
          disabled={!canRun || running === 'json'}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{running === 'json' ? 'sync' : 'play_arrow'}</span>
          {running === 'json' ? 'Submitting…' : 'Submit'}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800/50 text-red-300 text-sm rounded p-md mb-md flex items-start gap-2">
          <span className="material-symbols-outlined shrink-0" style={{ fontSize: 18 }}>error</span>
          <span>{error}</span>
        </div>
      )}

      {!result && !error && (
        <div className="bg-surface-container-low border border-dashed border-outline-variant/40 rounded-lg p-12 text-center">
          <span className="material-symbols-outlined text-slate-600" style={{ fontSize: 48 }}>analytics</span>
          <p className="text-slate-400 mt-2">Select a date range and report type, then click <span className="text-slate-200 font-semibold">Submit</span> to view data.</p>
        </div>
      )}

      {result && <ReportResult result={result} running={running} onExport={run} />}
    </>
  )
}

function ReportResult({ result, running, onExport }) {
  const headers = result.data?.headers ?? []
  const rows = result.data?.rows ?? []
  const totals = result.data?.totals
  return (
    <div className="bg-surface-container-low border border-outline-variant/50 rounded-lg p-md">
      <div className="flex flex-wrap items-start justify-between gap-md mb-md">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-300" style={{ fontSize: 22 }}>{REPORT_ICONS[result.report.key] || 'assessment'}</span>
            <h2 className="text-h3 font-h3 text-slate-100">{result.data.title || result.report.name}</h2>
          </div>
          {result.data.period && <p className="text-xs text-slate-400 mt-1 font-mono ml-8">{result.data.period}</p>}
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => onExport('xlsx')}
            disabled={running === 'xlsx'}
            className="px-3 py-2 rounded bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{running === 'xlsx' ? 'sync' : 'table_view'}</span>
            {running === 'xlsx' ? 'Exporting…' : 'Excel'}
          </button>
          <button
            onClick={() => onExport('pdf')}
            disabled={running === 'pdf'}
            className="px-3 py-2 rounded bg-red-600/20 text-red-300 border border-red-500/30 hover:bg-red-600/30 text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{running === 'pdf' ? 'sync' : 'picture_as_pdf'}</span>
            {running === 'pdf' ? 'Exporting…' : 'PDF'}
          </button>
        </div>
      </div>

      {totals && Object.keys(totals).length > 0 && (
        <div className="flex flex-wrap gap-md mb-md text-xs text-slate-400">
          {Object.entries(totals).map(([k, v]) => (
            <div key={k} className="bg-surface-container-highest/30 border border-outline-variant/40 rounded px-3 py-1.5">
              <span className="text-slate-500 uppercase tracking-wider">{k.replace('_', ' ')}:</span> <span className="text-slate-200 font-semibold">{v}</span>
            </div>
          ))}
        </div>
      )}

      <div className="border border-outline-variant/40 rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-container-highest/30 text-label-sm text-slate-400 uppercase tracking-wider">
            <tr>
              {headers.map((h, i) => <th key={i} className="px-3 py-2 text-left whitespace-nowrap">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {rows.length === 0 && <tr><td colSpan={headers.length} className="p-6 text-center text-slate-500 italic">No data for this period.</td></tr>}
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-surface-container-highest/10">
                {renderRow(result.report.key, row)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function renderRow(key, row) {
  if (key === 'duplicate-eligibility') {
    const photo = pictureUrl(row.profile_picture)
    const cellCls = 'px-3 py-2 text-slate-300 whitespace-nowrap'
    const empty = <span className="text-slate-500">—</span>
    const d = row.scanned_at ? new Date(row.scanned_at) : null
    return (
      <>
        <td className="px-3 py-2 text-slate-300 whitespace-nowrap">
          <div className="flex items-center gap-2.5">
            {photo ? (
              <img
                src={photo}
                alt=""
                width={36}
                height={36}
                className="object-cover border border-outline-variant/40 flex-shrink-0 block"
                style={{ width: 36, height: 36, minWidth: 36, minHeight: 36, borderRadius: '9999px' }}
              />
            ) : (
              <div
                className="bg-surface-container-highest/40 border border-outline-variant/40 flex items-center justify-center flex-shrink-0"
                style={{ width: 36, height: 36, minWidth: 36, minHeight: 36, borderRadius: '9999px' }}
              >
                <span className="material-symbols-outlined text-slate-500" style={{ fontSize: 18 }}>person</span>
              </div>
            )}
            <div className="min-w-0 leading-tight">
              <div className="text-slate-200 text-sm">{row.name || empty}</div>
              <div className="font-mono text-slate-400 text-xs">{row.worker_id || ''}</div>
            </div>
          </div>
        </td>
        <td className={cellCls}>{row.current_site || empty}</td>
        <td className={cellCls}>{row.scan_site || empty}</td>
        <td className={cellCls}>
          {row.result
            ? <span className={resultBadge(row.result)}>{(row.result || '').toUpperCase()}</span>
            : (row.status || empty)}
        </td>
        <td className={cellCls}>{row.reason || empty}</td>
        <td className={cellCls}>{row.meal_type || empty}</td>
        <td className="px-3 py-2 whitespace-nowrap">
          {d ? (
            <div className="text-slate-400 text-xs">
              <span className="text-slate-300">{dateFmt.format(d)}</span>
              <span className="font-mono ml-1.5">{timeFmt.format(d)}</span>
            </div>
          ) : empty}
        </td>
      </>
    )
  }
  if (key === 'daily-transaction') {
    const photo = pictureUrl(row.profile_picture)
    const cellCls = 'px-3 py-2 text-slate-300 whitespace-nowrap'
    const empty = <span className="text-slate-500">—</span>
    const ruleNames = Object.keys(row.meals ?? {})
    return (
      <>
        <td className={cellCls}>{row.site || empty}</td>
        <td className="px-3 py-2 text-slate-300 whitespace-nowrap">
          <div className="flex items-center gap-2.5">
            {photo ? (
              <img
                src={photo}
                alt=""
                width={36}
                height={36}
                className="object-cover border border-outline-variant/40 flex-shrink-0 block"
                style={{ width: 36, height: 36, minWidth: 36, minHeight: 36, borderRadius: '9999px' }}
              />
            ) : (
              <div
                className="bg-surface-container-highest/40 border border-outline-variant/40 flex items-center justify-center flex-shrink-0"
                style={{ width: 36, height: 36, minWidth: 36, minHeight: 36, borderRadius: '9999px' }}
              >
                <span className="material-symbols-outlined text-slate-500" style={{ fontSize: 18 }}>person</span>
              </div>
            )}
            <div className="min-w-0 leading-tight">
              <div className="text-slate-200 text-sm">{row.name || empty}</div>
              <div className="font-mono text-slate-400 text-xs">{row.employee_code || ''}</div>
            </div>
          </div>
        </td>
        {ruleNames.map((rn, j) => {
          const detail = row.meal_details?.[rn]
          const sites = detail?.sites ?? row.meals?.[rn] ?? '—'
          const scans = detail?.scans ?? []
          if (!detail || sites === '—') {
            return <td key={j} className={cellCls}>{empty}</td>
          }
          return (
            <td key={j} className="px-3 py-2 whitespace-nowrap align-top">
              <div className="leading-tight space-y-1">
                <div className="text-slate-200 text-sm font-medium">{sites}</div>
                {scans.map((iso, k) => {
                  const d = new Date(iso)
                  return (
                    <div key={k} className="text-slate-400 text-xs">
                      <span className="text-slate-300">{dateFmt.format(d)}</span>
                      <span className="font-mono ml-1.5">{timeFmt.format(d)}</span>
                    </div>
                  )
                })}
              </div>
            </td>
          )
        })}
      </>
    )
  }
  const cells = flattenRow(key, row)
  return cells.map((v, j) => (
    <td key={j} className="px-3 py-2 text-slate-300 whitespace-nowrap">{v === null || v === '' || v === undefined ? <span className="text-slate-500">—</span> : String(v)}</td>
  ))
}

function flattenRow(key, row) {
  switch (key) {
    case 'daily-transaction': {
      const base = [row.site, row.employee_code, row.name]
      const meals = Object.values(row.meals ?? {})
      return [...base, ...meals]
    }
    case 'by-supplier': {
      const meals = Object.values(row.meals ?? {})
      return [row.supplier, row.site, row.date, ...meals, row.total]
    }
    case 'by-location': {
      const meals = Object.values(row.meals ?? {})
      return [row.site, row.date, ...meals, row.total]
    }
    case 'duplicate-eligibility':
      return [row.worker_id, row.current_site, row.scan_site, row.status, row.reason, row.meal_type, row.date, row.time]
    case 'remarks':
      return [row.date, row.supplier, row.site, row.meal_type, row.quantity, row.remarks, row.added_by, row.source]
    case 'request-comparison':
      return [row.date, row.supplier, row.site, row.meal_type, row.yesterday ?? '—', row.today, row.variance ?? '—', row.change_pct ?? '—', row.reason ?? '—']
    case 'complaints':
      return [row.ref_no, row.date_logged, row.site, row.supplier, row.meal_type, row.issue_type, row.description, row.logged_by, row.status, row.date_resolved, row.remarks]
    default:
      return Object.values(row)
  }
}
