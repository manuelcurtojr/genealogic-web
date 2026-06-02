'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import type { AnalyticsRange } from '@/lib/analytics'
import { useT } from '@/components/i18n/locale-provider'

const OPTIONS: { id: AnalyticsRange; label: string }[] = [
  { id: 'today', label: 'Hoy' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
  { id: 'year', label: 'Año' },
]

export function RangeChips({ active }: { active: AnalyticsRange }) {
  const t = useT()
  const pathname = usePathname()
  const sp = useSearchParams()
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-canvas p-1 ring-1 ring-hairline">
      {OPTIONS.map((opt) => {
        const params = new URLSearchParams(sp?.toString() ?? '')
        params.set('range', opt.id)
        const isActive = opt.id === active
        return (
          <Link
            key={opt.id}
            href={`${pathname}?${params.toString()}`}
            className={`rounded-full px-3.5 py-1 text-xs font-medium transition-colors ${
              isActive ? 'bg-ink text-on-primary' : 'text-body hover:text-ink'
            }`}
          >
            {t(opt.label)}
          </Link>
        )
      })}
    </div>
  )
}
