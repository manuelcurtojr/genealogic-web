'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useT } from '@/components/i18n/locale-provider'
import { setConsent } from '@/lib/analytics/consent'

export default function CookieBanner() {
  const t = useT()
  const [show, setShow] = useState(false)
  // Política de cookies de la plataforma.
  const cookiesHref = '/cookies'
  // Solo declaramos cookies de analítica si hay alguna herramienta realmente
  // configurada en Vercel (GA o PostHog). Sin ninguna, el banner mantiene el
  // mensaje "sin seguimiento".
  const analyticsEnabled =
    !!process.env.NEXT_PUBLIC_GA_ID || !!process.env.NEXT_PUBLIC_POSTHOG_KEY

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) setShow(true)
  }, [])

  function accept() {
    setConsent('accepted')
    setShow(false)
  }

  function reject() {
    setConsent('rejected')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[300] bg-surface-card border-t border-hairline px-4 py-4 sm:px-6">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <p className="text-sm text-body flex-1">
          {analyticsEnabled
            ? t('Usamos cookies esenciales para el funcionamiento de la plataforma y, si lo aceptas, cookies de analítica y de grabación de sesión (Google Analytics y PostHog) para entender cómo se usa y mejorarla. No usamos cookies de publicidad.')
            : t('Usamos cookies esenciales para el funcionamiento de la plataforma. No usamos cookies de seguimiento ni publicidad.')}{' '}
          <Link href={cookiesHref} className="text-ink hover:underline">{t('Más información')}</Link>
        </p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={reject} className="text-xs text-muted hover:text-ink px-3 py-2 transition">
            {t('Rechazar')}
          </button>
          <button onClick={accept} className="text-xs bg-ink text-on-primary hover:opacity-90 font-semibold px-4 py-2 rounded-lg transition">
            {t('Aceptar')}
          </button>
        </div>
      </div>
    </div>
  )
}
