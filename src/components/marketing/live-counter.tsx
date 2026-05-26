/**
 * LiveCounter — número grande que se anima count-up al montar y se refresca
 * cada 15s consultando /api/public/stats. Si el valor sube, anima el delta.
 *
 * Props:
 *  - initial: valor inicial server-rendered (sin flash)
 *  - kind: qué campo del endpoint usar ('dogs' | 'kennels' | 'breeds')
 *  - label: texto debajo del número
 *  - pollMs: cada cuánto refresca (default 15000)
 */
'use client'

import { useEffect, useRef, useState } from 'react'

type Kind = 'dogs' | 'kennels' | 'breeds'

export default function LiveCounter({
  initial,
  kind,
  label,
  pollMs = 15000,
  className,
  size = 'large',
}: {
  initial: number
  kind: Kind
  label: string
  pollMs?: number
  className?: string
  /**
   * - 'large': hero protagonista (~40-72px desktop)
   * - 'compact': dentro de tarjetas (~22-30px desktop). Cabe en 3 columnas
   *   sin desbordar incluso con números de 6+ cifras como 73.000+ perros.
   */
  size?: 'large' | 'compact'
}) {
  const [value, setValue] = useState(initial)
  const [displayed, setDisplayed] = useState(0)
  const [pulse, setPulse] = useState(false)
  const startRef = useRef<number | null>(null)

  // Animación count-up al montar (de 0 a initial)
  useEffect(() => {
    const duration = 1400
    let raf = 0
    function step(t: number) {
      if (startRef.current === null) startRef.current = t
      const elapsed = t - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(Math.round(value * eased))
      if (progress < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cuando value cambie tras polling, animar incremento corto
  useEffect(() => {
    if (displayed === value) return
    const diff = value - displayed
    if (Math.abs(diff) < 1) return
    const duration = 600
    let raf = 0
    const startTs = performance.now()
    const startVal = displayed
    function step(t: number) {
      const progress = Math.min((t - startTs) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(Math.round(startVal + diff * eased))
      if (progress < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    if (diff > 0) {
      setPulse(true)
      setTimeout(() => setPulse(false), 800)
    }
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  // Polling
  useEffect(() => {
    let active = true
    const tick = async () => {
      try {
        const res = await fetch('/api/public/stats', { cache: 'no-store' })
        if (!res.ok) return
        const json = await res.json()
        if (!active) return
        const next = json[kind] as number
        if (typeof next === 'number' && next !== value) setValue(next)
      } catch {}
    }
    const id = setInterval(tick, pollMs)
    return () => { active = false; clearInterval(id) }
  }, [kind, pollMs, value])

  const isCompact = size === 'compact'
  const numberClasses = isCompact
    // Compact: estable en celdas de 3-col dentro de cards. Min-w-0 + truncate
    // por seguridad si la celda es muy estrecha.
    ? 'text-[20px] sm:text-[22px] lg:text-[26px]'
    // Large: hero protagonista (versión histórica).
    : 'text-[22px] sm:text-[clamp(40px,7vw,72px)]'
  const labelClasses = isCompact
    ? 'mt-1 text-[9.5px] sm:text-[10px]'
    : 'mt-1.5 sm:mt-2 text-[10px] sm:text-[13.5px]'

  return (
    <div className={className}>
      <p className={`${numberClasses} font-semibold tabular-nums tracking-[-0.03em] sm:tracking-[-0.04em] text-ink leading-none transition-colors ${pulse ? 'text-[#FE6620]' : ''}`}>
        {displayed.toLocaleString('es-ES')}
      </p>
      <p className={`${labelClasses} uppercase tracking-[0.06em] sm:tracking-[0.08em] text-muted font-semibold`}>{label}</p>
    </div>
  )
}
