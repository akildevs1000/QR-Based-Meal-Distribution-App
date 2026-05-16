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
      { to: '/sites', icon: 'apartment', label: 'Sites', permission: 'sites.view' },
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
      { to: '/meal-remarks', icon: 'comment', label: 'Meal Remarks', permission: 'meal-remarks.view' },
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
    ? 'group flex items-center gap-3 mx-3 my-0.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-blue-500/20 via-blue-500/10 to-violet-500/5 text-blue-200 border border-blue-500/30 shadow-sm shadow-blue-500/10 transition-all'
    : 'group flex items-center gap-3 mx-3 my-0.5 px-3 py-2.5 rounded-xl text-slate-400 border border-transparent hover:text-slate-100 hover:bg-slate-800/60 hover:border-slate-700/50 transition-all'

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
    <aside className="fixed left-0 top-0 h-screen w-64 z-40 flex flex-col py-4 bg-gradient-to-b from-[#0f172a] via-[#0c1424] to-[#0a111f] border-r border-slate-800/70 text-blue-200 font-inter text-xs font-medium uppercase tracking-widest transition-all overflow-y-auto">
      <div className="px-5 mb-5 flex items-center gap-3">
        {logoUrl && (
          <img
            src={logoUrl}
            alt=""
            className="h-10 w-10 rounded-xl object-contain bg-gradient-to-br from-blue-500/20 to-violet-500/10 border border-blue-500/30 p-1 shrink-0 shadow-sm shadow-blue-500/10"
          />
        )}
        <div className="min-w-0">
          <h2 className="text-base font-black bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent normal-case tracking-normal truncate">{companyName}</h2>
          <p className="text-blue-400/70 text-[10px] mt-0.5 normal-case tracking-wide truncate">{tagline}</p>
        </div>
      </div>

      <nav className="flex-1 flex flex-col">
        {visibleGroups.map((group) => (
          <div key={group.label} className="mb-2">
            <div className="px-6 pt-3 pb-1.5 text-[9px] tracking-[0.18em] text-slate-500 font-semibold">{group.label}</div>
            {group.links.map((link) => (
              <NavLink key={link.to} to={link.to} className={linkCls}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{link.icon}</span>
                {link.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="flex flex-col gap-1 mt-2 mx-3 border-t border-slate-800/60 pt-3">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 border border-transparent hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/20 transition-all"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
          Log out
        </button>
      </div>
    </aside>
  )
}
