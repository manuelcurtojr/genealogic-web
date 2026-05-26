/**
 * LeaveReviewButton — CTA para que un usuario logueado deje reseña pública
 * en el perfil de un kennel.
 *
 * Si NO está logueado: link a /login con returnTo a esta página.
 * Si está logueado: abre modal con form (texto + rating).
 * Tras enviar: la reseña queda pending; aparecerá tras aprobación del owner.
 *
 * NO mostramos el botón al propio owner del kennel (se filtraría en el
 * server action, pero también lo gateamos via prop opcional).
 */
'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Star, X, Loader2, Check, AlertCircle, MessageSquare,
} from 'lucide-react'
import { submitPublicReviewAction } from '@/lib/kennel/public-review-actions'

interface Props {
  kennelId: string
  kennelSlug: string
}

export default function LeaveReviewButton({ kennelId, kennelSlug }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isOwnerOrAnon, setIsOwnerOrAnon] = useState<'loading' | 'anon' | 'owner' | 'other'>('loading')

  // Detectar si el visitante es el owner del kennel — no mostramos el botón
  useEffect(() => {
    let mounted = true
    const sb = createClient()
    sb.auth.getUser().then(async ({ data }) => {
      if (!mounted) return
      if (!data.user) {
        setIsOwnerOrAnon('anon')
        return
      }
      const { data: kennel } = await sb
        .from('kennels')
        .select('owner_id')
        .eq('id', kennelId)
        .single()
      if (!mounted) return
      if (kennel?.owner_id === data.user.id) {
        setIsOwnerOrAnon('owner')
      } else {
        setIsOwnerOrAnon('other')
      }
    })
    return () => { mounted = false }
  }, [kennelId])

  // No mostrar el botón al owner del kennel (no se puede auto-reseñar)
  if (isOwnerOrAnon === 'owner') return null
  if (isOwnerOrAnon === 'loading') return null

  function handleClick() {
    if (isOwnerOrAnon === 'anon') {
      // Redirige a login y vuelve aquí
      router.push(`/login?returnTo=/kennels/${kennelSlug}`)
      return
    }
    setOpen(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 rounded-xl border border-hairline bg-canvas text-ink px-3.5 py-2 text-[12.5px] font-semibold hover:border-ink/30 transition"
      >
        <MessageSquare className="h-3.5 w-3.5" />
        Dejar reseña
      </button>
      {open && (
        <ReviewModal
          kennelId={kennelId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

function ReviewModal({ kennelId, onClose }: { kennelId: string; onClose: () => void }) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [rating, setRating] = useState<number | null>(5)
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !pending) onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, pending])

  function submit() {
    setError(null)
    startTransition(async () => {
      try {
        await submitPublicReviewAction({ kennelId, body, rating })
        setDone(true)
        router.refresh()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'error'
        const human =
          msg === 'body_too_short' ? 'La reseña es muy corta (mínimo 20 caracteres).' :
          msg === 'body_too_long' ? 'La reseña es muy larga (máximo 1500 caracteres).' :
          msg === 'already_reviewed' ? 'Ya has dejado una reseña en este criadero.' :
          msg === 'cannot_review_own_kennel' ? 'No puedes dejarte reseñas a ti mismo.' :
          msg === 'unauthorized' ? 'Tienes que iniciar sesión.' :
          `No se pudo enviar: ${msg}`
        setError(human)
      }
    })
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full sm:max-w-md bg-canvas rounded-t-3xl sm:rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.18)] border border-hairline overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {done ? (
          <div className="p-8 text-center">
            <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
              <Check className="h-6 w-6 text-emerald-700" strokeWidth={2.5} />
            </div>
            <h3 className="text-[17px] font-semibold text-ink">¡Gracias por tu reseña!</h3>
            <p className="mt-2 text-[13.5px] text-body max-w-sm mx-auto leading-snug">
              El criadero la revisará y aparecerá pública en cuanto la apruebe.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-ink px-5 py-2.5 text-[13px] font-bold text-on-primary hover:opacity-90 transition"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-hairline">
              <div>
                <h3 className="text-[15px] font-semibold text-ink">Dejar reseña</h3>
                <p className="text-[12px] text-muted mt-0.5">
                  Tu opinión ayuda a otras familias.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={pending}
                className="rounded-md p-1 text-muted hover:bg-surface-soft hover:text-ink"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <p className="text-[12.5px] font-semibold text-ink mb-1.5">Valoración</p>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const n = i + 1
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(rating === n ? null : n)}
                        className="p-1"
                        aria-label={`${n} estrellas`}
                      >
                        <Star
                          className={`h-6 w-6 transition ${n <= (rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-hairline hover:text-amber-300'}`}
                        />
                      </button>
                    )
                  })}
                </div>
              </div>

              <label className="block">
                <span className="text-[12.5px] font-semibold text-ink">Tu reseña</span>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  rows={6}
                  placeholder="Cuenta tu experiencia con el criadero, qué te ha gustado, recomendarías..."
                  className="mt-1.5 w-full rounded-xl border border-hairline bg-canvas px-3 py-2.5 text-[14px] text-ink placeholder:text-muted/70 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink transition resize-y leading-[1.55]"
                />
                <span className="block mt-1 text-[10.5px] text-muted text-right tabular-nums">
                  {body.trim().length} / 1500
                </span>
              </label>

              <p className="text-[11.5px] text-muted leading-snug">
                Tu reseña no se publica al instante — el criadero la revisa antes
                de hacerla visible. Aparecerá con un badge automático según seas
                cliente o usuario registrado.
              </p>

              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[12.5px] text-red-700">
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  {error}
                </div>
              )}
            </div>

            <div className="border-t border-hairline bg-surface-soft px-5 py-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={pending}
                className="rounded-lg px-3 py-2 text-[13px] font-semibold text-body hover:text-ink"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={pending || body.trim().length < 20}
                className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-[13px] font-bold text-on-primary hover:opacity-90 disabled:opacity-40 transition"
              >
                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Enviar reseña
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
