'use client'

import Link from 'next/link'
import { Search, Dog, Home, Tag } from 'lucide-react'
import { useT } from '@/components/i18n/locale-provider'

/**
 * Tabs compartidas del descubrimiento: Buscar · Perros · Criaderos · Razas.
 * - Buscar (/search) = resumen universal (las 3 categorías a la vez).
 * - Perros (/perros), Criaderos (/kennels), Razas (/razas) = directorios.
 * Las 4 páginas montan este componente para navegar entre sí.
 */
const TABS = [
  { key: 'search', label: 'Buscar', icon: Search, href: '/search' },
  { key: 'dogs', label: 'Perros', icon: Dog, href: '/perros' },
  { key: 'kennels', label: 'Criaderos', icon: Home, href: '/kennels' },
  { key: 'breeds', label: 'Razas', icon: Tag, href: '/razas' },
] as const

export default function DirectoryTabs({ active }: { active: 'search' | 'dogs' | 'kennels' | 'breeds' }) {
  const t = useT()
  return (
    // -mx/px + overflow-x-auto: en móvil las 4 tabs scrollean si no caben,
    // sin recortarse ni romper el layout.
    <div className="-mx-1 overflow-x-auto px-1">
      <div className="inline-flex gap-1 rounded-lg bg-surface-card p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const on = active === tab.key
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-4 py-1.5 text-[13px] font-medium transition-colors ${
                on ? 'bg-canvas text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)]' : 'text-muted hover:text-ink'
              }`}
            >
              <Icon className="h-4 w-4" /> {t(tab.label)}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
