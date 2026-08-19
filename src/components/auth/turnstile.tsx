'use client'

import { useEffect, useRef } from 'react'

/**
 * Widget de Cloudflare Turnstile (CAPTCHA invisible/"managed").
 *
 * Protege registro, login y reset de contraseña contra bots (el email-bombing
 * que reventó el registro en agosto 2026: cuentas con nombres aleatorios que
 * disparaban confirmaciones/resets a víctimas reales y quemaban el dominio).
 *
 * DEPLOY SEGURO: solo se renderiza si NEXT_PUBLIC_TURNSTILE_SITE_KEY está
 * configurada. Sin la key, el componente es un no-op y el auth funciona como
 * hasta ahora — la protección se enciende al poner la key en Vercel + activar
 * CAPTCHA en Supabase Auth. Así desplegar el código no rompe nada.
 */
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string
      reset: (id?: string) => void
      remove: (id?: string) => void
    }
  }
}

/** ¿Está la protección activa? (hay site key configurada en build). */
export function isTurnstileEnabled(): boolean {
  return !!SITE_KEY
}

export default function Turnstile({
  onVerify,
  onExpire,
}: {
  onVerify: (token: string) => void
  onExpire?: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)
  // Callbacks en refs para que el widget se monte UNA sola vez y NO se recree
  // cuando el padre re-renderiza. El bug anterior: `onExpire` (y por tanto el
  // `render` con deps [onVerify, onExpire]) cambiaba en cada render del padre,
  // el useEffect se reejecutaba, y destruía+recreaba el widget con cada tecla
  // que el usuario escribía en email/contraseña → crash 300031 + pérdida del
  // token → botón deshabilitado → nadie podía entrar por email.
  const onVerifyRef = useRef(onVerify)
  const onExpireRef = useRef(onExpire)
  onVerifyRef.current = onVerify
  onExpireRef.current = onExpire

  useEffect(() => {
    if (!SITE_KEY) return
    // Carga el script de Turnstile una sola vez.
    if (!document.querySelector('script[data-turnstile]')) {
      const s = document.createElement('script')
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
      s.async = true
      s.defer = true
      s.setAttribute('data-turnstile', '1')
      document.head.appendChild(s)
    }
    let cancelled = false
    const tryRender = () => {
      if (cancelled || !window.turnstile || !ref.current || widgetId.current) return
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: SITE_KEY,
        callback: (token: string) => onVerifyRef.current(token),
        'expired-callback': () => onExpireRef.current?.(),
        'error-callback': () => onExpireRef.current?.(),
        theme: 'auto',
      })
    }
    const iv = setInterval(() => {
      if (window.turnstile) { clearInterval(iv); tryRender() }
    }, 150)
    return () => {
      cancelled = true
      clearInterval(iv)
      if (widgetId.current && window.turnstile?.remove) {
        try { window.turnstile.remove(widgetId.current) } catch { /* noop */ }
        widgetId.current = null
      }
    }
    // Deps vacías a propósito: montar una vez, limpiar al desmontar. Los
    // callbacks se leen siempre frescos vía refs, así que no hacen falta aquí.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!SITE_KEY) return null
  return <div ref={ref} className="flex justify-center" />
}
