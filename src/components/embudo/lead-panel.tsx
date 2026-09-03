'use client'

/** Panel lateral con el detalle completo de un lead/ficha del embudo. */
import { useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Phone, MapPin, Clock, ArrowUpRight, MessageSquare, Tag, Trash2, EyeOff } from 'lucide-react'
import { useT } from '@/components/i18n/locale-provider'
import { deleteEntry, markEntryUnseen } from '@/lib/pipelines/actions'
import ReservationPaymentsCard from './reservation-payments-card'
import ReservationNotes, { type ReservationNote } from './reservation-notes'
import ReservationBreedPicker from './reservation-breed-picker'
import Drawer from './drawer'
import type { FunnelEntry, Pipeline, Stage } from '@/lib/pipelines/types'

const SOURCE_LABEL: Record<string, string> = {
  public_form: 'Formulario web',
  manual: 'Alta manual',
  api: 'API',
}

export default function LeadPanel({
  entry,
  pipeline,
  pending,
  onMove,
  onClose,
  kennelBreeds = [],
}: {
  entry: FunnelEntry
  pipeline: Pipeline
  pending: boolean
  onMove: (target: Stage) => void
  onClose: () => void
  /** Razas que cría el criadero, para el selector de raza de interés. */
  kennelBreeds?: string[]
}) {
  const t = useT()
  const current = pipeline.stages.find((s) => s.id === entry.stage_id)
  const location = [entry.applicant_city, entry.applicant_country].filter(Boolean).join(', ')
  const rawExtra = entry.applicant_extra_data && typeof entry.applicant_extra_data === 'object'
    ? (entry.applicant_extra_data as Record<string, unknown>)
    : {}
  // Ocultamos de "Respuestas del formulario" las claves internas (_notes) y la
  // raza (preference_breed): tienen su propio editor dedicado más abajo.
  const extra = Object.entries(rawExtra).filter(
    ([k, v]) => v != null && v !== '' && k !== 'preference_breed' && !k.startsWith('_'),
  )
  const notes: ReservationNote[] = Array.isArray(rawExtra._notes) ? (rawExtra._notes as ReservationNote[]) : []
  const pbVal = (rawExtra.preference_breed as { value?: unknown } | undefined)?.value
  const breeds = Array.isArray(pbVal) ? (pbVal as string[]) : (typeof pbVal === 'string' && pbVal ? [pbVal] : [])
  const formAnswers: { label: string; value: string }[] = [
    ...(entry.applicant_purpose ? [{ label: t('Propósito'), value: String(entry.applicant_purpose) }] : []),
    ...(entry.preference_sex
      ? [{ label: t('Preferencia de sexo'), value: entry.preference_sex === 'male' ? t('Macho') : t('Hembra') }]
      : []),
    ...extra.map(([k, v]) => {
      // Los campos extra se guardan como { label, value } (splitFormValues);
      // value puede ser string o array (checkbox multi, p.ej. "Razas de interés").
      const wrapped = v != null && typeof v === 'object' && 'value' in (v as Record<string, unknown>)
      const rawVal = wrapped ? (v as { value: unknown }).value : v
      const label = wrapped && (v as { label?: string }).label
        ? String((v as { label: string }).label)
        : k.replace(/_/g, ' ')
      const value = Array.isArray(rawVal) ? rawVal.join(', ') : String(rawVal)
      return { label, value }
    }),
  ]

  return (
    <Drawer
      title={entry.applicant_name || t('Sin nombre')}
      subtitle={current ? t(current.name) : undefined}
      onClose={onClose}
      footer={
        <Link
          href={`/reservas/${entry.id}`}
          className="inline-flex items-center justify-center gap-1.5 w-full rounded-lg bg-ink text-on-primary px-4 py-2.5 text-sm font-bold hover:opacity-90"
        >
          {t('Abrir ficha completa')} <ArrowUpRight className="w-4 h-4" />
        </Link>
      }
    >
      {/* Contacto */}
      <div className="space-y-2 text-sm">
        {entry.applicant_email && (
          <a href={`mailto:${entry.applicant_email}`} className="flex items-center gap-2 text-ink hover:underline">
            <Mail className="w-4 h-4 text-muted flex-shrink-0" /> <span className="min-w-0 truncate">{entry.applicant_email}</span>
          </a>
        )}
        {entry.applicant_phone && (
          <a href={`tel:${entry.applicant_phone}`} className="flex items-center gap-2 text-ink hover:underline">
            <Phone className="w-4 h-4 text-muted flex-shrink-0" /> <span className="min-w-0 truncate">{entry.applicant_phone}</span>
          </a>
        )}
        {location && (
          <div className="flex items-center gap-2 text-body">
            <MapPin className="w-4 h-4 text-muted flex-shrink-0" /> <span className="min-w-0 break-words">{location}</span>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-muted">
          <Clock className="w-4 h-4 flex-shrink-0" /> {new Date(entry.created_at).toLocaleString()}
          {entry.source && SOURCE_LABEL[entry.source] && (
            <span className="inline-flex items-center gap-1">
              · <Tag className="w-3 h-3" /> {t(SOURCE_LABEL[entry.source])}
            </span>
          )}
        </div>
      </div>

      {/* Mensaje completo */}
      {entry.applicant_message && (
        <div className="mt-4">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted mb-1.5">
            <MessageSquare className="w-3.5 h-3.5" /> {t('Mensaje')}
          </div>
          <div className="rounded-xl border border-hairline bg-surface-soft/40 p-3.5 text-sm text-ink whitespace-pre-wrap break-words">
            {entry.applicant_message}
          </div>
        </div>
      )}

      {/* Respuestas / opciones del formulario */}
      {formAnswers.length > 0 && (
        <div className="mt-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-1.5">
            {t('Respuestas del formulario')}
          </div>
          <dl className="rounded-xl border border-hairline divide-y divide-hairline text-sm overflow-hidden">
            {formAnswers.map((a, i) => (
              <div key={i} className="flex flex-col sm:flex-row gap-0.5 sm:gap-3 px-3 py-2">
                <dt className="text-muted capitalize sm:min-w-[120px] sm:flex-shrink-0 break-words">{a.label}</dt>
                <dd className="text-ink break-words min-w-0">{a.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <ReservationBreedPicker reservationId={entry.id} options={kennelBreeds} initial={breeds} />

      <ReservationPaymentsCard
        reservationId={entry.id}
        currency={entry.currency || 'EUR'}
        totalPriceCents={entry.total_price_cents}
      />

      <ReservationNotes reservationId={entry.id} initialNotes={notes} legacyNote={entry.internal_note} />

      <div className="mt-6 pt-4 border-t border-hairline flex items-center justify-between gap-3">
        <MarkUnseenButton entryId={entry.id} onDone={onClose} />
        <DeleteButton entryId={entry.id} onDeleted={onClose} />
      </div>

      {entry.lost_reason && (
        <div className="mt-4 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
          {t('Motivo')}: {t(entry.lost_reason)}
        </div>
      )}

      {/* Mover de paso */}
      <div className="mt-5">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-1.5">
          {t('Mover a otro paso')}
        </div>
        <div className="flex flex-wrap gap-2">
          {pipeline.stages
            .filter((s) => s.id !== entry.stage_id)
            .map((s) => (
              <button
                key={s.id}
                disabled={pending}
                onClick={() => onMove(s)}
                className={
                  'inline-flex items-center gap-1 rounded-full px-3 h-8 text-xs font-medium border transition-colors disabled:opacity-50 ' +
                  (s.type === 'won'
                    ? 'border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                    : s.type === 'lost'
                    ? 'border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100'
                    : 'border-hairline text-ink bg-canvas hover:bg-surface-soft')
                }
              >
                {s.type === 'won' ? '🏆 ' : s.type === 'lost' ? '✕ ' : ''}
                {t(s.name)}
              </button>
            ))}
        </div>
      </div>
    </Drawer>
  )
}

/** Botón para eliminar un lead (confirmación + acción del criador). */
function DeleteButton({ entryId, onDeleted }: { entryId: string; onDeleted: () => void }) {
  const t = useT()
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <button
      onClick={() => {
        if (!window.confirm(t('¿Eliminar este lead? No se puede deshacer.'))) return
        start(async () => {
          const r = await deleteEntry(entryId)
          if (!r.ok) {
            alert(r.error)
            return
          }
          onDeleted()
          router.refresh()
        })
      }}
      disabled={pending}
      className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 disabled:opacity-50"
    >
      <Trash2 className="w-3.5 h-3.5" /> {t('Eliminar lead')}
    </button>
  )
}

/** Devuelve el lead a "no leída" → vuelve a resaltarse como pendiente en el embudo. */
function MarkUnseenButton({ entryId, onDone }: { entryId: string; onDone: () => void }) {
  const t = useT()
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <button
      onClick={() => {
        start(async () => {
          const r = await markEntryUnseen(entryId)
          if (!r.ok) {
            alert(t('No se pudo marcar como no leída'))
            return
          }
          onDone()
          router.refresh()
        })
      }}
      disabled={pending}
      className="inline-flex items-center gap-1 text-xs text-body hover:text-ink disabled:opacity-50"
    >
      <EyeOff className="w-3.5 h-3.5" /> {t('Marcar como no leída')}
    </button>
  )
}
