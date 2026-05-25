/**
 * Refresca la página cada 5s mientras un run está en estado 'running'.
 * Se desmonta cuando la página se navega o cuando deja de estar running
 * (el page parent re-renderiza sin este componente).
 */
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RunAutoRefresh() {
  const router = useRouter()
  useEffect(() => {
    const i = setInterval(() => router.refresh(), 5000)
    return () => clearInterval(i)
  }, [router])
  return null
}
