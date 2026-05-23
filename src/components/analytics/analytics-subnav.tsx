'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, TrendingUp } from 'lucide-react'

/**
 * Subnav compartido entre /analytics (Negocio) y /estadisticas (Operativa).
 *
 * Ambas miden cosas distintas pero el criador las percibe como "métricas"
 * en general. Este subnav las une visualmente sin tocar la lógica de
 * cada página.
 */
export default function AnalyticsSubnav() {
  const pathname = usePathname()

  const tabs = [
    {
      href: '/analytics',
      label: 'Negocio',
      hint: 'Perros, camadas, palmarés, salud — analítica del criadero',
      icon: BarChart3,
      active: pathname === '/analytics' || pathname.startsWith('/analytics/'),
    },
    {
      href: '/estadisticas',
      label: 'Operativa',
      hint: 'Reservas, clientes, biblioteca, newsletter, web pública',
      icon: TrendingUp,
      active: pathname === '/estadisticas' || pathname.startsWith('/estadisticas/'),
    },
  ]

  return (
    <nav className="-mx-1 flex overflow-x-auto pb-1">
      <div className="flex gap-1 px-1">
        {tabs.map((t) => {
          const Icon = t.icon
          return (
            <Link
              key={t.href}
              href={t.href}
              title={t.hint}
              className={`flex-shrink-0 inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                t.active
                  ? 'border-ink bg-ink text-on-primary'
                  : 'border-hairline bg-canvas text-body hover:bg-surface-soft'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
