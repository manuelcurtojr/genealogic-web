'use client'

/**
 * PostHog (analítica de producto: autocaptura de clicks, grabaciones de sesión,
 * heatmaps y funnels). Mismo contrato de privacidad que Google Analytics: NO
 * carga nada ni pone cookies hasta que se cumplen DOS condiciones:
 *   1) NEXT_PUBLIC_POSTHOG_KEY está definida (env de Vercel), y
 *   2) el usuario ACEPTÓ en el banner de cookies.
 *
 * Sin la env var el componente es inerte (igual que GA/Sentry) → mergear a
 * producción no cambia nada hasta que pegues la key. Reacciona en vivo al
 * aceptar (evento CONSENT_EVENT) sin recargar.
 *
 * Privacidad: las grabaciones de sesión enmascaran TODOS los inputs
 * (maskAllInputs) para no capturar lo que el usuario teclea (contraseñas,
 * emails, datos personales). Región EU (Frankfurt), como Supabase.
 */

import { useEffect } from 'react'
import posthog from 'posthog-js'
import { getConsent, CONSENT_EVENT } from '@/lib/analytics/consent'
import { createClient } from '@/lib/supabase/client'

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com'

// Guard a nivel de módulo: init() debe ejecutarse UNA sola vez aunque el
// componente se remonte o el consentimiento cambie varias veces.
let started = false

function start() {
  if (started || !KEY || typeof window === 'undefined') return
  if (getConsent() !== 'accepted') return
  started = true

  posthog.init(KEY, {
    api_host: HOST,
    ui_host: 'https://eu.posthog.com',
    // Solo creamos perfil de persona para usuarios identificados (más limpio y
    // económico). Los anónimos siguen generando autocaptura y grabaciones.
    person_profiles: 'identified_only',
    // Auto-pageviews en navegación SPA (App Router) sin código extra.
    capture_pageview: 'history_change',
    capture_pageleave: true,
    // Autocaptura de clicks, envíos de formulario, rageclicks, etc.
    autocapture: true,
    // Grabaciones de sesión con TODOS los inputs enmascarados (RGPD).
    session_recording: { maskAllInputs: true },
    persistence: 'localStorage+cookie',
    // Respetar la señal "Do Not Track" del navegador.
    respect_dnt: true,
  })

  // Identificar al usuario logueado (si lo hay) para poder cruzar el
  // comportamiento con su user_id de Supabase en los dashboards de PostHog.
  identifyCurrentUser()
}

function identifyCurrentUser() {
  if (!started) return
  const supabase = createClient()
  supabase.auth.getUser().then(({ data }) => {
    if (data.user) {
      posthog.identify(data.user.id, { email: data.user.email })
    }
  })
}

export default function PostHogAnalytics() {
  useEffect(() => {
    start()

    const onConsent = () => start()
    window.addEventListener(CONSENT_EVENT, onConsent)
    window.addEventListener('storage', onConsent) // consentimiento en otra pestaña

    // Mantener la identidad sincronizada con login / logout.
    const supabase = createClient()
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!started) return
      if (session?.user) {
        posthog.identify(session.user.id, { email: session.user.email })
      } else if (event === 'SIGNED_OUT') {
        posthog.reset()
      }
    })

    return () => {
      window.removeEventListener(CONSENT_EVENT, onConsent)
      window.removeEventListener('storage', onConsent)
      sub.subscription.unsubscribe()
    }
  }, [])

  return null
}
