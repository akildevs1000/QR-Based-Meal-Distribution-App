import { useEffect, useState } from 'react'
import {
  useFoodRequests, useSaveFoodRequest, useDeleteFoodRequest,
  useSites, useSuppliers, useMealRules, useMealCategories,
} from '../api/queries'
import Pagination from '../components/Pagination'
import DatePicker from '../components/DatePicker'
import Select from '../components/Select'
import RowMenu from '../components/RowMenu'

const inputCls =
  'w-full bg-surface-container-high/50 border border-outline-variant/30 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 hover:bg-surface-container-high/70 hover:border-outline-variant/50 focus:bg-surface-container-high focus:border-blue-400 focus:ring-1 focus:ring-blue-400/60 focus:outline-none transition-all'

const filterCls =
  'bg-surface-container-high/50 border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none transition-all'

const STATUSES = [
  { value: 'submitted', label: 'Submitted', cls: 'bg-blue-900/40 text-blue-400 border-blue-800/50' },
  { value: 'approved',  label: 'Approved',  cls: 'bg-green-900/40 text-green-400 border-green-800/50' },
  { value: 'delivered', label: 'Delivered', cls: 'bg-emerald-900/40 text-emerald-400 border-emerald-800/50' },
  { value: 'cancelled', label: 'Cancelled', cls: 'bg-red-900/40 text-red-400 border-red-800/50' },
]

const statusBadge = (v) => {
  const base = 'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border '
  const s = STATUSES.find(x => x.value === v)
  return base + (s ? s.cls : 'bg-slate-900/40 text-slate-400 border-slate-700/50')
}

