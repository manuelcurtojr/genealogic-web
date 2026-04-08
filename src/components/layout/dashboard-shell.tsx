'use client'

import { useState, useEffect } from 'react'
import { Menu, Bell, Sun, Moon } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import Sidebar from './sidebar'
import SearchBar from './search-bar'
import NotificationsPanel from './notifications-panel'

interface DashboardShellProps {
  user: { display_name: string; email: string; role: string; avatar_url: string | null } | null
  kennel: { name: string; logo_url: string | null } | null
  children: React.ReactNode
}

export default function DashboardShell({ user, kennel, children }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('theme') !== 'light'
    return true
  })
  const [notifOpen, setNotifOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('is_read', false)
      .then(({ count }) => setUnreadCount(count || 0))
  }, [notifOpen])

  useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebar-collapsed')
    if (savedCollapsed === 'true') setCollapsed(true)

    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'light') {
      setDarkMode(false)
      document.documentElement.setAttribute('data-theme', 'light')
    } else {
      document.documentElement.setAttribute('data-theme', 'dark')
    }
  }, [])

  const toggleCollapse = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('sidebar-collapsed', String(next))
  }

  const toggleTheme = () => {
    const next = !darkMode
    setDarkMode(next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
  }

  const sidebarWidth = collapsed ? 68 : 256

  const shellBg = darkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'
  const headerBg = darkMode ? 'bg-gray-950 border-white/10' : 'bg-white border-gray-200'
  const iconColor = darkMode ? 'text-white/40 hover:text-white' : 'text-gray-400 hover:text-gray-700'
  const avatarBg = darkMode ? 'border-white/10' : 'border-gray-200'

  return (
    <div className={`min-h-screen ${shellBg} transition-colors duration-300`} style={{ '--sidebar-width': `${sidebarWidth}px` } as React.CSSProperties}>
      <Sidebar
        user={user}
        kennel={kennel}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
      />

      {/* Mobile top bar */}
      <div className={`lg:hidden fixed top-0 left-0 right-0 h-14 ${headerBg} border-b flex items-center px-4 z-30 transition-colors duration-300`}>
        <button onClick={() => setMobileOpen(true)} className={`${iconColor} transition mr-3`}>
          <Menu className="w-6 h-6" />
        </button>
        <img src="/icon.svg" alt="Genealogic" className="h-6 w-auto" />
        <div className="ml-auto flex items-center gap-2">
          <button onClick={toggleTheme} className={`w-8 h-8 rounded-full flex items-center justify-center ${iconColor} transition`}>
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button onClick={() => setNotifOpen(true)} className={`w-8 h-8 rounded-full flex items-center justify-center ${iconColor} transition relative`}>
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#D74709]" />}
          </button>
          <div className={`w-8 h-8 rounded-full overflow-hidden border-2 ${avatarBg}`}>
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

      {/* Desktop header */}
      <div
        className={`hidden lg:flex fixed top-0 right-0 h-14 ${headerBg} border-b items-center px-6 z-20 transition-all duration-300`}
        style={{ left: sidebarWidth }}
      >
        <div className="flex-1 mr-4">
          <SearchBar />
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={toggleTheme} className={`w-9 h-9 rounded-full flex items-center justify-center ${iconColor} hover:bg-white/5 transition`} title={darkMode ? 'Modo claro' : 'Modo oscuro'}>
            {darkMode ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          </button>
          <button onClick={() => setNotifOpen(true)} className={`w-9 h-9 rounded-full flex items-center justify-center ${iconColor} hover:bg-white/5 transition relative`}>
            <Bell className="w-[18px] h-[18px]" />
            {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#D74709]" />}
          </button>
          <div className={`w-9 h-9 rounded-full overflow-hidden border-2 ${avatarBg} cursor-pointer`}>
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
      <main className="p-4 pt-18 lg:pt-[74px] transition-all duration-300">
        <div className={`transition-all duration-300 ${collapsed ? 'lg:ml-[68px]' : 'lg:ml-64'} lg:px-[30px] lg:py-[30px]`}>
          {children}
        </div>
      </main>

      {/* Notifications panel */}
      <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  )
}
