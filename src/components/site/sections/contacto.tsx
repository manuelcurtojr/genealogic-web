/**
 * Secciones "Contacto" — light theme.
 */
'use client'

import { useState } from 'react'
import { useEffect } from 'react'

export function ContactFormSection({
  title, subtitle, eyebrow, headline, topics, success_message,
}: {
  title?: string
  subtitle?: string
  eyebrow?: string
  headline?: string  // alias
  topics?: string[]
  success_message?: string
}) {
  const t = title || headline || 'Cuéntanos'
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
    // Obtener kennel del path /c/[slug]
    const seg = typeof window !== 'undefined' ? window.location.pathname.split('/') : []
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
      <section className="py-16 lg:py-24">
        <div className="max-w-xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-ink mb-3 tracking-tight">¡Recibido!</h2>
          <p className="text-body">
            {success_message || 'Tu mensaje ha llegado al criador. Te responderá personalmente lo antes posible.'}
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 lg:py-16">
      <div className="max-w-xl mx-auto px-4 sm:px-6">
        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted mb-2">{eyebrow}</p>
        )}
        <h2 className="text-2xl md:text-3xl font-bold text-ink mb-3 tracking-tight">{t}</h2>
        {subtitle && <p className="text-body mb-6 leading-relaxed">{subtitle}</p>}
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
      </div>
    </section>
  )
}

export function ContactInfoSection({
  title, items = [], eyebrow,
}: {
  title?: string
  eyebrow?: string
  items?: { label: string; value: string }[]
}) {
  return (
    <section className="py-12 lg:py-16 bg-surface-card border-y border-hairline">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted mb-2 text-center">{eyebrow}</p>
        )}
        {title && (
          <h2 className="text-2xl md:text-3xl font-bold text-ink mb-8 text-center tracking-tight">{title}</h2>
        )}
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((it, i) => (
            <div key={i} className="rounded-xl border border-hairline bg-canvas p-4">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted mb-1">{it.label}</dt>
              <dd className="text-sm text-ink font-medium">{it.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

export function MapEmbedSection({
  title, embed_url, address,
}: {
  title?: string
  embed_url?: string
  address?: string
}) {
  if (!embed_url) return null
  return (
    <section className="py-12 lg:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {title && (
          <h2 className="text-2xl md:text-3xl font-bold text-ink mb-6 tracking-tight">{title}</h2>
        )}
        <div className="aspect-[16/9] rounded-2xl overflow-hidden border border-hairline">
          <iframe
            src={embed_url}
            className="w-full h-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={address || 'Mapa'}
          />
        </div>
        {address && (
          <p className="text-sm text-muted mt-3 text-center">{address}</p>
        )}
      </div>
    </section>
  )
}
