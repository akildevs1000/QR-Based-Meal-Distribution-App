import { useEffect, useMemo, useState } from 'react'
import { useEmployees, useLogs, useMealRules, useSites } from '../api/queries'
import Select from '../components/Select'

function LiveClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const dateStr = now.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const timeStr = now.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  return (
    <div className="flex items-center gap-3 px-1 py-2">
      <span className="material-symbols-outlined text-blue-400" style={{ fontSize: 22 }}>
        schedule
      </span>
      <div className="flex flex-col leading-tight">
        <span className="font-mono text-lg font-semibold text-slate-100 tabular-nums tracking-tight">
          {timeStr}
        </span>
        <span className="text-[11px] text-slate-400 uppercase tracking-wider">{dateStr}</span>
      </div>
    </div>
  )
}

function Metric({ label, icon, value, suffix, trend, accentClass = 'bg-blue-500/5', progress }) {
  return (
    <div className="bg-surface-container-low border border-outline-variant/50 rounded-lg p-3 flex flex-col justify-between h-24 relative overflow-hidden">
      <div className="flex justify-between items-start z-10">
        <span className="text-[10px] text-slate-400 uppercase tracking-wider truncate mr-1 font-semibold">{label}</span>
        <span className="material-symbols-outlined text-slate-500" style={{ fontSize: 16 }}>{icon}</span>
      </div>
      <div className="z-10">
        <div className="text-xl font-bold text-slate-100 leading-none mb-1.5">
          {value}
          {suffix && <span className="text-slate-500 text-sm font-normal">{suffix}</span>}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[10px] font-medium leading-none ${trend.color}`}>
            {trend.icon && <span className="material-symbols-outlined" style={{ fontSize: 12 }}>{trend.icon}</span>}
            <span>{trend.label}</span>
          </div>
        )}
      </div>
      {progress != null && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-surface-container-highest">
          <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, progress)}%` }} />
        </div>
      )}
      <div className={`absolute bottom-0 right-0 w-24 h-24 ${accentClass} rounded-full blur-2xl -mr-8 -mb-8 pointer-events-none`} />
    </div>
  )
}

