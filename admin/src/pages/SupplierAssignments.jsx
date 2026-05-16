import { useSupplierPortalAssignments } from '../api/queries'

const today = () => new Date().toISOString().slice(0, 10)

const periodBadge = (a) => {
  const t = today()
  const startOk = !a.start_date || a.start_date <= t
  const endOk   = !a.end_date   || a.end_date   >= t
  const active  = startOk && endOk
  const base = 'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border '
  if (active) return base + 'bg-green-900/40 text-green-400 border-green-800/50'
  if (a.start_date && a.start_date > t) return base + 'bg-blue-900/40 text-blue-300 border-blue-800/50'
  return base + 'bg-slate-900/40 text-slate-400 border-slate-700/50'
}

const periodLabel = (a) => {
  const t = today()
  const startOk = !a.start_date || a.start_date <= t
  const endOk   = !a.end_date   || a.end_date   >= t
  if (startOk && endOk) return 'ACTIVE'
  if (a.start_date && a.start_date > t) return 'UPCOMING'
  return 'ENDED'
}

export default function SupplierAssignments() {
  const { data, isLoading } = useSupplierPortalAssignments()
  const rows = data?.data ?? []

  return (
    <div className="space-y-md">
      <header>
        <h1 className="font-h1 text-h1 text-slate-100">My Assignments</h1>
        <p className="font-body-md text-body-md text-slate-400 mt-1">Sites and meals you are contracted to deliver.</p>
      </header>

      <div className="bg-surface-container-low border border-outline-variant/50 rounded-lg overflow-visible">
        <table className="w-full text-left text-body-md">
          <thead className="bg-surface-container-highest/20 text-label-sm text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 font-medium">Site</th>
              <th className="px-4 py-3 font-medium">Meal</th>
              <th className="px-4 py-3 font-medium">Start</th>
              <th className="px-4 py-3 font-medium">End</th>
              <th className="px-4 py-3 font-medium">Period</th>
              <th className="px-4 py-3 font-medium">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {isLoading && <tr><td colSpan="6" className="p-6 text-center text-slate-500">Loading…</td></tr>}
            {!isLoading && rows.length === 0 && <tr><td colSpan="6" className="p-6 text-center text-slate-500">No assignments.</td></tr>}
            {rows.map(a => (
              <tr key={a.id} className="hover:bg-surface-container-highest/10">
                <td className="px-4 py-3 text-slate-200">{a.site ? `${a.site.site_code} — ${a.site.name}` : '—'}</td>
                <td className="px-4 py-3 text-slate-200">{a.meal_rule?.name || '—'}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-300">{a.start_date ? String(a.start_date).slice(0, 10) : '—'}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-300">{a.end_date ? String(a.end_date).slice(0, 10) : '—'}</td>
                <td className="px-4 py-3"><span className={periodBadge(a)}>{periodLabel(a)}</span></td>
                <td className="px-4 py-3 text-slate-400 text-xs max-w-[20rem] truncate">{a.remarks || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
