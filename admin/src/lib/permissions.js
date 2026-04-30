import { useMe } from '../api/queries'

export function useCan(permission) {
  const { data: me } = useMe()
  if (!me) return false
  if (me.is_super_admin) return true
  if (!permission) return true
  return Array.isArray(me.permissions) && me.permissions.includes(permission)
}

export function useIsSuperAdmin() {
  const { data: me } = useMe()
  return !!me?.is_super_admin
}
