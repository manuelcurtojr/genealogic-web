'use client'

import { useState, useTransition } from 'react'
import { Mail, Loader2, Check, AlertCircle } from 'lucide-react'
import { subscribePublicNewsletterAction } from '@/lib/kennel/content-actions'
import { useT } from '@/components/i18n/locale-provider'

interface Props {
  kennelId: string
  kennelName: string
  /** Si true, renderiza SOLO el form + estado (sin card grande con título/glow).
   *  Pensado para usar dentro del footer fusionado donde el título y el body
   *  los pone el wrapper. */
  inline?: boolean
}

export default function NewsletterSubscribe({ kennelId, kennelName, inline = false }: Props) {
  const t = useT()
  const [email, setEmail] = useState('')
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const [duplicate, setDuplicate] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setDuplicate(false)
    startTransition(async () => {
      try {
        const result = await subscribePublicNewsletterAction({ kennelId, email })
        setDone(true)
        if (result.duplicate) setDuplicate(true)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'error'
        const human =
          msg === 'invalid_email' ? t('Email no válido.') :
          `${t('No se pudo suscribir:')} ${msg}`
        setError(human)
      }
    })
  }

  // Renderiza solo el formulario + estado cuando es inline.
  const formBlock = (
    <>
      {done ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
            <Check className="h-4 w-4 text-emerald-700" strokeWidth={2.5} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold text-emerald-900">
              {duplicate ? t('¡Ya estabas suscrito!') : t('¡Apuntado!')}
            </p>
            <p className="text-[12px] text-emerald-900/80 leading-snug">
              {duplicate
                ? t('Recibirás todas las novedades de este criadero.')
                : t('Te avisamos cuando haya novedades.')}
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="tu@email.com"
              className="w-full rounded-xl border border-hairline bg-canvas py-2.5 pl-10 pr-3 text-[14px] text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink transition"
            />
          </div>
          <button
            type="submit"
            disabled={pending || !email}
            className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2.5 text-[13px] font-bold text-on-primary hover:opacity-90 disabled:opacity-40 transition flex-shrink-0"
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t('Suscribirme')}
          </button>
        </form>
      )}
      {error && (
        <div className="mt-2 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[12px] text-red-700">
          <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}
    </>
  )

  if (inline) {
    return <div className="w-full max-w-[440px]">{formBlock}</div>
  }

  return (
    <section className="rounded-3xl overflow-hidden border border-hairline bg-gradient-to-br from-blue-50/60 via-canvas to-orange-50/60 p-6 sm:p-10 relative">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 -right-20 h-[280px] w-[280px] rounded-full blur-3xl opacity-50"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(59,130,246,0.25) 0%, transparent 70%)',
        }}
      />
      <div className="relative grid grid-cols-1 sm:grid-cols-[1fr_auto] items-center gap-5 sm:gap-8">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#3b82f6]">Newsletter</p>
          <h2 className="mt-1 text-[22px] sm:text-[26px] font-semibold tracking-[-0.03em] text-ink leading-[1.15]">
            {t('Mantente al día con')} {kennelName}
          </h2>
          <p className="mt-2 text-[13.5px] sm:text-[14.5px] text-body leading-snug max-w-prose">
            {t('Próximas camadas, novedades, eventos. Cero spam. Te das de baja con un click.')}
          </p>
        </div>
        <div className="w-full sm:w-[360px]">
          {done ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <Check className="h-4 w-4 text-emerald-700" strokeWidth={2.5} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold text-emerald-900">
                  {duplicate ? t('¡Ya estabas suscrito!') : t('¡Apuntado!')}
                </p>
                <p className="text-[12px] text-emerald-900/80 leading-snug">
                  {duplicate
                    ? t('Recibirás todas las novedades de este criadero.')
                    : t('Te avisamos cuando haya novedades.')}
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="tu@email.com"
                  className="w-full rounded-xl border border-hairline bg-canvas py-2.5 pl-10 pr-3 text-[14px] text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink transition"
                />
              </div>
              <button
                type="submit"
                disabled={pending || !email}
                className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2.5 text-[13px] font-bold text-on-primary hover:opacity-90 disabled:opacity-40 transition flex-shrink-0"
              >
                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t('Suscribirme')}
              </button>
            </form>
          )}
          {error && (
            <div className="mt-2 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[12px] text-red-700">
              <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
