import { useEffect, useState } from 'react'
import {
  useDeliveryNotes, useSaveDeliveryNote, useDeleteDeliveryNote,
  useSites, useSuppliers, useMealRules, useMealCategories,
} from '../api/queries'
import Pagination from '../components/Pagination'
import DatePicker from '../components/DatePicker'
import Select from '../components/Select'
import RowMenu from '../components/RowMenu'

const inputCls =
  'w-full bg-surface-container-lowest border border-outline-variant/50 rounded px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none transition-all'

const filterCls =
  'bg-surface-container-lowest border border-outline-variant/50 rounded px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none transition-all'

const apiOrigin = (import.meta.env.VITE_API_BASE || 'http://localhost:8000/api').replace(/\/api\/?$/, '')
const fileUrl = (p) => (p ? `${apiOrigin}/storage/${p}` : null)

const STATUSES = [
  { value: 'pending',   label: 'Pending',   cls: 'bg-slate-900/40 text-slate-400 border-slate-700/50' },
  { value: 'delivered', label: 'Delivered', cls: 'bg-green-900/40 text-green-400 border-green-800/50' },
  { value: 'partial',   label: 'Partial',   cls: 'bg-amber-900/40 text-amber-400 border-amber-800/50' },
  { value: 'rejected',  label: 'Rejected',  cls: 'bg-red-900/40 text-red-400 border-red-800/50' },
]

const statusBadge = (v) => {
  const base = 'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border '
  const s = STATUSES.find(x => x.value === v)
  return base + (s ? s.cls : 'bg-slate-900/40 text-slate-400 border-slate-700/50')
}

