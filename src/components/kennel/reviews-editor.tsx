'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, Check, Trash2, Pencil, X, MessageSquare, AlertCircle, Eye, EyeOff, Star } from 'lucide-react'
import {
  upsertReviewAction,
  deleteReviewAction,
  toggleReviewVisibilityAction,
} from '@/lib/kennel/content-actions'

type Review = {
  id: string
  author_name: string
  body: string
  rating: number | null
  is_visible: boolean
}

export default function ReviewsEditor({
  kennelId, initialReviews,
}: {
  kennelId: string
  initialReviews: Review[]
}) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[17px] sm:text-[18px] font-semibold tracking-[-0.02em] text-ink">
            Reseñas de clientes
          </h2>
          <p className="mt-1 text-[12.5px] text-muted max-w-prose">
            Aparecen en el Inicio de tu web pública. Pega aquí los testimonios que
            te dan tus clientes (con su permiso, por supuesto).
          </p>
        </div>
        {!creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-[12.5px] font-bold text-on-primary hover:opacity-90 transition self-start"
          >
            <Plus className="h-3.5 w-3.5" /> Nueva reseña
          </button>
        )}
      </div>

      {creating && (
        <ReviewForm
          kennelId={kennelId}
          onDone={() => { setCreating(false); router.refresh() }}
          onCancel={() => setCreating(false)}
          onError={setError}
        />
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[12.5px] text-red-700">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {initialReviews.length === 0 && !creating ? (
        <div className="rounded-2xl border border-dashed border-hairline bg-surface-soft p-8 text-center">
          <MessageSquare className="mx-auto h-7 w-7 text-muted" />
          <p className="mt-3 text-[14px] font-semibold text-ink">Aún no hay reseñas</p>
          <p className="mt-1 text-[12.5px] text-body max-w-sm mx-auto leading-snug">
            La opinión sincera de un cliente vale más que cualquier copy de marketing.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {initialReviews.map(review => (
            <ReviewRow key={review.id} review={review} kennelId={kennelId} onError={setError} />
          ))}
        </ul>
      )}
    </div>
  )
}

function ReviewRow({
  review, kennelId, onError,
}: { review: Review; kennelId: string; onError: (msg: string | null) => void }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm('¿Borrar esta reseña?')) return
    onError(null)
    startTransition(async () => {
      try {
        await deleteReviewAction({ reviewId: review.id, kennelId })
        router.refresh()
      } catch (err) {
        onError(err instanceof Error ? err.message : 'No se pudo borrar')
      }
    })
  }

  function toggleVisibility() {
    onError(null)
    startTransition(async () => {
      try {
        await toggleReviewVisibilityAction({ reviewId: review.id, kennelId, visible: !review.is_visible })
        router.refresh()
      } catch (err) {
        onError(err instanceof Error ? err.message : 'No se pudo cambiar visibilidad')
      }
    })
  }

  if (editing) {
    return (
      <li>
        <ReviewForm
          kennelId={kennelId}
          initialReview={review}
          onDone={() => { setEditing(false); router.refresh() }}
          onCancel={() => setEditing(false)}
          onError={onError}
        />
      </li>
    )
  }

  return (
    <li className={`rounded-2xl border border-hairline bg-canvas p-4 sm:p-5 ${!review.is_visible ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[14px] font-semibold text-ink">{review.author_name}</p>
            {review.rating && (
              <div className="inline-flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${i < (review.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-hairline'}`}
                  />
                ))}
              </div>
            )}
            {!review.is_visible && (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-card text-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                Oculta
              </span>
            )}
          </div>
          <p className="mt-2 text-[13.5px] text-body leading-[1.55] whitespace-pre-line">{review.body}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={toggleVisibility}
            disabled={pending}
            className="text-muted hover:text-ink p-1.5 rounded-md hover:bg-surface-soft disabled:opacity-50"
            title={review.is_visible ? 'Ocultar' : 'Mostrar'}
          >
            {review.is_visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => setEditing(true)}
            className="text-muted hover:text-ink p-1.5 rounded-md hover:bg-surface-soft"
            title="Editar"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleDelete}
            disabled={pending}
            className="text-muted hover:text-red-600 p-1.5 rounded-md hover:bg-surface-soft disabled:opacity-50"
            title="Borrar"
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </li>
  )
}

function ReviewForm({
  kennelId, initialReview, onDone, onCancel, onError,
}: {
  kennelId: string
  initialReview?: Review
  onDone: () => void
  onCancel: () => void
  onError: (msg: string | null) => void
}) {
  const [authorName, setAuthorName] = useState(initialReview?.author_name || '')
  const [body, setBody] = useState(initialReview?.body || '')
  const [rating, setRating] = useState<number | null>(initialReview?.rating ?? 5)
  const [pending, startTransition] = useTransition()

  function save() {
    onError(null)
    startTransition(async () => {
      try {
        await upsertReviewAction({
          kennelId,
          reviewId: initialReview?.id,
          authorName, body, rating,
        })
        onDone()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'error'
        const human =
          msg === 'author_too_short' ? 'El nombre del cliente es muy corto.' :
          msg === 'body_too_short' ? 'El texto de la reseña es muy corto.' :
          `No se pudo guardar: ${msg}`
        onError(human)
      }
    })
  }

  return (
    <div className="rounded-2xl border border-ink bg-canvas p-4 sm:p-5 space-y-3">
      <input
        type="text"
        value={authorName}
        onChange={e => setAuthorName(e.target.value)}
        placeholder="Nombre del cliente (ej: Familia García, Madrid)"
        autoFocus={!initialReview}
        className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-[14px] font-semibold text-ink placeholder:text-muted/70 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink transition"
      />
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        rows={4}
        placeholder="Texto de la reseña tal cual te la dio el cliente..."
        className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-[13.5px] text-body placeholder:text-muted/70 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink transition resize-y leading-[1.55]"
      />
      <div className="flex items-center gap-2">
        <span className="text-[11.5px] font-medium text-muted">Valoración:</span>
        {Array.from({ length: 5 }).map((_, i) => {
          const n = i + 1
          return (
            <button
              key={n}
              type="button"
              onClick={() => setRating(rating === n ? null : n)}
              className="p-1"
              title={`${n} estrellas`}
            >
              <Star
                className={`h-4 w-4 transition ${n <= (rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-hairline hover:text-amber-300'}`}
              />
            </button>
          )
        })}
        {rating !== null && (
          <button
            type="button"
            onClick={() => setRating(null)}
            className="ml-2 text-[11px] text-muted hover:text-ink transition"
          >
            Sin nota
          </button>
        )}
      </div>
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold text-muted hover:text-ink transition"
        >
          <X className="h-3 w-3" /> Cancelar
        </button>
        <button
          type="button"
          onClick={save}
          disabled={pending || !authorName.trim() || !body.trim()}
          className="inline-flex items-center gap-1 rounded-lg bg-ink px-3 py-1.5 text-[12.5px] font-bold text-on-primary hover:opacity-90 disabled:opacity-40 transition"
        >
          {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          Guardar
        </button>
      </div>
    </div>
  )
}
