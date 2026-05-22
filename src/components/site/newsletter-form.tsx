'use client'

import { useState } from 'react'

export function NewsletterForm({
  kennelId,
  placeholder = 'tu@email.com',
  placeholderEmail,
  ctaLabel = 'Suscribirme',
}: {
  kennelId?: string
  placeholder?: string
  placeholderEmail?: string
  ctaLabel?: string
}) {
  const ph = placeholderEmail || placeholder
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle')
  const [msg, setMsg] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !kennelId) return
    setStatus('loading'); setMsg(null)
    try {
      const res = await fetch('/api/newsletter/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kennel_id: kennelId, email: email.trim(), source: 'web_form' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      setStatus('ok'); setMsg('¡Suscrito! Te avisaremos en próximas camadas.')
      setEmail('')
    } catch (err: any) {
      setStatus('err'); setMsg(err.message)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
      <input
        type="email" value={email} onChange={e => setEmail(e.target.value)}
        placeholder={ph} required disabled={status === 'loading'}
        className="flex-1 px-4 py-3 text-sm border border-hairline rounded-lg bg-canvas text-ink placeholder:text-muted focus:outline-none focus:border-ink"
      />
      <button type="submit" disabled={status === 'loading'}
        className="px-5 py-3 text-sm font-semibold bg-ink text-on-primary rounded-lg hover:opacity-90 transition disabled:opacity-50">
        {status === 'loading' ? 'Enviando…' : ctaLabel}
      </button>
      {msg && (
        <p className={`text-xs ${status === 'ok' ? 'text-ink' : 'text-red-700'} mt-1`}>{msg}</p>
      )}
    </form>
  )
}
