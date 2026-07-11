'use client'

/**
 * HashSessionHandler — consume tokens de sesión que llegan en el hash de la
 * URL (#access_token=...&refresh_token=...), el formato "implicit flow" de
 * los magic links / invitaciones generados por Supabase.
 *
 * Motivo (QA 2026-07-11): el cliente usa flujo PKCE (?code=... vía
 * /auth/callback), así que un magic link estándar de Supabase aterrizaba con
 * la sesión en el hash y se ignoraba — el usuario "no se logueaba". Este
 * componente cierra ese hueco sin tocar el flujo PKCE existente.
 *
 * Montado una vez en el layout raíz. No renderiza nada.
 */
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function HashSessionHandler() {
  const router = useRouter()

  useEffect(() => {
    const hash = window.location.hash
    if (!hash || !hash.includes('access_token=')) return
    const params = new URLSearchParams(hash.slice(1))
    const access_token = params.get('access_token')
    const refresh_token = params.get('refresh_token')
    if (!access_token || !refresh_token) return

    const supabase = createClient()
    supabase.auth
      .setSession({ access_token, refresh_token })
      .then(({ error }) => {
        // Limpiar el hash SIEMPRE (con o sin error) para no dejar tokens en
        // la barra de direcciones ni en el historial.
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
        if (!error) router.refresh()
      })
  }, [router])

  return null
}
