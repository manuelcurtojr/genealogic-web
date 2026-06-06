'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Img } from '@/components/ui/img'
import { Menu, Bell, LayoutDashboard, Dog, Calendar, Settings, Sparkles } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Sidebar from './sidebar'
import SearchBar from './search-bar'
import NotificationsPanel from './notifications-panel'
import GenosPanel from '@/components/genos/genos-panel'
import { CommandBar } from './command-bar'
import { hasProAccess } from '@/lib/permissions'
import { usePlatform } from '@/components/platform/platform-provider'
import { useT } from '@/components/i18n/locale-provider'

interface DashboardShellProps {
  user: { display_name: string; email: string; role: string; avatar_url: string | null } | null
  kennel: { name: string; logo_url: string | null; addons?: string[] | null } | null
  plan: string
  planIsFounder?: boolean
  userId?: string
  /** True si el user tiene al menos una reserva vinculada o un perro
   *  transferido como cliente. Activa el bloque "Propietario" del sidebar. */
  isClient?: boolean
  children: React.ReactNode
}

export default function DashboardShell({ user, kennel, plan, planIsFounder, userId, isClient, children }: DashboardShellProps) {
  const t = useT()
  const pathname = usePathname()
  const { isIos } = usePlatform()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [isNative, setIsNative] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [genosOpen, setGenosOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Cuenta de no leídas. Tres fuentes de actualización:
  //   1. mount inicial (refreshCount al cargar)
  //   2. realtime: INSERT/UPDATE/DELETE en notifications del user (suscripción
  //      única, sin deps — antes el re-subscribe creaba race conditions)
  //   3. evento custom 'notifs:changed' que emiten los componentes que
  //      modifican notifs (panel, página /notifications, etc.). Garantiza
  //      refresh inmediato sin esperar latencia de realtime.
  //   4. cuando se cierra el panel (notifOpen → false), refresh defensivo
  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null
    let active = true
    let currentUserId: string | null = null

    async function refreshCount() {
      if (!active || !currentUserId) return
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', currentUserId)
        .eq('is_read', false)
      if (active) setUnreadCount(count || 0)
    }

    // Setup: auth + realtime
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!active || !user) return
      currentUserId = user.id
      refreshCount()
      channel = supabase
        .channel(`notifs-badge-${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          () => refreshCount(),
        )
        .subscribe()
    })

    // Evento custom: el panel/page emite esto al marcar leídas/borrar
    function handleNotifsChanged() {
      refreshCount()
    }
    window.addEventListener('notifs:changed', handleNotifsChanged)

    return () => {
      active = false
      window.removeEventListener('notifs:changed', handleNotifsChanged)
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  // Refresh defensivo al cerrar el panel (por si el evento custom se perdió)
  useEffect(() => {
    if (notifOpen) return
    window.dispatchEvent(new Event('notifs:changed'))
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
        userId={userId}
        isClient={isClient ?? false}
        isIos={isIos}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
      />

      {/* Mobile top bar. En iOS el WebView empuja safe-area-top via CSS var
          (definida en globals.css con data-platform="ios"). El header crece
          para cubrir el notch con fondo blanco. */}
      <div
        className={`lg:hidden fixed top-0 left-0 right-0 ${headerBg} border-b flex items-center gap-3 px-4 z-40 transition-colors duration-300`}
        style={{
          paddingTop: 'var(--safe-area-top)',
          height: 'calc(3.5rem + var(--safe-area-top))',
        }}
      >
        <button onClick={() => setMobileOpen(true)} className={`${iconColor} transition shrink-0`}>
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex-1 min-w-0">
          <SearchBar />
        </div>
        <button
          onClick={() => setGenosOpen(true)}
          title="Genos"
          className={`${iconColor} transition shrink-0`}
        >
          <Sparkles className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop header — también respeta safe-area-top en iPad. */}
      <div
        className={`hidden lg:flex fixed top-0 right-0 ${headerBg} border-b items-center px-6 z-40 transition-all duration-300`}
        style={{
          left: sidebarWidth,
          paddingTop: 'var(--safe-area-top)',
          height: 'calc(3.5rem + var(--safe-area-top))',
        }}
      >
        <div className="flex-1 mr-4">
          <SearchBar />
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setGenosOpen(true)}
            title={t('Genos — asistente de Genealogic')}
            className={`w-9 h-9 rounded-full flex items-center justify-center ${iconColor} hover:bg-surface-card transition`}
          >
            <Sparkles className="w-[18px] h-[18px]" />
          </button>
          <button onClick={() => setNotifOpen(true)} className={`w-9 h-9 rounded-full flex items-center justify-center ${iconColor} hover:bg-surface-card transition relative`}>
            <Bell className="w-[18px] h-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-ink text-on-primary text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          <Link href="/settings" className={`w-9 h-9 rounded-full overflow-hidden border-2 ${avatarBg} cursor-pointer block`}>
            {user?.avatar_url ? (
              <Img src={user.avatar_url} w={120} alt="" className="w-full h-full object-cover" />
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
      <main
        className={`p-4 transition-all duration-300 ${isIos ? '' : 'pt-18 lg:pt-[74px]'}`}
        style={
          isIos
            ? {
                // En iOS el header tiene height 3.5rem + safe-area-top. El
                // main empieza justo después con 1rem de respiro entre header
                // y contenido — eso garantiza separación visual en TODAS las
                // páginas, incluidas las que empiezan con hero full-bleed
                // (ej. /dogs/[id]) que no tienen margin-top propio.
                paddingTop: 'calc(3.5rem + var(--safe-area-top) + 1rem)',
                paddingBottom: 'calc(1rem + var(--safe-area-bottom))',
              }
            : undefined
        }
      >
        <div className={`transition-all duration-300 ${collapsed ? 'lg:ml-[68px]' : 'lg:ml-64'} lg:px-[30px] lg:py-[30px]`}>
          {children}
        </div>
      </main>

      {/* Tab bar is now native iOS — no web tab bar needed */}

      {/* Notifications panel */}
      <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />

      {/* Genos — chatbot asistente */}
      <GenosPanel open={genosOpen} onClose={() => setGenosOpen(false)} />

      {/* Command Bar (⌘K) — montado a nivel shell para estar disponible siempre */}
      <CommandBar
        hasKennel={!!kennel}
        isPro={hasProAccess(plan)}
        isAdmin={user?.role === 'admin'}
      />
    </div>
  )
}
