'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CookieBanner() {
  const [show, setShow] = useState(false)
  // Link a la política de cookies según el host: en la plataforma → /cookies
  // (la global); bajo un dominio propio de criadero → /legal/cookies (la del
  // criadero; el middleware la reescribe a /kennels/<slug>/legal/cookies).
  // Sin esto, bajo iremacurto.com el enlace iría a /cookies → 404.
  const [cookiesHref, setCookiesHref] = useState('/cookies')

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) setShow(true)
    try {
      const host = window.location.host.toLowerCase()
      const isPlatform =
        host.endsWith('genealogic.io') ||
        host.startsWith('localhost') ||
        host.startsWith('127.0.0.1') ||
        host.endsWith('vercel.app')
      if (!isPlatform) setCookiesHref('/legal/cookies')
    } catch {
      // sin window (no debería en 'use client') → default /cookies
    }
  }, [])

  function accept() {
    localStorage.setItem('cookie-consent', 'accepted')
    setShow(false)
  }

  function reject() {
    localStorage.setItem('cookie-consent', 'rejected')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[300] bg-surface-card border-t border-hairline px-4 py-4 sm:px-6">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <p className="text-sm text-body flex-1">
          Usamos cookies esenciales para el funcionamiento de la plataforma. No usamos cookies de seguimiento ni publicidad.{' '}
          <Link href={cookiesHref} className="text-ink hover:underline">Más información</Link>
        </p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={reject} className="text-xs text-muted hover:text-ink px-3 py-2 transition">
            Rechazar
          </button>
          <button onClick={accept} className="text-xs bg-ink text-on-primary hover:opacity-90 font-semibold px-4 py-2 rounded-lg transition">
            Aceptar
          </button>
        </div>
      </div>
    </div>
  )
}
