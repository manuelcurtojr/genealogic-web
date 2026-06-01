'use client'

import { AlertTriangle } from 'lucide-react'
import { useT } from '@/components/i18n/locale-provider'

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  const t = useT()
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <AlertTriangle className="w-16 h-16 text-ink/50 mb-4" />
      <h2 className="text-xl font-bold mb-2">{t('Algo salio mal')}</h2>
      <p className="text-muted text-sm mb-6 text-center max-w-md">
        {error.message || t('Ha ocurrido un error inesperado. Intenta recargar la página.')}
      </p>
      <button
        onClick={reset}
        className="bg-ink text-on-primary hover:opacity-90 px-6 py-2.5 rounded-lg text-sm font-semibold transition"
      >
        {t('Intentar de nuevo')}
      </button>
    </div>
  )
}
