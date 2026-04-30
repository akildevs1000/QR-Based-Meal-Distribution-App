import { NavLink, useNavigate } from 'react-router-dom'
import { useLogout, useMe, useSettings } from '../api/queries'

const navGroups = [
  {
    label: 'Overview',
    links: [
      { to: '/dashboard', icon: 'dashboard', label: 'Dashboard', permission: 'dashboard.view' },
      { to: '/logs', icon: 'list_alt', label: 'Transactions', permission: 'logs.view' },
    ],
  },
  {
    label: 'Master Data',
    links: [
      { to: '/employees', icon: 'badge', label: 'Employees', permission: 'employees.view' },
      { to: '/sites', icon: 'apartment', label: 'Distribution Points', permission: 'sites.view' },
      { to: '/suppliers', icon: 'local_shipping', label: 'Suppliers', permission: 'suppliers.view' },
      { to: '/meal-rules', icon: 'restaurant_menu', label: 'Meal Rules', permission: 'meal-rules.view' },
      { to: '/meal-categories', icon: 'ramen_dining', label: 'Meal Categories', permission: 'meal-categories.view' },
    ],
  },
  {
    label: 'Operations',
    links: [
      { to: '/food-requests', icon: 'receipt_long', label: 'Food Requests', permission: 'food-requests.view' },
      { to: '/delivery-notes', icon: 'inventory_2', label: 'Delivery Notes', permission: 'delivery-notes.view' },
      { to: '/complaints', icon: 'report', label: 'Complaints', permission: 'complaints.view' },
      { to: '/reports', icon: 'assessment', label: 'Reports', permission: 'reports.view' },
    ],
  },
  {
    label: 'System',
    links: [
      { to: '/users', icon: 'group', label: 'Users & Access', permission: 'users.view' },
      { to: '/roles', icon: 'admin_panel_settings', label: 'Roles & Permissions', permission: 'roles.view' },
      { to: '/settings', icon: 'settings', label: 'Settings', permission: 'settings.view' },
    ],
  },
]

const linkCls = ({ isActive }) =>
  isActive
    ? 'flex items-center gap-3 bg-slate-900 text-blue-300 border-l-2 border-blue-400 px-4 py-2.5 active:opacity-80 transition-all'
    : 'flex items-center gap-3 text-slate-500 border-l-2 border-transparent px-4 py-2.5 hover:text-slate-200 hover:bg-slate-900/80 active:opacity-80 transition-all'

function canSee(me, permission) {
  if (!me) return false
  if (me.is_super_admin) return true
  if (!permission) return true
  return Array.isArray(me.permissions) && me.permissions.includes(permission)
}

export default function SideNavBar() {
  const nav = useNavigate()
  const logout = useLogout()
  const { data: settings } = useSettings()
  const { data: me } = useMe()

  const companyName = settings?.company_name || 'Distributor HQ'
  const tagline = settings?.company_tagline || 'Analytical Oversight'
  const logoUrl = settings?.logo_url

  const onLogout = async () => {
    await logout.mutateAsync().catch(() => {})
    nav('/login', { replace: true })
  }

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      links: group.links.filter((link) => canSee(me, link.permission)),
    }))
    .filter((group) => group.links.length > 0)

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 z-40 flex flex-col py-4 bg-slate-950 border-r border-slate-800 text-blue-200 font-inter text-xs font-medium uppercase tracking-widest transition-all overflow-y-auto">
      <div className="px-6 mb-4 flex items-center gap-3">
        {logoUrl && (
          <img
            src={logoUrl}
            alt=""
            className="h-9 w-9 rounded object-contain bg-slate-900 border border-slate-800 p-0.5 shrink-0"
          />
        )}
        <div className="min-w-0">
          <h2 className="text-base font-black text-slate-100 normal-case tracking-normal truncate">{companyName}</h2>
          <p className="text-slate-500 text-[10px] mt-0.5 normal-case tracking-normal truncate">{tagline}</p>
        </div>
      </div>

      <nav className="flex-1 flex flex-col">
        {visibleGroups.map((group) => (
          <div key={group.label} className="mb-3">
            <div className="px-6 pt-2 pb-1 text-[9px] tracking-[0.15em] text-slate-600">{group.label}</div>
            {group.links.map((link) => (
              <NavLink key={link.to} to={link.to} className={linkCls}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{link.icon}</span>
                {link.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="flex flex-col gap-1 mt-2 border-t border-slate-800/50 pt-2">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 text-slate-500 px-4 py-2 hover:text-slate-200 hover:bg-slate-900/80 transition-all"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>logout</span>
          Log out
        </button>
      </div>
    </aside>
  )
}
