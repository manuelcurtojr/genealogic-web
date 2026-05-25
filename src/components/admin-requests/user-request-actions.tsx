/**
 * Acciones que puede hacer un USER sobre su propia solicitud:
 *  - Responder (añade mensaje al thread)
 *  - Cancelar (mientras esté abierta)
 */
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { replyToRequestAction, cancelRequestAction } from '@/lib/admin-requests/actions'
import type { AdminRequestStatus } from '@/lib/admin-requests/types'
import { Send, Loader2, X, AlertCircle } from 'lucide-react'

export default function UserRequestActions({
  requestId,
  status,
}: {
  requestId: string
  status: AdminRequestStatus
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  const [confirmCancel, setConfirmCancel] = useState(false)

  function reply() {
    setError('')
    if (!body.trim()) return
    startTransition(async () => {
      try {
        await replyToRequestAction({ requestId, body: body.trim() })
        setBody('')
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error')
      }
    })
  }

  function cancel() {
    startTransition(async () => {
      try {
        await cancelRequestAction(requestId)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error')
      }
    })
  }

  return (
    <div className="mt-6 space-y-4">
      {/* Reply form */}
      <div className="rounded-xl border-2 border-ink/20 bg-canvas p-4 ml-6">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-muted mb-2">
          {status === 'awaiting_user' ? 'El equipo está esperando tu respuesta' : 'Añadir un mensaje'}
        </p>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          placeholder="Escribe aquí…"
          className="w-full bg-canvas border border-hairline rounded-lg px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none resize-none"
        />
        {error && (
          <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {error}
          </p>
        )}
        <button
          onClick={reply}
          disabled={pending || !body.trim()}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-ink text-on-primary px-4 py-2 text-xs font-bold hover:opacity-90 disabled:opacity-50"
        >
          {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          Enviar
        </button>
      </div>

      {/* Cancel */}
      <div className="text-center">
        {!confirmCancel ? (
          <button
            onClick={() => setConfirmCancel(true)}
            disabled={pending}
            className="text-xs text-muted hover:text-red-600 transition"
          >
            Cancelar esta solicitud
          </button>
        ) : (
          <div className="inline-flex items-center gap-2">
            <span className="text-xs text-body">¿Seguro?</span>
            <button
              onClick={cancel}
              disabled={pending}
              className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700"
            >
              {pending && <Loader2 className="w-3 h-3 animate-spin" />}
              <X className="w-3 h-3" /> Sí, cancelar
            </button>
            <button
              onClick={() => setConfirmCancel(false)}
              disabled={pending}
              className="text-xs text-muted hover:text-ink"
            >
              No
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
