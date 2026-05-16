import { useEffect, useState } from 'react'
import { useSupplierPortalDeliveryNotes, useSupplierPortalSites, useConfirmDelivery } from '../api/queries'
import Pagination from '../components/Pagination'
import Select from '../components/Select'
import DateRangePicker from '../components/DateRangePicker'

const STATUSES = [
  { value: '',          label: 'All statuses' },
  { value: 'pending',   label: 'Pending' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'partial',   label: 'Partial' },
  { value: 'rejected',  label: 'Rejected' },
]

const CONFIRM_STATUSES = [
  { value: 'delivered', label: 'Delivered (full)' },
  { value: 'partial',   label: 'Partial' },
  { value: 'rejected',  label: 'Rejected' },
  { value: 'pending',   label: 'Pending (revert)' },
]

const apiOrigin = (import.meta.env.VITE_API_BASE || 'http://localhost:8000/api').replace(/\/api\/?$/, '')
const fileUrl = (p) => (p ? `${apiOrigin}/storage/${p}` : null)

const statusBadge = (v) => {
  const base = 'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border '
  const map = {
    pending:   'bg-slate-900/40 text-slate-400 border-slate-700/50',
    delivered: 'bg-green-900/40 text-green-400 border-green-800/50',
    partial:   'bg-amber-900/40 text-amber-400 border-amber-800/50',
    rejected:  'bg-red-900/40 text-red-400 border-red-800/50',
  }
  return base + (map[v] || 'bg-slate-900/40 text-slate-400 border-slate-700/50')
}

const inputCls =
  'w-full bg-surface-container-high/50 border border-outline-variant/30 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 hover:bg-surface-container-high/70 hover:border-outline-variant/50 focus:bg-surface-container-high focus:border-blue-400 focus:ring-1 focus:ring-blue-400/60 focus:outline-none transition-all'

