'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Dog, Baby, Calendar, FileInput, Heart, Users, HandCoins, Settings, LogOut, X, GitCompareArrows, LayoutDashboard, Menu, Home, Store, BarChart3 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { NAV_ITEMS, PRO_NAV_ITEMS, BRAND } from '@/lib/constants'

const iconMap: Record<string, React.ElementType> = {
  Dog, Baby, Calendar, FileInput, Heart, Users, HandCoins, Settings, LayoutDashboard, GitCompareArrows, Home, Store, BarChart3,
}

interface SidebarProps {
  user: { display_name: string; email: string; role: string; avatar_url: string | null } | null
  kennel: { name: string; logo_url: string | null } | null
  mobileOpen: boolean
  onClose: () => void
  collapsed: boolean
  onToggleCollapse: () => void
}

export default function Sidebar({ user, kennel, mobileOpen, onClose, collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isPro = user?.role === 'pro' || user?.role === 'admin'

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const handleNav = () => {
    onClose()
  }

  const sidebarWidth = collapsed ? 'w-[68px]' : 'w-64'

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      <aside className={`fixed left-0 top-0 h-screen ${sidebarWidth} bg-gray-950 border-r border-white/10 flex flex-col z-50 transition-all duration-300 ${
        mobileOpen ? 'translate-x-0 !w-64' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Logo + toggle */}
        <div className="h-14 border-b border-white/10 flex items-center px-3 gap-2 flex-shrink-0">
          {/* Toggle button */}
          <button
            onClick={mobileOpen ? onClose : onToggleCollapse}
            className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition flex-shrink-0"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 min-w-0" onClick={handleNav}>
            {(collapsed && !mobileOpen) ? (
              <img src="/icon.svg" alt="Genealogic" className="h-7 w-auto" />
            ) : (
              <><img src="/logo.svg" alt="Genealogic" className="logo-dark h-5 w-auto" /><img src="/logo-dark.svg" alt="Genealogic" className="logo-light h-5 w-auto" /></>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {(!collapsed || mobileOpen) && (
            <p className="text-[11px] font-semibold text-white/30 uppercase tracking-wider px-3 mb-2">General</p>
          )}
          {NAV_ITEMS.map((item) => {
            const Icon = iconMap[item.icon]
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNav}
                title={collapsed && !mobileOpen ? item.label : undefined}
                className={`flex items-center gap-3 rounded-lg text-sm font-medium transition mb-0.5 ${
                  collapsed && !mobileOpen ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
                } ${
                  active
                    ? 'bg-[#D74709]/15 text-[#D74709]'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {Icon && <Icon className="w-[18px] h-[18px] flex-shrink-0" />}
                {(!collapsed || mobileOpen) && <span>{item.label}</span>}
              </Link>
            )
          })}

          {isPro && (
            <>
              {(!collapsed || mobileOpen) && (
                <p className="text-[11px] font-semibold text-white/30 uppercase tracking-wider px-3 mt-5 mb-2">CRM</p>
              )}
              {collapsed && !mobileOpen && <div className="my-3 mx-3 border-t border-white/10" />}
              {PRO_NAV_ITEMS.map((item) => {
                const Icon = iconMap[item.icon]
                const active = pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleNav}
                    title={collapsed && !mobileOpen ? item.label : undefined}
                    className={`flex items-center gap-3 rounded-lg text-sm font-medium transition mb-0.5 ${
                      collapsed && !mobileOpen ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
                    } ${
                      active
                        ? 'bg-[#D74709]/15 text-[#D74709]'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {Icon && <Icon className="w-[18px] h-[18px] flex-shrink-0" />}
                    {(!collapsed || mobileOpen) && <span>{item.label}</span>}
                  </Link>
                )
              })}
            </>
          )}
        </nav>

        {/* Bottom: Settings + Logout */}
        <div className="border-t border-white/10 p-2">
          <Link
            href="/settings"
            onClick={handleNav}
            title={collapsed && !mobileOpen ? 'Ajustes' : undefined}
            className={`flex items-center gap-3 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition ${
              collapsed && !mobileOpen ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
            }`}
          >
            <Settings className="w-[18px] h-[18px] flex-shrink-0" />
            {(!collapsed || mobileOpen) && <span>Ajustes</span>}
          </Link>
          <button
            onClick={handleLogout}
            title={collapsed && !mobileOpen ? 'Cerrar sesion' : undefined}
            className={`flex items-center gap-3 rounded-lg text-sm text-white/60 hover:text-red-400 hover:bg-white/5 transition w-full ${
              collapsed && !mobileOpen ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
            }`}
          >
            <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
            {(!collapsed || mobileOpen) && <span>Cerrar sesion</span>}
          </button>
        </div>

        {/* User avatar at bottom (collapsed only) */}
        {collapsed && !mobileOpen && user && (
          <div className="border-t border-white/10 p-2 flex justify-center">
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/10">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#D74709]/20 flex items-center justify-center text-[#D74709] text-xs font-bold">
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