function StatusBadge({ result, reason }) {
  const approved = result === 'allowed'
  const denied = result === 'denied'
  const label = approved
    ? 'APPROVED'
    : denied
      ? `DENIED${reason ? ' · ' + reason.toUpperCase() : ''}`
      : (result || 'ERROR').toUpperCase()
  const cls = approved
    ? 'bg-green-900/40 text-green-400 border-green-800/50'
    : denied
      ? 'bg-red-900/40 text-red-400 border-red-800/50'
      : 'bg-yellow-900/40 text-yellow-400 border-yellow-800/50'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border whitespace-nowrap ${cls}`}>
      {label}
    </span>
  )
}

function niceMax(raw) {
  if (raw <= 4) return 4
  if (raw <= 8) return 8
  if (raw <= 20) return Math.ceil(raw / 4) * 4
  if (raw <= 100) return Math.ceil(raw / 10) * 10
  return Math.ceil(raw / 100) * 100
}

function buildSmoothPath(points) {
  if (points.length === 0) return ''
  if (points.length === 1) return `M${points[0].x},${points[0].y}`
  let d = `M${points[0].x},${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1]
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`
  }
  return d
}

function LineChart({ slice, max }) {
  const W = 100
  const H = 100
  const n = slice.length
  const points = slice.map((v, i) => ({
    x: n === 1 ? W / 2 : (i / (n - 1)) * W,
    y: H - (v / max) * H,
  }))
  const linePath = buildSmoothPath(points)
  const areaPath = linePath
    ? `${linePath} L${points[points.length - 1].x},${H} L${points[0].x},${H} Z`
    : ''
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="chart-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
        </linearGradient>
      </defs>
      {areaPath && <path d={areaPath} fill="url(#chart-area)" />}
      {linePath && (
        <path
          d={linePath}
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  )
}

export default function Dashboard() {
  const today = new Date().toISOString().slice(0, 10)
  const [siteId, setSiteId] = useState('')
  const siteFilter = siteId ? { site_id: Number(siteId) } : {}
  const { data: empPage } = useEmployees({ per_page: 1, ...siteFilter })
  const { data: todayLogsPage } = useLogs({ date: today, per_page: 500, ...siteFilter })
  const { data: recentLogsPage } = useLogs({ per_page: 8, ...siteFilter })
  const { data: rulesPage } = useMealRules({ per_page: 500 })
  const rules = rulesPage?.data ?? []
  const { data: sitesPage } = useSites({ all: 1 })
  const allSites = sitesPage?.data ?? []
  const selectedSite = siteId ? allSites.find((s) => s.id === Number(siteId)) : null

  const totalEmployees = empPage?.meta?.total ?? empPage?.total ?? empPage?.data?.length ?? 0
  const todayLogs = todayLogsPage?.data ?? []
  const recentLogs = recentLogsPage?.data ?? []

  const { served, denied, coverage } = useMemo(() => {
    const s = todayLogs.filter((l) => l.result === 'allowed').length
    const d = todayLogs.filter((l) => l.result === 'denied').length
    const cov = totalEmployees > 0 ? Math.round((s / totalEmployees) * 100) : 0
    return { served: s, denied: d, coverage: cov }
  }, [todayLogs, totalEmployees])

  const activeRules = rules.filter((r) => r.active).length
  const totalRules = rules.length
  const activeSites = allSites.filter((s) => s.active).length
  const totalSites = allSites.length

  const sessionBreakdown = useMemo(() => {
    const map = new Map()
    for (const l of todayLogs) {
      if (l.result !== 'allowed') continue
      const name = l.meal_rule?.name || 'Unassigned'
      map.set(name, (map.get(name) || 0) + 1)
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [todayLogs])

  const HOUR_START = 6
  const HOUR_END = 22
  const hourly = useMemo(() => {
    const buckets = Array.from({ length: 24 }, () => 0)
    for (const l of todayLogs) {
      if (l.result !== 'allowed') continue
      const h = new Date(l.scanned_at).getHours()
      buckets[h] += 1
    }
    const slice = buckets.slice(HOUR_START, HOUR_END)
    const rawMax = Math.max(0, ...slice)
    return { slice, max: niceMax(rawMax) }
  }, [todayLogs])

  const hourLabels = useMemo(() => {
    const out = []
    for (let h = HOUR_START; h <= HOUR_END; h += 4) out.push(`${String(h).padStart(2, '0')}:00`)
    return out
  }, [])

  const siteBreakdown = useMemo(() => {
    const counts = new Map()
    let unassigned = 0
    for (const l of todayLogs) {
      if (l.result !== 'allowed') continue
      const site = l.employee?.site
      if (site) counts.set(site.id, (counts.get(site.id) || 0) + 1)
      else unassigned += 1
    }
    const rows = allSites.map((s) => ({
      code: s.site_code,
      name: s.name,
      count: counts.get(s.id) || 0,
    }))
    if (unassigned > 0) rows.push({ code: '—', name: 'Unassigned', count: unassigned })
    rows.sort((a, b) => (b.count - a.count) || a.code.localeCompare(b.code))
    return rows
  }, [todayLogs, allSites])
  const siteTotal = siteBreakdown.reduce((sum, r) => sum + r.count, 0)

  return (
    <>
      <header className="flex justify-between items-center mb-lg gap-md">
        <div>
          <h1 className="font-h1 text-h1 text-slate-100">Executive Dashboard</h1>
          <p className="font-body-md text-body-md text-slate-400 mt-1">
            {selectedSite
              ? <>Showing <span className="text-slate-200 font-medium">{selectedSite.name}</span> <span className="font-mono text-slate-500">({selectedSite.site_code})</span>.</>
              : 'Real-time overview of meal distribution metrics.'}
          </p>
        </div>
        <div className="flex-1 flex justify-center">
          <LiveClock />
        </div>
        <Select
          value={siteId}
          onChange={setSiteId}
          searchable
          align="right"
          leadingIcon="apartment"
          className="w-64"
          options={[
            { value: '', label: 'All sites' },
            ...allSites.map((s) => ({ value: String(s.id), label: `${s.site_code} — ${s.name}` })),
          ]}
        />
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-md mb-lg">
        <Metric
          label="Active Emp."
          icon="badge"
          value={totalEmployees.toLocaleString()}
          trend={{ icon: 'group', label: 'Registered', color: 'text-slate-400' }}
        />
        <Metric
          label="Meals Served"
          icon="restaurant"
          value={served.toLocaleString()}
          trend={{ icon: 'arrow_upward', label: `${coverage}% cov.`, color: 'text-green-400' }}
          progress={coverage}
        />
        <Metric
          label="Access Denied"
          icon="block"
          value={denied.toLocaleString()}
          trend={{ icon: 'arrow_downward', label: 'today', color: 'text-red-400' }}
          accentClass="bg-red-500/5"
        />
        <Metric
          label="Sites"
          icon="apartment"
          value={activeSites}
          suffix={`/${totalSites}`}
          trend={{
            label: totalSites ? `${Math.round((activeSites / totalSites) * 100)}% active` : '—',
            color: 'text-slate-400',
          }}
        />
        <Metric
          label="Efficiency"
          icon="speed"
          value={todayLogs.length > 0 ? `${Math.round((served / todayLogs.length) * 100)}%` : '—'}
          trend={{ icon: 'arrow_upward', label: 'approval rate', color: 'text-green-400' }}
          accentClass="bg-green-500/5"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
        <section className="lg:col-span-2 lg:row-span-1 bg-surface-container-low border border-outline-variant/50 rounded-lg flex flex-col p-md min-h-[300px]">
          <div className="flex justify-between items-center mb-md">
            <h3 className="font-h3 text-h3 text-slate-200">Distribution Velocity</h3>
            <div className="flex bg-surface-container-high rounded p-1 border border-outline-variant/30">
              <button className="px-3 py-1 rounded font-label-md text-label-md bg-surface-variant text-slate-100 shadow-sm">1 Day</button>
              <button className="px-3 py-1 rounded font-label-md text-label-md text-slate-400 hover:text-slate-200">1 Week</button>
              <button className="px-3 py-1 rounded font-label-md text-label-md text-slate-400 hover:text-slate-200">1 Month</button>
            </div>
          </div>
          <div className="flex-1 min-h-0 relative flex items-end w-full">
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-slate-500 text-[11px] pb-6 pr-2 text-right w-8">
              <span>{hourly.max}</span>
              <span>{Math.round(hourly.max * 0.75)}</span>
              <span>{Math.round(hourly.max * 0.5)}</span>
              <span>{Math.round(hourly.max * 0.25)}</span>
              <span>0</span>
            </div>
            <div className="absolute inset-0 ml-8 mb-6 border-b border-outline-variant/30 flex flex-col justify-between pointer-events-none">
              <div className="border-t border-outline-variant/10 h-0 w-full" />
              <div className="border-t border-outline-variant/10 h-0 w-full" />
              <div className="border-t border-outline-variant/10 h-0 w-full" />
              <div className="border-t border-outline-variant/10 h-0 w-full" />
              <div className="h-0 w-full" />
            </div>
            <div className="absolute top-0 left-8 right-0 bottom-6">
              <LineChart slice={hourly.slice} max={hourly.max} />
            </div>
            <div className="absolute bottom-0 left-8 right-0 flex justify-between text-slate-500 text-[11px]">
              {hourLabels.map((l) => <span key={l}>{l}</span>)}
            </div>
          </div>
        </section>

        <section className="lg:col-span-1 lg:row-span-1 bg-surface-container-low border border-outline-variant/50 rounded-lg flex flex-col overflow-hidden min-h-[300px]">
          <div className="p-md border-b border-outline-variant/30 bg-surface-container-highest/30">
            <h3 className="font-h3 text-h3 text-slate-200">Site Breakdown</h3>
            <p className="font-label-md text-label-md text-slate-400 mt-1">Meals served by site today.</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {siteBreakdown.length === 0 ? (
              <div className="px-4 py-6 text-center text-slate-500 text-sm">No meals served yet today.</div>
            ) : (
              <ul className="divide-y divide-outline-variant/20">
                {siteBreakdown.map((row) => {
                  const pct = siteTotal > 0 ? Math.round((row.count / siteTotal) * 100) : 0
                  return (
                    <li key={`${row.code}|${row.name}`} className="px-4 py-3 hover:bg-surface-container-highest/10 transition-colors">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-baseline gap-2 min-w-0">
                          <span className="font-mono text-[11px] text-slate-500">{row.code}</span>
                          <span className="text-slate-200 truncate">{row.name}</span>
                        </div>
                        <span className="font-mono text-slate-300 whitespace-nowrap ml-2">
                          {row.count.toLocaleString()} <span className="text-slate-500 text-xs">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-1.5 rounded bg-surface-container-highest/60 overflow-hidden">
                        <div className="h-full bg-blue-500/80" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>

        <section className="lg:col-span-2 lg:row-span-1 bg-surface-container-low border border-outline-variant/50 rounded-lg flex flex-col overflow-hidden min-h-[300px]">
          <div className="p-md border-b border-outline-variant/30 bg-surface-container-highest/30 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h3 className="font-h3 text-h3 text-slate-200">Live Scan Event Log</h3>
              <span className="flex h-2 w-2 relative ml-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
            </div>
            <a href="/logs" className="text-label-md font-medium text-blue-400 hover:text-blue-300">View All</a>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-body-md whitespace-nowrap">
              <thead className="bg-surface-container-highest/10 text-label-sm text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2 font-medium">Timestamp</th>
                  <th className="px-4 py-2 font-medium">Employee</th>
                  <th className="px-4 py-2 font-medium">ID</th>
                  <th className="px-4 py-2 font-medium">Session</th>
                  <th className="px-4 py-2 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 text-sm">
                {recentLogs.length === 0 && (
                  <tr><td colSpan="5" className="px-4 py-6 text-center text-slate-500">No recent scan events.</td></tr>
                )}
                {recentLogs.map((log, idx) => (
                  <tr
                    key={log.id}
                    className={idx === 0 ? 'bg-blue-500/5 hover:bg-blue-500/10 transition-colors' : 'hover:bg-surface-container-highest/10 transition-colors'}
                  >
                    <td className="px-4 py-2 font-mono text-slate-400 text-xs">
                      {new Date(log.scanned_at).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-2 text-slate-200 font-medium">
                      {log.employee?.name || <span className="text-slate-500 italic">unknown</span>}
                    </td>
                    <td className="px-4 py-2 font-mono text-slate-500">
                      {log.employee?.employee_code || log.scanned_code}
                    </td>
                    <td className="px-4 py-2 text-slate-400">{log.meal_rule?.name || '—'}</td>
                    <td className="px-4 py-2 text-right">
                      <StatusBadge result={log.result} reason={log.reason} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="lg:col-span-1 lg:row-span-1 bg-surface-container-low border border-outline-variant/50 rounded-lg flex flex-col overflow-hidden min-h-[300px]">
          <div className="p-md border-b border-outline-variant/30 bg-surface-container-highest/30">
            <h3 className="font-h3 text-h3 text-slate-200">Session Breakdown</h3>
            <p className="font-label-md text-label-md text-slate-400 mt-1">Meals served by session today.</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left text-body-md">
              <thead className="bg-surface-container-highest/20 text-label-sm text-slate-400 uppercase tracking-wider sticky top-0">
                <tr>
                  <th className="px-4 py-3 font-medium">Session</th>
                  <th className="px-4 py-3 font-medium text-right">Served</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {sessionBreakdown.length === 0 && (
                  <tr>
                    <td colSpan="2" className="px-4 py-6 text-center text-slate-500 text-sm">
                      No meals served yet today.
                    </td>
                  </tr>
                )}
                {sessionBreakdown.map(([name, count]) => (
                  <tr key={name} className="hover:bg-surface-container-highest/10 transition-colors">
                    <td className="px-4 py-3 text-slate-200">{name}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-300">{count.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  )
}
