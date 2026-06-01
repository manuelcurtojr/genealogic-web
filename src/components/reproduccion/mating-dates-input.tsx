'use client'

import { Plus, X, CalendarHeart } from 'lucide-react'
import { useT } from '@/components/i18n/locale-provider'

const ORDINAL_LABELS = [
  'Primera monta', 'Segunda monta', 'Tercera monta', 'Cuarta monta', 'Quinta monta',
  'Sexta monta', 'Séptima monta', 'Octava monta', 'Novena monta', 'Décima monta',
]
function ordinalLabel(i: number, t: (k: string) => string): string {
  return ORDINAL_LABELS[i] ? t(ORDINAL_LABELS[i]) : `${t('Monta')} ${i + 1}`
}

/** Filtra vacíos, ordena y deduplica una lista de fechas de monta. */
export function cleanMatingDates(dates: string[]): string[] {
  return Array.from(new Set(dates.filter(Boolean))).sort()
}

/**
 * Lista dinámica de días de monta. "Primera monta" + botón ＋ para añadir la
 * siguiente ("Segunda monta", "Tercera monta"...), y ✕ para quitar. El rango
 * de parto (primera → última) lo calcula el contenedor a partir de esta lista.
 */
export default function MatingDatesInput({
  value,
  onChange,
}: {
  value: string[]
  onChange: (dates: string[]) => void
}) {
  const t = useT()
  const rows = value.length ? value : ['']

  const setAt = (i: number, v: string) => {
    const next = [...rows]
    next[i] = v
    onChange(next)
  }
  const add = () => onChange([...rows, ''])
  const removeAt = (i: number) => {
    const next = rows.filter((_, j) => j !== i)
    onChange(next.length ? next : [''])
  }

  return (
    <div className="space-y-2">
      {rows.map((d, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/40 px-3 py-2">
            <CalendarHeart className="h-4 w-4 flex-shrink-0 text-rose-400" />
            <span className="w-[92px] flex-shrink-0 text-[11.5px] font-medium text-rose-900">
              {ordinalLabel(i, t)}
            </span>
            <input
              type="date"
              value={d}
              onChange={(e) => setAt(i, e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-[13.5px] text-ink focus:outline-none"
            />
            {rows.length > 1 && (
              <button
                type="button"
                onClick={() => removeAt(i)}
                title={t('Quitar esta monta')}
                className="flex-shrink-0 rounded-md p-1 text-rose-400 transition hover:bg-rose-100 hover:text-rose-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {/* ＋ junto a la última fila para añadir la siguiente monta */}
          {i === rows.length - 1 && (
            <button
              type="button"
              onClick={add}
              title={t('Añadir otra monta')}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-dashed border-rose-300 text-rose-500 transition hover:border-rose-500 hover:bg-rose-50"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
      <p className="text-[11px] text-muted">
        {t('Apunta cada día de cubrición. Calcularemos el parto como una ventana desde la primera a la última monta (~63 días).')}
      </p>
    </div>
  )
}
