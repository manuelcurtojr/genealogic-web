'use client'

import { useEffect, useRef, useCallback } from 'react'

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

  const render = useCallback(() => {
    if (!SITE_KEY || !ref.current || !window.turnstile || widgetId.current) return
    widgetId.current = window.turnstile.render(ref.current, {
      sitekey: SITE_KEY,
      callback: (token: string) => onVerify(token),
      'expired-callback': () => onExpire?.(),
      'error-callback': () => onExpire?.(),
      theme: 'auto',
    })
  }, [onVerify, onExpire])

  useEffect(() => {
    if (!SITE_KEY) return
    // Carga el script de Turnstile una sola vez; luego renderiza el widget.
    if (!document.querySelector('script[data-turnstile]')) {
      const s = document.createElement('script')
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
      s.async = true
      s.defer = true
      s.setAttribute('data-turnstile', '1')
      document.head.appendChild(s)
    }
    const iv = setInterval(() => {
      if (window.turnstile) { clearInterval(iv); render() }
    }, 150)
    return () => {
      clearInterval(iv)
      if (widgetId.current && window.turnstile?.remove) {
        try { window.turnstile.remove(widgetId.current) } catch { /* noop */ }
        widgetId.current = null
      }
    }
  }, [render])

  if (!SITE_KEY) return null
  return <div ref={ref} className="flex justify-center" />
}
