'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Store, Palette, GitBranch, Stethoscope, LogOut, Shield, Menu, X, Key, BarChart3, Dog, Activity, Globe, ShieldCheck, ShieldAlert, Inbox, Flag } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ADMIN_NAV: { section?: string; label: string; href: string; icon: any }[] = [
  // General
  { section: 'General', label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Actividad', href: '/admin/activity', icon: Activity },
  { label: 'Estadísticas', href: '/admin/stats', icon: BarChart3 },
  { label: 'Solicitudes', href: '/admin/solicitudes', icon: Inbox },
  { label: 'Reportes', href: '/admin/reports', icon: Flag },
  { label: 'Audit log', href: '/admin/audit', icon: ShieldAlert },
  // Gestión
  { section: 'Gestion', label: 'Usuarios', href: '/admin/users', icon: Users },
  { label: 'Perros', href: '/admin/dogs', icon: Dog },
  { label: 'Criaderos', href: '/admin/kennels', icon: Store },
  { label: 'Genealogías', href: '/admin/genealogy', icon: GitBranch },
  // Herramientas
  { section: 'Herramientas', label: 'Importar genealogía', href: '/admin/import', icon: Globe },
  { label: 'Catálogo', href: '/admin/catalog', icon: Palette },
  { label: 'Plantillas vet.', href: '/admin/vet-templates', icon: Stethoscope },
  // Sistema
  { section: 'Sistema', label: 'Configuración', href: '/admin/settings', icon: Key },
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
    <div className="min-h-screen bg-canvas text-ink flex">
      {/* Mobile backdrop */}
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-screen ${sidebarWidth} bg-canvas border-r border-hairline flex flex-col z-50 transition-all duration-300 ${
        mobileOpen ? 'translate-x-0 !w-60' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Header */}
        <div className="h-14 border-b border-hairline flex items-center px-3 gap-2 flex-shrink-0">
          <button onClick={mobileOpen ? () => setMobileOpen(false) : toggleCollapse}
            className="w-10 h-10 flex items-center justify-center text-muted hover:text-ink hover:bg-surface-card rounded-lg transition flex-shrink-0">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          {(!collapsed || mobileOpen) && (
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-ink" />
              <span className="text-sm font-bold">Admin</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {ADMIN_NAV.map((item, i) => {
            const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
            return (
              <div key={item.href}>
                {item.section && (!collapsed || mobileOpen) && (
                  <p className={`text-[10px] font-semibold text-muted uppercase tracking-wider px-3 ${i > 0 ? 'mt-4 mb-1' : 'mb-1'}`}>{item.section}</p>
                )}
                {item.section && collapsed && !mobileOpen && i > 0 && (
                  <div className="mx-3 my-2 border-t border-hairline" />
                )}
                <a href={item.href} onClick={() => setMobileOpen(false)}
                  title={collapsed && !mobileOpen ? item.label : undefined}
                  className={`flex items-center gap-3 rounded-lg text-sm font-medium transition mb-0.5 ${
                    collapsed && !mobileOpen ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
                  } ${
                    active ? 'bg-surface-card text-ink' : 'text-body hover:text-ink hover:bg-surface-card'
                  }`}>
                  <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                  {(!collapsed || mobileOpen) && <span>{item.label}</span>}
                </a>
              </div>
            )
          })}
        </nav>

        {/* Cerrar sesión — antes había "Volver a la app" pero el super admin
            vive en este panel. Para ver la app como un user normal se usa
            la funcionalidad Impersonate desde /admin/users. */}
        <div className="border-t border-hairline p-2">
          <button
            onClick={async () => {
              const supabase = createClient()
              await supabase.auth.signOut()
              window.location.href = '/login'
            }}
            title={collapsed && !mobileOpen ? 'Cerrar sesión' : undefined}
            className={`flex w-full items-center gap-3 rounded-lg text-sm text-body hover:text-[color:var(--error)] hover:bg-surface-card transition ${
              collapsed && !mobileOpen ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
            }`}>
            <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
            {(!collapsed || mobileOpen) && <span>Cerrar sesión</span>}
          </button>
        </div>

        {/* User */}
        {(!collapsed || mobileOpen) ? (
          <div className="border-t border-hairline p-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-surface-card flex items-center justify-center text-ink text-xs font-bold flex-shrink-0">
              {(user?.display_name || '?')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{user?.display_name}</p>
              <p className="text-[10px] text-muted truncate">{user?.email}</p>
            </div>
          </div>
        ) : (
          <div className="border-t border-hairline p-2 flex justify-center">
            <div className="w-9 h-9 rounded-full bg-surface-card flex items-center justify-center text-ink text-xs font-bold">
              {(user?.display_name || '?')[0].toUpperCase()}
            </div>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className={`flex-1 ${mainMargin} transition-all duration-300`}>
        {/* Mobile header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-canvas border-b border-hairline flex items-center px-4 z-30">
          <button onClick={() => setMobileOpen(true)} className="text-muted hover:text-ink transition mr-3">
            <Menu className="w-6 h-6" />
          </button>
          <Shield className="w-5 h-5 text-ink mr-2" />
          <span className="text-sm font-bold">Admin</span>
        </div>

        <main className="p-6 pt-6 lg:pt-6 lg:p-8 mt-14 lg:mt-0">
          {children}
        </main>
      </div>
    </div>
  )
}
