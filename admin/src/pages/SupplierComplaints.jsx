import { useEffect, useState } from 'react'
import { useSupplierPortalComplaints, useRespondToComplaint } from '../api/queries'
import Pagination from '../components/Pagination'
import Select from '../components/Select'
import DateRangePicker from '../components/DateRangePicker'

const STATUSES = [
  { value: '',          label: 'All statuses' },
  { value: 'open',      label: 'Open' },
  { value: 'in_review', label: 'In Review' },
  { value: 'resolved',  label: 'Resolved' },
  { value: 'closed',    label: 'Closed' },
]

const statusBadge = (v) => {
  const base = 'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border '
  const map = {
    open:      'bg-red-900/40 text-red-300 border-red-800/50',
    in_review: 'bg-amber-900/40 text-amber-300 border-amber-800/50',
    resolved:  'bg-green-900/40 text-green-400 border-green-800/50',
    closed:    'bg-slate-900/40 text-slate-400 border-slate-700/50',
  }
  return base + (map[v] || 'bg-slate-900/40 text-slate-400 border-slate-700/50')
}

const inputCls =
  'w-full bg-surface-container-high/50 border border-outline-variant/30 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 hover:bg-surface-container-high/70 hover:border-outline-variant/50 focus:bg-surface-container-high focus:border-blue-400 focus:ring-1 focus:ring-blue-400/60 focus:outline-none transition-all'

export default function SupplierComplaints() {
  const [range, setRange] = useState({ from: '', to: '' })
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [responding, setResponding] = useState(null)
  useEffect(() => { setPage(1) }, [range, status])

  const params = { page }
  if (range.from) params.from = range.from
  if (range.to)   params.to   = range.to
  if (status)     params.status = status

  const { data, isLoading } = useSupplierPortalComplaints(params)
  const rows = data?.data ?? []

  return (
    <div className="space-y-md">
      <header className="flex flex-wrap items-center justify-between gap-md">
        <div>
          <h1 className="font-h1 text-h1 text-slate-100">Complaints</h1>
          <p className="font-body-md text-body-md text-slate-400 mt-1">Complaints filed against your service. Respond to move them into review.</p>
        </div>
        <div className="flex flex-wrap gap-sm">
          <DateRangePicker value={range} onChange={setRange} placeholder="Date range" />
          <Select value={status} onChange={setStatus} className="w-40" options={STATUSES} />
        </div>
      </header>

      <div className="bg-surface-container-low border border-outline-variant/50 rounded-lg overflow-visible">
        <table className="w-full text-left text-body-md">
          <thead className="bg-surface-container-highest/20 text-label-sm text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 font-medium">Ref</th>
              <th className="px-4 py-3 font-medium">Logged</th>
              <th className="px-4 py-3 font-medium">Site</th>
              <th className="px-4 py-3 font-medium">Issue</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">My response</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {isLoading && <tr><td colSpan="8" className="p-6 text-center text-slate-500">Loading…</td></tr>}
            {!isLoading && rows.length === 0 && <tr><td colSpan="8" className="p-6 text-center text-slate-500">No complaints. 🎉</td></tr>}
            {rows.map(c => (
              <tr key={c.id} className="hover:bg-surface-container-highest/10 align-top">
                <td className="px-4 py-3 font-mono text-xs text-slate-300">{c.ref_no}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-300">{String(c.date_logged).slice(0, 10)}</td>
                <td className="px-4 py-3 text-slate-200">{c.site ? `${c.site.site_code} — ${c.site.name}` : '—'}</td>
                <td className="px-4 py-3 text-slate-300 capitalize">{(c.issue_type || '').replace(/_/g, ' ')}</td>
                <td className="px-4 py-3"><span className={statusBadge(c.status)}>{(c.status || '').toUpperCase().replace('_', ' ')}</span></td>
                <td className="px-4 py-3 text-slate-300 text-xs max-w-[16rem]">
                  {c.supplier_response ? (
                    <div>
                      <div className="truncate" title={c.supplier_response}>{c.supplier_response}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{c.supplier_responded_at ? String(c.supplier_responded_at).replace('T', ' ').slice(0, 16) : ''}</div>
                    </div>
                  ) : <span className="text-slate-500">—</span>}
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs max-w-[20rem] truncate" title={c.description}>{c.description || '—'}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setResponding({ id: c.id, ref_no: c.ref_no, description: c.description, supplier_response: c.supplier_response || '' })}
                    className="text-xs px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-semibold inline-flex items-center gap-1">
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>reply</span>
                    {c.supplier_response ? 'Edit response' : 'Respond'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination meta={data} onChange={setPage} />
      </div>

      {responding && <RespondModal complaint={responding} setComplaint={setResponding} onClose={() => setResponding(null)} />}
    </div>
  )
}

function RespondModal({ complaint, setComplaint, onClose }) {
  const respond = useRespondToComplaint()
  const [err, setErr] = useState(null)

  const onSubmit = async (ev) => {
    ev.preventDefault()
    setErr(null)
    try {
      await respond.mutateAsync({ id: complaint.id, supplier_response: complaint.supplier_response })
      onClose()
    } catch (e) {
      const errors = e?.response?.data?.errors
      const first = errors ? Object.values(errors)[0]?.[0] : null
      setErr(first || e?.response?.data?.message || 'Save failed')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <form onSubmit={onSubmit} className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-lg w-full max-w-lg space-y-md">
        <div>
          <h2 className="text-h3 font-h3 text-slate-100">Respond to complaint</h2>
          <p className="text-body-md text-slate-400 mt-1">Ref <span className="font-mono">{complaint.ref_no}</span></p>
        </div>

        <div className="bg-surface-container-lowest/50 border border-outline-variant/40 rounded p-3 text-sm text-slate-300">
          <div className="text-label-sm text-slate-500 uppercase tracking-wider mb-1">Original complaint</div>
          <div className="text-slate-200 whitespace-pre-wrap">{complaint.description || '—'}</div>
        </div>

        <div>
          <label className="block text-label-md text-slate-300 mb-1.5">Your response</label>
          <textarea rows={5} required value={complaint.supplier_response || ''}
            onChange={e => setComplaint({ ...complaint, supplier_response: e.target.value })}
            className={`${inputCls} resize-y`} placeholder="Explain what happened, what you'll do about it, and the timeline…" />
        </div>

        {err && <div className="text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded px-3 py-2">{err}</div>}

        <div className="flex justify-end gap-sm pt-sm">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-outline-variant/50 text-sm text-slate-300 hover:bg-surface-container-highest/40 focus:outline-none focus:ring-2 focus:ring-blue-400/30">Cancel</button>
          <button type="submit" disabled={respond.isPending}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 disabled:opacity-60">
            {respond.isPending ? 'Submitting…' : 'Submit response'}
          </button>
        </div>
      </form>
    </div>
  )
}
