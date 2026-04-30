import { useMemo, useState } from 'react'
import {
  useRoles,
  useRole,
  usePermissions,
  useSaveRole,
  useDeleteRole,
} from '../api/queries'
import { useCan } from '../lib/permissions'
import Checkbox from '../components/Checkbox'

const inputCls =
  'w-full bg-surface-container-lowest border border-outline-variant/50 rounded px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none transition-all'

export default function Roles() {
  const canCreate = useCan('roles.create')
  const canUpdate = useCan('roles.update')
  const canDelete = useCan('roles.delete')

  const { data: rolesPayload, isLoading: rolesLoading } = useRoles()
  const { data: permsPayload, isLoading: permsLoading } = usePermissions()
  const roles = useMemo(() => rolesPayload?.data ?? [], [rolesPayload])
  const grouped = useMemo(() => permsPayload?.grouped ?? [], [permsPayload])

  const [explicitId, setExplicitId] = useState(null)
  const [creating, setCreating] = useState(false)

  const effectiveId = creating ? null : (explicitId ?? roles[0]?.id ?? null)

  const { data: roleDetail } = useRole(effectiveId, !creating)

  const startCreate = () => {
    setCreating(true)
    setExplicitId(null)
  }

  const cancelCreate = () => {
    setCreating(false)
  }

  const onSelect = (id) => {
    setCreating(false)
    setExplicitId(id)
  }

  const onCreated = (saved) => {
    setCreating(false)
    if (saved?.id) setExplicitId(saved.id)
  }

  const onDeleted = () => {
    setExplicitId(null)
  }

  const isEditing = creating || !!effectiveId
  const editorKey = creating ? 'new' : (roleDetail ? `role-${roleDetail.id}` : 'empty')

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-md mb-lg">
        <div className="min-w-0">
          <h1 className="font-h1 text-h1 text-slate-100">Roles &amp; Permissions</h1>
          <p className="font-body-md text-body-md text-slate-400 mt-1">
            Define roles and choose exactly which pages each role can use. Roles are then assigned to users.
          </p>
        </div>
        {canCreate && (
          <button
            onClick={startCreate}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            New role
          </button>
        )}
      </header>

      <div className="grid gap-lg" style={{ gridTemplateColumns: 'minmax(0, 320px) minmax(0, 1fr)' }}>
        {/* Left pane — role list */}
        <aside className="bg-surface-container-low border border-outline-variant/50 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-outline-variant/30 text-label-sm uppercase tracking-wider text-slate-400">
            Roles {roles.length > 0 && <span className="text-slate-600">· {roles.length}</span>}
          </div>
          <div className="divide-y divide-outline-variant/20 max-h-[calc(100vh-220px)] overflow-y-auto">
            {rolesLoading && <div className="p-4 text-sm text-slate-500">Loading…</div>}
            {!rolesLoading && roles.length === 0 && !creating && (
              <div className="p-6 text-center text-sm text-slate-500">
                No roles yet.
                {canCreate && <div className="mt-2 text-slate-600 text-xs">Click "New role" to create your first one.</div>}
              </div>
            )}
            {creating && (
              <button
                type="button"
                className="w-full text-left px-4 py-3 bg-blue-600/15 border-l-2 border-blue-400"
              >
                <div className="text-slate-100 font-medium text-sm">New role</div>
                <div className="text-xs text-slate-500 mt-0.5">Unsaved</div>
              </button>
            )}
            {roles.map((r) => {
              const active = !creating && r.id === effectiveId
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onSelect(r.id)}
                  className={
                    'w-full text-left px-4 py-3 transition-colors ' +
                    (active
                      ? 'bg-blue-600/15 border-l-2 border-blue-400'
                      : 'border-l-2 border-transparent hover:bg-surface-container-highest/30')
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-slate-100 font-medium text-sm truncate">{r.name}</div>
                    {r.is_system && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                        SYSTEM
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                    <span>{r.permissions_count ?? 0} permission{(r.permissions_count ?? 0) === 1 ? '' : 's'}</span>
                    <span>·</span>
                    <span>{r.users_count ?? 0} user{(r.users_count ?? 0) === 1 ? '' : 's'}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        {/* Right pane — editor */}
        <section className="bg-surface-container-low border border-outline-variant/50 rounded-lg">
          {!isEditing && (
            <div className="p-xl text-center text-slate-500">
              Select a role on the left, or create a new one.
            </div>
          )}
          {isEditing && (
            <RoleEditor
              key={editorKey}
              creating={creating}
              role={creating ? null : roleDetail}
              grouped={grouped}
              permsLoading={permsLoading}
              canUpdate={canUpdate}
              canDelete={canDelete}
              onCreated={onCreated}
              onDeleted={onDeleted}
              onCancelCreate={cancelCreate}
            />
          )}
        </section>
      </div>
    </>
  )
}

function RoleEditor({
  creating,
  role,
  grouped,
  permsLoading,
  canUpdate,
  canDelete,
  onCreated,
  onDeleted,
  onCancelCreate,
}) {
  const initial = useMemo(() => ({
    id: role?.id,
    name: role?.name ?? '',
    description: role?.description ?? '',
    is_system: !!role?.is_system,
    users_count: role?.users_count ?? 0,
    permission_ids: role?.permission_ids ?? [],
  }), [role])

  const [form, setForm] = useState(initial)
  const [err, setErr] = useState(null)
  const save = useSaveRole()
  const del = useDeleteRole()

  const allPermIds = useMemo(
    () => grouped.flatMap((g) => g.permissions.map((p) => p.id)),
    [grouped],
  )

  const togglePerm = (id) => {
    setForm((f) => {
      const set = new Set(f.permission_ids)
      if (set.has(id)) set.delete(id)
      else set.add(id)
      return { ...f, permission_ids: Array.from(set) }
    })
  }

  const toggleGroup = (groupPerms) => {
    const ids = groupPerms.map((p) => p.id)
    setForm((f) => {
      const allSelected = ids.every((id) => f.permission_ids.includes(id))
      const set = new Set(f.permission_ids)
      if (allSelected) ids.forEach((id) => set.delete(id))
      else ids.forEach((id) => set.add(id))
      return { ...f, permission_ids: Array.from(set) }
    })
  }

  const selectAll = () => setForm((f) => ({ ...f, permission_ids: [...allPermIds] }))
  const clearAll = () => setForm((f) => ({ ...f, permission_ids: [] }))

  const formDisabled = !creating && !canUpdate
  const isSystem = !!form.is_system

  const onSave = async (e) => {
    e?.preventDefault?.()
    setErr(null)
    if (!form.name?.trim()) {
      setErr('Role name is required.')
      return
    }
    try {
      const saved = await save.mutateAsync({
        id: form.id,
        name: form.name.trim(),
        description: form.description?.trim() || null,
        permission_ids: form.permission_ids,
      })
      if (creating) onCreated(saved)
      else if (saved?.id) {
        // Update local form with server-truth values (e.g. trimmed name)
        setForm((f) => ({ ...f, name: saved.name, description: saved.description ?? '' }))
      }
    } catch (e) {
      const data = e?.response?.data
      const firstError = data?.errors ? Object.values(data.errors).flat()[0] : null
      setErr(firstError || data?.message || 'Failed to save role.')
    }
  }

  const onDelete = async () => {
    if (!form.id) return
    if (form.users_count > 0) return
    if (!confirm(`Delete role "${form.name}"? This cannot be undone.`)) return
    try {
      await del.mutateAsync(form.id)
      onDeleted()
    } catch (e) {
      setErr(e?.response?.data?.message || 'Failed to delete role.')
    }
  }

  const interactive = !formDisabled && !isSystem

  return (
    <form onSubmit={onSave} className="flex flex-col">
      <div className="px-lg py-md border-b border-outline-variant/30 flex flex-wrap items-center justify-between gap-md">
        <div className="min-w-0">
          <h2 className="text-h3 font-h3 text-slate-100">
            {creating ? 'New role' : form.name || 'Edit role'}
          </h2>
          {!creating && form.users_count > 0 && (
            <p className="text-xs text-slate-500 mt-0.5">
              Assigned to {form.users_count} user{form.users_count === 1 ? '' : 's'}.
            </p>
          )}
        </div>
        <div className="flex gap-sm">
          {!creating && canDelete && (
            <button
              type="button"
              onClick={onDelete}
              disabled={isSystem || form.users_count > 0 || del.isPending}
              title={
                isSystem
                  ? 'System roles cannot be deleted.'
                  : form.users_count > 0
                    ? 'Reassign all users on this role before deleting.'
                    : ''
              }
              className="px-4 py-2 rounded border border-red-900/50 text-sm text-red-300 hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Delete
            </button>
          )}
          {creating && (
            <button
              type="button"
              onClick={onCancelCreate}
              className="px-4 py-2 rounded border border-outline-variant/50 text-sm text-slate-300 hover:bg-surface-container-highest/40 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={save.isPending || formDisabled || isSystem}
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {save.isPending ? 'Saving…' : creating ? 'Create role' : 'Save changes'}
          </button>
        </div>
      </div>

      {err && (
        <div className="mx-lg mt-md px-3 py-2 rounded border border-red-900/50 bg-red-900/20 text-red-300 text-sm">
          {err}
        </div>
      )}

      <div className="px-lg py-md grid gap-md md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <div>
          <label className="block text-label-md text-slate-300 mb-1.5">Role name</label>
          <input
            required
            disabled={formDisabled || isSystem}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputCls}
            placeholder="e.g. Site Manager"
          />
        </div>
        <div>
          <label className="block text-label-md text-slate-300 mb-1.5">Description <span className="text-slate-600">· optional</span></label>
          <input
            disabled={formDisabled || isSystem}
            value={form.description ?? ''}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className={inputCls}
            placeholder="Short note about what this role is for"
          />
        </div>
      </div>

      <div className="px-lg pt-sm pb-3 flex items-center justify-between border-t border-outline-variant/20">
        <div className="text-label-sm text-slate-400 uppercase tracking-wider">
          Permissions <span className="text-slate-600">· {form.permission_ids.length} of {allPermIds.length} selected</span>
        </div>
        {interactive && (
          <div className="flex gap-3 text-xs">
            <button type="button" onClick={selectAll} className="text-blue-400 hover:text-blue-300">
              Select all
            </button>
            <span className="text-slate-700">·</span>
            <button type="button" onClick={clearAll} className="text-slate-400 hover:text-slate-200">
              Clear all
            </button>
          </div>
        )}
      </div>

      <div className="px-lg pb-lg space-y-1.5">
        {permsLoading && <div className="text-sm text-slate-500">Loading permissions…</div>}
        {grouped.map((g) => {
          const ids = g.permissions.map((p) => p.id)
          const selectedInGroup = ids.filter((id) => form.permission_ids.includes(id)).length
          const allInGroup = selectedInGroup === ids.length
          const someInGroup = selectedInGroup > 0 && !allInGroup
          return (
            <div
              key={g.group}
              className="border border-outline-variant/30 rounded-lg px-3 py-2.5 bg-surface-container-lowest/40 hover:bg-surface-container-lowest/60 transition-colors"
            >
              <div className="flex items-center gap-3 flex-wrap">
                <Checkbox
                  checked={allInGroup}
                  indeterminate={someInGroup}
                  disabled={!interactive}
                  size={20}
                  onChange={() => toggleGroup(g.permissions)}
                  className="min-w-[180px]"
                  labelClassName=""
                >
                  <span className="text-sm font-semibold text-slate-100">{g.group}</span>
                </Checkbox>
                <div className="flex items-center gap-2 flex-wrap flex-1">
                  {g.permissions.map((p) => {
                    const checked = form.permission_ids.includes(p.id)
                    const action = (p.key.split('.').pop() || p.key)
                    const label = action.charAt(0).toUpperCase() + action.slice(1)
                    return (
                      <button
                        key={p.id}
                        type="button"
                        disabled={!interactive}
                        onClick={() => togglePerm(p.id)}
                        title={p.label}
                        className={
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-colors disabled:cursor-not-allowed ' +
                          (checked
                            ? 'bg-blue-600/20 border-blue-500/60 text-blue-100 hover:bg-blue-600/30'
                            : 'bg-surface-container-lowest border-outline-variant/40 text-slate-400 hover:text-slate-200 hover:border-outline-variant')
                        }
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                          {checked ? 'check_box' : 'check_box_outline_blank'}
                        </span>
                        {label}
                      </button>
                    )
                  })}
                </div>
                <span className="text-[11px] text-slate-500 tabular-nums w-10 text-right shrink-0">
                  {selectedInGroup}/{ids.length}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </form>
  )
}
