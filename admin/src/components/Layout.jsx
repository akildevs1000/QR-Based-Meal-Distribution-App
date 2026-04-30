import { Outlet } from 'react-router-dom'
import SideNavBar from './SideNavBar'

export default function Layout() {
  return (
    <div className="bg-surface text-on-surface h-screen overflow-hidden">
      <div className="flex h-screen">
        <SideNavBar />
        <main className="ml-64 flex-1 overflow-y-auto p-gutter bg-surface">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
