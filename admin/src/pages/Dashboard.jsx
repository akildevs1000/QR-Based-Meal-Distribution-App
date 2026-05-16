import { useEffect, useMemo, useState } from 'react'
import {
  useDashboardQuotas,
  useEmployees,
  useLogs,
  useMealRules,
  useSites,
  useMealCategories,
} from '../api/queries'
import Select from '../components/Select'

// ---------- helpers ----------
function LiveClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const dateStr = now.toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
  const timeStr = now.toLocaleTimeString(undefined, {
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
  return (
    <span className="font-mono tabular-nums">{dateStr} · {timeStr}</span>
  )
}

function niceMax(raw) {
  if (raw <= 4) return 4
  if (raw <= 10) return 10
  if (raw <= 20) return 20
  if (raw <= 50) return Math.ceil(raw / 10) * 10
  if (raw <= 200) return Math.ceil(raw / 20) * 20
  return Math.ceil(raw / 50) * 50
}

const ARROW_UP = '↑'
const ARROW_DN = '↓'

// Classifies a meal-rule name into one of three session buckets by keywords / time.
function classifySession(rule) {
  const n = String(rule?.name || '').toLowerCase()
  if (/breakfast|morning/.test(n)) return 'breakfast'
  if (/lunch|noon|midday/.test(n)) return 'lunch'
  if (/dinner|supper|evening|night/.test(n)) return 'dinner'
  const h = parseInt(String(rule?.start_time || '').slice(0, 2), 10)
  if (Number.isFinite(h)) {
    if (h < 11) return 'breakfast'
    if (h < 16) return 'lunch'
    return 'dinner'
  }
  return null
}

const SESSION_META = {
  breakfast: { name: 'Breakfast', color: '#f6a13a', order: 0 },
  lunch:     { name: 'Lunch',     color: '#5f9bef', order: 1 },
  dinner:    { name: 'Dinner',    color: '#9b7cf0', order: 2 },
}

const CAT_COLORS = ['#5f9bef', '#27c39c', '#f6a13a', '#9b7cf0', '#ef7250', '#7eb6ff', '#e8b341']

// ---------- atoms ----------
const METRIC_COLORS = {
  blue:   { bg: 'bg-blue-500/10',    text: 'text-blue-400' },
  violet: { bg: 'bg-violet-500/10',  text: 'text-violet-400' },
  orange: { bg: 'bg-orange-500/10',  text: 'text-orange-400' },
  red:    { bg: 'bg-red-500/10',     text: 'text-red-400' },
  green:  { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  amber:  { bg: 'bg-amber-500/10',   text: 'text-amber-400' },
}

function Metric({ label, icon, value, suffix, color = 'blue' }) {
  const c = METRIC_COLORS[color] || METRIC_COLORS.blue
  return (
    <div className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-4 flex flex-col gap-3">
      <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center`}>
        <span className={`material-symbols-outlined ${c.text}`} style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-100 leading-none mb-1.5 tabular-nums">
          {value}
          {suffix && <span className="text-slate-500 text-base font-normal">{suffix}</span>}
        </div>
        <div className={`text-xs ${c.text}`}>{label}</div>
      </div>
    </div>
  )
}

function Card({ children, className = '', pad = true }) {
  return (
    <div
      className={`rounded-2xl border border-outline-variant/40 bg-surface-container-low/70 backdrop-blur-sm ${pad ? 'p-4' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

function DeltaPill({ value, unit = '%' }) {
  if (value == null || Number.isNaN(value)) return null
  const pos = value > 0
  const neg = value < 0
  const cls = pos
    ? 'bg-emerald-500/15 text-emerald-300'
    : neg
      ? 'bg-rose-500/15 text-rose-300'
      : 'bg-slate-500/15 text-slate-300'
  const arrow = pos ? ARROW_UP : neg ? ARROW_DN : '—'
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10.5px] font-semibold tabular-nums ${cls}`}>
      {arrow} {Math.abs(value).toFixed(unit === '%' ? 1 : 0)}{unit}
    </span>
  )
}

function StatKpi({ label, value, unit, delta, deltaUnit = '%', icon, tone = 'default', foot }) {
  const TONE = {
    default: { bg: 'bg-slate-500/15',    text: 'text-slate-300' },
    accent:  { bg: 'bg-blue-500/15',     text: 'text-blue-300' },
    ok:      { bg: 'bg-emerald-500/15',  text: 'text-emerald-300' },
    err:     { bg: 'bg-rose-500/15',     text: 'text-rose-300' },
  }
  const t = TONE[tone] || TONE.default
  return (
    <Card className="flex flex-col gap-2.5 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-6 h-6 rounded-md ${t.bg} ${t.text} flex items-center justify-center`}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{icon}</span>
          </span>
          <span className="text-[11px] font-medium text-slate-400">{label}</span>
        </div>
        <DeltaPill value={delta} unit={deltaUnit} />
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-semibold text-slate-100 tracking-tight tabular-nums leading-none">
          {value}
        </span>
        {unit && <span className="text-sm text-slate-400">{unit}</span>}
      </div>
      {foot && <div className="text-[11px] text-slate-500 leading-snug">{foot}</div>}
    </Card>
  )
}

function HeroKpi({ served, plan, delta }) {
  const pct = plan > 0 ? Math.min(100, (served / plan) * 100) : 0
  const remaining = Math.max(0, plan - served)
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3.5 text-white relative overflow-hidden h-full"
      style={{
        background: 'linear-gradient(135deg, #5f9bef 0%, #3a55c4 100%)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.18) inset, 0 14px 40px -10px rgba(58,85,196,0.40)',
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11.5px] font-medium opacity-90">Meals served · today</span>
        {delta != null && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 font-mono text-[10.5px] font-semibold tabular-nums">
            {delta >= 0 ? ARROW_UP : ARROW_DN} {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span
          className="text-[50px] font-medium leading-none tabular-nums"
          style={{ letterSpacing: '-0.035em' }}
        >
          {served.toLocaleString()}
        </span>
        <span className="text-sm opacity-80">/ {plan.toLocaleString()} plan</span>
      </div>
      <div className="relative h-1.5 bg-white/20 rounded-full overflow-hidden">
        <div className="absolute inset-y-0 left-0 bg-white rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-[11px] opacity-85">
        <span>{pct.toFixed(1)}% of daily target</span>
        <span className="tabular-nums">{remaining.toLocaleString()} remaining</span>
      </div>
    </div>
  )
}

function SessionCard({ session }) {
  const pct = session.plan > 0 ? Math.min(100, (session.served / session.plan) * 100) : 0
  const tone = session.status === 'live'
    ? { c: 'text-emerald-300', bg: 'bg-emerald-500/15', dot: '#22c391' }
    : session.status === 'closed'
      ? { c: 'text-slate-400',  bg: 'bg-slate-500/15',   dot: '#5e6985' }
      : { c: 'text-violet-300', bg: 'bg-violet-500/15',  dot: '#9b7cf0' }
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-sm" style={{ background: session.color }} />
          <span className="text-sm font-semibold text-slate-100">{session.name}</span>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider ${tone.bg} ${tone.c}`}
        >
          {session.status === 'live' && (
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: tone.dot, boxShadow: `0 0 6px ${tone.dot}` }} />
          )}
          {session.status}
        </span>
      </div>
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-medium leading-none tabular-nums text-slate-100 tracking-tight">
            {session.served.toLocaleString()}
          </span>
          <span className="text-xs text-slate-400">/ {session.plan.toLocaleString()}</span>
        </div>
        {session.window && (
          <span className="font-mono text-[11px] text-slate-500">{session.window}</span>
        )}
      </div>
      <div className="h-1.5 bg-surface-container-highest/50 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: session.color }} />
      </div>
      <div className="flex justify-between text-[11px] text-slate-500">
        <span>{pct.toFixed(0)}% complete</span>
        {session.denied > 0 && <span className="text-rose-400">{session.denied} denied</span>}
      </div>
    </Card>
  )
}

// Stacked approved/denied + projected (dashed) hourly chart with NOW marker.
function HourlyChart({ buckets, nowHour }) {
  const W = 760, H = 200, padL = 32, padR = 18, padT = 18, padB = 28
  const innerW = W - padL - padR
  const innerH = H - padT - padB
  const totals = buckets.map(b => Math.max((b.approved || 0) + (b.denied || 0), b.projected || 0))
  const maxV = niceMax(Math.max(...totals, 10))
  const bw = innerW / buckets.length
  const y = v => padT + innerH - (v / maxV) * innerH

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full block">
      {[0, maxV / 2, maxV].map((t, i) => {
        const yy = y(t)
        return (
          <g key={i}>
            <line x1={padL} y1={yy} x2={W - padR} y2={yy} stroke="rgba(255,255,255,0.06)" strokeDasharray={i === 1 ? '2 4' : ''} />
            <text x={padL - 8} y={yy + 3} textAnchor="end" fontFamily="ui-monospace, monospace" fontSize="10" fill="#5e6985">{Math.round(t)}</text>
          </g>
        )
      })}
      {buckets.map((row, i) => {
        const xb = padL + i * bw + 3
        const w = bw - 6
        if (row.future) {
          const proj = row.projected || 0
          if (proj <= 0) {
            return (
              <text key={row.h} x={xb + w / 2} y={H - 10} textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="10" fill="#3f485e">{row.label}</text>
            )
          }
          const h = (proj / maxV) * innerH
          return (
            <g key={row.h}>
              <rect x={xb} y={y(proj)} width={w} height={h} fill="none" stroke="#3f485e" strokeDasharray="3 2" rx="2" />
              <text x={xb + w / 2} y={H - 10} textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="10" fill="#5e6985">{row.label}</text>
            </g>
          )
        }
        const approved = row.approved || 0
        const denied = row.denied || 0
        const approvedH = (approved / maxV) * innerH
        const deniedH = (denied / maxV) * innerH
        const isNow = row.h === nowHour
        return (
          <g key={row.h}>
            {approved > 0 && (
              <rect x={xb} y={y(approved + denied)} width={w} height={approvedH} fill="#5f9bef" rx="2" />
            )}
            {denied > 0 && (
              <rect x={xb} y={y(denied)} width={w} height={deniedH} fill="#ef7060" rx="2" />
            )}
            <text x={xb + w / 2} y={H - 10} textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="10" fill={isNow ? '#7eb6ff' : '#5e6985'} fontWeight={isNow ? 600 : 400}>{row.label}</text>
          </g>
        )
      })}
      {(() => {
        const idx = buckets.findIndex(b => b.h === nowHour)
        if (idx < 0) return null
        const xx = padL + idx * bw + bw - 1
        return (
          <g>
            <line x1={xx} y1={padT - 4} x2={xx} y2={padT + innerH + 4} stroke="#7eb6ff" strokeDasharray="2 3" strokeWidth="1.2" />
            <g transform={`translate(${xx - 22}, ${padT - 4})`}>
              <rect x="0" y="0" width="40" height="14" rx="7" fill="#7eb6ff" />
              <text x="20" y="10" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="9" fontWeight="700" fill="#071029">NOW</text>
            </g>
          </g>
        )
      })()}
    </svg>
  )
}

function CategoryDonut({ items }) {
  const total = items.reduce((s, m) => s + m.qty, 0)
  if (total <= 0) {
    return <div className="text-sm text-slate-500 italic py-4">No meals served yet today.</div>
  }
  const r = 44, R = 64, cx = 72, cy = 72
  let acc = 0
  return (
    <div className="flex items-center gap-4 mt-1">
      <svg viewBox="0 0 144 144" width="144" height="144" className="flex-none">
        {items.map((m, i) => {
          const frac = m.qty / total
          const a0 = acc * 2 * Math.PI - Math.PI / 2
          acc += frac
          const a1 = acc * 2 * Math.PI - Math.PI / 2
          const large = frac > 0.5 ? 1 : 0
          const x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0)
          const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1)
          const x2 = cx + r * Math.cos(a1), y2 = cy + r * Math.sin(a1)
          const x3 = cx + r * Math.cos(a0), y3 = cy + r * Math.sin(a0)
          return (
            <path
              key={m.key || i}
              d={`M ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1} L ${x2} ${y2} A ${r} ${r} 0 ${large} 0 ${x3} ${y3} Z`}
              fill={m.color}
            />
          )
        })}
        <text x={cx} y={cy - 2} textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="20" fontWeight="500" fill="#e8eefb" letterSpacing="-0.02em">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="9.5" fill="#5e6985">total</text>
      </svg>
      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
        {items.map((m, i) => (
          <div key={m.key || i} className="grid grid-cols-[10px_1fr_auto] gap-2 items-center text-[12px] text-slate-200">
            <span className="w-2 h-2 rounded-sm" style={{ background: m.color }} />
            <span className="truncate">{m.name}</span>
            <span className="text-slate-400 tabular-nums text-[12.5px] font-medium">{m.qty}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatusPill({ status }) {
  const approved = status === 'allowed' || status === 'approved'
  const denied = status === 'denied'
  const cls = approved
    ? 'bg-emerald-500/15 text-emerald-300'
    : denied
      ? 'bg-rose-500/15 text-rose-300'
      : 'bg-amber-500/15 text-amber-300'
  const label = approved ? 'APPROVED' : denied ? 'DENIED' : (status || 'ERROR').toUpperCase()
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-mono text-[10px] font-semibold uppercase tracking-wider ${cls}`}>
      {label}
    </span>
  )
}

// ---------- main ----------
export default function Dashboard() {
  const today = new Date().toISOString().slice(0, 10)
  const [siteId, setSiteId] = useState('')
  const siteFilter = siteId ? { site_id: Number(siteId) } : {}

  const { data: empPage } = useEmployees({ per_page: 1, ...siteFilter })
  const { data: todayLogsPage } = useLogs({ date: today, per_page: 500, ...siteFilter })
  const { data: recentLogsPage } = useLogs({ per_page: 8, ...siteFilter })
  const { data: rulesPage } = useMealRules({ per_page: 500 })
  const { data: quotasData } = useDashboardQuotas(siteFilter)
  const { data: sitesPage } = useSites({ all: 1 })
  const { data: categoriesPage } = useMealCategories({ per_page: 50 })

  const totalEmployees = empPage?.meta?.total ?? empPage?.total ?? 0
  const todayLogs = todayLogsPage?.data ?? []
  const recentLogs = recentLogsPage?.data ?? []
  const rules = rulesPage?.data ?? []
  const allSites = sitesPage?.data ?? []
  const categories = categoriesPage?.data ?? []
  const selectedSite = siteId ? allSites.find(s => s.id === Number(siteId)) : null

  // --- top-line KPIs ---
  const served = useMemo(() => todayLogs.filter(l => l.result === 'allowed').length, [todayLogs])
  const denied = useMemo(() => todayLogs.filter(l => l.result === 'denied').length, [todayLogs])
  const planTotal = quotasData?.today?.total ?? 0
  const efficiency = todayLogs.length > 0 ? (served / todayLogs.length) * 100 : 0

  // --- session breakdown ---
  const sessions = useMemo(() => {
    const buckets = {
      breakfast: { ...SESSION_META.breakfast, key: 'breakfast', served: 0, plan: 0, denied: 0, windows: [] },
      lunch:     { ...SESSION_META.lunch,     key: 'lunch',     served: 0, plan: 0, denied: 0, windows: [] },
      dinner:    { ...SESSION_META.dinner,    key: 'dinner',    served: 0, plan: 0, denied: 0, windows: [] },
    }
    const ruleClass = new Map()
    for (const r of rules) {
      const k = classifySession(r)
      if (!k) continue
      ruleClass.set(r.id, k)
      const quota = (quotasData?.today?.by_rule ?? []).find(x => x.meal_rule_id === r.id)
      if (quota) buckets[k].plan += quota.quantity || 0
      if (r.start_time && r.end_time) {
        buckets[k].windows.push(`${String(r.start_time).slice(0, 5)} – ${String(r.end_time).slice(0, 5)}`)
      }
    }
    for (const l of todayLogs) {
      const k = ruleClass.get(l.meal_rule_id ?? l.meal_rule?.id)
      if (!k) continue
      if (l.result === 'allowed') buckets[k].served += 1
      else if (l.result === 'denied') buckets[k].denied += 1
    }
    const now = new Date()
    const nowH = now.getHours() + now.getMinutes() / 60
    const out = Object.values(buckets)
    for (const b of out) {
      b.window = b.windows[0] || ''
      const ranges = b.windows.map(w => w.split(' – ').map(t => {
        const [hh, mm] = t.split(':').map(Number)
        return hh + (mm || 0) / 60
      }))
      const minStart = Math.min(...ranges.map(([s]) => s).filter(Number.isFinite))
      const maxEnd = Math.max(...ranges.map(([, e]) => e).filter(Number.isFinite))
      if (!Number.isFinite(minStart) || !Number.isFinite(maxEnd)) {
        b.status = b.served > 0 ? 'live' : 'upcoming'
      } else if (nowH < minStart) b.status = 'upcoming'
      else if (nowH > maxEnd) b.status = 'closed'
      else b.status = 'live'
    }
    return out.sort((a, b) => a.order - b.order)
  }, [rules, todayLogs, quotasData])

  // --- hourly chart buckets (06:00 – 20:00) ---
  const hourly = useMemo(() => {
    const start = 6, end = 20
    const approvedByH = new Array(24).fill(0)
    const deniedByH = new Array(24).fill(0)
    for (const l of todayLogs) {
      const ts = new Date(l.scanned_at)
      const h = ts.getHours()
      if (l.result === 'allowed') approvedByH[h] += 1
      else if (l.result === 'denied') deniedByH[h] += 1
    }
    const now = new Date()
    const nowHourStr = String(now.getHours()).padStart(2, '0')
    // Project future hours from same hour last week (cheap proxy: use today's avg of past hours).
    const out = []
    for (let h = start; h <= end; h += 1) {
      const label = String(h).padStart(2, '0')
      const future = h > now.getHours()
      out.push({
        h: label,
        label,
        approved: future ? 0 : approvedByH[h],
        denied: future ? 0 : deniedByH[h],
        projected: 0,
        future,
      })
    }
    return { buckets: out, nowHour: nowHourStr }
  }, [todayLogs])

  // --- meal categories donut ---
  const categoryItems = useMemo(() => {
    // Group served logs by category if backend exposes meal_rule.category; otherwise group by meal_rule name.
    const counts = new Map()
    for (const l of todayLogs) {
      if (l.result !== 'allowed') continue
      const catName = l.meal_rule?.category?.name
        || l.meal_rule?.meal_category?.name
        || l.meal_rule?.name
        || 'Other'
      counts.set(catName, (counts.get(catName) || 0) + 1)
    }
    const byName = new Map(categories.map(c => [c.name, c]))
    const arr = [...counts.entries()].map(([name, qty], i) => ({
      key: name,
      name,
      qty,
      color: byName.get(name)?.color || CAT_COLORS[i % CAT_COLORS.length],
    }))
    return arr.sort((a, b) => b.qty - a.qty)
  }, [todayLogs, categories])

  // --- site breakdown ---
  const siteRows = useMemo(() => {
    const counts = new Map()
    const denyCounts = new Map()
    for (const l of todayLogs) {
      const sid = l.employee?.site?.id
      if (!sid) continue
      if (l.result === 'allowed') counts.set(sid, (counts.get(sid) || 0) + 1)
      else if (l.result === 'denied') denyCounts.set(sid, (denyCounts.get(sid) || 0) + 1)
    }
    const ruleIds = new Set(rules.map(r => r.id))
    const planByRule = new Map(
      (quotasData?.today?.by_rule ?? []).map(q => [q.meal_rule_id, q.quantity || 0])
    )
    const totalPlan = [...planByRule.values()].reduce((a, b) => a + b, 0)
    return allSites.map(s => {
      // Plan per site = (site weight by employee count) × total plan, falling back to even split.
      const plan = s.daily_plan ?? Math.max(0, Math.round(totalPlan / Math.max(1, allSites.length)))
      return {
        id: s.id,
        code: s.site_code,
        name: s.name,
        served: counts.get(s.id) || 0,
        plan,
        denied: denyCounts.get(s.id) || 0,
      }
    }).sort((a, b) => b.served - a.served)
  }, [todayLogs, allSites, rules, quotasData])

  return (
    <div className="relative">
      {/* Header row */}
      <header className="flex flex-wrap items-end justify-between gap-4 mb-lg">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-h1 text-h1 text-slate-100">Executive Dashboard</h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-mono text-[10.5px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px #22c391' }} />
              Live
            </span>
          </div>
          <p className="font-body-md text-body-md text-slate-400 mt-1">
            {selectedSite
              ? <>Showing <span className="text-slate-200 font-medium">{selectedSite.name}</span> <span className="font-mono text-slate-500">({selectedSite.site_code})</span>.</>
              : <>Real-time overview · <LiveClock /></>}
          </p>
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
            ...allSites.map(s => ({ value: String(s.id), label: `${s.site_code} — ${s.name}` })),
          ]}
        />
      </header>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-md">
        <Metric
          label="Active Employees"
          icon="badge"
          value={totalEmployees.toLocaleString()}
          color="violet"
        />
        <Metric
          label="Meals Served"
          icon="restaurant"
          value={served.toLocaleString()}
          color="blue"
        />
        <Metric
          label="Access Denied"
          icon="block"
          value={denied.toLocaleString()}
          color="red"
        />
        <Metric
          label="Efficiency"
          icon="speed"
          value={todayLogs.length > 0 ? `${efficiency.toFixed(1)}%` : '—'}
          color="orange"
        />
      </div>

      {/* Session strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-md">
        {sessions.map(s => <SessionCard key={s.key} session={s} />)}
      </div>

      {/* Row: scans by hour + categories */}
      <div className="grid grid-cols-12 gap-md mb-md">
        <div className="col-span-12 lg:col-span-8">
          <Card className="flex flex-col gap-3 h-full">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-h3 text-h3 text-slate-100">Scans by hour</h3>
                <p className="text-[11.5px] text-slate-500 mt-0.5">Approved & denied — across today.</p>
              </div>
              <div className="flex gap-3.5 text-[10.5px] text-slate-400">
                <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#5f9bef' }} />Approved</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#ef7060' }} />Denied</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm border border-dashed" style={{ borderColor: '#3f485e' }} />Projected</span>
              </div>
            </div>
            <div className="flex-1 min-h-[212px] h-[212px]">
              <HourlyChart buckets={hourly.buckets} nowHour={hourly.nowHour} />
            </div>
          </Card>
        </div>
        <div className="col-span-12 lg:col-span-4">
          <Card className="flex flex-col gap-2 h-full">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-h3 text-h3 text-slate-100">Meal categories</h3>
                <p className="text-[11.5px] text-slate-500 mt-0.5">Served today · across all sites.</p>
              </div>
              {categoryItems.length > 0 && (
                <span className="font-mono text-[10.5px] text-blue-300 bg-blue-500/15 px-2 py-1 rounded-md">{categoryItems.length} cats</span>
              )}
            </div>
            <CategoryDonut items={categoryItems} />
          </Card>
        </div>
      </div>

      {/* Row: site table + scan log */}
      <div className="grid grid-cols-12 gap-md">
        <div className="col-span-12 lg:col-span-6">
          <Card className="flex flex-col gap-3 h-full">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-h3 text-h3 text-slate-100">Site breakdown</h3>
                <p className="text-[11.5px] text-slate-500 mt-0.5">Meals served by camp · today.</p>
              </div>
              <a href="/sites" className="text-[11.5px] text-slate-400 hover:text-slate-200 border border-outline-variant/40 rounded-md px-2 py-1">View all →</a>
            </div>
            <div className="flex flex-col -mx-1">
              <div className="grid grid-cols-[64px_1fr_60px_60px_80px_36px] px-1 pb-2 text-[10.5px] uppercase tracking-wider text-slate-500 border-b border-outline-variant/30">
                <span>Camp</span><span>Site</span>
                <span className="text-right">Served</span>
                <span className="text-right">Plan</span>
                <span className="text-right">Progress</span>
                <span className="text-right">Deny</span>
              </div>
              {siteRows.length === 0 && (
                <div className="px-1 py-6 text-center text-slate-500 text-sm">No sites configured.</div>
              )}
              {siteRows.slice(0, 9).map(s => {
                const pct = s.plan > 0 ? Math.min(100, (s.served / s.plan) * 100) : 0
                const tone = pct > 80 ? '#22c391' : pct > 50 ? '#e8b341' : '#ef7060'
                return (
                  <div key={s.id} className="grid grid-cols-[64px_1fr_60px_60px_80px_36px] items-center px-1 py-2 border-b border-outline-variant/20 text-[12.5px] text-slate-200">
                    <span className="font-mono text-[10.5px] text-slate-500 truncate">{s.code}</span>
                    <span className="truncate">{s.name}</span>
                    <span className="text-right font-medium tabular-nums">{s.served}</span>
                    <span className="text-right font-mono text-[11px] text-slate-500 tabular-nums">{s.plan}</span>
                    <span className="flex items-center justify-end gap-1.5">
                      <span className="w-[42px] h-1 rounded-full bg-surface-container-highest/50 overflow-hidden">
                        <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: tone }} />
                      </span>
                      <span className="font-mono text-[10.5px] text-slate-500 w-7 text-right">{pct.toFixed(0)}%</span>
                    </span>
                    <span className={`text-right font-mono text-[11px] tabular-nums ${s.denied > 0 ? 'text-rose-400' : 'text-slate-500'}`}>{s.denied}</span>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-6">
          <Card className="flex flex-col gap-3 h-full">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-h3 text-h3 text-slate-100">Live scan log</h3>
                <p className="text-[11.5px] text-slate-500 mt-0.5">Realtime · last {recentLogs.length} event{recentLogs.length === 1 ? '' : 's'}.</p>
              </div>
              <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px #22c391' }} />
                tailing
              </span>
            </div>
            <div className="flex flex-col -mx-1">
              <div className="grid grid-cols-[82px_1fr_96px_80px_84px] px-1 pb-2 text-[10.5px] uppercase tracking-wider text-slate-500 border-b border-outline-variant/30">
                <span>Timestamp</span>
                <span>Employee</span>
                <span>ID</span>
                <span>Site</span>
                <span className="text-right">Status</span>
              </div>
              {recentLogs.length === 0 && (
                <div className="px-1 py-6 text-center text-slate-500 text-sm">No recent scan events.</div>
              )}
              {recentLogs.map(log => (
                <div key={log.id} className="grid grid-cols-[82px_1fr_96px_80px_84px] items-center px-1 py-2 border-b border-outline-variant/20 text-[12px] text-slate-200">
                  <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                    {new Date(log.scanned_at).toLocaleTimeString([], { hour12: false })}
                  </span>
                  <span className="truncate">{log.employee?.name || <span className="italic text-slate-500">unknown</span>}</span>
                  <span className="font-mono text-[10.5px] text-slate-400 truncate">{log.employee?.employee_code || log.scanned_code}</span>
                  <span className="text-slate-400 truncate text-[11.5px]">{log.employee?.site?.name || '—'}</span>
                  <span className="text-right"><StatusPill status={log.result} /></span>
                </div>
              ))}
            </div>
          </Card>
        </div>

      </div>
    </div>
  )
}
