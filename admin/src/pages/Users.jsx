import { useEffect, useMemo, useState } from 'react'
import { useUsers, useSaveUser, useDeleteUser, useRoles } from '../api/queries'
import { useCan } from '../lib/permissions'
import Pagination from '../components/Pagination'
import Select from '../components/Select'
import RowMenu from '../components/RowMenu'
import Checkbox from '../components/Checkbox'

const inputCls =
  'w-full bg-surface-container-lowest border border-outline-variant/50 rounded px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none transition-all'

const isSuperAdminRow = (u) => u?.role === 'admin'

export default function Users() {
  const canCreate = useCan('users.create')
  const canUpdate = useCan('users.update')
  const canDelete = useCan('users.delete')

  const [q, setQ] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)
  useEffect(() => { setPage(1) }, [q, roleFilter])

  const { data: rolesPayload } = useRoles()
  const roles = rolesPayload?.data ?? []

  const { data, isLoading } = useUsers({ q, role_id: roleFilter || undefined, page })
  const save = useSaveUser()
  const del = useDeleteUser()
  const [editing, setEditing] = useState(null)
  const [err, setErr] = useState(null)

  const rows = data?.data ?? []

  const roleOptions = useMemo(
    () => roles.map((r) => ({ value: r.id, label: r.name })),
    [roles],
  )

  const roleFilterOptions = useMemo(
    () => [{ value: '', label: 'All roles' }, ...roleOptions.map((r) => ({ value: String(r.value), label: r.label }))],
    [roleOptions],
  )

  const openNew = () => {
    setErr(null)
    setEditing({
      name: '',
      email: '',
      password: '',
      role_id: roles[0]?.id ?? '',
      active: true,
    })
  }

  const openEdit = (u) => {
    setErr(null)
    setEditing({ ...u, password: '', role_id: u.role_id ?? '' })
  }

  const onSave = async (e) => {
    e.preventDefault()
    setErr(null)
    const payload = {
      id: editing.id,
      name: editing.name,
      email: editing.email,
      role_id: editing.role_id,
      active: editing.active,
    }
    if (editing.password) payload.password = editing.password
    if (!payload.role_id) {
      setErr('Please select a role.')
      return
    }
    try {
      await save.mutateAsync(payload)
      setEditing(null)
    } catch (e) {
      const data = e?.response?.data
      const firstError = data?.errors ? Object.values(data.errors).flat()[0] : null
      setErr(firstError || data?.message || 'Failed to save user.')
    }
  }

  const onDelete = (u) => {
    if (isSuperAdminRow(u)) return
    if (!confirm(`Delete ${u.name}?`)) return
    del.mutate(u.id)
  }

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-md mb-lg">
        <div className="min-w-0">
          <h1 className="font-h1 text-h1 text-slate-100">Users &amp; Access</h1>
          <p className="font-body-md text-body-md text-slate-400 mt-1">Create sub-accounts and assign each one a role to control what they can see and do.</p>
        </div>
        <div className="flex gap-sm shrink-0">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" style={{ fontSize: 18 }}>search</span>
            <input placeholder="Search users…" value={q} onChange={e => setQ(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant/50 rounded pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none transition-all w-64" />
          </div>
          <Select
            value={roleFilter}
            onChange={setRoleFilter}
            className="w-40"
            options={roleFilterOptions}
          />
          {canCreate && (
            <button onClick={openNew} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-colors">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>Add user
            </button>
          )}
        </div>
      </header>

      <div className="bg-surface-container-low border border-outline-variant/50 rounded-lg overflow-visible">
        <table className="w-full text-left text-body-md">
          <thead className="bg-surface-container-highest/20 text-label-sm text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {isLoading && <tr><td colSpan="5" className="p-6 text-center text-slate-500">Loading…</td></tr>}
            {!isLoading && rows.length === 0 && <tr><td colSpan="5" className="p-6 text-center text-slate-500">No users.</td></tr>}
            {rows.map(u => {
              const superAdmin = isSuperAdminRow(u)
              const roleLabel = superAdmin
                ? 'Super admin'
                : (u.assigned_role?.name || u.role_name || '—')
              const badgeCls = superAdmin
                ? 'bg-purple-900/40 text-purple-300 border-purple-800/50'
                : (u.role_id
                  ? 'bg-blue-900/40 text-blue-300 border-blue-800/50'
                  : 'bg-slate-900/40 text-slate-400 border-slate-700/50')
              const menuItems = []
              if (canUpdate && !superAdmin) {
                menuItems.push({ icon: 'edit', label: 'Edit', onClick: () => openEdit(u) })
              }
              if (canDelete && !superAdmin) {
                menuItems.push({ icon: 'delete', label: 'Delete', danger: true, onClick: () => onDelete(u) })
              }
              return (
                <tr key={u.id} className="hover:bg-surface-container-highest/10 transition-colors">
                  <td className="px-4 py-3 text-slate-200 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-slate-300 text-sm">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ' + badgeCls}>
                      {roleLabel.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={
                      'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ' +
                      (u.active !== false ? 'bg-green-900/40 text-green-400 border-green-800/50' : 'bg-slate-900/40 text-slate-400 border-slate-700/50')
                    }>{u.active !== false ? 'ACTIVE' : 'INACTIVE'}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {superAdmin ? (
                      <span className="text-xs text-slate-600 italic">Locked</span>
                    ) : menuItems.length > 0 ? (
                      <RowMenu items={menuItems} />
                    ) : (
                      <span className="text-xs text-slate-600">—</span>
                    )}
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
          <form onSubmit={onSave} className="bg-surface-container-low border border-outline-variant/50 rounded-lg p-lg w-full max-w-md space-y-md">
            <h2 className="text-h3 font-h3 text-slate-100">{editing.id ? 'Edit' : 'New'} User</h2>
            {err && (
              <div className="px-3 py-2 rounded border border-red-900/50 bg-red-900/20 text-red-300 text-sm">
                {err}
              </div>
            )}
            <div>
              <label className="block text-label-md text-slate-300 mb-1.5">Name</label>
              <input required value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-label-md text-slate-300 mb-1.5">Email</label>
              <input type="email" required value={editing.email || ''} onChange={e => setEditing({ ...editing, email: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-label-md text-slate-300 mb-1.5">Password {editing.id && <span className="text-slate-500 text-xs">(leave blank to keep)</span>}</label>
              <input type="password" autoComplete="new-password" required={!editing.id}
                value={editing.password || ''} onChange={e => setEditing({ ...editing, password: e.target.value })} className={inputCls}
                placeholder={editing.id ? '••••••' : ''} />
            </div>
            <div>
              <label className="block text-label-md text-slate-300 mb-1.5">Role</label>
              {roles.length === 0 ? (
                <div className="text-xs text-amber-400">
                  No roles defined yet. Create one in Roles &amp; Permissions first.
                </div>
              ) : (
                <Select
                  value={editing.role_id ?? ''}
                  onChange={(v) => setEditing({ ...editing, role_id: v })}
                  options={roleOptions}
                  placeholder="Select a role…"
                />
              )}
            </div>
            <Checkbox
              checked={editing.active !== false}
              onChange={(v) => setEditing({ ...editing, active: v })}
            >
              Active
            </Checkbox>
            <div className="flex justify-end gap-sm pt-sm">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded border border-outline-variant/50 text-sm text-slate-300 hover:bg-surface-container-highest/40 transition-colors">Cancel</button>
              <button type="submit" disabled={save.isPending || roles.length === 0} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold disabled:opacity-60 transition-colors">
                {save.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
