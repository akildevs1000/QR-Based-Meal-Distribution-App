import { useEffect, useState } from 'react'
import {
  useSupplierMealRemarks, useSaveSupplierMealRemark, useDeleteSupplierMealRemark,
  useSupplierPortalSites, useSupplierPortalMealRules, useMe,
} from '../api/queries'
import Pagination from '../components/Pagination'
import Select from '../components/Select'
import DatePicker from '../components/DatePicker'
import DateRangePicker from '../components/DateRangePicker'

const inputCls =
  'w-full bg-surface-container-high/50 border border-outline-variant/30 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 hover:bg-surface-container-high/70 hover:border-outline-variant/50 focus:bg-surface-container-high focus:border-blue-400 focus:ring-1 focus:ring-blue-400/60 focus:outline-none transition-all'

const today = () => new Date().toISOString().slice(0, 10)

const blank = () => ({
  site_id: '',
  meal_rule_id: '',
  remark_date: today(),
  meals_requested: '',
  remark: '',
})

export default function SupplierRemarks() {
  const { data: me } = useMe()
  const [range, setRange] = useState({ from: '', to: '' })
  const [siteId, setSiteId] = useState('')
  const [page, setPage] = useState(1)
  const [adding, setAdding] = useState(null)
  useEffect(() => { setPage(1) }, [range, siteId])

  const { data: sitesData } = useSupplierPortalSites()
  const { data: rulesData } = useSupplierPortalMealRules()
  const sites = sitesData?.data ?? []
  const rules = rulesData?.data ?? []

  const params = { page }
  if (range.from) params.from = range.from
  if (range.to)   params.to   = range.to
  if (siteId)     params.site_id = siteId

  const { data, isLoading } = useSupplierMealRemarks(params)
  const save = useSaveSupplierMealRemark()
  const del = useDeleteSupplierMealRemark()
  const rows = data?.data ?? []

  return (
    <div className="space-y-md">
      <header className="flex flex-wrap items-center justify-between gap-md">
        <div>
          <h1 className="font-h1 text-h1 text-slate-100">Remarks</h1>
          <p className="font-body-md text-body-md text-slate-400 mt-1">Post remarks on your meals — quality notes, delivery issues, menu changes, etc.</p>
        </div>
        <div className="flex flex-wrap gap-sm">
          <DateRangePicker value={range} onChange={setRange} placeholder="Date range" />
          <Select value={siteId} onChange={setSiteId} className="w-44"
            options={[{ value: '', label: 'All sites' }, ...sites.map(s => ({ value: s.id, label: `${s.site_code} — ${s.name}` }))]} />
          <button onClick={() => setAdding(blank())}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 flex items-center gap-2 transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_comment</span>Add remark
          </button>
        </div>
      </header>

      <div className="bg-surface-container-low border border-outline-variant/50 rounded-lg overflow-visible">
        <table className="w-full text-left text-body-md">
          <thead className="bg-surface-container-highest/20 text-label-sm text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Site</th>
              <th className="px-4 py-3 font-medium">Meal</th>
              <th className="px-4 py-3 font-medium text-right">Meals</th>
              <th className="px-4 py-3 font-medium">Remark</th>
              <th className="px-4 py-3 font-medium">Added by</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {isLoading && <tr><td colSpan="7" className="p-6 text-center text-slate-500">Loading…</td></tr>}
            {!isLoading && rows.length === 0 && <tr><td colSpan="7" className="p-6 text-center text-slate-500">No remarks yet.</td></tr>}
            {rows.map(r => {
              const isMine = r.added_by_type === 'supplier_user' && r.added_by_id === me?.id
              return (
                <tr key={r.id} className="hover:bg-surface-container-highest/10 align-top">
                  <td className="px-4 py-3 font-mono text-xs text-slate-300">{String(r.remark_date).slice(0, 10)}</td>
                  <td className="px-4 py-3 text-slate-200">{r.site ? `${r.site.site_code} — ${r.site.name}` : '—'}</td>
                  <td className="px-4 py-3 text-slate-300">{r.meal_rule?.name || '—'}</td>
                  <td className="px-4 py-3 font-mono text-right text-slate-300">{r.meals_requested ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-200 text-sm max-w-[24rem] whitespace-pre-wrap">{r.remark}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    <div>{r.added_by_name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{String(r.created_at).replace('T', ' ').slice(0, 16)}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isMine && (
                      <button onClick={() => { if (confirm('Delete this remark?')) del.mutate(r.id) }}
                        className="p-1 rounded hover:bg-red-900/30 text-red-400" title="Delete">
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <Pagination meta={data} onChange={setPage} />
      </div>

      {adding && <RemarkForm
        remark={adding}
        setRemark={setAdding}
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
    </div>
  )
}

function RemarkForm({ remark, setRemark, sites, rules, onSave, onCancel, saving }) {
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
      <form onSubmit={onSubmit} className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-lg w-full max-w-lg space-y-md">
        <div>
          <h2 className="text-h3 font-h3 text-slate-100">New remark</h2>
          <p className="text-body-md text-slate-400 mt-1">Posted as a supplier-side note. Visible to admins.</p>
        </div>

        <div className="grid grid-cols-2 gap-md">
          <div>
            <label className="block text-label-md text-slate-300 mb-1.5">Date</label>
            <DatePicker value={remark.remark_date} onChange={(v) => setRemark({ ...remark, remark_date: v })} />
          </div>
          <div>
            <label className="block text-label-md text-slate-300 mb-1.5">Site</label>
            <Select required value={remark.site_id} onChange={(v) => setRemark({ ...remark, site_id: v })}
              options={[{ value: '', label: '— Select site —' }, ...sites.map(s => ({ value: s.id, label: `${s.site_code} — ${s.name}` }))]} />
          </div>
          <div>
            <label className="block text-label-md text-slate-300 mb-1.5">Meal (optional)</label>
            <Select value={remark.meal_rule_id} onChange={(v) => setRemark({ ...remark, meal_rule_id: v })}
              options={[{ value: '', label: '— Any —' }, ...rules.map(r => ({ value: r.id, label: r.name }))]} />
          </div>
          <div>
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
            className={`${inputCls} resize-y`} placeholder="e.g. Menu revised today due to technical issue. Quality verified by supervisor." />
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
