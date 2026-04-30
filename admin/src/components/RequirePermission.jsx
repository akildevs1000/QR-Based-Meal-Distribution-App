import { useMe } from '../api/queries'
import { useCan } from '../lib/permissions'

export default function RequirePermission({ permission, children }) {
  const { isLoading, data: me } = useMe()
  const allowed = useCan(permission)

  if (isLoading || !me) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-slate-500 text-sm">
        Loading…
      </div>
    )
  }

  if (allowed) return children

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-md">
      <span className="material-symbols-outlined text-slate-600 mb-md" style={{ fontSize: 56 }}>
        block
      </span>
      <h2 className="text-h2 font-h2 text-slate-200 mb-1">Access denied</h2>
      <p className="text-body-md text-slate-400 max-w-md">
        You don't have permission to view this page. Ask an administrator to update your role
        if you need access.
      </p>
      {permission && (
        <p className="text-label-sm text-slate-600 mt-md font-mono">{permission}</p>
      )}
    </div>
  )
}
