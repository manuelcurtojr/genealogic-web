'use client'

/**
 * MeasurementsView — vista de SOLO LECTURA de la ficha morfométrica de un perro
 * (dog_measurements) para el perfil público. Se muestra en la pestaña «Medidas»
 * cuando el dueño las ha hecho públicas (o cuando el que mira es el dueño). Los
 * datos llegan ya cargados desde el servidor (service-role); aquí solo se pintan.
 *
 * Reutiliza NUMERIC_SECTIONS / QUALITATIVE_FIELDS de measurements-fields.ts para
 * no desincronizar etiquetas con el editor (MedidasTab).
 */
import { Ruler, Calendar, Lock } from 'lucide-react'
import { NUMERIC_SECTIONS, QUALITATIVE_FIELDS } from '@/lib/measurements-fields'
import { useT } from '@/components/i18n/locale-provider'

function fmtDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtNum(v: unknown): string {
  const n = Number(v)
  return Number.isFinite(n) ? String(Math.round(n * 100) / 100) : ''
}
function hasVal(v: unknown): boolean {
  return v !== null && v !== undefined && v !== ''
}

const ALL_FIELDS = [...NUMERIC_SECTIONS.flatMap((s) => s.fields), ...QUALITATIVE_FIELDS]

export default function MeasurementsView({
  measurements, isOwner = false, isPublic = false,
}: {
  measurements: any[]
  isOwner?: boolean
  isPublic?: boolean
}) {
  const t = useT()
  if (!measurements || measurements.length === 0) return null
  const countFilled = (s: any) => ALL_FIELDS.reduce((acc, f) => acc + (hasVal(s[f.col]) ? 1 : 0), 0)

  return (
    <div className="space-y-4">
      {/* Aviso al dueño cuando aún están privadas */}
      {isOwner && !isPublic && (
        <div className="flex items-start gap-2.5 rounded-xl border border-hairline bg-surface-soft/50 px-3.5 py-2.5">
          <Lock className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted" />
          <p className="text-[12.5px] leading-snug text-body">
            {t('Estas medidas son privadas: solo tú las ves aquí. Puedes hacerlas públicas en Editar › Medidas.')}
          </p>
        </div>
      )}

      {measurements.map((s) => {
        const notes = hasVal(s.notes) ? String(s.notes) : null
        const quals = QUALITATIVE_FIELDS.filter((f) => hasVal(s[f.col]))
        return (
          <div key={s.id} className="rounded-2xl border border-hairline bg-canvas p-4">
            {/* Cabecera de la tanda */}
            <div className="flex flex-wrap items-center gap-2 border-b border-hairline pb-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--brand-soft)' }}>
                <Ruler className="h-4 w-4" style={{ color: 'var(--brand)' }} />
              </span>
              <p className="inline-flex items-center gap-1 text-[14px] font-semibold text-ink">
                <Calendar className="h-3.5 w-3.5 text-muted" /> {fmtDate(s.measured_at)}
              </p>
              {s.age_months != null && (
                <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: 'var(--brand-soft)', color: 'var(--brand)' }}>
                  {s.age_months} {t('meses')}
                </span>
              )}
              <span className="rounded-full bg-surface-card px-1.5 py-0.5 text-[10px] font-medium text-muted tabular-nums">
                {countFilled(s)} {t('medidas')}
              </span>
            </div>

            <div className="mt-3 space-y-3">
              {/* Numéricas por sección */}
              {NUMERIC_SECTIONS.map((sec) => {
                const fields = sec.fields.filter((f) => hasVal(s[f.col]))
                if (fields.length === 0) return null
                return (
                  <div key={sec.title}>
                    <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted">{t(sec.title)}</p>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
                      {fields.map((f) => (
                        <div key={f.col} className="flex items-baseline justify-between gap-2 border-b border-hairline/60 pb-1">
                          <dt className="truncate text-[12px] text-muted">{t(f.label)}</dt>
                          <dd className="flex-shrink-0 text-[12.5px] font-semibold text-ink tabular-nums">{fmtNum(s[f.col])}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )
              })}

              {/* Cualitativas (morfología + salud) */}
              {quals.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted">{t('Morfología y salud')}</p>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
                    {quals.map((f) => (
                      <div key={f.col} className="flex items-baseline justify-between gap-2 border-b border-hairline/60 pb-1">
                        <dt className="truncate text-[12px] text-muted">{t(f.label)}</dt>
                        <dd className="flex-shrink-0 text-[12.5px] font-semibold text-ink">{String(s[f.col])}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {notes && (
                <div>
                  <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-wider text-muted">{t('Notas')}</p>
                  <p className="whitespace-pre-wrap text-[12.5px] leading-snug text-body">{notes}</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
