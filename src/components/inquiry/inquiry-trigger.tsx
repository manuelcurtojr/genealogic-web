'use client'

import { useState } from 'react'
import { useT } from '@/components/i18n/locale-provider'

/**
 * Botón que abre un formulario simple de inquiry (interesado).
 * Conecta con /api/owners para crear el cliente con source='web_form'
 * y opcionalmente crear una reserva 'interested' en el kennel del slug.
 */
export function InquiryTrigger({
  kennelId, label = 'Apuntarme a la lista de espera', variant = 'primary',
  className, children,
}: {
  kennelId?: string
  label?: string
  variant?: 'primary' | 'outline'
  className?: string
  children?: React.ReactNode
}) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!kennelId) return
    setLoading(true); setErr(null)
    try {
      const res = await fetch('/api/owners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kennel_id: kennelId,
          full_name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          notes: notes.trim() || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error')
      }
      setSent(true)
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  const buttonClass = className || (variant === 'outline'
    ? 'inline-flex items-center justify-center rounded-lg border border-ink text-ink px-5 py-3 text-sm font-semibold hover:bg-ink/5 transition'
    : 'inline-flex items-center justify-center rounded-lg bg-ink text-on-primary px-5 py-3 text-sm font-semibold hover:opacity-90 transition')

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonClass}>
        {children || t(label)}
      </button>
      {open && (
        <div
          onClick={() => !loading && setOpen(false)}
          className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4"
        >
          <div onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl border border-hairline shadow-xl w-full max-w-md p-6">
            {sent ? (
              <>
                <h2 className="text-xl font-bold text-ink mb-2">{t('¡Recibido!')}</h2>
                <p className="text-sm text-body mb-5">
                  {t('Tu mensaje ha llegado al criador. Te responderá personalmente lo antes posible.')}
                </p>
                <button onClick={() => setOpen(false)}
                  className="w-full inline-flex items-center justify-center rounded-lg bg-ink text-on-primary px-4 py-2.5 text-sm font-semibold">
                  {t('Cerrar')}
                </button>
              </>
            ) : (
              <form onSubmit={submit} className="space-y-3">
                <h2 className="text-xl font-bold text-ink mb-1">{t('Lista de espera')}</h2>
                <p className="text-sm text-muted mb-4">
                  {t('Déjanos tus datos y te contactaremos antes de la próxima camada.')}
                </p>
                <input value={name} onChange={e => setName(e.target.value)} required placeholder={t('Tu nombre completo *')}
                  className="w-full px-3 py-2 text-sm border border-hairline rounded-lg focus:outline-none focus:border-ink" />
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder={t('Email')}
                  className="w-full px-3 py-2 text-sm border border-hairline rounded-lg focus:outline-none focus:border-ink" />
                <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" placeholder={t('Teléfono')}
                  className="w-full px-3 py-2 text-sm border border-hairline rounded-lg focus:outline-none focus:border-ink" />
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('¿Algo que quieras contarnos? Sexo preferido, fechas, etc.')}
                  className="w-full px-3 py-2 text-sm border border-hairline rounded-lg focus:outline-none focus:border-ink min-h-[80px]" />
                {err && <p className="text-xs text-red-700">{err}</p>}
                <div className="flex gap-2 justify-end pt-2">
                  <button type="button" onClick={() => setOpen(false)} disabled={loading}
                    className="px-4 py-2 text-sm text-body hover:text-ink">{t('Cancelar')}</button>
                  <button type="submit" disabled={loading}
                    className="px-4 py-2 text-sm font-semibold bg-ink text-on-primary rounded-lg disabled:opacity-50">
                    {loading ? t('Enviando…') : t('Enviar')}
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
