'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

interface Props {
  kennelId?: string | null
  dogId?: string | null
}

/**
 * Componente cliente invisible que llama a /api/track al montarse.
 * Se incluye en páginas públicas (kennel profile, dog profile, kennel pages).
 * Dedupe en sessionStorage para no contar el mismo path múltiples veces por sesión.
 */
export default function PageTracker({ kennelId, dogId }: Props) {
  const pathname = usePathname()
  const sent = useRef(false)

  useEffect(() => {
    if (sent.current) return
    sent.current = true

    try {
      const key = `pv:${pathname}`
      const session = typeof window !== 'undefined' ? sessionStorage : null
      if (session?.getItem(key)) return
      session?.setItem(key, '1')
    } catch { /* sessionStorage no disponible (privado) — track igualmente */ }

    const referrer = typeof document !== 'undefined' ? document.referrer || null : null

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        kennel_id: kennelId || null,
        dog_id: dogId || null,
        path: pathname,
        referrer,
      }),
    }).catch(() => { /* silent */ })
  }, [pathname, kennelId, dogId])

  return null
}
