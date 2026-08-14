'use client'

/**
 * Vista de resultado de la evaluación IA vs estándar. Compartida por la
 * evaluación de CRUCE (CrossStandardEval) y la de PERRO (DogStandardEval):
 * ambos endpoints devuelven la misma forma, así que la presentación es común.
 */

import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  AlertOctagon,
  Plus,
  Minus,
} from 'lucide-react'
import { useT } from '@/components/i18n/locale-provider'

export interface EvalSection {
  titulo: string
  relevancia: 'esencial' | 'secundario' | 'menor'
  estado: 'bien' | 'atencion' | 'desvia' | 'sin_datos'
  comentario: string
}
export interface EvalResult {
  breedName?: string
  score?: number
  calificacion?: string
  resumen?: string
  gate?: { motivo: string } | null
  secciones?: EvalSection[]
  fortalezas?: string[]
  mejoras?: string[]
  raw?: string
}

// Bandas de color ancladas a las calificaciones cinológicas (ver prompt backend).
function scoreMeta(s: number): { pill: string; ring: string } {
  if (s >= 7) return { pill: 'bg-emerald-500/12 text-emerald-600', ring: 'border-emerald-500/40 text-emerald-600' }
  if (s >= 5) return { pill: 'bg-sky-500/12 text-sky-600', ring: 'border-sky-500/40 text-sky-600' }
  if (s >= 3.5) return { pill: 'bg-amber-500/12 text-amber-600', ring: 'border-amber-500/40 text-amber-600' }
  return { pill: 'bg-red-500/12 text-red-600', ring: 'border-red-500/40 text-red-600' }
}

/** Palabra de calificación (fallback si el modelo no devuelve `calificacion`). */
export function gradeFor(s: number): string {
  if (s >= 9) return 'Excelente'
  if (s >= 7) return 'Muy Bueno'
  if (s >= 5) return 'Bueno'
  if (s >= 3.5) return 'Suficiente'
  return 'Insuficiente'
}

const ESTADO_META: Record<
  EvalSection['estado'],
  { Icon: typeof CheckCircle2; cls: string; label: string }
> = {
  bien: { Icon: CheckCircle2, cls: 'text-emerald-600', label: 'Bien' },
  atencion: { Icon: AlertTriangle, cls: 'text-amber-600', label: 'Atención' },
  desvia: { Icon: XCircle, cls: 'text-red-600', label: 'Se desvía' },
  sin_datos: { Icon: HelpCircle, cls: 'text-muted', label: 'Sin datos' },
}

const RELEVANCIA_META: Record<EvalSection['relevancia'], { cls: string; label: string }> = {
  esencial: { cls: 'bg-[color:var(--brand)]/12 text-[color:var(--brand)]', label: 'Esencial' },
  secundario: { cls: 'bg-surface-card text-muted', label: 'Secundario' },
  menor: { cls: 'bg-surface-card text-muted/60', label: 'Menor' },
}

export default function StandardEvalResult({ result }: { result: EvalResult }) {
  const t = useT()
  const hasScore = typeof result.score === 'number'

  return (
    <div className="space-y-4">
      {/* Factor limitante (gate): topa la nota pase lo que pase el resto */}
      {result.gate && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/[0.06] px-4 py-3">
          <AlertOctagon className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <p className="text-[12.5px] leading-relaxed text-body">
            <span className="font-semibold text-red-600">{t('Factor limitante:')}</span>{' '}
            {result.gate.motivo}{' '}
            <span className="text-muted">{t('— la nota está topada por esto.')}</span>
          </p>
        </div>
      )}

      {/* Nota + resumen */}
      {hasScore && (
        <div className="rounded-xl border border-hairline bg-canvas p-5">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl border-2 ${scoreMeta(result.score!).ring}`}
            >
              <span className="text-[28px] font-bold leading-none tabular-nums">
                {result.score!.toFixed(1)}
              </span>
              <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wider opacity-70">
                / 10
              </span>
            </div>
            <div className="min-w-0">
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${scoreMeta(result.score!).pill}`}
              >
                {result.calificacion || gradeFor(result.score!)}
              </span>
              {result.breedName && (
                <p className="mt-1.5 text-[11.5px] text-muted">
                  {t('vs estándar de')}{' '}
                  <span className="font-medium text-ink">{result.breedName}</span>
                </p>
              )}
              {result.resumen && (
                <p className="mt-1 text-[13.5px] leading-relaxed text-body">{result.resumen}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Análisis por secciones */}
      {result.secciones && result.secciones.length > 0 && (
        <div className="rounded-xl border border-hairline bg-canvas p-4">
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
            {t('Análisis por secciones')}
          </h4>
          <div>
            {result.secciones.map((sec, i) => {
              const meta = ESTADO_META[sec.estado]
              const Icon = meta.Icon
              return (
                <div
                  key={`${sec.titulo}-${i}`}
                  className="flex gap-2.5 border-b border-hairline py-2.5 last:border-b-0"
                >
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${meta.cls}`} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="text-[13px] font-medium text-ink">{sec.titulo}</p>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide ${RELEVANCIA_META[sec.relevancia].cls}`}
                      >
                        {t(RELEVANCIA_META[sec.relevancia].label)}
                      </span>
                    </div>
                    {sec.comentario && (
                      <p className="mt-0.5 text-[12.5px] leading-relaxed text-body">
                        {sec.comentario}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Fortalezas + mejoras */}
      {((result.fortalezas && result.fortalezas.length > 0) ||
        (result.mejoras && result.mejoras.length > 0)) && (
        <div className="grid gap-3 md:grid-cols-2">
          {result.fortalezas && result.fortalezas.length > 0 && (
            <div className="rounded-xl border border-hairline bg-canvas p-4">
              <h4 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
                <Plus className="h-3.5 w-3.5" />
                {t('Fortalezas')}
              </h4>
              <ul className="space-y-1.5">
                {result.fortalezas.map((f, i) => (
                  <li key={i} className="flex gap-2 text-[12.5px] leading-relaxed text-body">
                    <span className="text-emerald-600">•</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.mejoras && result.mejoras.length > 0 && (
            <div className="rounded-xl border border-hairline bg-canvas p-4">
              <h4 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-600">
                <Minus className="h-3.5 w-3.5" />
                {t('A vigilar')}
              </h4>
              <ul className="space-y-1.5">
                {result.mejoras.map((m, i) => (
                  <li key={i} className="flex gap-2 text-[12.5px] leading-relaxed text-body">
                    <span className="text-amber-600">•</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Fallback: respuesta sin estructurar */}
      {!hasScore && result.raw && (
        <div className="rounded-xl border border-hairline bg-canvas p-4">
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-body">{result.raw}</p>
        </div>
      )}
    </div>
  )
}
