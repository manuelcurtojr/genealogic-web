'use client'

/**
 * DraftActionsMenu — menú "⋯ Más" en el header del editor de un contrato
 * draft. Agrupa las acciones destructivas (resetear, eliminar) para no
 * saturar la toolbar.
 *
 * Confirmación nativa con window.confirm — consistente con el resto del
 * dashboard (cancelar contrato, borrar plantilla, etc.) y suficiente para
 * acciones que solo afectan a UN contrato draft.
 */

import { useState, useRef, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MoreVertical, RotateCcw, Trash2, Loader2 } from 'lucide-react'

interface Props {
  reservationId: string
  contractId: string
  onResetAction: (
    reservationId: string,
    contractId: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>
  onDeleteAction: (
    reservationId: string,
    contractId: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>
}

export default function DraftActionsMenu({
  reservationId, contractId, onResetAction, onDeleteAction,
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const wrapRef = useRef<HTMLDivElement>(null)

  // Cerrar al click fuera
  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  function doReset() {
    if (!confirm('¿Resetear el borrador? Se perderán los valores que has rellenado en el formulario y el contrato volverá al estado inicial. La estructura del contrato y el cachorro asignado se mantienen.')) return
    setOpen(false)
    startTransition(async () => {
      const res = await onResetAction(reservationId, contractId)
      if (!res.ok) alert(res.error)
      else router.refresh()
    })
  }

  function doDelete() {
    if (!confirm('¿Eliminar este borrador de contrato? Esta acción NO se puede deshacer. La reserva volverá al estado "sin contrato" y podrás crear uno nuevo desde plantilla.')) return
    setOpen(false)
    startTransition(async () => {
      const res = await onDeleteAction(reservationId, contractId)
      if (!res.ok) alert(res.error)
      else router.refresh()
    })
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted hover:text-ink hover:bg-surface-soft disabled:opacity-50 transition-colors"
        aria-label="Más opciones"
        title="Más opciones (resetear, eliminar)"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 w-56 rounded-lg border border-hairline bg-canvas shadow-lg z-30 py-1">
          <button
            type="button"
            onClick={doReset}
            className="w-full flex items-start gap-2.5 px-3 py-2 text-left hover:bg-surface-soft transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5 text-muted flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[12.5px] font-semibold text-ink">Resetear borrador</p>
              <p className="text-[11px] text-muted leading-snug">Vuelve al estado inicial sin perder el cachorro asignado.</p>
            </div>
          </button>
          <div className="my-1 border-t border-hairline" />
          <button
            type="button"
            onClick={doDelete}
            className="w-full flex items-start gap-2.5 px-3 py-2 text-left hover:bg-rose-50 group transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5 text-muted group-hover:text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[12.5px] font-semibold text-ink group-hover:text-rose-700">Eliminar borrador</p>
              <p className="text-[11px] text-muted leading-snug">Borra el contrato. La reserva vuelve a "sin contrato".</p>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