export default function FoodRequests() {
  const [filters, setFilters] = useState({ date: '', site_id: '', supplier_id: '', status: '' })
  const [page, setPage] = useState(1)
  useEffect(() => { setPage(1) }, [filters])
  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
  const { data, isLoading } = useFoodRequests({ ...params, page })
  const { data: sitesData } = useSites({ all: 1 })
  const { data: suppliersData } = useSuppliers({ all: 1 })
  const { data: rulesData } = useMealRules({ per_page: 100 })
  const { data: categoriesData } = useMealCategories({ all: 1 })
  const save = useSaveFoodRequest()
  const del = useDeleteFoodRequest()
  const [editing, setEditing] = useState(null)

  const sites = sitesData?.data ?? []
  const suppliers = suppliersData?.data ?? []
  const rules = rulesData?.data ?? []
  const categories = categoriesData?.data ?? []
  const rows = data?.data ?? []

  const openNew = () => setEditing({
    request_date: new Date().toISOString().slice(0, 10),
    site_id: sites[0]?.id ?? null,
    supplier_id: null, meal_category_id: null,
    meal_rule_id: rules[0]?.id ?? null,
    quantity: 0, status: 'submitted', remarks: '',
  })

  const openEdit = (row) => setEditing({
    ...row,
    request_date: row.request_date ? String(row.request_date).slice(0, 10) : '',
  })

  const onSave = async (e) => {
    e.preventDefault()
    const payload = { ...editing }
    if (payload.supplier_id === '') payload.supplier_id = null
    if (payload.meal_category_id === '') payload.meal_category_id = null
    await save.mutateAsync(payload)
    setEditing(null)
  }

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-md mb-lg">
        <div className="min-w-0">
          <h1 className="font-h1 text-h1 text-slate-100">Food Requests</h1>
          <p className="font-body-md text-body-md text-slate-400 mt-1">Site meal requests per day, by supplier and meal category.</p>
        </div>
        <button onClick={openNew} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 flex items-center gap-2 whitespace-nowrap transition-colors">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>New request
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
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Site</th>
              <th className="px-4 py-3 font-medium">Meal</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Supplier</th>
              <th className="px-4 py-3 font-medium text-right">Quantity</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Remarks</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {isLoading && <tr><td colSpan="9" className="p-6 text-center text-slate-500">Loading…</td></tr>}
            {!isLoading && rows.length === 0 && <tr><td colSpan="9" className="p-6 text-center text-slate-500">No food requests.</td></tr>}
            {rows.map(r => (
              <tr key={r.id} className="hover:bg-surface-container-highest/10 transition-colors">
                <td className="px-4 py-3 font-mono text-[12px] text-slate-300">{r.request_date ? String(r.request_date).slice(0, 10) : '—'}</td>
                <td className="px-4 py-3 text-slate-200">{r.site ? <><span className="font-mono text-[11px] text-slate-500 mr-1.5">{r.site.site_code}</span>{r.site.name}</> : '—'}</td>
                <td className="px-4 py-3 text-slate-300">{r.meal_rule?.name || '—'}</td>
                <td className="px-4 py-3 text-slate-300 text-xs">{r.meal_category ? `${r.meal_category.cuisine?.name ?? ''} · ${r.meal_category.name}` : <span className="text-slate-500">—</span>}</td>
                <td className="px-4 py-3 text-slate-300">{r.supplier?.name || <span className="text-slate-500">—</span>}</td>
                <td className="px-4 py-3 font-mono text-slate-200 text-right">{r.quantity}</td>
                <td className="px-4 py-3"><span className={statusBadge(r.status)}>{(r.status || '').toUpperCase()}</span></td>
                <td className="px-4 py-3 text-slate-400 text-xs truncate max-w-[200px]">{r.remarks || <span className="text-slate-500">—</span>}</td>
                <td className="px-4 py-3 text-right">
                  <RowMenu
                    items={[
                      { icon: 'edit', label: 'Edit', onClick: () => openEdit(r) },
                      { icon: 'delete', label: 'Delete', danger: true, onClick: () => { if (confirm('Delete request?')) del.mutate(r.id) } },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination meta={data} onChange={setPage} />
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={onSave} className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-lg w-full max-w-lg space-y-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-h3 font-h3 text-slate-100">{editing.id ? 'Edit' : 'New'} Food Request</h2>
            <div className="grid grid-cols-2 gap-md">
              <div>
                <label className="block text-label-md text-slate-300 mb-1.5">Request date</label>
                <DatePicker required value={editing.request_date || ''} onChange={(v) => setEditing({ ...editing, request_date: v })} placeholder="Pick a date" />
              </div>
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
            </div>
            <div className="grid grid-cols-2 gap-md">
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
              <div>
                <label className="block text-label-md text-slate-300 mb-1.5">Meal category (optional)</label>
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
            </div>
            <div className="grid grid-cols-2 gap-md">
              <div>
                <label className="block text-label-md text-slate-300 mb-1.5">Supplier (optional)</label>
                <Select
                  searchable
                  value={editing.supplier_id ?? ''}
                  onChange={(v) => setEditing({ ...editing, supplier_id: v === '' ? null : Number(v) })}
                  options={[
                    { value: '', label: '—' },
                    ...suppliers.map(s => ({ value: String(s.id), label: `${s.supplier_code} — ${s.name}` })),
                  ]}
                />
              </div>
              <div>
                <label className="block text-label-md text-slate-300 mb-1.5">Quantity</label>
                <input type="number" min={0} required value={editing.quantity ?? 0} onChange={e => setEditing({ ...editing, quantity: Number(e.target.value) })} className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-label-md text-slate-300 mb-1.5">Status</label>
              <Select
                value={editing.status || 'submitted'}
                onChange={(v) => setEditing({ ...editing, status: v })}
                options={STATUSES.map(s => ({ value: s.value, label: s.label }))}
              />
            </div>
            <div>
              <label className="block text-label-md text-slate-300 mb-1.5">Remarks</label>
              <textarea rows={2} value={editing.remarks || ''} onChange={e => setEditing({ ...editing, remarks: e.target.value })} className={`${inputCls} resize-y`} />
            </div>
            <div className="flex justify-end gap-sm pt-sm">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg border border-outline-variant/50 text-sm text-slate-300 hover:bg-surface-container-highest/40 focus:outline-none focus:ring-2 focus:ring-blue-400/30 transition-colors">Cancel</button>
              <button type="submit" disabled={save.isPending} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 disabled:opacity-60 transition-colors">
                {save.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
