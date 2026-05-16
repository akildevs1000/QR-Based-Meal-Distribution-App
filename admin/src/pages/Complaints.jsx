import { useEffect, useState } from 'react'
import {
  useComplaints, useSaveComplaint, useDeleteComplaint,
  useSites, useSuppliers, useMealRules,
} from '../api/queries'
import Pagination from '../components/Pagination'
import DatePicker from '../components/DatePicker'
import Select from '../components/Select'
import RowMenu from '../components/RowMenu'

const inputCls =
  'w-full bg-surface-container-high/50 border border-outline-variant/30 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 hover:bg-surface-container-high/70 hover:border-outline-variant/50 focus:bg-surface-container-high focus:border-blue-400 focus:ring-1 focus:ring-blue-400/60 focus:outline-none transition-all'

const filterCls =
  'bg-surface-container-high/50 border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none transition-all'

const apiOrigin = (import.meta.env.VITE_API_BASE || 'http://localhost:8000/api').replace(/\/api\/?$/, '')
const fileUrl = (p) => (p ? `${apiOrigin}/storage/${p}` : null)

const ISSUE_TYPES = ['Food Quality', 'Late Delivery', 'Wrong Items', 'Other']

const STATUSES = [
  { value: 'open',      label: 'Open',       cls: 'bg-yellow-900/40 text-yellow-400 border-yellow-800/50' },
  { value: 'in_review', label: 'In Review',  cls: 'bg-blue-900/40 text-blue-400 border-blue-800/50' },
  { value: 'resolved',  label: 'Resolved',   cls: 'bg-green-900/40 text-green-400 border-green-800/50' },
  { value: 'escalated', label: 'Escalated',  cls: 'bg-red-900/40 text-red-400 border-red-800/50' },
]

const statusBadge = (v) => {
  const base = 'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border '
  const s = STATUSES.find(x => x.value === v)
  return base + (s ? s.cls : 'bg-slate-900/40 text-slate-400 border-slate-700/50')
}

