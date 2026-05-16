import { useEffect, useState } from 'react'
import {
  useSuppliers, useSupplier, useSaveSupplier, useDeleteSupplier,
  useUploadSupplierDocument, useDeleteSupplierDocument,
  useSites,
  useSupplierUsers, useSaveSupplierUser, useResetSupplierUserPassword, useDeleteSupplierUser,
} from '../api/queries'
import { api } from '../api/client'
import Pagination from '../components/Pagination'
import Select from '../components/Select'
import RowMenu from '../components/RowMenu'
import Checkbox from '../components/Checkbox'
import DatePicker from '../components/DatePicker'

const inputCls =
  'w-full bg-surface-container-high/50 border border-outline-variant/30 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 hover:bg-surface-container-high/70 hover:border-outline-variant/50 focus:bg-surface-container-high focus:border-blue-400 focus:ring-1 focus:ring-blue-400/60 focus:outline-none transition-all'

const apiOrigin = (import.meta.env.VITE_API_BASE || 'http://localhost:8000/api').replace(/\/api\/?$/, '')
const fileUrl = (p) => (p ? `${apiOrigin}/storage/${p}` : null)

const statusBadge = (status) => {
  const base = 'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border '
  if (status === 'active') return base + 'bg-green-900/40 text-green-400 border-green-800/50'
  return base + 'bg-slate-900/40 text-slate-400 border-slate-700/50'
}

