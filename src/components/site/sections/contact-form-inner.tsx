'use client'

import { useEffect, useState } from 'react'

export default function ContactFormInner({
  topics, success_message,
}: {
  topics?: string[]
  success_message?: string
}) {
  const [kennelId, setKennelId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [topic, setTopic] = useState(topics?.[0] || '')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const seg = window.location.pathname.split('/')
    const slug = seg[2]
    if (!slug) return
    fetch(`/api/kennel-by-slug?slug=${encodeURIComponent(slug)}`)
      .then(r => r.json())
      .then(d => { if (d.kennel?.id) setKennelId(d.kennel.id) })
      .catch(() => {})
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!kennelId) { setErr('Cargando criadero…'); return }
    setLoading(true); setErr(null)
    try {
      const notes = `[Tema: ${topic || 'Sin especificar'}]\n${message}`.trim()
      const res = await fetch('/api/owners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kennel_id: kennelId,
          full_name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          notes,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Error')
      }
      setSent(true)
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-ink mb-3 tracking-tight">¡Recibido!</h2>
        <p className="text-body">
          {success_message || 'Tu mensaje ha llegado al criador. Te responderá personalmente lo antes posible.'}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <input type="text" required placeholder="Nombre *" value={name} onChange={e => setName(e.target.value)}
        className="w-full px-4 py-3 text-sm border border-hairline rounded-lg bg-canvas focus:outline-none focus:border-ink" />
      <input type="email" required placeholder="Email *" value={email} onChange={e => setEmail(e.target.value)}
        className="w-full px-4 py-3 text-sm border border-hairline rounded-lg bg-canvas focus:outline-none focus:border-ink" />
      <input type="tel" placeholder="Teléfono (opcional)" value={phone} onChange={e => setPhone(e.target.value)}
        className="w-full px-4 py-3 text-sm border border-hairline rounded-lg bg-canvas focus:outline-none focus:border-ink" />
      {topics && topics.length > 0 && (
        <select value={topic} onChange={e => setTopic(e.target.value)}
          className="w-full px-4 py-3 text-sm border border-hairline rounded-lg bg-canvas focus:outline-none focus:border-ink">
          {topics.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      )}
      <textarea required placeholder="Mensaje *" value={message} onChange={e => setMessage(e.target.value)}
        className="w-full px-4 py-3 text-sm border border-hairline rounded-lg bg-canvas focus:outline-none focus:border-ink min-h-[140px]" />
      {err && <p className="text-sm text-red-700">{err}</p>}
      <button type="submit" disabled={loading}
        className="w-full inline-flex items-center justify-center rounded-lg bg-ink text-on-primary px-6 py-3 text-sm font-semibold hover:opacity-90 transition disabled:opacity-50">
        {loading ? 'Enviando…' : 'Enviar mensaje'}
      </button>
    </form>
  )
}
