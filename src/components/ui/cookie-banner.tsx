'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CookieBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) setShow(true)
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
    <div className="fixed bottom-0 left-0 right-0 z-[300] bg-ink-800 border-t border-hair px-4 py-4 sm:px-6">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <p className="text-sm text-fg-dim flex-1">
          Usamos cookies esenciales para el funcionamiento de la plataforma. No usamos cookies de seguimiento ni publicidad.{' '}
          <Link href="/cookies" className="text-[#D74709] hover:underline">Más información</Link>
        </p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={reject} className="text-xs text-fg-mute hover:text-fg px-3 py-2 transition">
            Rechazar
          </button>
          <button onClick={accept} className="text-xs bg-[#D74709] hover:bg-[#c03d07] text-white font-semibold px-4 py-2 rounded-lg transition">
            Aceptar
          </button>
        </div>
      </div>
    </div>
  )
}