export default function Complaints() {
  const [filters, setFilters] = useState({ status: '', site_id: '', supplier_id: '' })
  const [page, setPage] = useState(1)
  useEffect(() => { setPage(1) }, [filters])
  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
  const { data, isLoading } = useComplaints({ ...params, page })
  const { data: sitesData } = useSites({ all: 1 })
  const { data: suppliersData } = useSuppliers({ all: 1 })
  const { data: rulesData } = useMealRules({ per_page: 100 })
  const save = useSaveComplaint()
  const del = useDeleteComplaint()
  const [editing, setEditing] = useState(null)

  const sites = sitesData?.data ?? []
  const suppliers = suppliersData?.data ?? []
  const rules = rulesData?.data ?? []
  const rows = data?.data ?? []

  const openNew = () => setEditing({
    date_logged: new Date().toISOString().slice(0, 10),
    site_id: null, supplier_id: null, meal_rule_id: null,
    issue_type: 'Food Quality', description: '',
    status: 'open', remarks: '', date_resolved: '',
    attachment: null,
  })

  const openEdit = (row) => setEditing({
    ...row,
    date_logged: row.date_logged ? String(row.date_logged).slice(0, 10) : '',
    date_resolved: row.date_resolved ? String(row.date_resolved).slice(0, 10) : '',
    attachment: null,
  })

  const onSave = async (e) => {
    e.preventDefault()
    const payload = { ...editing }
    await save.mutateAsync(payload)
    setEditing(null)
  }

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-md mb-lg">
        <div className="min-w-0">
          <h1 className="font-h1 text-h1 text-slate-100">Complaints</h1>
          <p className="font-body-md text-body-md text-slate-400 mt-1">Log food-service issues and track resolution.</p>
        </div>
        <button onClick={openNew} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 flex items-center gap-2 whitespace-nowrap transition-colors">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>New complaint
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-sm mb-md">
        <Select
          value={filters.status}
          onChange={(v) => setFilters({ ...filters, status: v })}
          className="w-44"
          options={[
            { value: '', label: 'All statuses' },
            ...STATUSES.map(s => ({ value: s.value, label: s.label })),
          ]}
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
        {(filters.status || filters.site_id || filters.supplier_id) && (
          <button
            type="button"
            onClick={() => setFilters({ status: '', site_id: '', supplier_id: '' })}
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
              <th className="px-4 py-3 font-medium">Ref #</th>
              <th className="px-4 py-3 font-medium">Logged</th>
              <th className="px-4 py-3 font-medium">Site</th>
              <th className="px-4 py-3 font-medium">Supplier</th>
              <th className="px-4 py-3 font-medium">Issue</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium">Logged by</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Supplier reply</th>
              <th className="px-4 py-3 font-medium">Resolved</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {isLoading && <tr><td colSpan="11" className="p-6 text-center text-slate-500">Loading…</td></tr>}
            {!isLoading && rows.length === 0 && <tr><td colSpan="11" className="p-6 text-center text-slate-500">No complaints.</td></tr>}
            {rows.map(c => (
              <tr key={c.id} className="hover:bg-surface-container-highest/10 transition-colors">
                <td className="px-4 py-3 font-mono text-slate-300">{c.ref_no}</td>
                <td className="px-4 py-3 font-mono text-[12px] text-slate-300">{c.date_logged ? String(c.date_logged).slice(0, 10) : '—'}</td>
                <td className="px-4 py-3 text-slate-300">{c.site ? c.site.site_code : <span className="text-slate-500">—</span>}</td>
                <td className="px-4 py-3 text-slate-300">{c.supplier?.name || <span className="text-slate-500">—</span>}</td>
                <td className="px-4 py-3 text-slate-300 text-xs">{c.issue_type}</td>
                <td className="px-4 py-3 text-slate-400 text-xs truncate max-w-[220px]">{c.description}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">{c.logger?.name || <span className="text-slate-500">—</span>}</td>
                <td className="px-4 py-3"><span className={statusBadge(c.status)}>{(c.status || '').toUpperCase().replace('_', ' ')}</span></td>
                <td className="px-4 py-3 text-xs max-w-[16rem]">
                  {c.supplier_response ? (
                    <div>
                      <div className="text-slate-300 truncate" title={c.supplier_response}>{c.supplier_response}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{c.supplier_responded_at ? String(c.supplier_responded_at).replace('T', ' ').slice(0, 16) : ''}</div>
                    </div>
                  ) : <span className="text-slate-500">—</span>}
                </td>
                <td className="px-4 py-3 font-mono text-[12px] text-slate-400">{c.date_resolved ? String(c.date_resolved).slice(0, 10) : <span className="text-slate-500">—</span>}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <div className="inline-flex items-center gap-1">
                    {c.attachment_path && (
                      <a href={fileUrl(c.attachment_path)} target="_blank" rel="noreferrer" aria-label="View attachment"
                        className="p-1.5 rounded hover:bg-surface-container-highest/40 text-slate-400 hover:text-slate-200 transition-colors inline-flex">
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>attach_file</span>
                      </a>
                    )}
                    <RowMenu
                      items={[
                        { icon: 'edit', label: 'Edit', onClick: () => openEdit(c) },
                        { icon: 'delete', label: 'Delete', danger: true, onClick: () => { if (confirm(`Delete ${c.ref_no}?`)) del.mutate(c.id) } },
                      ]}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination meta={data} onChange={setPage} />
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={onSave} className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-lg w-full max-w-2xl space-y-md max-h-[90vh] overflow-y-auto">
            <div>
              <h2 className="text-h3 font-h3 text-slate-100">{editing.id ? `Edit ${editing.ref_no}` : 'New Complaint'}</h2>
              <p className="text-body-md text-slate-400 mt-1">All fields will auto-fill logged-by from your account.</p>
            </div>
            <div className="grid grid-cols-2 gap-md">
              <div>
                <label className="block text-label-md text-slate-300 mb-1.5">Date logged</label>
                <DatePicker required value={editing.date_logged || ''} onChange={(v) => setEditing({ ...editing, date_logged: v })} placeholder="Pick a date" />
              </div>
              <div>
                <label className="block text-label-md text-slate-300 mb-1.5">Issue type</label>
                <Select
                  required
                  value={editing.issue_type || 'Food Quality'}
                  onChange={(v) => setEditing({ ...editing, issue_type: v })}
                  options={ISSUE_TYPES.map(t => ({ value: t, label: t }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-md">
              <div>
                <label className="block text-label-md text-slate-300 mb-1.5">Site</label>
                <Select
                  searchable
                  value={editing.site_id ?? ''}
                  onChange={(v) => setEditing({ ...editing, site_id: v === '' ? null : Number(v) })}
                  options={[
                    { value: '', label: '—' },
                    ...sites.map(s => ({ value: String(s.id), label: `${s.site_code} — ${s.name}` })),
                  ]}
                />
              </div>
              <div>
                <label className="block text-label-md text-slate-300 mb-1.5">Supplier</label>
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
                <label className="block text-label-md text-slate-300 mb-1.5">Meal type</label>
                <Select
                  value={editing.meal_rule_id ?? ''}
                  onChange={(v) => setEditing({ ...editing, meal_rule_id: v === '' ? null : Number(v) })}
                  options={[
                    { value: '', label: '—' },
                    ...rules.map(r => ({ value: String(r.id), label: r.name })),
                  ]}
                />
              </div>
            </div>
            <div>
              <label className="block text-label-md text-slate-300 mb-1.5">Description</label>
              <textarea rows={3} required value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} className={`${inputCls} resize-y`} placeholder="Explain the issue…" />
            </div>
            <div>
              <label className="block text-label-md text-slate-300 mb-1.5">Attachment (photo/delivery slip)</label>
              <input type="file" accept="image/*,application/pdf" onChange={e => setEditing({ ...editing, attachment: e.target.files?.[0] || null })}
                className="block text-sm text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600/20 file:text-blue-300 hover:file:bg-blue-600/30" />
              {editing.attachment_path && !editing.attachment && (
                <div className="mt-1 text-xs text-slate-400">
                  Existing: <a href={fileUrl(editing.attachment_path)} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300">view file</a>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-md">
              <div>
                <label className="block text-label-md text-slate-300 mb-1.5">Status</label>
                <Select
                  value={editing.status || 'open'}
                  onChange={(v) => setEditing({ ...editing, status: v })}
                  options={STATUSES.map(s => ({ value: s.value, label: s.label }))}
                />
              </div>
              <div>
                <label className="block text-label-md text-slate-300 mb-1.5">Date resolved</label>
                <DatePicker value={editing.date_resolved || ''} onChange={(v) => setEditing({ ...editing, date_resolved: v })} placeholder="Not yet resolved" />
              </div>
            </div>
            <div>
              <label className="block text-label-md text-slate-300 mb-1.5">Remarks</label>
              <textarea rows={2} value={editing.remarks || ''} onChange={e => setEditing({ ...editing, remarks: e.target.value })} className={`${inputCls} resize-y`} placeholder="Escalated to supplier / supplier apologized / investigating…" />
            </div>
            {editing.supplier_response && (
              <div className="bg-amber-900/10 border border-amber-700/30 rounded p-3">
                <div className="text-label-sm text-amber-300/80 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>reply</span>Supplier response
                  {editing.supplier_responded_at && <span className="text-[10px] text-slate-500 font-mono ml-auto">{String(editing.supplier_responded_at).replace('T', ' ').slice(0, 16)}</span>}
                </div>
                <div className="text-slate-200 text-sm whitespace-pre-wrap">{editing.supplier_response}</div>
              </div>
            )}
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
