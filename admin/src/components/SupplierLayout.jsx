import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useLogout, useMe, usePublicSettings } from '../api/queries'
import { getToken } from '../api/client'

const navLinks = [
  { to: '/supplier',                icon: 'dashboard',     label: 'Dashboard', end: true },
  { to: '/supplier/food-requests',  icon: 'receipt_long',  label: 'Food Requests' },
  { to: '/supplier/delivery-notes', icon: 'inventory_2',   label: 'Delivery Notes' },
  { to: '/supplier/complaints',     icon: 'report',        label: 'Complaints' },
  { to: '/supplier/remarks',        icon: 'comment',       label: 'Remarks' },
  { to: '/supplier/assignments',    icon: 'assignment',    label: 'My Assignments' },
  { to: '/supplier/profile',        icon: 'person',        label: 'Profile' },
]

const linkCls = ({ isActive }) =>
  isActive
    ? 'flex items-center gap-3 bg-slate-900 text-blue-300 border-l-2 border-blue-400 px-4 py-2.5 transition-all'
    : 'flex items-center gap-3 text-slate-500 border-l-2 border-transparent px-4 py-2.5 hover:text-slate-200 hover:bg-slate-900/80 transition-all'

export default function SupplierLayout() {
  const nav = useNavigate()
  const logout = useLogout()
  const { data: me, isLoading } = useMe()
  const { data: brand } = usePublicSettings()

  if (!getToken()) return <Navigate to="/login" replace />
  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm bg-surface">Loading…</div>
  if (me?.type !== 'supplier') return <Navigate to="/dashboard" replace />

  const companyName = brand?.company_name || 'Supplier Portal'
  const logoUrl = brand?.logo_url

  const onLogout = async () => {
    await logout.mutateAsync().catch(() => {})
    nav('/login', { replace: true })
  }

  return (
    <div className="bg-surface text-on-surface h-screen overflow-hidden font-inter">
      <div className="flex h-screen">
        <aside className="fixed left-0 top-0 h-screen w-64 z-40 flex flex-col py-4 bg-slate-950 border-r border-slate-800 text-blue-200 text-xs font-medium uppercase tracking-widest overflow-y-auto">
          <div className="px-6 mb-4 flex items-center gap-3">
            {logoUrl && <img src={logoUrl} alt="" className="h-9 w-9 rounded object-contain bg-slate-900 border border-slate-800 p-0.5 shrink-0" />}
            <div className="min-w-0">
              <h2 className="text-base font-black text-slate-100 normal-case tracking-normal truncate">{companyName}</h2>
              <p className="text-slate-500 text-[10px] mt-0.5 normal-case tracking-normal truncate">Supplier Portal</p>
            </div>
          </div>

          <div className="px-6 pb-3 mb-2 border-b border-slate-800/60">
            <div className="text-[10px] text-slate-500 normal-case tracking-normal mb-0.5">Signed in as</div>
            <div className="text-sm text-slate-200 normal-case tracking-normal truncate">{me?.name}</div>
            <div className="text-[10px] text-slate-500 normal-case tracking-normal truncate">{me?.supplier?.name} · <span className="font-mono">{me?.supplier?.supplier_code}</span></div>
          </div>

          <nav className="flex-1 flex flex-col">
            {navLinks.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={linkCls}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{link.icon}</span>
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex flex-col gap-1 mt-2 border-t border-slate-800/50 pt-2">
            <button onClick={onLogout} className="flex items-center gap-3 text-slate-500 px-4 py-2 hover:text-slate-200 hover:bg-slate-900/80 transition-all">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>logout</span>
              Log out
            </button>
          </div>
        </aside>

        <main className="ml-64 flex-1 overflow-y-auto p-gutter bg-surface">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
