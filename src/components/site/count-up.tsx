'use client'

import { useEffect, useRef, useState } from 'react'

export function CountUp({
  to, value, durationMs = 1200, suffix = '', prefix = '',
}: {
  to?: number
  value?: number | string
  durationMs?: number
  suffix?: string
  prefix?: string
}) {
  const target = typeof to === 'number'
    ? to
    : typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? (parseFloat(value) || 0)
        : 0
  const ref = useRef<HTMLSpanElement>(null)
  const [n, setN] = useState(0)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    let started = false
    const io = new IntersectionObserver(entries => {
      if (!started && entries[0].isIntersecting) {
        started = true
        io.disconnect()
        const t0 = performance.now()
        const tick = (now: number) => {
          const p = Math.min(1, (now - t0) / durationMs)
          const eased = 1 - Math.pow(1 - p, 3)
          setN(Math.round(target * eased))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.5 })
    io.observe(node)
    return () => io.disconnect()
  }, [target, durationMs])

  return <span ref={ref}>{prefix}{n.toLocaleString('es-ES')}{suffix}</span>
}
