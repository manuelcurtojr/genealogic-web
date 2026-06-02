'use client'

/** Panel lateral con el detalle completo de un lead/ficha del embudo. */
import Link from 'next/link'
import { Mail, Phone, MapPin, Clock, ArrowUpRight, MessageSquare, Tag } from 'lucide-react'
import { useT } from '@/components/i18n/locale-provider'
import Drawer from './drawer'
import type { FunnelEntry, Pipeline, Stage } from '@/lib/pipelines/types'

const SOURCE_LABEL: Record<string, string> = {
  public_form: 'Formulario web',
  manual: 'Alta manual',
  emailbot: 'Emailbot',
  api: 'API',
}

export default function LeadPanel({
  entry,
  pipeline,
  pending,
  onMove,
  onClose,
}: {
  entry: FunnelEntry
  pipeline: Pipeline
  pending: boolean
  onMove: (target: Stage) => void
  onClose: () => void
}) {
  const t = useT()
  const current = pipeline.stages.find((s) => s.id === entry.stage_id)
  const location = [entry.applicant_city, entry.applicant_country].filter(Boolean).join(', ')
  const extra = entry.applicant_extra_data && typeof entry.applicant_extra_data === 'object'
    ? Object.entries(entry.applicant_extra_data).filter(([, v]) => v != null && v !== '')
    : []

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
            <Mail className="w-4 h-4 text-muted flex-shrink-0" /> {entry.applicant_email}
          </a>
        )}
        {entry.applicant_phone && (
          <a href={`tel:${entry.applicant_phone}`} className="flex items-center gap-2 text-ink hover:underline">
            <Phone className="w-4 h-4 text-muted flex-shrink-0" /> {entry.applicant_phone}
          </a>
        )}
        {location && (
          <div className="flex items-center gap-2 text-body">
            <MapPin className="w-4 h-4 text-muted flex-shrink-0" /> {location}
          </div>
        )}
        <div className="flex items-center gap-2 text-muted">
          <Clock className="w-4 h-4 flex-shrink-0" /> {new Date(entry.created_at).toLocaleString()}
          {entry.source && SOURCE_LABEL[entry.source] && (
            <span className="ml-1 inline-flex items-center gap-1">
              · <Tag className="w-3 h-3" /> {t(SOURCE_LABEL[entry.source])}
            </span>
          )}
        </div>
        {entry.preference_sex && (
          <div className="text-muted text-xs">
            {t('Preferencia')}: {entry.preference_sex === 'male' ? t('Macho') : t('Hembra')}
          </div>
        )}
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

      {/* Datos extra del formulario */}
      {extra.length > 0 && (
        <div className="mt-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-1.5">
            {t('Otros datos')}
          </div>
          <dl className="rounded-xl border border-hairline divide-y divide-hairline text-sm">
            {extra.map(([k, v]) => (
              <div key={k} className="flex gap-3 px-3 py-2">
                <dt className="text-muted capitalize min-w-[120px]">{k.replace(/_/g, ' ')}</dt>
                <dd className="text-ink break-words">{String(v)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

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
