import { useEffect, useState } from "react"
import {
  useSites, useSite, useSaveSite, useDeleteSite,
  useSuppliers, useMealRules, useUsers,
  useSaveSupplierMealAssignment, useDeleteSupplierMealAssignment,
  useSaveDistributionAssignment, useDeleteDistributionAssignment,
} from "../api/queries"
import Pagination from "../components/Pagination"
import Select from "../components/Select"
import RowMenu from "../components/RowMenu"
import Checkbox from "../components/Checkbox"
import DatePicker from "../components/DatePicker"

const inputCls =
  "w-full bg-surface-container-high/50 border border-outline-variant/30 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 hover:bg-surface-container-high/70 hover:border-outline-variant/50 focus:bg-surface-container-high focus:border-blue-400 focus:ring-1 focus:ring-blue-400/60 focus:outline-none transition-all"

const SITE_TYPES = [
  { value: 'camp', label: 'Camp' },
  { value: 'site', label: 'Site' },
  { value: 'project', label: 'Project' },
  { value: 'other', label: 'Other' },
]

const SITE_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'finish', label: 'Finish' },
]

const statusBadge = (status) => {
  const base = 'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border '
  if (status === 'active') return base + 'bg-green-900/40 text-green-400 border-green-800/50'
  if (status === 'finish') return base + 'bg-blue-900/40 text-blue-400 border-blue-800/50'
  return base + 'bg-slate-900/40 text-slate-400 border-slate-700/50'
}

