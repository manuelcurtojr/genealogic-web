/**
 * Form de creación de ticket de soporte genérico.
 * Si todo OK, redirige al detalle de la solicitud recién creada.
 */
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createSupportRequestAction } from '@/lib/admin-requests/actions'
import { Loader2, Send, AlertCircle } from 'lucide-react'

export default function SupportForm() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function submit() {
    setError('')
    if (subject.trim().length < 3) {
      setError('Asunto demasiado corto (mín. 3 caracteres)')
      return
    }
    if (message.trim().length < 10) {
      setError('Explica un poco más (mín. 10 caracteres)')
      return
    }
    startTransition(async () => {
      try {
        const { id } = await createSupportRequestAction({
          subject: subject.trim(),
          message: message.trim(),
          source: 'soporte_form',
          sourceUrl: typeof window !== 'undefined' ? window.location.href : undefined,
        })
        router.push(`/soporte/${id}?created=1`)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error')
      }
    })
  }

  return (
    <div className="rounded-xl border border-hairline bg-canvas p-5 sm:p-6 space-y-4">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
          Asunto *
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Ej: No me llegan emails del bot"
          maxLength={120}
          className="w-full bg-canvas border border-hairline rounded-lg px-3 py-2.5 text-sm text-ink focus:border-ink focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
          Cuéntanos qué pasa *
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          placeholder="Sé concreto: qué intentaste, qué esperabas, qué pasó. Si hay URLs implicadas, pégalas aquí."
          className="w-full bg-canvas border border-hairline rounded-lg px-3 py-2.5 text-sm text-ink focus:border-ink focus:outline-none resize-none"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <button
        onClick={submit}
        disabled={pending || subject.trim().length < 3 || message.trim().length < 10}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-ink text-on-primary px-6 py-3 text-sm font-bold hover:opacity-90 disabled:opacity-50"
      >
        {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Enviar a soporte
      </button>
    </div>
  )
}
