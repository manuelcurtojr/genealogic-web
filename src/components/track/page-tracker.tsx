'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

interface Props {
  kennelId?: string | null
  dogId?: string | null
  /** Si la página conoce el user logueado (server-rendered), pásalo para que
   *  el page_view se asocie a su user_id. Sin este prop el tracking sigue
   *  siendo anónimo (session_id hash diario). */
  userId?: string | null
}

/**
 * Componente cliente invisible que llama a /api/track al montarse.
 * Se incluye en páginas públicas (kennel profile, dog profile, kennel pages).
 * Dedupe en sessionStorage para no contar el mismo path múltiples veces por sesión.
 */
export default function PageTracker({ kennelId, dogId, userId }: Props) {
  const pathname = usePathname()
  // Guardamos el ÚLTIMO path trackeado (no un booleano): así el tracker también
  // funciona montado en un LAYOUT persistente (p.ej. el del kennel), que NO se
  // desmonta al navegar entre subpáginas — con un booleano solo se contaba la 1ª.
  // Re-dispara en cada cambio de pathname; el dedupe real (mismo path/sesión) lo
  // siguen haciendo sessionStorage (abajo) + el endpoint /api/track.
  const lastSent = useRef<string | null>(null)

  useEffect(() => {
    if (lastSent.current === pathname) return
    lastSent.current = pathname

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
        user_id: userId || null,
        path: pathname,
        referrer,
      }),
    }).catch(() => { /* silent */ })
  }, [pathname, kennelId, dogId, userId])

  return null
}
