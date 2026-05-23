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
      <div className="text-center py-6">
        <div
          className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center text-2xl text-theme-accent"
          style={{ borderRadius: 'var(--button-radius, 999px)', background: 'var(--brand-soft)' }}
        >
          ✓
        </div>
        <h2
          className="text-2xl md:text-3xl font-bold text-ink mb-3 tracking-tight"
          style={{ fontFamily: 'var(--font-display, inherit)' }}
        >
          ¡Recibido!
        </h2>
        <p className="text-body leading-relaxed">
          {success_message || 'Tu mensaje ha llegado al criador. Te responderá personalmente lo antes posible.'}
        </p>
      </div>
    )
  }

  // Estilos compartidos para todos los inputs — usan tokens del tema
  const inputClass =
    'w-full px-4 py-3 text-sm border border-hairline bg-canvas text-ink placeholder-muted/70 focus:outline-none focus:border-theme-accent transition-colors'
  const inputStyle = { borderRadius: 'var(--button-radius, 8px)' as const }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input type="text" required placeholder="Nombre *" value={name} onChange={e => setName(e.target.value)}
        className={inputClass} style={inputStyle} />
      <input type="email" required placeholder="Email *" value={email} onChange={e => setEmail(e.target.value)}
        className={inputClass} style={inputStyle} />
      <input type="tel" placeholder="Teléfono (opcional)" value={phone} onChange={e => setPhone(e.target.value)}
        className={inputClass} style={inputStyle} />
      {topics && topics.length > 0 && (
        <select value={topic} onChange={e => setTopic(e.target.value)}
          className={inputClass} style={inputStyle}>
          {topics.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      )}
      <textarea required placeholder="Mensaje *" value={message} onChange={e => setMessage(e.target.value)}
        className={`${inputClass} min-h-[140px]`} style={inputStyle} />
      {err && <p className="text-sm text-red-600">{err}</p>}
      <button type="submit" disabled={loading}
        className="btn-brand w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 text-[13px] font-semibold uppercase tracking-[0.1em] disabled:opacity-50">
        {loading ? 'Enviando…' : 'Enviar mensaje'}
        {!loading && <span aria-hidden="true">→</span>}
      </button>
    </form>
  )
}
