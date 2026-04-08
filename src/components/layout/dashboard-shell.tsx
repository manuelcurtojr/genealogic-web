'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Menu, Bell, Sun, Moon, LayoutDashboard, Dog, Calendar, Settings } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Sidebar from './sidebar'
import SearchBar from './search-bar'
import NotificationsPanel from './notifications-panel'

interface DashboardShellProps {
  user: { display_name: string; email: string; role: string; avatar_url: string | null } | null
  kennel: { name: string; logo_url: string | null } | null
  children: React.ReactNode
}

export default function DashboardShell({ user, kennel, children }: DashboardShellProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [isNative, setIsNative] = useState(false)
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

    // Detect Capacitor native app
    if ((window as any).Capacitor?.isNativePlatform?.()) setIsNative(true)

    // Force dark mode on mobile
    const isMobile = window.innerWidth < 1024
    if (isMobile) {
      setDarkMode(true)
      localStorage.setItem('theme', 'dark')
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme === 'light') {
        setDarkMode(false)
        document.documentElement.setAttribute('data-theme', 'light')
      } else {
        document.documentElement.setAttribute('data-theme', 'dark')
      }
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

  // ─── Tab bar memory (Instagram-style) ───
  const TAB_ROOTS = ['/dashboard', '/dogs', '/calendar', '/notifications', '/settings'] as const
  const tabHistory = useRef<Record<string, string>>({})
  const lastTapTime = useRef<Record<string, number>>({})

  // Track current path per tab
  useEffect(() => {
    for (const root of TAB_ROOTS) {
      if (root === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(root)) {
        tabHistory.current[root] = pathname
        break
      }
    }
  }, [pathname])

  const handleTabTap = useCallback((e: React.MouseEvent, tabRoot: string) => {
    e.preventDefault()
    const now = Date.now()
    const lastTap = lastTapTime.current[tabRoot] || 0
    const isDoubleTap = now - lastTap < 300
    lastTapTime.current[tabRoot] = now

    const isCurrentTab = tabRoot === '/dashboard'
      ? pathname === '/dashboard'
      : pathname.startsWith(tabRoot)

    if (isDoubleTap || (isCurrentTab && pathname !== tabRoot)) {
      // Double tap or already on this tab but not root → go to root
      tabHistory.current[tabRoot] = tabRoot
      window.location.href = tabRoot
    } else if (isCurrentTab) {
      // Already at root → do nothing
      return
    } else {
      // Switch tab → go to stored path or root
      const stored = tabHistory.current[tabRoot]
      window.location.href = stored || tabRoot
    }
  }, [pathname])

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
      <div className={`lg:hidden fixed top-0 left-0 right-0 h-14 ${headerBg} border-b flex items-center gap-3 px-4 z-30 transition-colors duration-300`}>
        <button onClick={() => setMobileOpen(true)} className={`${iconColor} transition shrink-0`}>
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex-1 min-w-0">
          <SearchBar />
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
          <Link href="/settings" className={`w-9 h-9 rounded-full overflow-hidden border-2 ${avatarBg} cursor-pointer block`}>
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#D74709]/20 flex items-center justify-center text-[#D74709] text-xs font-bold">
                {(user?.display_name || '?')[0].toUpperCase()}
              </div>
            )}
          </Link>
        </div>
      </div>

      {/* Main content */}
      <main className={`p-4 pt-18 lg:pt-[74px] transition-all duration-300 ${isNative ? 'pb-24' : ''}`}>
        <div className={`transition-all duration-300 ${collapsed ? 'lg:ml-[68px]' : 'lg:ml-64'} lg:px-[30px] lg:py-[30px]`}>
          {children}
        </div>
      </main>

      {/* Native app bottom tab bar */}
      {isNative && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-950 border-t border-white/10" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="flex items-center justify-around h-14">
            {([
              { href: '/dashboard', icon: LayoutDashboard, label: 'Inicio' },
              { href: '/dogs', icon: Dog, label: 'Perros' },
              { href: '/calendar', icon: Calendar, label: 'Calendario' },
              { href: '/notifications', icon: Bell, label: 'Alertas', badge: unreadCount },
            ] as const).map(tab => {
              const active = tab.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(tab.href)
              return (
                <a key={tab.href} href="#" onClick={(e) => handleTabTap(e, tab.href)} className={`flex flex-col items-center justify-center gap-0.5 w-16 py-1 transition ${active ? 'text-[#D74709]' : 'text-white/40'}`}>
                  <div className="relative">
                    <tab.icon className="w-[22px] h-[22px]" />
                    {'badge' in tab && (tab.badge ?? 0) > 0 && (
                      <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-[#D74709] text-white text-[8px] font-bold flex items-center justify-center">{tab.badge! > 9 ? '9+' : tab.badge}</span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium">{tab.label}</span>
                </a>
              )
            })}
            {/* Avatar → Settings */}
            <a href="#" onClick={(e) => handleTabTap(e, '/settings')} className={`flex flex-col items-center justify-center gap-0.5 w-16 py-1 transition ${pathname.startsWith('/settings') ? 'text-[#D74709]' : 'text-white/40'}`}>
              <div className={`w-[22px] h-[22px] rounded-full overflow-hidden border ${pathname.startsWith('/settings') ? 'border-[#D74709]' : 'border-white/20'}`}>
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#D74709]/20 flex items-center justify-center text-[#D74709] text-[8px] font-bold">
                    {(user?.display_name || '?')[0].toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-[10px] font-medium">Perfil</span>
            </a>
          </div>
        </nav>
      )}

      {/* Notifications panel */}
      <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  )
}
