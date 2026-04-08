'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Store, Palette, Coins, GitBranch, Stethoscope, ArrowLeft, Shield, Menu, X, Key } from 'lucide-react'

const ADMIN_NAV = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Usuarios', href: '/admin/users', icon: Users },
  { label: 'Criaderos', href: '/admin/kennels', icon: Store },
  { label: 'Catálogo', href: '/admin/catalog', icon: Palette },
  { label: 'Genes', href: '/admin/genes', icon: Coins },
  { label: 'Genealogías', href: '/admin/genealogy', icon: GitBranch },
  { label: 'Plantillas vet.', href: '/admin/vet-templates', icon: Stethoscope },
  { label: 'Configuración', href: '/admin/settings', icon: Key },
]

interface Props {
  user: { display_name: string; email: string; role: string; avatar_url: string | null } | null
  children: React.ReactNode
}

export default function AdminShell({ user, children }: Props) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('admin-sidebar-collapsed')
    if (saved === 'true') setCollapsed(true)
  }, [])

  const toggleCollapse = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('admin-sidebar-collapsed', String(next))
  }

  const sidebarWidth = collapsed ? 'w-[68px]' : 'w-60'
  const mainMargin = collapsed ? 'lg:ml-[68px]' : 'lg:ml-60'

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Mobile backdrop */}
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-screen ${sidebarWidth} bg-gray-950 border-r border-white/10 flex flex-col z-50 transition-all duration-300 ${
        mobileOpen ? 'translate-x-0 !w-60' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Header */}
        <div className="h-14 border-b border-white/10 flex items-center px-3 gap-2 flex-shrink-0">
          <button onClick={mobileOpen ? () => setMobileOpen(false) : toggleCollapse}
            className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition flex-shrink-0">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          {(!collapsed || mobileOpen) && (
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#D74709]" />
              <span className="text-sm font-bold">Admin</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {ADMIN_NAV.map(item => {
            const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
            return (
              <a key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                title={collapsed && !mobileOpen ? item.label : undefined}
                className={`flex items-center gap-3 rounded-lg text-sm font-medium transition mb-0.5 ${
                  collapsed && !mobileOpen ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
                } ${
                  active ? 'bg-[#D74709]/15 text-[#D74709]' : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}>
                <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                {(!collapsed || mobileOpen) && <span>{item.label}</span>}
              </a>
            )
          })}
        </nav>

        {/* Back to app */}
        <div className="border-t border-white/10 p-2">
          <a href="/dashboard"
            title={collapsed && !mobileOpen ? 'Volver a la app' : undefined}
            className={`flex items-center gap-3 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition ${
              collapsed && !mobileOpen ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
            }`}>
            <ArrowLeft className="w-[18px] h-[18px] flex-shrink-0" />
            {(!collapsed || mobileOpen) && <span>Volver a la app</span>}
          </a>
        </div>

        {/* User */}
        {(!collapsed || mobileOpen) ? (
          <div className="border-t border-white/10 p-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#D74709]/20 flex items-center justify-center text-[#D74709] text-xs font-bold flex-shrink-0">
              {(user?.display_name || '?')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{user?.display_name}</p>
              <p className="text-[10px] text-white/30 truncate">{user?.email}</p>
            </div>
          </div>
        ) : (
          <div className="border-t border-white/10 p-2 flex justify-center">
            <div className="w-9 h-9 rounded-full bg-[#D74709]/20 flex items-center justify-center text-[#D74709] text-xs font-bold">
              {(user?.display_name || '?')[0].toUpperCase()}
            </div>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className={`flex-1 ${mainMargin} transition-all duration-300`}>
        {/* Mobile header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-gray-950 border-b border-white/10 flex items-center px-4 z-30">
          <button onClick={() => setMobileOpen(true)} className="text-white/40 hover:text-white transition mr-3">
            <Menu className="w-6 h-6" />
          </button>
          <Shield className="w-5 h-5 text-[#D74709] mr-2" />
          <span className="text-sm font-bold">Admin</span>
        </div>

        <main className="p-6 pt-6 lg:pt-6 lg:p-8 mt-14 lg:mt-0">
          {children}
        </main>
      </div>
    </div>
  )
}
