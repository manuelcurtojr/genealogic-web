'use client'

import Link from 'next/link'
import { Dog, Home, Tag } from 'lucide-react'

/**
 * Tabs compartidas de los 3 directorios públicos: Perros · Criaderos · Razas.
 * Son <Link> (cada directorio es su propia página): Perros y Criaderos viven en
 * /search (?tab=), Razas en /razas. "Buscar" (sidebar) entra por Perros.
 */
const TABS = [
  { key: 'dogs', label: 'Perros', icon: Dog, href: '/search' },
  { key: 'kennels', label: 'Criaderos', icon: Home, href: '/search?tab=kennels' },
  { key: 'breeds', label: 'Razas', icon: Tag, href: '/razas' },
] as const

export default function DirectoryTabs({ active }: { active: 'dogs' | 'kennels' | 'breeds' }) {
  return (
    <div className="inline-flex gap-1 rounded-lg bg-surface-card p-1">
      {TABS.map((t) => {
        const Icon = t.icon
        const on = active === t.key
        return (
          <Link
            key={t.key}
            href={t.href}
            className={`inline-flex items-center gap-1.5 rounded-md px-4 py-1.5 text-[13px] font-medium transition-colors ${
              on ? 'bg-canvas text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)]' : 'text-muted hover:text-ink'
            }`}
          >
            <Icon className="h-4 w-4" /> {t.label}
          </Link>
        )
      })}
    </div>
  )
}
