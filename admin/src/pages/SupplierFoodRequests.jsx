import { useEffect, useState } from 'react'
import { useSupplierPortalFoodRequests, useSupplierPortalSites } from '../api/queries'
import Pagination from '../components/Pagination'
import Select from '../components/Select'
import DateRangePicker from '../components/DateRangePicker'

const STATUSES = [
  { value: '',          label: 'All statuses' },
  { value: 'pending',   label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

const statusBadge = (v) => {
  const base = 'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border '
  const map = {
    pending:   'bg-amber-900/40 text-amber-300 border-amber-800/50',
    confirmed: 'bg-blue-900/40 text-blue-300 border-blue-800/50',
    delivered: 'bg-green-900/40 text-green-400 border-green-800/50',
    cancelled: 'bg-slate-900/40 text-slate-400 border-slate-700/50',
  }
  return base + (map[v] || 'bg-slate-900/40 text-slate-400 border-slate-700/50')
}

export default function SupplierFoodRequests() {
  const [range, setRange] = useState({ from: '', to: '' })
  const [siteId, setSiteId] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  useEffect(() => { setPage(1) }, [range, siteId, status])

  const { data: sitesData } = useSupplierPortalSites()
  const sites = sitesData?.data ?? []

  const params = { page }
  if (range.from) params.from = range.from
  if (range.to)   params.to   = range.to
  if (siteId)     params.site_id = siteId
  if (status)     params.status  = status

  const { data, isLoading } = useSupplierPortalFoodRequests(params)
  const rows = data?.data ?? []

  return (
    <div className="space-y-md">
      <header className="flex flex-wrap items-center justify-between gap-md">
        <div>
          <h1 className="font-h1 text-h1 text-slate-100">Food Requests</h1>
          <p className="font-body-md text-body-md text-slate-400 mt-1">Meals requested from you across all assigned sites.</p>
        </div>
        <div className="flex flex-wrap gap-sm">
          <DateRangePicker value={range} onChange={setRange} placeholder="Date range" />
          <Select value={siteId} onChange={(v) => setSiteId(v)} className="w-44"
            options={[{ value: '', label: 'All sites' }, ...sites.map(s => ({ value: s.id, label: `${s.site_code} — ${s.name}` }))]} />
          <Select value={status} onChange={setStatus} className="w-40" options={STATUSES} />
        </div>
      </header>

      <div className="bg-surface-container-low border border-outline-variant/50 rounded-lg overflow-visible">
        <table className="w-full text-left text-body-md">
          <thead className="bg-surface-container-highest/20 text-label-sm text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Site</th>
              <th className="px-4 py-3 font-medium">Meal</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium text-right">Quantity</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {isLoading && <tr><td colSpan="7" className="p-6 text-center text-slate-500">Loading…</td></tr>}
            {!isLoading && rows.length === 0 && <tr><td colSpan="7" className="p-6 text-center text-slate-500">No food requests.</td></tr>}
            {rows.map(r => (
              <tr key={r.id} className="hover:bg-surface-container-highest/10">
                <td className="px-4 py-3 font-mono text-xs text-slate-300">{String(r.request_date).slice(0, 10)}</td>
                <td className="px-4 py-3 text-slate-200">{r.site ? `${r.site.site_code} — ${r.site.name}` : '—'}</td>
                <td className="px-4 py-3 text-slate-200">{r.meal_rule?.name || '—'}</td>
                <td className="px-4 py-3 text-slate-300">{r.meal_category?.name || '—'}</td>
                <td className="px-4 py-3 text-slate-100 font-mono font-semibold text-right">{r.quantity}</td>
                <td className="px-4 py-3"><span className={statusBadge(r.status)}>{(r.status || '').toUpperCase()}</span></td>
                <td className="px-4 py-3 text-slate-400 text-xs max-w-[20rem] truncate">{r.remarks || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination meta={data} onChange={setPage} />
      </div>
    </div>
  )
}
