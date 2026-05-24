'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Menu, Bell, LayoutDashboard, Dog, Calendar, Settings, Sparkles } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Sidebar from './sidebar'
import SearchBar from './search-bar'
import NotificationsPanel from './notifications-panel'
import { CommandBar } from './command-bar'
import { hasProAccess } from '@/lib/permissions'

interface DashboardShellProps {
  user: { display_name: string; email: string; role: string; avatar_url: string | null } | null
  kennel: { name: string; logo_url: string | null } | null
  plan: string
  planIsFounder?: boolean
  userId?: string
  /** True si el user tiene al menos una reserva vinculada o un perro
   *  transferido como cliente. Activa el bloque "Propietario" del sidebar. */
  isClient?: boolean
  children: React.ReactNode
}

export default function DashboardShell({ user, kennel, plan, planIsFounder, userId, isClient, children }: DashboardShellProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [isNative, setIsNative] = useState(false)
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
    if ((window as any).Capacitor?.isNativePlatform?.()) {
      setIsNative(true)
      // Register push notifications
      initPushNotifications()
    }
  }, [])

  const toggleCollapse = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('sidebar-collapsed', String(next))
  }

  const sidebarWidth = collapsed ? 68 : 256

  // ─── Tab bar memory (Instagram-style, persisted in sessionStorage) ───
  const TAB_ROOTS = ['/dashboard', '/dogs', '/notifications', '/settings'] as const
  const lastTapTime = useRef<Record<string, number>>({})

  function getTabHistory(): Record<string, string> {
    try { return JSON.parse(sessionStorage.getItem('tab-history') || '{}') } catch { return {} }
  }
  function setTabHistory(root: string, path: string) {
    const h = getTabHistory(); h[root] = path
    sessionStorage.setItem('tab-history', JSON.stringify(h))
  }

  // Track current path per tab
  useEffect(() => {
    for (const root of TAB_ROOTS) {
      if (root === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(root)) {
        setTabHistory(root, pathname)
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
      setTabHistory(tabRoot, tabRoot)
      window.location.href = tabRoot
    } else if (isCurrentTab) {
      // Already at root → do nothing
      return
    } else {
      // Switch tab → go to stored path or root
      const stored = getTabHistory()[tabRoot]
      window.location.href = stored || tabRoot
    }
  }, [pathname])

  // Push notifications registration (Capacitor)
  async function initPushNotifications() {
    try {
      const Capacitor = (window as any).Capacitor
      if (!Capacitor?.Plugins?.PushNotifications) {
        console.warn('PushNotifications plugin not available')
        return
      }

      const Push = Capacitor.Plugins.PushNotifications

      const permResult = await Push.requestPermissions()
      if (permResult.receive !== 'granted') return

      await Push.register()

      Push.addListener('registration', async (token: any) => {
        // Save token directly via Supabase client
        const supabase = createClient()
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser && token.value) {
          await supabase.from('device_tokens').upsert(
            { user_id: authUser.id, token: token.value, platform: 'ios' },
            { onConflict: 'user_id,token' }
          )
        }
      })

      Push.addListener('registrationError', (err: any) => {
        console.error('Push registration error:', err)
      })

      Push.addListener('pushNotificationActionPerformed', (notification: any) => {
        const link = notification.notification?.data?.link
        if (link) window.location.href = link
      })
    } catch (err) {
      console.error('Push init error:', err)
    }
  }

  // Diseño Cal.com unificado con Pawdoq Breeders: canvas blanco puro,
  // hairlines #e5e7eb, sin tonos grises de fondo. Solo light mode.
  const shellBg = 'bg-canvas text-ink'
  const headerBg = 'bg-canvas border-hairline'
  const iconColor = 'text-muted hover:text-ink'
  const avatarBg = 'border-hairline'

  return (
    <div className={`min-h-screen ${shellBg} transition-colors duration-300`} style={{ '--sidebar-width': `${sidebarWidth}px`, '--tab-bar-height': isNative ? '90px' : '0px' } as React.CSSProperties}>
      <Sidebar
        user={user}
        kennel={kennel}
        plan={plan}
        planIsFounder={planIsFounder}
        isClient={isClient ?? false}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
      />

      {/* Mobile top bar */}
      <div className={`lg:hidden fixed top-0 left-0 right-0 h-14 ${headerBg} border-b flex items-center gap-3 px-4 z-40 transition-colors duration-300`}>
        <button onClick={() => setMobileOpen(true)} className={`${iconColor} transition shrink-0`}>
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex-1 min-w-0">
          <SearchBar />
        </div>
      </div>

      {/* Desktop header */}
      <div
        className={`hidden lg:flex fixed top-0 right-0 h-14 ${headerBg} border-b items-center px-6 z-40 transition-all duration-300`}
        style={{ left: sidebarWidth }}
      >
        <div className="flex-1 mr-4">
          <SearchBar />
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setNotifOpen(true)} className={`w-9 h-9 rounded-full flex items-center justify-center ${iconColor} hover:bg-surface-card transition relative`}>
            <Bell className="w-[18px] h-[18px]" />
            {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-ink" />}
          </button>
          <Link href="/settings" className={`w-9 h-9 rounded-full overflow-hidden border-2 ${avatarBg} cursor-pointer block`}>
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-surface-card flex items-center justify-center text-ink text-xs font-bold">
                {(user?.display_name || '?')[0].toUpperCase()}
              </div>
            )}
          </Link>
        </div>
      </div>

      {/* Main content — NO stacking context here, so slide panels rendered
          inside `children` can layer above the sidebar (z-50) and top bar (z-40). */}
      <main className="p-4 pt-18 lg:pt-[74px] transition-all duration-300">
        <div className={`transition-all duration-300 ${collapsed ? 'lg:ml-[68px]' : 'lg:ml-64'} lg:px-[30px] lg:py-[30px]`}>
          {children}
        </div>
      </main>

      {/* Tab bar is now native iOS — no web tab bar needed */}

      {/* Notifications panel */}
      <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />

      {/* Command Bar (⌘K) — montado a nivel shell para estar disponible siempre */}
      <CommandBar
        hasKennel={!!kennel}
        isPro={hasProAccess(plan)}
        isAdmin={user?.role === 'admin'}
      />
    </div>
  )
}
