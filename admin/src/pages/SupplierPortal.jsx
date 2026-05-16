import { Link } from 'react-router-dom'
import { useMe, useSupplierDashboard } from '../api/queries'

function Metric({ label, icon, value, accent = 'text-blue-300' }) {
  return (
    <div className="bg-surface-container-low border border-outline-variant/50 rounded-lg p-4">
      <div className="flex justify-between items-start mb-3">
        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{label}</span>
        <span className={`material-symbols-outlined ${accent}`} style={{ fontSize: 18 }}>{icon}</span>
      </div>
      <div className="text-2xl font-bold text-slate-100 leading-none">{value}</div>
    </div>
  )
}

const statusBadge = (status, palette = {}) => {
  const base = 'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border '
  const map = {
    completed: 'bg-green-900/40 text-green-400 border-green-800/50',
    pending:   'bg-amber-900/40 text-amber-300 border-amber-800/50',
    open:      'bg-red-900/40 text-red-300 border-red-800/50',
    in_review: 'bg-amber-900/40 text-amber-300 border-amber-800/50',
    resolved:  'bg-green-900/40 text-green-400 border-green-800/50',
    cancelled: 'bg-slate-900/40 text-slate-400 border-slate-700/50',
    ...palette,
  }
  return base + (map[status] || 'bg-slate-900/40 text-slate-400 border-slate-700/50')
}

export default function SupplierPortal() {
  const { data: me } = useMe()
  const { data, isLoading } = useSupplierDashboard()

  const k = data?.kpis ?? {}
  const recentRequests = data?.recent_requests ?? []
  const recentComplaints = data?.recent_complaints ?? []

  return (
    <div className="space-y-lg">
      <header>
        <h1 className="font-h1 text-h1 text-slate-100">Welcome, {me?.name?.split(' ')[0] || 'there'}</h1>
        <p className="font-body-md text-body-md text-slate-400 mt-1">
          Operational overview for <span className="text-slate-200 font-semibold">{me?.supplier?.name}</span>.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
        <Metric label="Requests today (meals)" icon="receipt_long" value={isLoading ? '—' : k.requests_today ?? 0} accent="text-blue-300" />
        <Metric label="Deliveries this week"   icon="inventory_2"  value={isLoading ? '—' : k.deliveries_this_week ?? 0} accent="text-green-300" />
        <Metric label="Open complaints"        icon="report"        value={isLoading ? '—' : k.open_complaints ?? 0} accent="text-red-300" />
        <Metric label="Active assignments"     icon="assignment"    value={isLoading ? '—' : k.active_assignments ?? 0} accent="text-amber-300" />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-md">
        <div className="bg-surface-container-low border border-outline-variant/50 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-outline-variant/40 flex items-center justify-between">
            <h2 className="text-h3 font-h3 text-slate-100">Recent food requests</h2>
            <Link to="/supplier/food-requests" className="text-xs text-blue-300 hover:text-blue-200">View all →</Link>
          </div>
          {isLoading ? (
            <div className="p-6 text-center text-slate-500 text-sm">Loading…</div>
          ) : recentRequests.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm">No recent requests.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-surface-container-highest/20 text-label-sm text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Site</th>
                  <th className="px-3 py-2 text-left">Meal</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {recentRequests.map(r => (
                  <tr key={r.id}>
                    <td className="px-3 py-2 text-slate-300 font-mono text-xs">{String(r.request_date).slice(0, 10)}</td>
                    <td className="px-3 py-2 text-slate-300">{r.site?.name || '—'}</td>
                    <td className="px-3 py-2 text-slate-300">{r.meal_rule?.name || '—'}</td>
                    <td className="px-3 py-2 text-slate-200 font-mono text-right">{r.quantity}</td>
                    <td className="px-3 py-2"><span className={statusBadge(r.status)}>{(r.status || '').toUpperCase()}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-surface-container-low border border-outline-variant/50 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-outline-variant/40 flex items-center justify-between">
            <h2 className="text-h3 font-h3 text-slate-100">Recent complaints</h2>
            <Link to="/supplier/complaints" className="text-xs text-blue-300 hover:text-blue-200">View all →</Link>
          </div>
          {isLoading ? (
            <div className="p-6 text-center text-slate-500 text-sm">Loading…</div>
          ) : recentComplaints.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm">No recent complaints.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-surface-container-highest/20 text-label-sm text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-2 text-left">Ref</th>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Site</th>
                  <th className="px-3 py-2 text-left">Issue</th>
                  <th className="px-3 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {recentComplaints.map(c => (
                  <tr key={c.id}>
                    <td className="px-3 py-2 text-slate-300 font-mono text-xs">{c.ref_no}</td>
                    <td className="px-3 py-2 text-slate-300 font-mono text-xs">{String(c.date_logged).slice(0, 10)}</td>
                    <td className="px-3 py-2 text-slate-300">{c.site?.name || '—'}</td>
                    <td className="px-3 py-2 text-slate-300 capitalize">{(c.issue_type || '').replace(/_/g, ' ')}</td>
                    <td className="px-3 py-2"><span className={statusBadge(c.status)}>{(c.status || '').toUpperCase().replace('_', ' ')}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  )
}
