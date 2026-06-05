'use client'

/**
 * SendContractDialog — modal in-app que reemplaza al window.confirm() del
 * navegador al pulsar "Enviar al cliente". Permite mostrar contexto visual
 * (qué se va a enviar + a quién), iconografía consistente con la app y un
 * mensaje más completo que el confirm nativo (que solo da texto plano).
 *
 * Controlado: el padre maneja `open` + `onConfirm`/`onCancel`. Soporta Esc
 * para cerrar y backdrop click.
 */

import { useEffect } from 'react'
import { Send, X, AlertCircle, Mail, Lock } from 'lucide-react'

interface Props {
  open: boolean
  /** Email destino (lo mostramos para que el criador confirme visualmente). */
  recipientEmail: string | null
  /** Nombre destino. */
  recipientName?: string | null
  /** kind del contrato — para personalizar el copy ("reserva" vs "entrega"). */
  kind: 'reservation' | 'delivery'
  pending: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function SendContractDialog({
  open, recipientEmail, recipientName, kind, pending, onConfirm, onCancel,
}: Props) {
  // Esc cierra (solo si no está pendiente — no perdemos en medio del envío)
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !pending) onCancel()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, pending, onCancel])

  if (!open) return null

  const kindLabel = kind === 'delivery' ? 'Contrato de compraventa y entrega' : 'Contrato de reserva'

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-[modalFade_150ms_ease-out]"
      onClick={() => !pending && onCancel()}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-canvas border border-hairline shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar */}
        <button
          type="button"
          onClick={() => !pending && onCancel()}
          disabled={pending}
          aria-label="Cerrar"
          className="absolute top-3 right-3 z-10 inline-flex items-center justify-center h-8 w-8 rounded-lg text-muted hover:text-ink hover:bg-surface-soft disabled:opacity-50 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header con icono naranja */}
        <div className="px-6 pt-7 pb-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FE6620]/10 text-[#FE6620]">
            <Send className="h-5 w-5" />
          </div>
          <h2 className="mt-3 text-[18px] font-bold tracking-tight text-ink">
            ¿Enviar el contrato al cliente?
          </h2>
          <p className="mt-1 text-[13px] text-body leading-snug">
            Recibirá un email con un link para crear su cuenta (o entrar si ya la tiene) y firmarlo electrónicamente.
          </p>
        </div>

        {/* Card del destinatario */}
        <div className="mx-6 mt-3 rounded-xl border border-hairline bg-surface-soft/50 px-4 py-3 flex items-start gap-3">
          <Mail className="h-4 w-4 text-muted flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted">
              Destinatario
            </p>
            <p className="mt-0.5 text-[13.5px] font-semibold text-ink truncate">
              {recipientName || 'Cliente'}
            </p>
            <p className="text-[12px] text-body truncate font-mono">
              {recipientEmail || <span className="italic text-muted">sin email</span>}
            </p>
          </div>
        </div>

        {/* Card del contrato */}
        <div className="mx-6 mt-2 rounded-xl border border-hairline bg-surface-soft/50 px-4 py-3 flex items-start gap-3">
          <Lock className="h-4 w-4 text-muted flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted">
              Tipo de contrato
            </p>
            <p className="mt-0.5 text-[13.5px] font-semibold text-ink">
              {kindLabel}
            </p>
          </div>
        </div>

        {/* Aviso ámbar */}
        <div className="mx-6 mt-3 rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2.5 text-[12px] text-amber-900 flex items-start gap-2">
          <AlertCircle className="h-3.5 w-3.5 text-amber-700 flex-shrink-0 mt-0.5" />
          <p>
            Tras enviar <strong>no podrás editar los campos</strong> hasta que canceles el envío. La firma del cliente queda registrada con su IP y fecha exacta.
          </p>
        </div>

        {/* Footer botones */}
        <div className="mt-5 px-6 pb-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-medium text-body hover:bg-surface-soft disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending || !recipientEmail}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink text-on-primary px-4 py-2 text-[13px] font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <Send className="h-3.5 w-3.5" />
            {pending ? 'Enviando…' : 'Sí, enviar'}
          </button>
        </div>
      </div>
    </div>
  )
}
