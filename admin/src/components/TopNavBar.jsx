import { useNavigate } from 'react-router-dom'
import { useMe, useSettings } from '../api/queries'

export default function TopNavBar() {
  const nav = useNavigate()
  const { data: me } = useMe()
  const { data: settings } = useSettings()

  const companyName = settings?.company_name || 'MealDistribute Pro'
  const logoUrl = settings?.logo_url
  const initial = (me?.name || me?.email || 'A').trim().charAt(0).toUpperCase()

  const iconButtons = [
    { icon: 'notifications', onClick: () => {} },
    { icon: 'settings', onClick: () => nav('/settings') },
    { icon: 'help', onClick: () => {} },
  ]

  return (
    <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-14 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 text-blue-200 font-inter text-sm tracking-tight transition-all duration-150 ease-in-out">
      <div className="flex items-center gap-3">
        {logoUrl && (
          <img src={logoUrl} alt="" className="h-7 w-7 rounded object-contain bg-slate-900 border border-slate-800 p-0.5" />
        )}
        <span className="text-lg font-bold tracking-tighter text-slate-100 truncate max-w-[260px]">{companyName}</span>
      </div>

      <div className="flex-1 max-w-md mx-6">
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3 text-slate-400" style={{ fontSize: '18px' }}>
            search
          </span>
          <input
            type="text"
            placeholder="Search logs, users, locations..."
            className="w-full bg-slate-900/50 border border-slate-800 rounded pl-10 pr-4 py-1.5 text-slate-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none transition-all placeholder-slate-500 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {iconButtons.map((b) => (
          <button
            key={b.icon}
            onClick={b.onClick}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 rounded transition-colors flex items-center justify-center"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              {b.icon}
            </span>
          </button>
        ))}
        <button
          onClick={() => nav('/settings')}
          title={me?.name || me?.email || ''}
          className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center ml-2 text-slate-300 text-xs font-semibold hover:border-blue-500 transition-colors"
        >
          {initial}
        </button>
      </div>
    </nav>
  )
}
