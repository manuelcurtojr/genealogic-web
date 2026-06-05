'use client'

import Link from 'next/link'
import { Img } from '@/components/ui/img'
import { usePathname } from 'next/navigation'
import {
  Dog, Baby, Calendar, FileInput, Heart, Users, HandCoins, Settings, LogOut, X,
  GitCompareArrows, LayoutDashboard, Menu, Home, Store, BarChart3, Search,
  Stethoscope, Shield, Inbox, Lock, Key, Bell,
  KanbanSquare, UsersRound, Mail, BookOpen, MessageSquare, Beaker,
  Globe, TrendingUp, Send, Sparkles, Receipt, Link2,
  Dna, CreditCard, Tag, Upload, FileText, ShieldAlert, LifeBuoy, PawPrint,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { NAV_SECTIONS, BRAND } from '@/lib/constants'
import { isAdmin, hasProFeatures } from '@/lib/permissions'
import { getTranslator } from '@/lib/i18n'
import { Wordmark } from '@/components/ui/wordmark'

const iconMap: Record<string, React.ElementType> = {
  Dog, Baby, Calendar, FileInput, Heart, Users, HandCoins, Settings,
  LayoutDashboard, GitCompareArrows, Home, Store, BarChart3, Search,
  Stethoscope, Inbox, Key, Bell, Shield,
  KanbanSquare, UsersRound, Mail, BookOpen, MessageSquare, Beaker,
  Globe, TrendingUp, Send, Sparkles, Receipt, Link2,
  Dna, CreditCard, Tag, Upload, FileText, ShieldAlert, LifeBuoy, PawPrint,
}

interface SidebarProps {
  user: { display_name: string; email: string; role: string; avatar_url: string | null } | null
  kennel: { name: string; logo_url: string | null; addons?: string[] | null } | null
  plan: string
  planIsFounder?: boolean
  /** Si el user tiene reservas vinculadas o perros transferidos como cliente. */
  isClient?: boolean
  /** True cuando la web se carga dentro del WebView iOS (App Store 3.1.1). */
  isIos?: boolean
  mobileOpen: boolean
  onClose: () => void
  collapsed: boolean
  onToggleCollapse: () => void
}

export default function Sidebar({ user, kennel, plan, planIsFounder, isClient = false, isIos = false, mobileOpen, onClose, collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const userRole = user?.role || 'owner'
  const isBreeder = !!kennel
  const userIsAdmin = isAdmin(userRole)
  // `plan` llega ya efectivo (loadShellContext: founder → kennel/Pro).
  const userHasPro = hasProFeatures(plan)
  // Extensiones EFECTIVAS (loadShellContext ya aplicó el override de founder).
  // Gatean los items del modelo "Pro + extensiones": Emailbot, Newsletter, Web.
  const userAddons = new Set<string>(kennel?.addons ?? [])
  const lang = typeof window !== 'undefined' ? localStorage.getItem('genealogic-lang') || 'es' : 'es'
  const t = getTranslator(lang)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  // Filter sections + items by user permissions
  const allSections = NAV_SECTIONS
    .filter(section => {
      if (section.requiresAdmin && !userIsAdmin) return false
      if (section.requiresKennel && !isBreeder) return false
      if (section.requiresPro && !userHasPro) return false
      if (section.requiresAddon && !userAddons.has(section.requiresAddon)) return false
      if (section.requiresClient && !isClient) return false
      if (section.hideOnIos && isIos) return false
      return true
    })
    .map(section => ({
      ...section,
      items: section.items.filter(item => {
        if (item.requiresAdmin && !userIsAdmin) return false
        if (item.requiresKennel && !isBreeder) return false
        if (item.requiresPro && !userHasPro) return false
        if (item.requiresAddon && !userAddons.has(item.requiresAddon)) return false
        if (item.requiresClient && !isClient) return false
        if (item.hideIfPro && userHasPro) return false
        if (item.hideOnIos && isIos) return false
        return true
      }),
    }))
    .filter(section => section.items.length > 0)

  // No locked sections in this model — show or hide
  const isSectionLocked = (_section: typeof NAV_SECTIONS[number]) => false

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen bg-canvas border-r border-hairline flex flex-col z-50 w-64 ${collapsed ? 'lg:w-[68px]' : 'lg:w-64'} lg:transition-all lg:duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 pointer-events-none lg:pointer-events-auto'
        }`}
        style={{
          // En iOS el WebView llena la pantalla bajo el notch y la home bar.
          // Aplicamos el inset directamente al <aside>: el header queda bajo
          // el notch y el footer (Settings/Logout) por encima de la home bar.
          paddingTop: 'var(--safe-area-top)',
          paddingBottom: 'var(--safe-area-bottom)',
        }}
      >
        {/* Logo + toggle — fijo arriba, no scrollea */}
        <div className="h-14 border-b border-hairline flex items-center px-3 gap-2 flex-shrink-0">
          <button
            onClick={mobileOpen ? onClose : onToggleCollapse}
            className="w-10 h-10 flex items-center justify-center text-muted hover:text-ink hover:bg-surface-card rounded-lg transition flex-shrink-0"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          {(collapsed && !mobileOpen) ? (
            <Link href="/dashboard" className="flex items-center" onClick={onClose}>
              <img src="/icon.svg?v=2" alt="Genealogic" className="h-8 w-8" />
            </Link>
          ) : (
            <Wordmark href="/dashboard" size="text-xl" onClick={onClose} />
          )}
        </div>

        {/* Navigation by sections */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {allSections.map((section, sIdx) => {
            const locked = isSectionLocked(section)
            const hasLabel = section.label && section.label.trim().length > 0
            return (
            <div key={section.id}>
              {/* Section title (solo si tiene label) */}
              {(!collapsed || mobileOpen) && hasLabel ? (
                <p className={`text-[10px] font-semibold uppercase tracking-[0.08em] px-3 ${sIdx > 0 ? 'mt-5' : ''} mb-2 flex items-center gap-1.5 text-muted`}>
                  {t(section.label)}
                  {locked && <Lock className="w-2.5 h-2.5" />}
                </p>
              ) : sIdx > 0 && !hasLabel ? (
                <div className="my-2 mx-3 border-t border-hairline" />
              ) : sIdx > 0 ? (
                <div className="my-3 mx-3 border-t border-hairline" />
              ) : null}

              {/* Section items */}
              {section.items.map((item) => {
                const Icon = iconMap[item.icon]
                const active = !locked && (pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)))

                if (locked) {
                  return (
                    <a
                      key={item.href}
                      href="/pricing"
                      onClick={() => onClose()}
                      title={collapsed && !mobileOpen ? `${t(item.label)} (Premium)` : undefined}
                      className={`flex items-center gap-3 rounded-lg text-[13px] font-medium transition mb-0.5 text-muted hover:bg-surface-card ${
                        collapsed && !mobileOpen ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
                      }`}
                    >
                      {Icon && <Icon className="w-[18px] h-[18px] flex-shrink-0" />}
                      {(!collapsed || mobileOpen) && (
                        <span className="flex items-center gap-2 flex-1">
                          {t(item.label)}
                          <Lock className="w-3 h-3 ml-auto opacity-50" />
                        </span>
                      )}
                    </a>
                  )
                }

                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => onClose()}
                    title={collapsed && !mobileOpen ? t(item.label) : undefined}
                    className={`flex items-center gap-3 rounded-lg text-[13px] font-medium transition mb-0.5 ${
                      collapsed && !mobileOpen ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
                    } ${
                      active
                        ? 'bg-surface-card text-ink font-semibold'
                        : 'text-body hover:text-ink hover:bg-surface-soft'
                    }`}
                  >
                    {Icon && <Icon className="w-[18px] h-[18px] flex-shrink-0" />}
                    {(!collapsed || mobileOpen) && <span>{t(item.label)}</span>}
                  </a>
                )
              })}
            </div>
            )
          })}
        </nav>

        {/* Bottom: Settings + Logout — fijo abajo (flex-shrink-0), nunca scrollea */}
        <div className="border-t border-hairline p-2 flex-shrink-0">
          <a
            href="/settings"
            title={collapsed && !mobileOpen ? t('Ajustes') : undefined}
            className={`flex items-center gap-3 rounded-lg text-[13px] font-medium text-body hover:text-ink hover:bg-surface-soft transition mb-0.5 ${
              collapsed && !mobileOpen ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
            }`}
          >
            <Settings className="w-[18px] h-[18px] flex-shrink-0" />
            {(!collapsed || mobileOpen) && <span>{t('Ajustes')}</span>}
          </a>
          <button
            onClick={handleLogout}
            title={collapsed && !mobileOpen ? t('Cerrar sesión') : undefined}
            className={`flex items-center gap-3 rounded-lg text-[13px] font-medium text-body hover:text-[color:var(--error)] hover:bg-surface-soft transition w-full ${
              collapsed && !mobileOpen ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
            }`}
          >
            <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
            {(!collapsed || mobileOpen) && <span>{t('Cerrar sesión')}</span>}
          </button>
        </div>

        {/* User avatar at bottom (collapsed only) */}
        {collapsed && !mobileOpen && user && (
          <div className="border-t border-hairline p-2 flex justify-center flex-shrink-0">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-hairline">
              {user.avatar_url ? (
                <Img src={user.avatar_url} w={120} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-surface-card flex items-center justify-center text-ink text-xs font-semibold">
                  {user.display_name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
