'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar as CalIcon, Heart, Stethoscope } from 'lucide-react'
import { useT } from '@/components/i18n/locale-provider'

/**
 * Subnav compartido entre /calendar, /reproduccion y /vet.
 *
 * Las 3 rutas son calendarios semánticamente distintos pero el usuario
 * los percibe como uno solo. Este subnav les da pertenencia visual a un
 * mismo grupo "Calendario" sin romper sus URLs ni su lógica interna.
 *
 * Detecta la ruta actual con usePathname() y marca la tab activa.
 */
export default function CalendarSubnav() {
  const t = useT()
  const pathname = usePathname()

  const tabs = [
    {
      href: '/calendar',
      label: t('Calendario'),
      hint: t('Vista mensual con eventos, recordatorios y celos'),
      icon: CalIcon,
      active: pathname === '/calendar' || pathname.startsWith('/calendar/'),
    },
    {
      href: '/reproduccion',
      label: t('Reproductivo'),
      hint: t('Gantt de hembras: celos, gestaciones y camadas'),
      icon: Heart,
      active: pathname === '/reproduccion' || pathname.startsWith('/reproduccion/'),
    },
    {
      href: '/vet',
      label: t('Veterinario'),
      hint: t('Vacunas, desparasitaciones y recordatorios'),
      icon: Stethoscope,
      active: pathname === '/vet' || pathname.startsWith('/vet/'),
    },
  ]

  return (
    <nav className="-mx-1 flex overflow-x-auto pb-1">
      <div className="flex gap-1 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              title={tab.hint}
              className={`flex-shrink-0 inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                tab.active
                  ? 'border-ink bg-ink text-on-primary'
                  : 'border-hairline bg-canvas text-body hover:bg-surface-soft'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
