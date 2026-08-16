'use client'

/**
 * Google Analytics 4 con consentimiento (RGPD). NO carga nada ni pone cookies
 * hasta que se cumplen DOS condiciones:
 *   1) NEXT_PUBLIC_GA_ID está definida (env de Vercel), y
 *   2) el usuario ACEPTÓ en el banner de cookies.
 *
 * Sin consentimiento no se inyecta gtag. Reacciona en vivo al aceptar (evento
 * CONSENT_EVENT) sin recargar. Si el usuario rechaza, no se carga.
 */

import Script from 'next/script'
import { useEffect, useState } from 'react'
import { getConsent, CONSENT_EVENT } from '@/lib/analytics/consent'

const GA_ID = process.env.NEXT_PUBLIC_GA_ID

export default function GoogleAnalytics() {
  const [granted, setGranted] = useState(false)

  useEffect(() => {
    const sync = () => setGranted(getConsent() === 'accepted')
    sync()
    window.addEventListener(CONSENT_EVENT, sync)
    window.addEventListener('storage', sync) // consentimiento dado en otra pestaña
    return () => {
      window.removeEventListener(CONSENT_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  if (!GA_ID || !granted) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}', { anonymize_ip: true });`}
      </Script>
    </>
  )
}