export default function SupplierDeliveryNotes() {
  const [range, setRange] = useState({ from: '', to: '' })
  const [siteId, setSiteId] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [confirming, setConfirming] = useState(null)
  useEffect(() => { setPage(1) }, [range, siteId, status])

  const { data: sitesData } = useSupplierPortalSites()
  const sites = sitesData?.data ?? []

  const params = { page }
  if (range.from) params.from = range.from
  if (range.to)   params.to   = range.to
  if (siteId)     params.site_id = siteId
  if (status)     params.status  = status

  const { data, isLoading } = useSupplierPortalDeliveryNotes(params)
  const rows = data?.data ?? []

  return (
    <div className="space-y-md">
      <header className="flex flex-wrap items-center justify-between gap-md">
        <div>
          <h1 className="font-h1 text-h1 text-slate-100">Delivery Notes</h1>
          <p className="font-body-md text-body-md text-slate-400 mt-1">Deliveries you have made or are pending. Click confirm to record delivery.</p>
        </div>
        <div className="flex flex-wrap gap-sm">
          <DateRangePicker value={range} onChange={setRange} placeholder="Date range" />
          <Select value={siteId} onChange={setSiteId} className="w-44"
            options={[{ value: '', label: 'All sites' }, ...sites.map(s => ({ value: s.id, label: `${s.site_code} — ${s.name}` }))]} />
          <Select value={status} onChange={setStatus} className="w-40" options={STATUSES} />
        </div>
      </header>

      <div className="bg-surface-container-low border border-outline-variant/50 rounded-lg overflow-visible">
        <table className="w-full text-left text-body-md">
          <thead className="bg-surface-container-highest/20 text-label-sm text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 font-medium">Note #</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Site</th>
              <th className="px-4 py-3 font-medium">Meal</th>
              <th className="px-4 py-3 font-medium text-right">Requested</th>
              <th className="px-4 py-3 font-medium text-right">Delivered</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Attachment</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {isLoading && <tr><td colSpan="9" className="p-6 text-center text-slate-500">Loading…</td></tr>}
            {!isLoading && rows.length === 0 && <tr><td colSpan="9" className="p-6 text-center text-slate-500">No delivery notes.</td></tr>}
            {rows.map(d => (
              <tr key={d.id} className="hover:bg-surface-container-highest/10">
                <td className="px-4 py-3 font-mono text-xs text-slate-300">{d.note_no}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-300">
                  {String(d.delivery_date).slice(0, 10)}
                  {d.delivery_time && <span className="text-slate-500 ml-1">{String(d.delivery_time).slice(0, 5)}</span>}
                </td>
                <td className="px-4 py-3 text-slate-200">{d.site ? `${d.site.site_code} — ${d.site.name}` : '—'}</td>
                <td className="px-4 py-3 text-slate-300">{d.meal_rule?.name || '—'}{d.meal_category ? <span className="text-slate-500"> · {d.meal_category.name}</span> : null}</td>
                <td className="px-4 py-3 text-slate-300 font-mono text-right">{d.quantity_requested ?? '—'}</td>
                <td className="px-4 py-3 text-slate-100 font-mono font-semibold text-right">{d.quantity_delivered ?? '—'}</td>
                <td className="px-4 py-3"><span className={statusBadge(d.status)}>{(d.status || '').toUpperCase()}</span></td>
                <td className="px-4 py-3">
                  {d.attachment_path
                    ? <a href={fileUrl(d.attachment_path)} target="_blank" rel="noreferrer" className="text-blue-300 hover:text-blue-200 text-xs inline-flex items-center gap-1">
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>description</span>View
                      </a>
                    : <span className="text-slate-500 text-xs">—</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setConfirming({
                    id: d.id,
                    note_no: d.note_no,
                    quantity_requested: d.quantity_requested,
                    status: d.status === 'pending' ? 'delivered' : d.status,
                    quantity_delivered: d.quantity_delivered ?? d.quantity_requested ?? '',
                    notes: d.notes || '',
                    attachment: null,
                  })}
                    className="text-xs px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-semibold inline-flex items-center gap-1">
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>task_alt</span>Confirm
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination meta={data} onChange={setPage} />
      </div>

      {confirming && <ConfirmModal note={confirming} setNote={setConfirming} onClose={() => setConfirming(null)} />}
    </div>
  )
}

function ConfirmModal({ note, setNote, onClose }) {
  const confirm = useConfirmDelivery()
  const [err, setErr] = useState(null)

  const onSubmit = async (ev) => {
    ev.preventDefault()
    setErr(null)
    try {
      await confirm.mutateAsync({
        id: note.id,
        status: note.status,
        quantity_delivered: ['delivered', 'partial'].includes(note.status) ? note.quantity_delivered : null,
        notes: note.notes,
        attachment: note.attachment,
      })
      onClose()
    } catch (e) {
      const errors = e?.response?.data?.errors
      const first = errors ? Object.values(errors)[0]?.[0] : null
      setErr(first || e?.response?.data?.message || 'Save failed')
    }
  }

  const needsQty = ['delivered', 'partial'].includes(note.status)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <form onSubmit={onSubmit} className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-lg w-full max-w-md space-y-md">
        <div>
          <h2 className="text-h3 font-h3 text-slate-100">Confirm delivery</h2>
          <p className="text-body-md text-slate-400 mt-1">Note <span className="font-mono">{note.note_no}</span> · requested <span className="font-mono">{note.quantity_requested ?? '—'}</span></p>
        </div>

        <div>
          <label className="block text-label-md text-slate-300 mb-1.5">Outcome</label>
          <Select value={note.status} onChange={(v) => setNote({ ...note, status: v })} options={CONFIRM_STATUSES} />
        </div>

        {needsQty && (
          <div>
            <label className="block text-label-md text-slate-300 mb-1.5">Quantity delivered</label>
            <input required type="number" min={0} value={note.quantity_delivered ?? ''}
              onChange={e => setNote({ ...note, quantity_delivered: e.target.value })}
              className={`${inputCls} font-mono`} />
          </div>
        )}

        <div>
          <label className="block text-label-md text-slate-300 mb-1.5">Notes (optional)</label>
          <textarea rows={3} value={note.notes || ''} onChange={e => setNote({ ...note, notes: e.target.value })}
            className={`${inputCls} resize-y`} placeholder="Anything to flag about this delivery…" />
        </div>

        <div>
          <label className="block text-label-md text-slate-300 mb-1.5">Attachment (optional)</label>
          <input type="file" onChange={e => setNote({ ...note, attachment: e.target.files?.[0] || null })}
            className="block text-sm text-slate-300 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600/20 file:text-blue-300 hover:file:bg-blue-600/30" />
          <p className="text-[11px] text-slate-500 mt-1">Photo of delivery, signed slip, etc. Max 10 MB.</p>
        </div>

        {err && <div className="text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded px-3 py-2">{err}</div>}

        <div className="flex justify-end gap-sm pt-sm">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-outline-variant/50 text-sm text-slate-300 hover:bg-surface-container-highest/40 focus:outline-none focus:ring-2 focus:ring-blue-400/30">Cancel</button>
          <button type="submit" disabled={confirm.isPending}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 disabled:opacity-60">
            {confirm.isPending ? 'Saving…' : 'Confirm'}
          </button>
        </div>
      </form>
    </div>
  )
}
