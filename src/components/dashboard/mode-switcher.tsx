'use client'

/**
 * Selector de MODO de escritorio (Negocio / Cría / Ejemplares / Agenda).
 * Al elegir, persiste el modo en una cookie y refresca para que el server
 * component del dashboard renderice los bloques de ese modo. La cookie se lee
 * en el servidor (dashboard/page.tsx), así el primer render ya trae el modo.
 */
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Coins, Baby, Dog, CalendarClock } from 'lucide-react'
import { DASHBOARD_MODE_COOKIE, type DashboardMode } from '@/lib/dashboard/mode'
import { useT } from '@/components/i18n/locale-provider'

const MODES: { key: DashboardMode; label: string; icon: React.ElementType }[] = [
  { key: 'negocio', label: 'Negocio', icon: Coins },
  { key: 'cria', label: 'Cría', icon: Baby },
  { key: 'ejemplares', label: 'Ejemplares', icon: Dog },
  { key: 'agenda', label: 'Agenda', icon: CalendarClock },
]

export default function DashboardModeSwitcher({ current }: { current: DashboardMode }) {
  const t = useT()
  const router = useRouter()
  const [pending, start] = useTransition()

  const choose = (mode: DashboardMode) => {
    if (mode === current) return
    // Cookie a 1 año, accesible por el server (no httpOnly).
    document.cookie = `${DASHBOARD_MODE_COOKIE}=${mode}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
    start(() => router.refresh())
  }

  return (
    <div className={`-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${pending ? 'opacity-60' : ''}`}>
      {MODES.map((m) => {
        const active = m.key === current
        const Icon = m.icon
        return (
          <button
            key={m.key}
            type="button"
            onClick={() => choose(m.key)}
            disabled={pending}
            className={`flex-shrink-0 inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-[13px] font-semibold transition-colors ${
              active
                ? 'border-ink bg-ink text-on-primary'
                : 'border-hairline bg-canvas text-body hover:bg-surface-soft hover:text-ink'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {t(m.label)}
          </button>
        )
      })}
    </div>
  )
}
