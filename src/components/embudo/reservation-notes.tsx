'use client'

/**
 * Notas internas del criador sobre una reserva. A diferencia del antiguo campo
 * único de texto, aquí cada nota es INDEPENDIENTE y lleva su fecha, como un
 * pequeño historial. Se guardan en applicant_extra_data._notes vía server
 * actions. Se usa igual en el panel lateral del embudo (variant "panel") y en
 * la ficha completa (variant "card").
 */
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { StickyNote, Plus, Trash2, Loader2 } from 'lucide-react'
import { addReservationNote, deleteReservationNote } from '@/lib/pipelines/reservation-extra-actions'

export type ReservationNote = { id: string; at: string; body: string }

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}

export default function ReservationNotes({
  reservationId, initialNotes, legacyNote = null, variant = 'panel',
}: {
  reservationId: string
  initialNotes: ReservationNote[]
  /** internal_note antiguo (solo lectura) por si aún no se migró a _notes. */
  legacyNote?: string | null
  variant?: 'panel' | 'card'
}) {
  const [notes, setNotes] = useState<ReservationNote[]>(initialNotes)
  const [draft, setDraft] = useState('')
  const [pending, start] = useTransition()
  const router = useRouter()

  // La nota importada (campo antiguo) se muestra SIEMPRE que exista, aunque se
  // añadan notas nuevas — si no, al crear la primera nota desaparecería.
  const showLegacy = !!legacyNote && legacyNote.trim() !== ''

  const add = () => {
    const body = draft.trim()
    if (!body) return
    start(async () => {
      const r = await addReservationNote(reservationId, body)
      if (r.ok) {
        // Optimista: la fecha exacta la fija el server, aquí basta una local para el orden.
        setNotes((prev) => [...prev, { id: `tmp-${prev.length}-${body.length}`, at: new Date().toISOString(), body }])
        setDraft('')
        router.refresh()
      } else {
        alert(r.error)
      }
    })
  }

  const remove = (id: string) => {
    start(async () => {
      const r = await deleteReservationNote(reservationId, id)
      if (r.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== id))
        router.refresh()
      } else alert(r.error)
    })
  }

  return (
    <section className={variant === 'card' ? 'rounded-2xl border border-hairline bg-canvas p-4 sm:p-6' : 'mt-4'}>
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted mb-2">
        <StickyNote className="w-3.5 h-3.5" /> Notas internas
        <span className="text-muted/70 normal-case font-normal tracking-normal">· solo tú las ves</span>
      </div>

      {/* Lista de notas */}
      <div className="space-y-1.5">
        {showLegacy && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2">
            <p className="text-[13px] text-ink whitespace-pre-wrap break-words">{legacyNote}</p>
            <p className="mt-1 text-[10.5px] text-muted uppercase tracking-wide">Nota importada</p>
          </div>
        )}
        {notes.length === 0 && !showLegacy && (
          <p className="text-[12px] text-muted py-1">Sin notas todavía.</p>
        )}
        {notes.map((n) => (
          <div key={n.id} className="group rounded-lg border border-hairline bg-amber-50/30 px-3 py-2">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[13px] text-ink whitespace-pre-wrap break-words min-w-0 flex-1">{n.body}</p>
              <button
                type="button"
                onClick={() => remove(n.id)}
                disabled={pending}
                className="flex-shrink-0 text-muted hover:text-rose-600 disabled:opacity-40 opacity-0 group-hover:opacity-100 transition"
                aria-label="Borrar nota"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="mt-1 text-[10.5px] text-muted">{fmtDate(n.at)}</p>
          </div>
        ))}
      </div>

      {/* Añadir nota */}
      <div className="mt-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          placeholder="Escribe una nota nueva…"
          className="w-full rounded-lg border border-hairline bg-amber-50/40 px-3 py-2 text-base sm:text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ink/10"
        />
        <div className="flex justify-end mt-1.5">
          <button
            type="button"
            onClick={add}
            disabled={pending || !draft.trim()}
            className="inline-flex items-center gap-1.5 rounded-md bg-ink text-on-primary px-3 py-1.5 text-[12px] font-semibold hover:opacity-90 disabled:opacity-40"
          >
            {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Añadir nota
          </button>
        </div>
      </div>
    </section>
  )
}
