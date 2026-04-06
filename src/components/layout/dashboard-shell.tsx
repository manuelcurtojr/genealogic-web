'use client'

import { useState, useEffect } from 'react'
import { Menu, Bell } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import Sidebar from './sidebar'
import SearchBar from './search-bar'

interface DashboardShellProps {
  user: { display_name: string; email: string; role: string; avatar_url: string | null } | null
  kennel: { name: string; logo_url: string | null } | null
  children: React.ReactNode
}

export default function DashboardShell({ user, kennel, children }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  // Persist collapsed state
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved === 'true') setCollapsed(true)
  }, [])

  const toggleCollapse = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('sidebar-collapsed', String(next))
  }

  const sidebarWidth = collapsed ? 68 : 256

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Sidebar
        user={user}
        kennel={kennel}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
      />

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-gray-950 border-b border-white/10 flex items-center px-4 z-30">
        <button onClick={() => setMobileOpen(true)} className="text-white/60 hover:text-white transition mr-3">
          <Menu className="w-6 h-6" />
        </button>
        <img src="/icon.svg" alt="Genealogic" className="h-6 w-auto" />
        <div className="ml-auto flex items-center gap-2">
          <button className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white transition">
            <Bell className="w-4.5 h-4.5" />
          </button>
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/10">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#D74709]/20 flex items-center justify-center text-[#D74709] text-xs font-bold">
                {(user?.display_name || '?')[0].toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop header — flush with sidebar */}
      <div
        className="hidden lg:flex fixed top-0 right-0 h-14 bg-gray-950 border-b border-white/10 items-center px-6 z-20 transition-all duration-300"
        style={{ left: sidebarWidth }}
      >
        {/* Search bar — fills all space */}
        <div className="flex-1 mr-4">
          <SearchBar />
        </div>

        {/* Bell + Avatar */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button className="w-9 h-9 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition relative">
            <Bell className="w-[18px] h-[18px]" />
          </button>
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/10 cursor-pointer">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#D74709]/20 flex items-center justify-center text-[#D74709] text-xs font-bold">
                {(user?.display_name || '?')[0].toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main
        className="p-4 pt-18 lg:p-8 lg:pt-22 transition-all duration-300"
        style={{ marginLeft: typeof window !== 'undefined' ? undefined : sidebarWidth }}
      >
        <div className={`transition-all duration-300 ${collapsed ? 'lg:ml-[68px]' : 'lg:ml-64'}`}>
          {children}
        </div>
      </main>
    </div>
  )
}
