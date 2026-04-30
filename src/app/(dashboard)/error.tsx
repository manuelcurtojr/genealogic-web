'use client'

import { AlertTriangle } from 'lucide-react'

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <AlertTriangle className="w-16 h-16 text-[#D74709]/50 mb-4" />
      <h2 className="text-xl font-bold mb-2">Algo salio mal</h2>
      <p className="text-fg-mute text-sm mb-6 text-center max-w-md">
        {error.message || 'Ha ocurrido un error inesperado. Intenta recargar la página.'}
      </p>
      <button
        onClick={reset}
        className="bg-[#D74709] hover:bg-[#c03d07] text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition"
      >
        Intentar de nuevo
      </button>
    </div>
  )
}
