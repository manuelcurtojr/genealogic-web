'use client'

/**
 * MeasurementsForecast — morfología proyectada de la camada (mid-parent).
 *
 * Dado un macho (sireId) y una hembra (damId), carga la última tanda de medidas
 * morfológicas de CADA progenitor por separado (dog_measurements) y muestra, por
 * cada medida numérica en la que AMBOS tienen dato, la MEDIA proyectada:
 *
 *     media = (padre + madre) / 2
 *
 * Las medidas cualitativas (boca, mordida, caderas, etc.) no se promedian: se
 * comparan lado a lado. Clona la estructura y el lenguaje visual de
 * genetics-forecast.tsx (mismo helper de Supabase cliente, estado `loading`,
 * tarjetas de resultado y tokens on-brand).
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Ruler, Loader2, Mars, Venus } from 'lucide-react'
import { useT } from '@/components/i18n/locale-provider'
import { BRAND } from '@/lib/constants'
import { NUMERIC_SECTIONS, QUALITATIVE_FIELDS } from '@/lib/measurements-fields'
import { sexStandardFor, projectBySex } from '@/lib/breed-sex-standards'

interface Props {
  sireId: string
  damId: string
}

// Cada fila de dog_measurements trae ~40 columnas; acceso dinámico por nombre.
type MeasureBatch = Record<string, any>

interface ParentMeasure {
  name: string | null
  breedId: string | null
  batch: MeasureBatch | null
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

function qual(v: unknown): string | null {
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  return s === '' ? null : s
}

export default function MeasurementsForecast({ sireId, damId }: Props) {
  const t = useT()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sire, setSire] = useState<ParentMeasure | null>(null)
  const [dam, setDam] = useState<ParentMeasure | null>(null)

  useEffect(() => {
    if (!sireId || !damId) return

    async function load() {
      setLoading(true)
      setError(null)
      const supabase = createClient()

      try {
        const loadParent = async (dogId: string): Promise<ParentMeasure> => {
          const [measRes, dogRes] = await Promise.all([
            supabase
              .from('dog_measurements')
              .select('*')
              .eq('dog_id', dogId)
              .order('measured_at', { ascending: false })
              .limit(1),
            supabase.from('dogs').select('name, breed_id').eq('id', dogId).maybeSingle(),
          ])

          const batch: MeasureBatch | null =
            measRes.data && measRes.data.length > 0 ? measRes.data[0] : null
          return {
            name: dogRes.data?.name ?? null,
            breedId: dogRes.data?.breed_id ?? null,
            batch,
          }
        }

        const [sireData, damData] = await Promise.all([loadParent(sireId), loadParent(damId)])
        setSire(sireData)
        setDam(damData)
      } catch (err: any) {
        setError(err?.message || t('Error cargando las medidas'))
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [sireId, damId])

  if (loading) {
    return (
      <div className="rounded-xl border border-hairline bg-canvas px-5 py-8 text-center">
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted" />
        <p className="mt-2 text-[12.5px] text-muted">{t('Calculando morfología proyectada...')}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl bg-[color:var(--error)]/10 px-5 py-4 text-[13px] text-[color:var(--error)]">
        {t('Error:')} {error}
      </div>
    )
  }

  if (!sire || !dam) return null

  const sireName = sire.name || t('el padre')
  const damName = dam.name || t('la madre')
  const bothMeasured = !!sire.batch && !!dam.batch

  // Referencias por sexo de la raza (para proyectar talla/peso por sexo). Si la
  // raza no está en el catálogo, sexRef = null → todo se muestra como media.
  const sexRef = sexStandardFor(sire.breedId)

  // Numéricas: por sección, solo filas donde al menos un progenitor tiene dato.
  const sections = bothMeasured
    ? NUMERIC_SECTIONS.map((section) => ({
        title: section.title,
        rows: section.fields
          .map((f) => ({
            col: f.col,
            label: f.label,
            s: num(sire.batch![f.col]),
            d: num(dam.batch![f.col]),
          }))
          .filter((r) => r.s !== null || r.d !== null),
      })).filter((section) => section.rows.length > 0)
    : []

  // Cualitativas: solo las que al menos un progenitor tiene informadas.
  const qualRows = bothMeasured
    ? QUALITATIVE_FIELDS.map((f) => ({
        label: f.label,
        s: qual(sire.batch![f.col]),
        d: qual(dam.batch![f.col]),
      })).filter((r) => r.s !== null || r.d !== null)
    : []

  const nothingToShow = bothMeasured && sections.length === 0 && qualRows.length === 0

  return (
    <div className="space-y-3">
      {/* Cabecera del bloque */}
      <div>
        <h3 className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.01em] text-ink">
          <Ruler className="h-4 w-4 text-[color:var(--brand)]" />
          {t('Morfología proyectada de la camada')}
        </h3>
        <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
          {sexRef
            ? t('Estimación a partir de la última tanda de cada progenitor. En talla y peso se proyecta por sexo (♂ y ♀ por separado, por el dimorfismo sexual); el resto es la media de los padres. Orientativo, no una garantía.')
            : t('Media de las medidas de ambos progenitores (mid-parent), a partir de la última tanda registrada de cada uno. Es una estimación orientativa, no una garantía.')}
        </p>
      </div>

      {/* Progenitores sin medir — no se calcula con ellos */}
      {!sire.batch && <MissingNotice name={sireName} sex="male" />}
      {!dam.batch && <MissingNotice name={damName} sex="female" />}

      {bothMeasured && (
        <>
          {/* Leyenda de progenitores */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-xl border border-hairline bg-canvas px-4 py-2.5 text-[12.5px]">
            <span className="inline-flex items-center gap-1.5">
              <Mars className="h-3.5 w-3.5" style={{ color: BRAND.male }} />
              <span className="text-muted">{t('Padre')}:</span>
              <span className="font-medium text-ink">{sireName}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Venus className="h-3.5 w-3.5" style={{ color: BRAND.female }} />
              <span className="text-muted">{t('Madre')}:</span>
              <span className="font-medium text-ink">{damName}</span>
            </span>
          </div>

          {/* Medidas numéricas por sección */}
          {sections.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2">
              {sections.map((section) => (
                <div key={section.title} className="rounded-xl border border-hairline bg-canvas p-4">
                  <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
                    {t(section.title)}
                  </h4>
                  <div>
                    {section.rows.map((r) => {
                      const both = r.s !== null && r.d !== null
                      const ref = sexRef?.[r.col]
                      const proj =
                        both && ref ? projectBySex(r.s as number, r.d as number, ref) : null
                      return (
                        <div
                          key={r.label}
                          className="flex flex-col gap-1 border-b border-hairline py-2 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3"
                        >
                          <span className="text-[13px] text-body">{t(r.label)}</span>
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 tabular-nums">
                            <span className="text-[12px] text-muted">
                              {t('Padre')}{' '}
                              <span className="font-medium text-ink">{r.s !== null ? fmt(r.s) : '—'}</span>
                            </span>
                            <span className="text-[12px] text-muted">
                              {t('Madre')}{' '}
                              <span className="font-medium text-ink">{r.d !== null ? fmt(r.d) : '—'}</span>
                            </span>
                            {proj ? (
                              <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted">
                                <span className="inline-flex items-center gap-1" title={t('Macho proyectado')}>
                                  <Mars className="h-3 w-3" style={{ color: BRAND.male }} />
                                  <span className="rounded-md bg-[color:var(--brand)]/10 px-1.5 py-0.5 text-[12.5px] font-semibold text-[color:var(--brand)]">
                                    {fmt(proj.male)}
                                  </span>
                                </span>
                                <span className="inline-flex items-center gap-1" title={t('Hembra proyectada')}>
                                  <Venus className="h-3 w-3" style={{ color: BRAND.female }} />
                                  <span className="rounded-md bg-[color:var(--brand)]/10 px-1.5 py-0.5 text-[12.5px] font-semibold text-[color:var(--brand)]">
                                    {fmt(proj.female)}
                                  </span>
                                </span>
                              </span>
                            ) : both ? (
                              <span className="inline-flex items-center gap-1 text-[12px] text-muted">
                                {t('Media')}
                                <span
                                  className="rounded-md bg-[color:var(--brand)]/10 px-2 py-0.5 text-[12.5px] font-semibold text-[color:var(--brand)]"
                                  title={t('Media proyectada')}
                                >
                                  {fmt(((r.s as number) + (r.d as number)) / 2)}
                                </span>
                              </span>
                            ) : (
                              <span className="text-[11px] italic text-muted">
                                {t('falta medir en el otro')}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Medidas cualitativas — comparación lado a lado */}
          {qualRows.length > 0 && (
            <div className="rounded-xl border border-hairline bg-canvas p-4">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                {t('Rasgos cualitativos')}
              </h4>
              <p className="mb-1.5 mt-0.5 text-[11.5px] text-muted">
                {t('No se promedian — se comparan lado a lado.')}
              </p>
              <div>
                {qualRows.map((r) => (
                  <div
                    key={r.label}
                    className="flex flex-col gap-1 border-b border-hairline py-2 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3"
                  >
                    <span className="text-[13px] text-body">{t(r.label)}</span>
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-[12px]">
                      <span className="text-muted">
                        {t('Padre')}: <span className="font-medium text-ink">{r.s ?? '—'}</span>
                      </span>
                      <span className="text-muted">
                        {t('Madre')}: <span className="font-medium text-ink">{r.d ?? '—'}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {nothingToShow && (
            <div className="rounded-xl border border-dashed border-hairline bg-surface-soft px-5 py-6 text-center text-[13px] text-muted">
              {t('Las tandas registradas todavía no tienen valores para proyectar.')}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function MissingNotice({ name, sex }: { name: string; sex: 'male' | 'female' }) {
  const t = useT()
  const Icon = sex === 'male' ? Mars : Venus
  return (
    <div className="rounded-xl border border-dashed border-hairline bg-surface-soft px-4 py-3.5">
      <div className="flex items-start gap-2.5">
        <Icon
          className="mt-0.5 h-4 w-4 flex-shrink-0"
          style={{ color: sex === 'male' ? BRAND.male : BRAND.female }}
        />
        <p className="text-[12.5px] leading-relaxed text-body">
          {t('Aún no has medido a')} <span className="font-semibold text-ink">{name}</span>{' '}
          {t('— añade sus medidas en su ficha › pestaña Medidas.')}
        </p>
      </div>
    </div>
  )
}