export default function Sites() {
  const [q, setQ] = useState("")
  const [page, setPage] = useState(1)
  useEffect(() => { setPage(1) }, [q])
  const { data, isLoading } = useSites({ q, page })
  const { data: mealRulesData } = useMealRules({ per_page: 100 })
  const save = useSaveSite()
  const del = useDeleteSite()
  const [editing, setEditing] = useState(null)
  const [viewingId, setViewingId] = useState(null)

  const activeMealRules = (mealRulesData?.data ?? []).filter(r => r.active !== false)

  const quotasFromRow = (row) => {
    const map = {}
    for (const q of row?.meal_quotas ?? []) map[q.meal_rule_id] = q.quantity
    return map
  }

  const openNew = () => setEditing({
    site_code: '', name: '', type: 'site', status: 'active',
    description: '', start_date: '', end_date: '',
    pin: '', clear_pin: false, active: true,
    meal_quotas: {},
  })
  const openEdit = (row) => setEditing({
    ...row,
    pin: '', clear_pin: false,
    start_date: row.start_date ? String(row.start_date).slice(0, 10) : '',
    end_date: row.end_date ? String(row.end_date).slice(0, 10) : '',
    meal_quotas: quotasFromRow(row),
  })
  const close = () => setEditing(null)

  const onSave = async (e) => {
    e.preventDefault()
    const payload = { ...editing }
    if (!payload.pin) delete payload.pin
    if (!payload.clear_pin) delete payload.clear_pin
    if (!payload.start_date) payload.start_date = null
    if (!payload.end_date) payload.end_date = null
    payload.meal_quotas = Object.entries(editing.meal_quotas || {})
      .map(([meal_rule_id, quantity]) => ({
        meal_rule_id: Number(meal_rule_id),
        quantity: Number(quantity) || 0,
      }))
      .filter(q => q.quantity > 0)
    await save.mutateAsync(payload)
    close()
  }

  const rows = data?.data ?? []

  return (
    <>
      <header className="flex justify-between items-end mb-lg">
        <div>
          <h1 className="font-h1 text-h1 text-slate-100">Sites</h1>
          <p className="font-body-md text-body-md text-slate-400 mt-1">Manage camps, sites and projects with their meal assignments.</p>
        </div>
        <div className="flex gap-sm">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" style={{ fontSize: 18 }}>search</span>
            <input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)}
              className="bg-surface-container-high/50 border border-outline-variant/30 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none transition-all w-64" />
          </div>
          <button onClick={openNew} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 flex items-center gap-2 transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>Add point
          </button>
        </div>
      </header>

      <div className="bg-surface-container-low border border-outline-variant/50 rounded-lg overflow-visible">
        <table className="w-full text-left text-body-md">
          <thead className="bg-surface-container-highest/20 text-label-sm text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium">Start</th>
              <th className="px-4 py-3 font-medium">End</th>
              <th className="px-4 py-3 font-medium">PIN</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {isLoading && <tr><td colSpan="9" className="p-6 text-center text-slate-500">Loading…</td></tr>}
            {!isLoading && rows.length === 0 && <tr><td colSpan="9" className="p-6 text-center text-slate-500">No sites.</td></tr>}
            {rows.map((s) => (
              <tr key={s.id} className="hover:bg-surface-container-highest/10 transition-colors">
                <td className="px-4 py-3 font-mono text-slate-300">{s.site_code}</td>
                <td className="px-4 py-3 text-slate-200 font-medium">{s.name}</td>
                <td className="px-4 py-3 text-slate-300 text-xs uppercase tracking-wide">{s.type || '—'}</td>
                <td className="px-4 py-3 text-slate-400 max-w-xs truncate">{s.description || <span className="text-slate-500">—</span>}</td>
                <td className="px-4 py-3 font-mono text-[12px] text-slate-400">{s.start_date ? String(s.start_date).slice(0, 10) : <span className="text-slate-500">—</span>}</td>
                <td className="px-4 py-3 font-mono text-[12px] text-slate-400">{s.end_date ? String(s.end_date).slice(0, 10) : <span className="text-slate-500">—</span>}</td>
                <td className="px-4 py-3">
                  {s.has_pin
                    ? <span className="inline-flex items-center gap-1 text-slate-300"><span className="material-symbols-outlined text-slate-500" style={{ fontSize: 16 }}>lock</span>Set</span>
                    : <span className="text-slate-500">—</span>}
                </td>
                <td className="px-4 py-3"><span className={statusBadge(s.status || (s.active ? 'active' : 'inactive'))}>{(s.status || (s.active ? 'active' : 'inactive')).toUpperCase()}</span></td>
                <td className="px-4 py-3 text-right">
                  <RowMenu
                    items={[
                      { icon: 'visibility', label: 'View', onClick: () => setViewingId(s.id) },
                      { icon: 'edit', label: 'Edit', onClick: () => openEdit(s) },
                      { icon: 'delete', label: 'Delete', danger: true, onClick: () => { if (confirm(`Delete ${s.site_code}?`)) del.mutate(s.id) } },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination meta={data} onChange={setPage} />
      </div>

      {viewingId && <SiteDetailModal id={viewingId} onClose={() => setViewingId(null)} onEdit={(row) => { setViewingId(null); openEdit(row) }} />}

      {editing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={onSave} className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-lg w-full max-w-lg space-y-md max-h-[90vh] overflow-y-auto">
            <div>
              <h2 className="text-h3 font-h3 text-slate-100">{editing.id ? 'Edit' : 'New'} Site</h2>
              <p className="text-body-md text-slate-400 mt-1">Code + type identify this location across transactions.</p>
            </div>
            <div className="grid grid-cols-2 gap-md">
              <div>
                <label className="block text-label-md text-slate-300 mb-1.5">Code</label>
                <input required value={editing.site_code || ''} onChange={e => setEditing({ ...editing, site_code: e.target.value })} className={`${inputCls} font-mono`} placeholder="DIP-1" />
              </div>
              <div>
                <label className="block text-label-md text-slate-300 mb-1.5">Name</label>
                <input required value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} className={inputCls} placeholder="DIP-1 Rent Camp" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-md">
              <div>
                <label className="block text-label-md text-slate-300 mb-1.5">Type</label>
                <Select
                  value={editing.type || 'site'}
                  onChange={(v) => setEditing({ ...editing, type: v })}
                  options={SITE_TYPES.map(t => ({ value: t.value, label: t.label }))}
                />
              </div>
              <div>
                <label className="block text-label-md text-slate-300 mb-1.5">Status</label>
                <Select
                  value={editing.status || 'active'}
                  onChange={(v) => setEditing({ ...editing, status: v, active: v === 'active' })}
                  options={SITE_STATUSES.map(s => ({ value: s.value, label: s.label }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-md">
              <div>
                <label className="block text-label-md text-slate-300 mb-1.5">Start date</label>
                <DatePicker value={editing.start_date || ''} onChange={(v) => setEditing({ ...editing, start_date: v })} placeholder="Pick a date" />
              </div>
              <div>
                <label className="block text-label-md text-slate-300 mb-1.5">End date</label>
                <DatePicker value={editing.end_date || ''} onChange={(v) => setEditing({ ...editing, end_date: v })} placeholder="Pick a date" />
              </div>
            </div>
            <div>
              <label className="block text-label-md text-slate-300 mb-1.5">Description</label>
              <textarea rows={2} value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} className={`${inputCls} resize-y`} placeholder="Temporary camp" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="material-symbols-outlined text-slate-500" style={{ fontSize: 16 }}>restaurant</span>
                <label className="text-label-md text-slate-300">Daily meal quantities</label>
                <span className="text-[11px] text-slate-500">— meals to prepare per day</span>
              </div>
              {activeMealRules.length === 0 ? (
                <div className="text-xs text-slate-500 italic px-3 py-2 border border-outline-variant/40 rounded">
                  No active meal rules. Create meal rules first to set quotas.
                </div>
              ) : (
                <div className={`grid gap-md ${activeMealRules.length >= 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  {activeMealRules.map(rule => (
                    <div key={rule.id}>
                      <label className="block text-label-sm text-slate-400 mb-1 truncate" title={rule.name}>{rule.name}</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={editing.meal_quotas?.[rule.id] ?? ''}
                        onChange={e => {
                          const v = e.target.value.replace(/\D/g, '')
                          const next = { ...(editing.meal_quotas || {}) }
                          if (v === '') delete next[rule.id]
                          else next[rule.id] = parseInt(v, 10) || 0
                          setEditing({ ...editing, meal_quotas: next })
                        }}
                        placeholder="0"
                        className={`${inputCls} font-mono`}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="flex items-center justify-between text-label-md text-slate-300 mb-1.5">
                <span className="flex items-center gap-2"><span className="material-symbols-outlined text-slate-500" style={{ fontSize: 16 }}>lock</span>PIN {editing.id && editing.has_pin ? '(leave blank to keep)' : '(4-12 digits)'}</span>
                {editing.id && editing.has_pin && (
                  <Checkbox
                    tone="red"
                    size={16}
                    labelClassName="text-[11px] text-slate-400"
                    checked={!!editing.clear_pin}
                    onChange={(v) => setEditing({ ...editing, clear_pin: v, pin: v ? '' : editing.pin })}
                  >
                    Remove PIN
                  </Checkbox>
                )}
              </label>
              <input type="password" inputMode="numeric" autoComplete="new-password" disabled={!!editing.clear_pin}
                value={editing.pin || ''} onChange={e => setEditing({ ...editing, pin: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                className={`${inputCls} font-mono tracking-widest disabled:opacity-40`} placeholder="••••" />
            </div>
            <div className="flex justify-end gap-sm pt-sm">
              <button type="button" onClick={close} className="px-4 py-2 rounded-lg border border-outline-variant/50 text-sm text-slate-300 hover:bg-surface-container-highest/40 focus:outline-none focus:ring-2 focus:ring-blue-400/30 transition-colors">Cancel</button>
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

function SiteDetailModal({ id, onClose, onEdit }) {
  const { data: site, isLoading } = useSite(id)
  const { data: suppliersData } = useSuppliers({ all: 1 })
  const { data: mealRulesData } = useMealRules({ per_page: 100 })
  const { data: usersData } = useUsers({ all: 1 })
  const saveSupAssign = useSaveSupplierMealAssignment()
  const delSupAssign = useDeleteSupplierMealAssignment()
  const saveDistAssign = useSaveDistributionAssignment()
  const delDistAssign = useDeleteDistributionAssignment()
  const [newSup, setNewSup] = useState(null)
  const [newDist, setNewDist] = useState(null)

  const suppliers = suppliersData?.data ?? []
  const rules = mealRulesData?.data ?? []
  const users = usersData?.data ?? []

  const submitSup = async (e) => {
    e.preventDefault()
    await saveSupAssign.mutateAsync({ ...newSup, site_id: id })
    setNewSup(null)
  }
  const submitDist = async (e) => {
    e.preventDefault()
    await saveDistAssign.mutateAsync({ ...newDist, site_id: id })
    setNewDist(null)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {isLoading || !site ? <div className="p-8 text-center text-slate-500">Loading…</div> : (
          <>
            <div className="flex items-start justify-between mb-md">
              <div>
                <h2 className="text-h3 font-h3 text-slate-100">{site.name}</h2>
                <p className="font-mono text-sm text-slate-400 mt-1">{site.site_code}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-slate-400 uppercase">{site.type || '—'}</span>
                  <span className={statusBadge(site.status || (site.active ? 'active' : 'inactive'))}>{(site.status || (site.active ? 'active' : 'inactive')).toUpperCase()}</span>
                  {site.has_pin && <span className="inline-flex items-center gap-1 text-xs text-slate-400"><span className="material-symbols-outlined" style={{ fontSize: 14 }}>lock</span>PIN</span>}
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded hover:bg-surface-container-highest/40 text-slate-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <dl className="grid grid-cols-3 gap-md text-sm mb-lg">
              <div><dt className="text-label-sm text-slate-500 uppercase tracking-wider mb-1">Description</dt><dd className="text-slate-200">{site.description || '—'}</dd></div>
              <div><dt className="text-label-sm text-slate-500 uppercase tracking-wider mb-1">Start</dt><dd className="text-slate-200 font-mono">{site.start_date ? String(site.start_date).slice(0, 10) : '—'}</dd></div>
              <div><dt className="text-label-sm text-slate-500 uppercase tracking-wider mb-1">End</dt><dd className="text-slate-200 font-mono">{site.end_date ? String(site.end_date).slice(0, 10) : '—'}</dd></div>
            </dl>

            {(site.meal_quotas ?? []).length > 0 && (
              <section className="mb-lg">
                <h3 className="text-label-sm text-slate-400 uppercase tracking-wider mb-sm">Daily meal quantities</h3>
                <div className="flex flex-wrap gap-2">
                  {site.meal_quotas.map(q => (
                    <div key={q.id} className="inline-flex items-center gap-2 bg-surface-container-lowest/60 border border-outline-variant/40 rounded px-3 py-1.5">
                      <span className="text-sm text-slate-200">{q.meal_rule?.name || '—'}</span>
                      <span className="font-mono text-sm text-blue-400">{q.quantity}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="mb-lg">
              <div className="flex items-center justify-between mb-sm">
                <h3 className="text-label-sm text-slate-400 uppercase tracking-wider">Meal supplier assignments</h3>
                <button onClick={() => setNewSup({ supplier_id: suppliers[0]?.id, meal_rule_id: rules[0]?.id, start_date: new Date().toISOString().slice(0, 10), end_date: '', remarks: '' })}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>Add
                </button>
              </div>
              {(site.supplier_meal_assignments ?? []).length === 0
                ? <div className="text-slate-500 text-sm">No supplier assignments.</div>
                : (
                  <div className="border border-outline-variant/40 rounded overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-surface-container-highest/30 text-label-sm text-slate-400 uppercase tracking-wider">
                        <tr><th className="px-3 py-2 text-left">Supplier</th><th className="px-3 py-2 text-left">Meal</th><th className="px-3 py-2 text-left">Start</th><th className="px-3 py-2 text-left">End</th><th className="px-3 py-2 text-left">Remarks</th><th></th></tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20">
                        {site.supplier_meal_assignments.map(a => (
                          <tr key={a.id}>
                            <td className="px-3 py-2 text-slate-300">{a.supplier ? `${a.supplier.supplier_code} — ${a.supplier.name}` : '—'}</td>
                            <td className="px-3 py-2 text-slate-300">{a.meal_rule?.name || '—'}</td>
                            <td className="px-3 py-2 font-mono text-xs text-slate-400">{a.start_date ? String(a.start_date).slice(0, 10) : '—'}</td>
                            <td className="px-3 py-2 font-mono text-xs text-slate-400">{a.end_date ? String(a.end_date).slice(0, 10) : '—'}</td>
                            <td className="px-3 py-2 text-slate-400">{a.remarks || '—'}</td>
                            <td className="px-3 py-2 text-right">
                              <button onClick={() => { if (confirm('Delete assignment?')) delSupAssign.mutate(a.id) }} className="text-red-400 hover:text-red-300">
                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
            </section>

            <section>
              <div className="flex items-center justify-between mb-sm">
                <h3 className="text-label-sm text-slate-400 uppercase tracking-wider">Meal distribution assignments</h3>
                <button onClick={() => setNewDist({ distributor_id: users[0]?.id, meal_rule_id: rules[0]?.id, start_date: new Date().toISOString().slice(0, 10), end_date: '', remarks: '' })}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>Add
                </button>
              </div>
              {(site.distribution_assignments ?? []).length === 0
                ? <div className="text-slate-500 text-sm">No distribution assignments.</div>
                : (
                  <div className="border border-outline-variant/40 rounded overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-surface-container-highest/30 text-label-sm text-slate-400 uppercase tracking-wider">
                        <tr><th className="px-3 py-2 text-left">Distributor</th><th className="px-3 py-2 text-left">Meal</th><th className="px-3 py-2 text-left">Start</th><th className="px-3 py-2 text-left">End</th><th className="px-3 py-2 text-left">Remarks</th><th></th></tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20">
                        {site.distribution_assignments.map(a => (
                          <tr key={a.id}>
                            <td className="px-3 py-2 text-slate-300">{a.distributor?.name || '—'} <span className="text-xs text-slate-500">({a.distributor?.role})</span></td>
                            <td className="px-3 py-2 text-slate-300">{a.meal_rule?.name || '—'}</td>
                            <td className="px-3 py-2 font-mono text-xs text-slate-400">{a.start_date ? String(a.start_date).slice(0, 10) : '—'}</td>
                            <td className="px-3 py-2 font-mono text-xs text-slate-400">{a.end_date ? String(a.end_date).slice(0, 10) : '—'}</td>
                            <td className="px-3 py-2 text-slate-400">{a.remarks || '—'}</td>
                            <td className="px-3 py-2 text-right">
                              <button onClick={() => { if (confirm('Delete assignment?')) delDistAssign.mutate(a.id) }} className="text-red-400 hover:text-red-300">
                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
            </section>

            <div className="flex justify-end gap-sm pt-lg mt-md border-t border-outline-variant/30">
              <button onClick={onClose} className="px-4 py-2 rounded-lg border border-outline-variant/50 text-sm text-slate-300 hover:bg-surface-container-highest/40 focus:outline-none focus:ring-2 focus:ring-blue-400/30 transition-colors">Close</button>
              <button onClick={() => onEdit(site)} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 transition-colors">Edit</button>
            </div>
          </>
        )}

        {newSup && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <form onSubmit={submitSup} className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-lg w-full max-w-md space-y-md">
              <h3 className="text-h3 font-h3 text-slate-100">New Supplier Assignment</h3>
              <div>
                <label className="block text-label-md text-slate-300 mb-1.5">Supplier</label>
                <Select
                  required
                  searchable
                  value={newSup.supplier_id ?? ''}
                  onChange={(v) => setNewSup({ ...newSup, supplier_id: v === '' ? null : Number(v) })}
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
                  value={newSup.meal_rule_id ?? ''}
                  onChange={(v) => setNewSup({ ...newSup, meal_rule_id: v === '' ? null : Number(v) })}
                  options={[
                    { value: '', label: '— choose —' },
                    ...rules.map(r => ({ value: String(r.id), label: r.name })),
                  ]}
                />
              </div>
              <div className="grid grid-cols-2 gap-md">
                <div><label className="block text-label-md text-slate-300 mb-1.5">Start</label><DatePicker required value={newSup.start_date} onChange={(v) => setNewSup({ ...newSup, start_date: v })} placeholder="Pick a date" /></div>
                <div><label className="block text-label-md text-slate-300 mb-1.5">End</label><DatePicker value={newSup.end_date || ''} onChange={(v) => setNewSup({ ...newSup, end_date: v })} placeholder="Pick a date" /></div>
              </div>
              <div><label className="block text-label-md text-slate-300 mb-1.5">Remarks</label><input value={newSup.remarks || ''} onChange={e => setNewSup({ ...newSup, remarks: e.target.value })} className={inputCls} /></div>
              <div className="flex justify-end gap-sm">
                <button type="button" onClick={() => setNewSup(null)} className="px-4 py-2 rounded-lg border border-outline-variant/50 text-sm text-slate-300 hover:bg-surface-container-highest/40 focus:outline-none focus:ring-2 focus:ring-blue-400/30 transition-colors">Cancel</button>
                <button type="submit" disabled={saveSupAssign.isPending} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 disabled:opacity-60">{saveSupAssign.isPending ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        )}

        {newDist && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <form onSubmit={submitDist} className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-lg w-full max-w-md space-y-md">
              <h3 className="text-h3 font-h3 text-slate-100">New Distribution Assignment</h3>
              <div>
                <label className="block text-label-md text-slate-300 mb-1.5">Distributor</label>
                <Select
                  required
                  searchable
                  value={newDist.distributor_id ?? ''}
                  onChange={(v) => setNewDist({ ...newDist, distributor_id: v === '' ? null : Number(v) })}
                  options={[
                    { value: '', label: '— choose —' },
                    ...users.map(u => ({ value: String(u.id), label: `${u.name} (${u.role})` })),
                  ]}
                />
              </div>
              <div>
                <label className="block text-label-md text-slate-300 mb-1.5">Meal</label>
                <Select
                  required
                  value={newDist.meal_rule_id ?? ''}
                  onChange={(v) => setNewDist({ ...newDist, meal_rule_id: v === '' ? null : Number(v) })}
                  options={[
                    { value: '', label: '— choose —' },
                    ...rules.map(r => ({ value: String(r.id), label: r.name })),
                  ]}
                />
              </div>
              <div className="grid grid-cols-2 gap-md">
                <div><label className="block text-label-md text-slate-300 mb-1.5">Start</label><DatePicker required value={newDist.start_date} onChange={(v) => setNewDist({ ...newDist, start_date: v })} placeholder="Pick a date" /></div>
                <div><label className="block text-label-md text-slate-300 mb-1.5">End</label><DatePicker value={newDist.end_date || ''} onChange={(v) => setNewDist({ ...newDist, end_date: v })} placeholder="Pick a date" /></div>
              </div>
              <div><label className="block text-label-md text-slate-300 mb-1.5">Remarks</label><input value={newDist.remarks || ''} onChange={e => setNewDist({ ...newDist, remarks: e.target.value })} className={inputCls} /></div>
              <div className="flex justify-end gap-sm">
                <button type="button" onClick={() => setNewDist(null)} className="px-4 py-2 rounded-lg border border-outline-variant/50 text-sm text-slate-300 hover:bg-surface-container-highest/40 focus:outline-none focus:ring-2 focus:ring-blue-400/30 transition-colors">Cancel</button>
                <button type="submit" disabled={saveDistAssign.isPending} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 disabled:opacity-60">{saveDistAssign.isPending ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
