/**
 * Form de respuesta del admin en el thread de una solicitud.
 * Toggle "Esperar respuesta del user" → pone status='awaiting_user'.
 */
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { adminReplyToRequestAction } from '@/lib/admin-requests/actions'
import { Send, Loader2 } from 'lucide-react'

export default function AdminRequestReply({ requestId }: { requestId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [body, setBody] = useState('')
  const [setAwaiting, setSetAwaiting] = useState(true)
  const [error, setError] = useState('')

  function submit() {
    setError('')
    if (!body.trim()) {
      setError('El mensaje no puede estar vacío')
      return
    }
    startTransition(async () => {
      try {
        await adminReplyToRequestAction({
          requestId,
          body: body.trim(),
          setAwaitingUser: setAwaiting,
        })
        setBody('')
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error')
      }
    })
  }

  return (
    <div className="rounded-xl border-2 border-ink/20 bg-canvas p-4 ml-6">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-2">
        Responder como Admin
      </p>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        placeholder="Escribe tu respuesta — el user la verá en /mis-solicitudes/[id]"
        className="w-full bg-canvas border border-hairline rounded-lg px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none resize-none"
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
        <label className="flex items-center gap-2 text-xs text-body cursor-pointer">
          <input
            type="checkbox"
            checked={setAwaiting}
            onChange={(e) => setSetAwaiting(e.target.checked)}
            className="rounded"
          />
          Marcar como "esperando user"
        </label>
        <button
          onClick={submit}
          disabled={pending || !body.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-ink text-on-primary px-4 py-2 text-xs font-bold hover:opacity-90 disabled:opacity-50"
        >
          {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          Enviar
        </button>
      </div>
    </div>
  )
}