export default function DeliveryNotes() {
  const [filters, setFilters] = useState({ date: '', site_id: '', supplier_id: '', status: '' })
  const [page, setPage] = useState(1)
  useEffect(() => { setPage(1) }, [filters])
  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
  const { data, isLoading } = useDeliveryNotes({ ...params, page })
  const { data: sitesData } = useSites({ all: 1 })
  const { data: suppliersData } = useSuppliers({ all: 1 })
  const { data: rulesData } = useMealRules({ per_page: 100 })
  const { data: categoriesData } = useMealCategories({ all: 1 })
  const save = useSaveDeliveryNote()
  const del = useDeleteDeliveryNote()
  const [editing, setEditing] = useState(null)

  const sites = sitesData?.data ?? []
  const suppliers = suppliersData?.data ?? []
  const rules = rulesData?.data ?? []
  const categories = categoriesData?.data ?? []
  const rows = data?.data ?? []

  const openNew = () => setEditing({
    delivery_date: new Date().toISOString().slice(0, 10),
    delivery_time: new Date().toTimeString().slice(0, 5),
    site_id: sites[0]?.id ?? null,
    supplier_id: suppliers[0]?.id ?? null,
    meal_rule_id: rules[0]?.id ?? null,
    meal_category_id: null,
    quantity_requested: 0, quantity_delivered: 0,
    status: 'delivered', notes: '', attachment: null,
  })

  const openEdit = (row) => setEditing({
    ...row,
    delivery_date: row.delivery_date ? String(row.delivery_date).slice(0, 10) : '',
    delivery_time: row.delivery_time ? String(row.delivery_time).slice(0, 5) : '',
    attachment: null,
  })

  const onSave = async (e) => {
    e.preventDefault()
    const payload = { ...editing }
    if (payload.meal_category_id === '') payload.meal_category_id = null
    if (payload.delivery_time && payload.delivery_time.length === 5) payload.delivery_time = payload.delivery_time + ':00'
    await save.mutateAsync(payload)
    setEditing(null)
  }

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-md mb-lg">
        <div className="min-w-0">
          <h1 className="font-h1 text-h1 text-slate-100">Delivery Notes</h1>
          <p className="font-body-md text-body-md text-slate-400 mt-1">Record supplier deliveries and reconcile requested vs delivered quantities.</p>
        </div>
        <button onClick={openNew} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-colors">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>New delivery note
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-sm mb-md">
        <DatePicker
          value={filters.date}
          onChange={(v) => setFilters({ ...filters, date: v })}
          placeholder="Any date"
          className="w-48"
        />
        <Select
          value={filters.site_id}
          onChange={(v) => setFilters({ ...filters, site_id: v })}
          searchable
          className="w-56"
          options={[
            { value: '', label: 'All sites' },
            ...sites.map(s => ({ value: String(s.id), label: `${s.site_code} — ${s.name}` })),
          ]}
        />
        <Select
          value={filters.supplier_id}
          onChange={(v) => setFilters({ ...filters, supplier_id: v })}
          searchable
          className="w-56"
          options={[
            { value: '', label: 'All suppliers' },
            ...suppliers.map(s => ({ value: String(s.id), label: `${s.supplier_code} — ${s.name}` })),
          ]}
        />
        <Select
          value={filters.status}
          onChange={(v) => setFilters({ ...filters, status: v })}
          className="w-40"
          options={[
            { value: '', label: 'All statuses' },
            ...STATUSES.map(s => ({ value: s.value, label: s.label })),
          ]}
        />
        {(filters.date || filters.site_id || filters.supplier_id || filters.status) && (
          <button
            type="button"
            onClick={() => setFilters({ date: '', site_id: '', supplier_id: '', status: '' })}
            className="flex items-center gap-1 px-3 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>Clear
          </button>
        )}
      </div>

      <div className="bg-surface-container-low border border-outline-variant/50 rounded-lg overflow-visible">
        <table className="w-full text-left text-body-md">
          <thead className="bg-surface-container-highest/20 text-label-sm text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="px-3 py-3 font-medium">Note #</th>
              <th className="px-3 py-3 font-medium">Date</th>
              <th className="px-3 py-3 font-medium">Time</th>
              <th className="px-3 py-3 font-medium">Site</th>
              <th className="px-3 py-3 font-medium">Supplier</th>
              <th className="px-3 py-3 font-medium">Meal</th>
              <th className="px-3 py-3 font-medium text-right">Req</th>
              <th className="px-3 py-3 font-medium text-right">Deliv</th>
              <th className="px-3 py-3 font-medium text-right">Var</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium">Received by</th>
              <th className="px-3 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {isLoading && <tr><td colSpan="12" className="p-6 text-center text-slate-500">Loading…</td></tr>}
            {!isLoading && rows.length === 0 && <tr><td colSpan="12" className="p-6 text-center text-slate-500">No delivery notes.</td></tr>}
            {rows.map(n => {
              const variance = (n.quantity_delivered ?? 0) - (n.quantity_requested ?? 0)
              return (
                <tr key={n.id} className="hover:bg-surface-container-highest/10 transition-colors">
                  <td className="px-3 py-3 font-mono text-slate-300 text-sm">{n.note_no}</td>
                  <td className="px-3 py-3 font-mono text-[12px] text-slate-300">{n.delivery_date ? String(n.delivery_date).slice(0, 10) : '—'}</td>
                  <td className="px-3 py-3 font-mono text-[12px] text-slate-400">{n.delivery_time ? String(n.delivery_time).slice(0, 5) : '—'}</td>
                  <td className="px-3 py-3 text-slate-300 text-sm">{n.site ? <><span className="font-mono text-[11px] text-slate-500 mr-1">{n.site.site_code}</span>{n.site.name}</> : '—'}</td>
                  <td className="px-3 py-3 text-slate-300 text-sm">{n.supplier?.name || '—'}</td>
                  <td className="px-3 py-3 text-slate-300 text-sm">{n.meal_rule?.name || '—'}</td>
                  <td className="px-3 py-3 font-mono text-slate-300 text-right">{n.quantity_requested}</td>
                  <td className="px-3 py-3 font-mono text-slate-200 text-right font-semibold">{n.quantity_delivered}</td>
                  <td className={"px-3 py-3 font-mono text-right " + (variance < 0 ? 'text-red-400' : variance > 0 ? 'text-emerald-400' : 'text-slate-400')}>
                    {variance > 0 ? '+' : ''}{variance}
                  </td>
                  <td className="px-3 py-3"><span className={statusBadge(n.status)}>{(n.status || '').toUpperCase()}</span></td>
                  <td className="px-3 py-3 text-slate-400 text-xs">{n.receiver?.name || '—'}</td>
                  <td className="px-3 py-3 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1">
                      {n.attachment_path && (
                        <a href={fileUrl(n.attachment_path)} target="_blank" rel="noreferrer" aria-label="View attachment"
                          className="p-1.5 rounded hover:bg-surface-container-highest/40 text-slate-400 hover:text-slate-200 transition-colors inline-flex">
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>attach_file</span>
                        </a>
                      )}
                      <RowMenu
                        items={[
                          { icon: 'edit', label: 'Edit', onClick: () => openEdit(n) },
                          { icon: 'delete', label: 'Delete', danger: true, onClick: () => { if (confirm(`Delete ${n.note_no}?`)) del.mutate(n.id) } },
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <Pagination meta={data} onChange={setPage} />
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={onSave} className="bg-surface-container-low border border-outline-variant/50 rounded-lg p-lg w-full max-w-2xl space-y-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-h3 font-h3 text-slate-100">{editing.id ? `Edit ${editing.note_no}` : 'New Delivery Note'}</h2>
            <div className="grid grid-cols-2 gap-md">
              <div>
                <label className="block text-label-md text-slate-300 mb-1.5">Delivery date</label>
                <DatePicker required value={editing.delivery_date || ''} onChange={(v) => setEditing({ ...editing, delivery_date: v })} placeholder="Pick a date" />
              </div>
              <div>
                <label className="block text-label-md text-slate-300 mb-1.5">Delivery time</label>
                <input type="time" value={editing.delivery_time || ''} onChange={e => setEditing({ ...editing, delivery_time: e.target.value })} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-md">
              <div>
                <label className="block text-label-md text-slate-300 mb-1.5">Site</label>
                <Select
                  required
                  searchable
                  value={editing.site_id ?? ''}
                  onChange={(v) => setEditing({ ...editing, site_id: v === '' ? null : Number(v) })}
                  options={[
                    { value: '', label: '— choose —' },
                    ...sites.map(s => ({ value: String(s.id), label: `${s.site_code} — ${s.name}` })),
                  ]}
                />
              </div>
              <div>
                <label className="block text-label-md text-slate-300 mb-1.5">Supplier</label>
                <Select
                  required
                  searchable
                  value={editing.supplier_id ?? ''}
                  onChange={(v) => setEditing({ ...editing, supplier_id: v === '' ? null : Number(v) })}
                  options={[
                    { value: '', label: '— choose —' },
                    ...suppliers.map(s => ({ value: String(s.id), label: `${s.supplier_code} — ${s.name}` })),
                  ]}
                />
              </div>
              <div>
                <label className="block text-label-md text-slate-300 mb-1.5">Meal</label>
                <Select
                  required
                  value={editing.meal_rule_id ?? ''}
                  onChange={(v) => setEditing({ ...editing, meal_rule_id: v === '' ? null : Number(v) })}
                  options={[
                    { value: '', label: '— choose —' },
                    ...rules.map(r => ({ value: String(r.id), label: r.name })),
                  ]}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-md">
              <div>
                <label className="block text-label-md text-slate-300 mb-1.5">Category (optional)</label>
                <Select
                  searchable
                  value={editing.meal_category_id ?? ''}
                  onChange={(v) => setEditing({ ...editing, meal_category_id: v === '' ? null : Number(v) })}
                  options={[
                    { value: '', label: '—' },
                    ...categories.map(c => ({ value: String(c.id), label: `${c.cuisine?.name ?? ''} · ${c.name}` })),
                  ]}
                />
              </div>
              <div>
                <label className="block text-label-md text-slate-300 mb-1.5">Quantity requested</label>
                <input type="number" min={0} value={editing.quantity_requested ?? 0} onChange={e => setEditing({ ...editing, quantity_requested: Number(e.target.value) })} className={inputCls} />
              </div>
              <div>
                <label className="block text-label-md text-slate-300 mb-1.5">Quantity delivered</label>
                <input type="number" min={0} required value={editing.quantity_delivered ?? 0} onChange={e => setEditing({ ...editing, quantity_delivered: Number(e.target.value) })} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-md">
              <div>
                <label className="block text-label-md text-slate-300 mb-1.5">Status</label>
                <Select
                  value={editing.status || 'delivered'}
                  onChange={(v) => setEditing({ ...editing, status: v })}
                  options={STATUSES.map(s => ({ value: s.value, label: s.label }))}
                />
              </div>
              <div>
                <label className="block text-label-md text-slate-300 mb-1.5">Delivery slip</label>
                <input type="file" accept="image/*,application/pdf" onChange={e => setEditing({ ...editing, attachment: e.target.files?.[0] || null })}
                  className="block text-sm text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600/20 file:text-blue-300 hover:file:bg-blue-600/30" />
                {editing.attachment_path && !editing.attachment && (
                  <div className="mt-1 text-xs text-slate-400">
                    Existing: <a href={fileUrl(editing.attachment_path)} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300">view file</a>
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-label-md text-slate-300 mb-1.5">Notes</label>
              <textarea rows={2} value={editing.notes || ''} onChange={e => setEditing({ ...editing, notes: e.target.value })} className={`${inputCls} resize-y`} placeholder="Short by 5 portions / on time / escalated…" />
            </div>
            <div className="flex justify-end gap-sm pt-sm">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded border border-outline-variant/50 text-sm text-slate-300 hover:bg-surface-container-highest/40 transition-colors">Cancel</button>
              <button type="submit" disabled={save.isPending} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold disabled:opacity-60 transition-colors">
                {save.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
