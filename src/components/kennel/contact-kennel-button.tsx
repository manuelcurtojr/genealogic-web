'use client'

import { useState } from 'react'
import { Send, X, Loader2, Check } from 'lucide-react'

interface Props {
  kennelId: string
  kennelName: string
}

/**
 * Botón "Solicitudes" en el perfil público del criadero.
 * Sustituye al CTA WhatsApp con un canal de contacto que se
 * registra en la bandeja del criador (puppy_reservations con
 * source='public_form').
 */
export default function ContactKennelButton({ kennelId, kennelName }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [preferenceSex, setPreferenceSex] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const reset = () => {
    setName(''); setEmail(''); setPhone(''); setMessage(''); setPreferenceSex('')
    setError(null); setDone(false); setSubmitting(false)
  }
  const close = () => { setOpen(false); setTimeout(reset, 200) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/contact-kennel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kennel_id: kennelId,
          applicant_name: name,
          applicant_email: email,
          applicant_phone: phone || null,
          applicant_message: message,
          preference_sex: preferenceSex || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'No se pudo enviar')
        setSubmitting(false)
        return
      }
      setDone(true)
      setSubmitting(false)
    } catch (err: any) {
      setError(err.message || 'Error de red')
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md bg-ink px-3 py-1.5 text-[12px] font-medium text-on-primary transition-colors hover:opacity-90"
      >
        <Send className="h-3.5 w-3.5" />
        Solicitudes
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={close}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-canvas shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
              <div>
                <h2 className="text-[16px] font-semibold tracking-[-0.02em] text-ink">
                  Contactar con {kennelName}
                </h2>
                <p className="mt-0.5 text-[12px] text-muted">
                  Tu mensaje llegará directamente al criador.
                </p>
              </div>
              <button
                onClick={close}
                className="rounded-lg p-1 text-muted hover:bg-surface-soft hover:text-ink"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {done ? (
              <div className="px-5 py-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                  <Check className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="mt-4 text-[15px] font-semibold text-ink">¡Solicitud enviada!</p>
                <p className="mt-1 text-[13px] text-body">
                  {kennelName} la verá en su bandeja y te responderá pronto.
                </p>
                <button
                  onClick={close}
                  className="mt-5 inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-canvas px-4 py-2 text-[13px] font-medium text-body hover:bg-surface-soft"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3 px-5 py-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[11.5px] font-medium uppercase tracking-[0.06em] text-muted">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-[14px] text-ink focus:border-ink focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11.5px] font-medium uppercase tracking-[0.06em] text-muted">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-[14px] text-ink focus:border-ink focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[11.5px] font-medium uppercase tracking-[0.06em] text-muted">
                      Teléfono (opcional)
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-[14px] text-ink focus:border-ink focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11.5px] font-medium uppercase tracking-[0.06em] text-muted">
                      Prefiero
                    </label>
                    <select
                      value={preferenceSex}
                      onChange={(e) => setPreferenceSex(e.target.value)}
                      className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-[14px] text-ink focus:border-ink focus:outline-none"
                    >
                      <option value="">Indiferente</option>
                      <option value="male">Macho</option>
                      <option value="female">Hembra</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[11.5px] font-medium uppercase tracking-[0.06em] text-muted">
                    Mensaje *
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={4}
                    placeholder="Cuéntanos qué buscas, cuándo, etc."
                    className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-[14px] text-ink focus:border-ink focus:outline-none resize-none"
                  />
                </div>

                {error && (
                  <div className="rounded-lg bg-[color:var(--error)]/10 px-3 py-2 text-[12.5px] text-[color:var(--error)]">
                    {error}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-lg border border-hairline bg-canvas px-4 py-2 text-[13px] font-medium text-body hover:bg-surface-soft"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-[13px] font-medium text-on-primary transition-colors hover:opacity-90 disabled:opacity-50"
                  >
                    {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Enviar solicitud
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
