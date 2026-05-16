import { useEffect, useState } from 'react'
import {
  useMealRemarks, useSaveMealRemark, useDeleteMealRemark,
  useSites, useSuppliers, useMealRules, useMe,
} from '../api/queries'
import Pagination from '../components/Pagination'
import Select from '../components/Select'
import DatePicker from '../components/DatePicker'
import DateRangePicker from '../components/DateRangePicker'

const inputCls =
  'w-full bg-surface-container-high/50 border border-outline-variant/30 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 hover:bg-surface-container-high/70 hover:border-outline-variant/50 focus:bg-surface-container-high focus:border-blue-400 focus:ring-1 focus:ring-blue-400/60 focus:outline-none transition-all'

const today = () => new Date().toISOString().slice(0, 10)

const blank = () => ({
  supplier_id: '',
  site_id: '',
  meal_rule_id: '',
  remark_date: today(),
  meals_requested: '',
  remark: '',
})

const authorBadge = (type) => {
  const base = 'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border '
  if (type === 'admin') return base + 'bg-blue-900/40 text-blue-300 border-blue-800/50'
  return base + 'bg-amber-900/40 text-amber-300 border-amber-800/50'
}

export default function MealRemarks() {
  const { data: me } = useMe()
  const [range, setRange] = useState({ from: '', to: '' })
  const [supplierId, setSupplierId] = useState('')
  const [siteId, setSiteId] = useState('')
  const [author, setAuthor] = useState('')
  const [page, setPage] = useState(1)
  const [adding, setAdding] = useState(null)
  useEffect(() => { setPage(1) }, [range, supplierId, siteId, author])

  const { data: suppliersData } = useSuppliers({ all: 1 })
  const { data: sitesData } = useSites({ all: 1 })
  const { data: rulesData } = useMealRules({ per_page: 100 })
  const suppliers = suppliersData?.data ?? []
  const sites = sitesData?.data ?? []
  const rules = rulesData?.data ?? []

  const params = { page }
  if (range.from)   params.from = range.from
  if (range.to)     params.to   = range.to
  if (supplierId)   params.supplier_id = supplierId
  if (siteId)       params.site_id = siteId
  if (author)       params.added_by_type = author

  const { data, isLoading } = useMealRemarks(params)
  const save = useSaveMealRemark()
  const del = useDeleteMealRemark()
  const rows = data?.data ?? []

  const canCreate = !!me?.permissions && (me.permissions.includes('*') || me.permissions.includes('meal-remarks.create'))
  const canDelete = !!me?.permissions && (me.permissions.includes('*') || me.permissions.includes('meal-remarks.delete'))

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-md mb-lg">
        <div>
          <h1 className="font-h1 text-h1 text-slate-100">Meal Remarks</h1>
          <p className="font-body-md text-body-md text-slate-400 mt-1">Day-by-day remarks on meals, posted by timekeepers and suppliers.</p>
        </div>
        {canCreate && (
          <button onClick={() => setAdding(blank())}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 flex items-center gap-2 transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_comment</span>Add remark
          </button>
        )}
      </header>

      <div className="flex flex-wrap items-center gap-sm mb-md">
        <DateRangePicker value={range} onChange={setRange} placeholder="Date range" />
        <Select value={supplierId} onChange={setSupplierId} searchable className="w-56"
          options={[{ value: '', label: 'All suppliers' }, ...suppliers.map(s => ({ value: String(s.id), label: `${s.supplier_code} — ${s.name}` }))]} />
        <Select value={siteId} onChange={setSiteId} searchable className="w-56"
          options={[{ value: '', label: 'All sites' }, ...sites.map(s => ({ value: String(s.id), label: `${s.site_code} — ${s.name}` }))]} />
        <Select value={author} onChange={setAuthor} className="w-44"
          options={[
            { value: '', label: 'All authors' },
            { value: 'admin', label: 'Timekeeper' },
            { value: 'supplier_user', label: 'Supplier' },
          ]} />
        {(range.from || range.to || supplierId || siteId || author) && (
          <button type="button" onClick={() => { setRange({ from: '', to: '' }); setSupplierId(''); setSiteId(''); setAuthor('') }}
            className="flex items-center gap-1 px-3 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>Clear
          </button>
        )}
      </div>

      <div className="bg-surface-container-low border border-outline-variant/50 rounded-lg overflow-visible">
        <table className="w-full text-left text-body-md">
          <thead className="bg-surface-container-highest/20 text-label-sm text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Supplier</th>
              <th className="px-4 py-3 font-medium">Site</th>
              <th className="px-4 py-3 font-medium">Meal</th>
              <th className="px-4 py-3 font-medium text-right">Meals</th>
              <th className="px-4 py-3 font-medium">Remark</th>
              <th className="px-4 py-3 font-medium">Added by</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {isLoading && <tr><td colSpan="8" className="p-6 text-center text-slate-500">Loading…</td></tr>}
            {!isLoading && rows.length === 0 && <tr><td colSpan="8" className="p-6 text-center text-slate-500">No remarks.</td></tr>}
            {rows.map(r => (
              <tr key={r.id} className="hover:bg-surface-container-highest/10 align-top">
                <td className="px-4 py-3 font-mono text-xs text-slate-300">{String(r.remark_date).slice(0, 10)}</td>
                <td className="px-4 py-3 text-slate-200">{r.supplier ? `${r.supplier.supplier_code} — ${r.supplier.name}` : '—'}</td>
                <td className="px-4 py-3 text-slate-300">{r.site ? `${r.site.site_code} — ${r.site.name}` : '—'}</td>
                <td className="px-4 py-3 text-slate-300">{r.meal_rule?.name || '—'}</td>
                <td className="px-4 py-3 font-mono text-right text-slate-300">{r.meals_requested ?? '—'}</td>
                <td className="px-4 py-3 text-slate-200 text-sm max-w-[22rem] whitespace-pre-wrap">{r.remark}</td>
                <td className="px-4 py-3 text-xs">
                  <span className={authorBadge(r.added_by_type)}>{r.added_by_type === 'admin' ? 'TIMEKEEPER' : 'SUPPLIER'}</span>
                  <div className="text-slate-300 mt-1">{r.added_by_name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{String(r.created_at).replace('T', ' ').slice(0, 16)}</div>
                </td>
                <td className="px-4 py-3 text-right">
                  {canDelete && (
                    <button onClick={() => { if (confirm('Delete this remark?')) del.mutate(r.id) }}
                      className="p-1 rounded hover:bg-red-900/30 text-red-400" title="Delete">
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination meta={data} onChange={setPage} />
      </div>

      {adding && <RemarkForm
        remark={adding}
        setRemark={setAdding}
        suppliers={suppliers}
        sites={sites}
        rules={rules}
        onSave={async () => {
          const payload = { ...adding }
          if (!payload.meal_rule_id) delete payload.meal_rule_id
          if (payload.meals_requested === '' || payload.meals_requested == null) delete payload.meals_requested
          await save.mutateAsync(payload)
          setAdding(null)
        }}
        onCancel={() => setAdding(null)}
        saving={save.isPending}
      />}
    </>
  )
}

function RemarkForm({ remark, setRemark, suppliers, sites, rules, onSave, onCancel, saving }) {
  const [err, setErr] = useState(null)
  const onSubmit = async (ev) => {
    ev.preventDefault()
    setErr(null)
    try {
      await onSave()
    } catch (e) {
      const errors = e?.response?.data?.errors
      const first = errors ? Object.values(errors)[0]?.[0] : null
      setErr(first || e?.response?.data?.message || 'Save failed')
    }
  }
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <form onSubmit={onSubmit} className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-lg w-full max-w-lg space-y-md max-h-[90vh] overflow-y-auto">
        <div>
          <h2 className="text-h3 font-h3 text-slate-100">New remark</h2>
          <p className="text-body-md text-slate-400 mt-1">Posted as a timekeeper note. Visible to the supplier.</p>
        </div>

        <div className="grid grid-cols-2 gap-md">
          <div>
            <label className="block text-label-md text-slate-300 mb-1.5">Date</label>
            <DatePicker value={remark.remark_date} onChange={(v) => setRemark({ ...remark, remark_date: v })} />
          </div>
          <div>
            <label className="block text-label-md text-slate-300 mb-1.5">Supplier</label>
            <Select required searchable value={remark.supplier_id}
              onChange={(v) => setRemark({ ...remark, supplier_id: v })}
              options={[{ value: '', label: '— Select supplier —' }, ...suppliers.map(s => ({ value: String(s.id), label: `${s.supplier_code} — ${s.name}` }))]} />
          </div>
          <div>
            <label className="block text-label-md text-slate-300 mb-1.5">Site</label>
            <Select required searchable value={remark.site_id}
              onChange={(v) => setRemark({ ...remark, site_id: v })}
              options={[{ value: '', label: '— Select site —' }, ...sites.map(s => ({ value: String(s.id), label: `${s.site_code} — ${s.name}` }))]} />
          </div>
          <div>
            <label className="block text-label-md text-slate-300 mb-1.5">Meal (optional)</label>
            <Select value={remark.meal_rule_id} onChange={(v) => setRemark({ ...remark, meal_rule_id: v })}
              options={[{ value: '', label: '— Any —' }, ...rules.map(r => ({ value: String(r.id), label: r.name }))]} />
          </div>
          <div className="col-span-2">
            <label className="block text-label-md text-slate-300 mb-1.5">Meals (optional)</label>
            <input type="number" min={0} value={remark.meals_requested}
              onChange={e => setRemark({ ...remark, meals_requested: e.target.value })}
              className={`${inputCls} font-mono`} placeholder="e.g. 500" />
          </div>
        </div>

        <div>
          <label className="block text-label-md text-slate-300 mb-1.5">Remark</label>
          <textarea required rows={4} value={remark.remark}
            onChange={e => setRemark({ ...remark, remark: e.target.value })}
            className={`${inputCls} resize-y`} placeholder="e.g. Food quality not good. Daily late delivery, escalated to supplier." />
        </div>

        {err && <div className="text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded px-3 py-2">{err}</div>}

        <div className="flex justify-end gap-sm pt-sm">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-outline-variant/50 text-sm text-slate-300 hover:bg-surface-container-highest/40 focus:outline-none focus:ring-2 focus:ring-blue-400/30">Cancel</button>
          <button type="submit" disabled={saving}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 disabled:opacity-60">
            {saving ? 'Posting…' : 'Post remark'}
          </button>
        </div>
      </form>
    </div>
  )
}
