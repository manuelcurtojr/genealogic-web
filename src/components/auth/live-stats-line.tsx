/**
 * Línea de stats en vivo para el panel de marketing de /login y /register.
 * Hace fetch a /api/public/stats al montar y refresca cada 30s.
 *
 * Renderiza algo como: "16.587 perros · 990 criaderos · 240 razas"
 *
 * SSR-safe: muestra placeholder ("…") si todavía no llegan datos.
 */
'use client'

import { useEffect, useState } from 'react'
import { useT } from '@/components/i18n/locale-provider'

type Stats = { dogs: number; kennels: number; breeds: number }

export default function LiveStatsLine({ className }: { className?: string }) {
  const t = useT()
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    let active = true
    const tick = async () => {
      try {
        const res = await fetch('/api/public/stats', { cache: 'no-store' })
        if (!res.ok) return
        const json = (await res.json()) as Stats
        if (active) setStats(json)
      } catch {}
    }
    tick()
    const id = setInterval(tick, 30000)
    return () => { active = false; clearInterval(id) }
  }, [])

  const fmt = (n: number) => n.toLocaleString('es-ES')

  return (
    <p className={className}>
      {stats
        ? `${fmt(stats.dogs)} ${t('perros')} · ${fmt(stats.kennels)} ${t('criaderos')} · ${fmt(stats.breeds)} ${t('razas')}`
        : `… ${t('perros')} · … ${t('criaderos')} · … ${t('razas')}`}
    </p>
  )
}