export default function Suppliers() {
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  useEffect(() => { setPage(1) }, [q, statusFilter])
  const { data, isLoading } = useSuppliers({ q, status: statusFilter, page })
  const { data: sitesData } = useSites({ all: 1 })
  const save = useSaveSupplier()
  const del = useDeleteSupplier()
  const [editing, setEditing] = useState(null)
  const [viewingId, setViewingId] = useState(null)

  const sites = sitesData?.data ?? []
  const rows = data?.data ?? []

  const openNew = () => setEditing({
    supplier_code: '', name: '', status: 'active',
    start_date: '', end_date: '',
    contact_person: '', contact_email: '', contact_phone: '',
    address: '', notes: '',
    site_ids: [],
  })

  const openEdit = async (row) => {
    const res = (await api.get(`/suppliers/${row.id}`)).data
    setEditing({
      ...res,
      start_date: res.start_date ? String(res.start_date).slice(0, 10) : '',
      end_date: res.end_date ? String(res.end_date).slice(0, 10) : '',
      site_ids: (res.sites ?? []).map(s => s.id),
    })
  }

  const close = () => setEditing(null)

  const onSave = async (ev) => {
    ev.preventDefault()
    const payload = { ...editing }
    if (!payload.start_date) payload.start_date = null
    if (!payload.end_date) payload.end_date = null
    await save.mutateAsync(payload)
    close()
  }

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-md mb-lg">
        <div className="min-w-0">
          <h1 className="font-h1 text-h1 text-slate-100">Suppliers</h1>
          <p className="font-body-md text-body-md text-slate-400 mt-1">Manage catering vendors, their contacts and documents.</p>
        </div>
        <div className="flex gap-sm shrink-0">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" style={{ fontSize: 18 }}>search</span>
            <input placeholder="Search suppliers…" value={q} onChange={e => setQ(e.target.value)}
              className="bg-surface-container-high/50 border border-outline-variant/30 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none transition-all w-64" />
          </div>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            className="w-40"
            options={[
              { value: '', label: 'All statuses' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
          <button onClick={openNew}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 flex items-center gap-2 whitespace-nowrap transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>Add supplier
          </button>
        </div>
      </header>

      <div className="bg-surface-container-low border border-outline-variant/50 rounded-lg overflow-visible">
        <table className="w-full text-left text-body-md">
          <thead className="bg-surface-container-highest/20 text-label-sm text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Start</th>
              <th className="px-4 py-3 font-medium">End</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {isLoading && <tr><td colSpan="7" className="p-6 text-center text-slate-500">Loading…</td></tr>}
            {!isLoading && rows.length === 0 && <tr><td colSpan="7" className="p-6 text-center text-slate-500">No suppliers.</td></tr>}
            {rows.map(s => (
              <tr key={s.id} className="hover:bg-surface-container-highest/10 transition-colors">
                <td className="px-4 py-3 font-mono text-slate-300">{s.supplier_code}</td>
                <td className="px-4 py-3 text-slate-200 font-medium">{s.name}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">
                  {s.contact_person && <div className="text-slate-300">{s.contact_person}</div>}
                  {s.contact_email || s.contact_phone
                    ? <div>{[s.contact_email, s.contact_phone].filter(Boolean).join(' · ')}</div>
                    : <span className="text-slate-500">—</span>}
                </td>
                <td className="px-4 py-3 text-slate-300 font-mono text-[12px]">{s.start_date ? String(s.start_date).slice(0, 10) : <span className="text-slate-500">—</span>}</td>
                <td className="px-4 py-3 text-slate-300 font-mono text-[12px]">{s.end_date ? String(s.end_date).slice(0, 10) : <span className="text-slate-500">—</span>}</td>
                <td className="px-4 py-3"><span className={statusBadge(s.status)}>{(s.status || '').toUpperCase()}</span></td>
                <td className="px-4 py-3 text-right">
                  <RowMenu
                    items={[
                      { icon: 'visibility', label: 'View', onClick: () => setViewingId(s.id) },
                      { icon: 'edit', label: 'Edit', onClick: () => openEdit(s) },
                      { icon: 'delete', label: 'Delete', danger: true, onClick: () => { if (confirm(`Delete ${s.supplier_code}?`)) del.mutate(s.id) } },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination meta={data} onChange={setPage} />
      </div>

      {viewingId && <SupplierDetailModal id={viewingId} onClose={() => setViewingId(null)} onEdit={(row) => { setViewingId(null); openEdit(row) }} />}

      {editing && <SupplierForm editing={editing} setEditing={setEditing} sites={sites} onSave={onSave} onCancel={close} saving={save.isPending} />}
    </>
  )
}

function SupplierForm({ editing, setEditing, sites, onSave, onCancel, saving }) {
  const toggleSite = (siteId) => {
    const set = new Set(editing.site_ids ?? [])
    if (set.has(siteId)) set.delete(siteId); else set.add(siteId)
    setEditing({ ...editing, site_ids: [...set] })
  }
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <form onSubmit={onSave} className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-lg w-full max-w-2xl space-y-md max-h-[90vh] overflow-y-auto">
        <div>
          <h2 className="text-h3 font-h3 text-slate-100">{editing.id ? 'Edit' : 'New'} Supplier</h2>
          <p className="text-body-md text-slate-400 mt-1">Basic details, contact info, and location assignments.</p>
        </div>
        <div className="grid grid-cols-2 gap-md">
          <div>
            <label className="block text-label-md text-slate-300 mb-1.5">Supplier code</label>
            <input required value={editing.supplier_code || ''} onChange={e => setEditing({ ...editing, supplier_code: e.target.value })} className={`${inputCls} font-mono`} placeholder="AMC01" />
          </div>
          <div>
            <label className="block text-label-md text-slate-300 mb-1.5">Name</label>
            <input required value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} className={inputCls} placeholder="AMC Catering" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-md">
          <div>
            <label className="block text-label-md text-slate-300 mb-1.5">Status</label>
            <Select
              value={editing.status || 'active'}
              onChange={(v) => setEditing({ ...editing, status: v })}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
          </div>
          <div>
            <label className="block text-label-md text-slate-300 mb-1.5">Start date</label>
            <DatePicker value={editing.start_date || ''} onChange={(v) => setEditing({ ...editing, start_date: v })} placeholder="Pick a date" />
          </div>
          <div>
            <label className="block text-label-md text-slate-300 mb-1.5">End date</label>
            <DatePicker value={editing.end_date || ''} onChange={(v) => setEditing({ ...editing, end_date: v })} placeholder="Pick a date" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-md">
          <div>
            <label className="block text-label-md text-slate-300 mb-1.5">Contact person</label>
            <input value={editing.contact_person || ''} onChange={e => setEditing({ ...editing, contact_person: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="block text-label-md text-slate-300 mb-1.5">Email</label>
            <input type="email" value={editing.contact_email || ''} onChange={e => setEditing({ ...editing, contact_email: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="block text-label-md text-slate-300 mb-1.5">Phone</label>
            <input value={editing.contact_phone || ''} onChange={e => setEditing({ ...editing, contact_phone: e.target.value })} className={inputCls} />
          </div>
        </div>
        <div>
          <label className="block text-label-md text-slate-300 mb-1.5">Address</label>
          <textarea rows={2} value={editing.address || ''} onChange={e => setEditing({ ...editing, address: e.target.value })} className={`${inputCls} resize-y`} />
        </div>
        <div>
          <label className="block text-label-md text-slate-300 mb-1.5">Notes</label>
          <textarea rows={2} value={editing.notes || ''} onChange={e => setEditing({ ...editing, notes: e.target.value })} className={`${inputCls} resize-y`} />
        </div>
        <div>
          <label className="block text-label-md text-slate-300 mb-1.5">Assigned locations</label>
          <div className="bg-surface-container-high/50 border border-outline-variant/30 rounded-lg p-md grid grid-cols-2 gap-sm max-h-48 overflow-y-auto">
            {sites.length === 0 && <div className="text-slate-500 text-sm col-span-2">No sites available.</div>}
            {sites.map(s => (
              <Checkbox
                key={s.id}
                checked={(editing.site_ids ?? []).includes(s.id)}
                onChange={() => toggleSite(s.id)}
              >
                <span className="font-mono text-[11px] text-slate-500">{s.site_code}</span>
                <span>{s.name}</span>
              </Checkbox>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-sm pt-sm">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-outline-variant/50 text-sm text-slate-300 hover:bg-surface-container-highest/40 focus:outline-none focus:ring-2 focus:ring-blue-400/30 transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 disabled:opacity-60 transition-colors">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}

function SupplierDetailModal({ id, onClose, onEdit }) {
  const { data: supplier, isLoading } = useSupplier(id)
  const upload = useUploadSupplierDocument()
  const delDoc = useDeleteSupplierDocument()
  const [docForm, setDocForm] = useState({ name: '', expires_at: '', file: null })

  const onUpload = async (ev) => {
    ev.preventDefault()
    if (!docForm.file || !docForm.name) return
    await upload.mutateAsync({ supplierId: id, name: docForm.name, file: docForm.file, expires_at: docForm.expires_at })
    setDocForm({ name: '', expires_at: '', file: null })
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {isLoading || !supplier ? <div className="p-8 text-center text-slate-500">Loading…</div> : (
          <>
            <div className="flex items-start justify-between mb-md">
              <div>
                <h2 className="text-h3 font-h3 text-slate-100">{supplier.name}</h2>
                <p className="font-mono text-sm text-slate-400 mt-1">{supplier.supplier_code}</p>
                <span className={statusBadge(supplier.status) + ' mt-2'}>{(supplier.status || '').toUpperCase()}</span>
              </div>
              <button onClick={onClose} className="p-1.5 rounded hover:bg-surface-container-highest/40 text-slate-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <dl className="grid grid-cols-3 gap-md text-sm mb-lg">
              <div><dt className="text-label-sm text-slate-500 uppercase tracking-wider mb-1">Start</dt><dd className="text-slate-200 font-mono">{supplier.start_date ? String(supplier.start_date).slice(0, 10) : '—'}</dd></div>
              <div><dt className="text-label-sm text-slate-500 uppercase tracking-wider mb-1">End</dt><dd className="text-slate-200 font-mono">{supplier.end_date ? String(supplier.end_date).slice(0, 10) : '—'}</dd></div>
              <div><dt className="text-label-sm text-slate-500 uppercase tracking-wider mb-1">Contact</dt><dd className="text-slate-200">{supplier.contact_person || '—'}</dd></div>
              <div><dt className="text-label-sm text-slate-500 uppercase tracking-wider mb-1">Email</dt><dd className="text-slate-200">{supplier.contact_email || '—'}</dd></div>
              <div><dt className="text-label-sm text-slate-500 uppercase tracking-wider mb-1">Phone</dt><dd className="text-slate-200">{supplier.contact_phone || '—'}</dd></div>
              <div><dt className="text-label-sm text-slate-500 uppercase tracking-wider mb-1">Address</dt><dd className="text-slate-200 truncate">{supplier.address || '—'}</dd></div>
            </dl>

            <section className="mb-lg">
              <h3 className="text-label-sm text-slate-400 uppercase tracking-wider mb-2">Assigned locations</h3>
              <div className="flex flex-wrap gap-2">
                {(supplier.sites ?? []).length === 0 && <span className="text-slate-500 text-sm">None</span>}
                {(supplier.sites ?? []).map(s => (
                  <span key={s.id} className="inline-flex items-center gap-1.5 bg-surface-container-highest/40 border border-outline-variant/40 rounded px-2 py-1 text-xs text-slate-300">
                    <span className="font-mono text-[10px] text-slate-500">{s.site_code}</span>{s.name}
                  </span>
                ))}
              </div>
            </section>

            <SupplierUsersSection supplierId={id} />

            <section className="mb-lg">
              <h3 className="text-label-sm text-slate-400 uppercase tracking-wider mb-2">Meal assignments</h3>
              {(supplier.meal_assignments ?? []).length === 0
                ? <div className="text-slate-500 text-sm">No meal assignments.</div>
                : (
                  <div className="border border-outline-variant/40 rounded overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-surface-container-highest/30 text-label-sm text-slate-400 uppercase tracking-wider">
                        <tr><th className="px-3 py-2 text-left">Site</th><th className="px-3 py-2 text-left">Meal</th><th className="px-3 py-2 text-left">Start</th><th className="px-3 py-2 text-left">End</th><th className="px-3 py-2 text-left">Remarks</th></tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20">
                        {supplier.meal_assignments.map(a => (
                          <tr key={a.id}>
                            <td className="px-3 py-2 text-slate-300">{a.site ? `${a.site.site_code} — ${a.site.name}` : '—'}</td>
                            <td className="px-3 py-2 text-slate-300">{a.meal_rule?.name || '—'}</td>
                            <td className="px-3 py-2 font-mono text-xs text-slate-400">{a.start_date ? String(a.start_date).slice(0, 10) : '—'}</td>
                            <td className="px-3 py-2 font-mono text-xs text-slate-400">{a.end_date ? String(a.end_date).slice(0, 10) : '—'}</td>
                            <td className="px-3 py-2 text-slate-400">{a.remarks || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              }
            </section>

            <section>
              <h3 className="text-label-sm text-slate-400 uppercase tracking-wider mb-2">Documents & certifications</h3>
              <div className="space-y-sm">
                {(supplier.documents ?? []).length === 0 && <div className="text-slate-500 text-sm">No documents uploaded.</div>}
                {(supplier.documents ?? []).map(d => (
                  <div key={d.id} className="flex items-center justify-between bg-surface-container-highest/30 border border-outline-variant/40 rounded px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-slate-400" style={{ fontSize: 18 }}>description</span>
                      <a href={fileUrl(d.file_path)} target="_blank" rel="noreferrer" className="text-slate-200 hover:text-blue-300 text-sm font-medium">{d.name}</a>
                      {d.expires_at && <span className="text-xs text-slate-500 font-mono">expires {String(d.expires_at).slice(0, 10)}</span>}
                    </div>
                    <button onClick={() => { if (confirm(`Delete ${d.name}?`)) delDoc.mutate({ supplierId: id, documentId: d.id }) }}
                      className="text-red-400 hover:text-red-300 p-1 rounded"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span></button>
                  </div>
                ))}
              </div>
              <form onSubmit={onUpload} className="grid grid-cols-[1fr_auto_auto_auto] gap-sm items-end mt-md">
                <div>
                  <label className="block text-label-md text-slate-300 mb-1">Document name</label>
                  <input value={docForm.name} onChange={e => setDocForm({ ...docForm, name: e.target.value })} className={inputCls} placeholder="Trade License" />
                </div>
                <div>
                  <label className="block text-label-md text-slate-300 mb-1">Expires</label>
                  <DatePicker value={docForm.expires_at} onChange={(v) => setDocForm({ ...docForm, expires_at: v })} placeholder="Pick a date" />
                </div>
                <div>
                  <label className="block text-label-md text-slate-300 mb-1">File</label>
                  <input type="file" onChange={e => setDocForm({ ...docForm, file: e.target.files?.[0] || null })}
                    className="block text-sm text-slate-300 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600/20 file:text-blue-300 hover:file:bg-blue-600/30" />
                </div>
                <button type="submit" disabled={upload.isPending || !docForm.file || !docForm.name}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 disabled:opacity-60">
                  {upload.isPending ? 'Uploading…' : 'Upload'}
                </button>
              </form>
            </section>

            <div className="flex justify-end gap-sm pt-lg mt-md border-t border-outline-variant/30">
              <button onClick={onClose} className="px-4 py-2 rounded-lg border border-outline-variant/50 text-sm text-slate-300 hover:bg-surface-container-highest/40 focus:outline-none focus:ring-2 focus:ring-blue-400/30 transition-colors">Close</button>
              <button onClick={() => onEdit(supplier)} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 transition-colors">Edit</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const ROLE_OPTIONS = [
  { value: 'rep',        label: 'Representative' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'admin',      label: 'Admin' },
]

const blankUser = () => ({ name: '', email: '', password: '', role: 'rep', active: true })

function SupplierUsersSection({ supplierId }) {
  const { data, isLoading } = useSupplierUsers(supplierId)
  const save = useSaveSupplierUser()
  const reset = useResetSupplierUserPassword()
  const del = useDeleteSupplierUser()

  const [editing, setEditing] = useState(null) // null | blank-new-user | existing-row
  const [resetResult, setResetResult] = useState(null) // { email, password }
  const [err, setErr] = useState(null)

  const users = data?.data ?? []

  const onSave = async (ev) => {
    ev.preventDefault()
    setErr(null)
    try {
      const payload = { supplierId, ...editing }
      if (payload.id && !payload.password) delete payload.password
      await save.mutateAsync(payload)
      setEditing(null)
    } catch (e) {
      const errors = e?.response?.data?.errors
      const first = errors ? Object.values(errors)[0]?.[0] : null
      setErr(first || e?.response?.data?.message || 'Save failed')
    }
  }

  const onReset = async (u) => {
    if (!confirm(`Reset password for ${u.email}? A new password will be generated.`)) return
    setErr(null)
    try {
      const res = await reset.mutateAsync({ id: u.id })
      setResetResult({ email: u.email, password: res.password })
    } catch (e) {
      setErr(e?.response?.data?.message || 'Reset failed')
    }
  }

  const onToggleActive = async (u) => {
    try {
      await save.mutateAsync({ supplierId, id: u.id, active: !u.active })
    } catch (e) {
      setErr(e?.response?.data?.message || 'Update failed')
    }
  }

  return (
    <section className="mb-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-label-sm text-slate-400 uppercase tracking-wider">Login users</h3>
        <button
          onClick={() => { setErr(null); setEditing(blankUser()) }}
          className="text-xs px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-semibold flex items-center gap-1"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>Add user
        </button>
      </div>

      {resetResult && (
        <div className="mb-sm bg-amber-900/20 border border-amber-700/50 rounded px-3 py-2 text-xs text-amber-200">
          <div className="font-semibold mb-0.5">New password for {resetResult.email}</div>
          <div className="font-mono select-all bg-black/30 inline-block px-2 py-0.5 rounded">{resetResult.password}</div>
          <button onClick={() => setResetResult(null)} className="ml-2 text-amber-300/60 hover:text-amber-300">dismiss</button>
        </div>
      )}

      <div className="border border-outline-variant/40 rounded overflow-hidden">
        {isLoading ? (
          <div className="p-4 text-center text-slate-500 text-sm">Loading…</div>
        ) : users.length === 0 && !editing ? (
          <div className="p-4 text-center text-slate-500 text-sm">No login users. Click “Add user” to grant portal access.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-container-highest/30 text-label-sm text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Role</th>
                <th className="px-3 py-2 text-left">Last login</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-surface-container-highest/10">
                  <td className="px-3 py-2 text-slate-200">{u.name}</td>
                  <td className="px-3 py-2 text-slate-300 font-mono text-xs">{u.email}</td>
                  <td className="px-3 py-2 text-slate-300 capitalize">{u.role}</td>
                  <td className="px-3 py-2 text-slate-400 font-mono text-xs">{u.last_login_at ? String(u.last_login_at).replace('T', ' ').slice(0, 16) : '—'}</td>
                  <td className="px-3 py-2">
                    <span className={'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ' + (u.active ? 'bg-green-900/40 text-green-400 border-green-800/50' : 'bg-slate-900/40 text-slate-400 border-slate-700/50')}>
                      {u.active ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex gap-1">
                      <button onClick={() => { setErr(null); setEditing({ ...u, password: '' }) }} title="Edit"
                        className="p-1 rounded hover:bg-surface-container-highest/40 text-slate-400 hover:text-slate-200">
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                      </button>
                      <button onClick={() => onReset(u)} title="Reset password"
                        className="p-1 rounded hover:bg-surface-container-highest/40 text-slate-400 hover:text-slate-200">
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>lock_reset</span>
                      </button>
                      <button onClick={() => onToggleActive(u)} title={u.active ? 'Disable' : 'Enable'}
                        className="p-1 rounded hover:bg-surface-container-highest/40 text-slate-400 hover:text-slate-200">
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{u.active ? 'block' : 'check_circle'}</span>
                      </button>
                      <button onClick={() => { if (confirm(`Delete ${u.email}?`)) del.mutate({ id: u.id, supplierId }) }} title="Delete"
                        className="p-1 rounded hover:bg-red-900/30 text-red-400">
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <form onSubmit={onSave} className="mt-sm bg-surface-container-lowest/50 border border-outline-variant/40 rounded p-md grid grid-cols-2 gap-sm">
          <div className="col-span-2 text-label-sm text-slate-400 uppercase tracking-wider">{editing.id ? 'Edit user' : 'New user'}</div>
          <div>
            <label className="block text-label-md text-slate-300 mb-1">Name</label>
            <input required value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="block text-label-md text-slate-300 mb-1">Email</label>
            <input required type="email" value={editing.email || ''} onChange={e => setEditing({ ...editing, email: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="block text-label-md text-slate-300 mb-1">Role</label>
            <Select value={editing.role || 'rep'} onChange={(v) => setEditing({ ...editing, role: v })} options={ROLE_OPTIONS} />
          </div>
          {!editing.id && (
            <div>
              <label className="block text-label-md text-slate-300 mb-1">Password (min 8)</label>
              <input required type="text" value={editing.password || ''} onChange={e => setEditing({ ...editing, password: e.target.value })} className={`${inputCls} font-mono`} />
            </div>
          )}
          {editing.id && (
            <div className="flex items-end">
              <Checkbox checked={!!editing.active} onChange={(v) => setEditing({ ...editing, active: v })}>Active</Checkbox>
            </div>
          )}
          {err && <div className="col-span-2 text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded px-2 py-1.5">{err}</div>}
          <div className="col-span-2 flex justify-end gap-sm">
            <button type="button" onClick={() => { setEditing(null); setErr(null) }} className="px-3 py-1.5 rounded border border-outline-variant/50 text-xs text-slate-300 hover:bg-surface-container-highest/40">Cancel</button>
            <button type="submit" disabled={save.isPending} className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 disabled:opacity-60">
              {save.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
