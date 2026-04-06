'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Dog, Baby, Calendar, FileInput, Heart, Users, HandCoins, Settings, LogOut, PawPrint, LayoutDashboard, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { NAV_ITEMS, PRO_NAV_ITEMS, BRAND } from '@/lib/constants'

const iconMap: Record<string, React.ElementType> = {
  Dog, Baby, Calendar, FileInput, Heart, Users, HandCoins, Settings, LayoutDashboard,
}

interface SidebarProps {
  user: { display_name: string; email: string; role: string; avatar_url: string | null } | null
  kennel: { name: string; logo_url: string | null } | null
  mobileOpen: boolean
  onClose: () => void
}

export default function Sidebar({ user, kennel, mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isPro = user?.role === 'pro' || user?.role === 'admin'

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleNav = () => {
    onClose()
  }

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      <aside className={`fixed left-0 top-0 h-screen w-64 bg-gray-950 border-r border-white/10 flex flex-col z-50 transition-transform duration-300 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Logo */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={handleNav}>
            <PawPrint className="w-7 h-7" style={{ color: BRAND.primary }} />
            <span className="text-lg font-bold text-white">Genealogic</span>
          </Link>
          <button onClick={onClose} className="lg:hidden text-white/40 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Kennel info */}
        {kennel && (
          <Link href="/kennel" className="p-4 border-b border-white/5 hover:bg-white/5 transition" onClick={handleNav}>
            <div className="flex items-center gap-3">
              {kennel.logo_url ? (
                <img src={kennel.logo_url} alt="" className="w-9 h-9 rounded-lg object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white/50 text-sm font-bold">
                  {kennel.name[0]}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{kennel.name}</p>
                <p className="text-xs text-white/40">Mi criadero</p>
              </div>
            </div>
          </Link>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          <p className="text-[11px] font-semibold text-white/30 uppercase tracking-wider px-3 mb-2">General</p>
          {NAV_ITEMS.map((item) => {
            const Icon = iconMap[item.icon]
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNav}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition mb-0.5 ${
                  active
                    ? 'bg-[#D74709]/15 text-[#D74709]'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {Icon && <Icon className="w-[18px] h-[18px]" />}
                {item.label}
              </Link>
            )
          })}

          {isPro && (
            <>
              <p className="text-[11px] font-semibold text-white/30 uppercase tracking-wider px-3 mt-5 mb-2">CRM</p>
              {PRO_NAV_ITEMS.map((item) => {
                const Icon = iconMap[item.icon]
                const active = pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleNav}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition mb-0.5 ${
                      active
                        ? 'bg-[#D74709]/15 text-[#D74709]'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {Icon && <Icon className="w-[18px] h-[18px]" />}
                    {item.label}
                  </Link>
                )
              })}
            </>
          )}
        </nav>

        {/* User + Settings */}
        <div className="border-t border-white/10 p-3">
          <Link
            href="/settings"
            onClick={handleNav}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition"
          >
            <Settings className="w-[18px] h-[18px]" />
            Ajustes
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-red-400 hover:bg-white/5 transition w-full"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Cerrar sesion
          </button>
        </div>
      </aside>
    </>
  )
}
