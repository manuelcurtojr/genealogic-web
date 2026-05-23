'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Plus, Heart, Calendar, Baby, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface Props {
  dogId: string
  userId: string
}

interface HeatCycle {
  id: string
  start_date: string
  end_date: string | null
  was_mated: boolean
  resulted_in_litter_id: string | null
  notes: string | null
}

interface Litter {
  id: string
  status: string
  mating_date: string | null
  birth_date: string | null
  puppy_count: number | null
}

const HEAT_DURATION_DAYS = 21
const DEFAULT_CYCLE_INTERVAL_DAYS = 180
const GESTATION_DAYS = 63

function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0)
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

function addDays(d: Date, days: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + days)
  return r
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

/**
 * Tab "Reproducción" del edit panel de perro — solo aplica a hembras.
 * Muestra ciclos de celo, predicciones futuras, y camadas resultantes.
 * Permite añadir un nuevo celo desde aquí sin ir a /reproduccion.
 */
export default function ReproduccionTab({ dogId, userId }: Props) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cycles, setCycles] = useState<HeatCycle[]>([])
  const [litters, setLitters] = useState<Litter[]>([])
  const [showForm, setShowForm] = useState(false)

  // Estado del form
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState('')
  const [wasMated, setWasMated] = useState(false)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    try {
      const [cyclesRes, littersRes] = await Promise.all([
        supabase
          .from('heat_cycles')
          .select('id, start_date, end_date, was_mated, resulted_in_litter_id, notes')
          .eq('dog_id', dogId)
          .order('start_date', { ascending: false }),
        supabase
          .from('litters')
          .select('id, status, mating_date, birth_date, puppy_count')
          .eq('mother_id', dogId)
          .order('mating_date', { ascending: false }),
      ])
      setCycles(cyclesRes.data || [])
      setLitters(littersRes.data || [])
    } catch (err: any) {
      setError(err.message || 'Error cargando datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dogId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const supabase = createClient()
    const { error: insertErr } = await supabase.from('heat_cycles').insert({
      owner_id: userId,
      dog_id: dogId,
      start_date: startDate,
      end_date: endDate || null,
      was_mated: wasMated,
      notes: notes.trim() || null,
    })
    setSaving(false)
    if (insertErr) {
      setError(insertErr.message)
      return
    }
    // Reset + reload
    setShowForm(false)
    setStartDate(new Date().toISOString().split('T')[0])
    setEndDate('')
    setWasMated(false)
    setNotes('')
    load()
  }

  // Cálculo de próximo celo previsto
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const cyclesAsc = [...cycles].sort(
    (a, b) => parseDate(a.start_date).getTime() - parseDate(b.start_date).getTime()
  )
  let avgInterval = DEFAULT_CYCLE_INTERVAL_DAYS
  if (cyclesAsc.length >= 2) {
    const intervals: number[] = []
    for (let i = 1; i < cyclesAsc.length; i++) {
      intervals.push(daysBetween(parseDate(cyclesAsc[i - 1].start_date), parseDate(cyclesAsc[i].start_date)))
    }
    avgInterval = Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length)
  }
  const lastCycle = cyclesAsc[cyclesAsc.length - 1]
  let nextHeatDate: Date | null = null
  if (lastCycle) {
    const projected = addDays(parseDate(lastCycle.start_date), avgInterval)
    if (projected > today) nextHeatDate = projected
  }

  // Detectar estado actual
  const activeHeat = cyclesAsc.find((c) => {
    const start = parseDate(c.start_date)
    const end = c.end_date ? parseDate(c.end_date) : addDays(start, HEAT_DURATION_DAYS)
    return today >= start && today <= end
  })
  const activePregnancy = litters.find((l) => {
    if (l.status !== 'mated' || !l.mating_date) return false
    const mating = parseDate(l.mating_date)
    const expected = addDays(mating, GESTATION_DAYS)
    return today >= mating && today <= expected
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Estado actual + próximo celo */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-hairline bg-canvas p-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted">Estado actual</p>
          {activeHeat ? (
            <p className="mt-2 flex items-center gap-2 text-[14px] font-semibold text-blue-600">
              <Heart className="h-4 w-4" /> En celo
            </p>
          ) : activePregnancy ? (
            <p className="mt-2 flex items-center gap-2 text-[14px] font-semibold text-pink-600">
              <Baby className="h-4 w-4" /> Gestante
            </p>
          ) : (
            <p className="mt-2 text-[14px] font-semibold text-muted">En reposo</p>
          )}
        </div>
        <div className="rounded-xl border border-hairline bg-canvas p-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted">Próximo celo previsto</p>
          {nextHeatDate ? (
            <p className="mt-2 flex items-center gap-2 text-[14px] font-semibold text-ink">
              <Calendar className="h-4 w-4 text-muted" /> {fmtDate(nextHeatDate)}
              <span className="text-[11.5px] font-normal text-muted">({avgInterval}d)</span>
            </p>
          ) : (
            <p className="mt-2 text-[13px] text-muted">
              Registra al menos 2 celos para calcular predicción.
            </p>
          )}
        </div>
      </div>

      {/* Header + Add */}
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-ink">Historial de celos</h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-[12.5px] font-medium text-on-primary transition-colors hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" /> Registrar celo
          </button>
        )}
      </div>

      {/* Form inline */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-hairline bg-surface-soft p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11.5px] font-medium uppercase tracking-[0.06em] text-muted">
                Inicio del celo *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-hairline bg-canvas px-3 py-1.5 text-[13.5px] text-ink focus:border-ink focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-[11.5px] font-medium uppercase tracking-[0.06em] text-muted">
                Fin (opcional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-hairline bg-canvas px-3 py-1.5 text-[13.5px] text-ink focus:border-ink focus:outline-none"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-[13px] text-ink">
            <input
              type="checkbox"
              checked={wasMated}
              onChange={(e) => setWasMated(e.target.checked)}
              className="h-4 w-4 rounded border-hairline"
            />
            Hubo cruce durante este celo
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Notas: semental, progesterona, observaciones..."
            className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-[13.5px] text-ink focus:border-ink focus:outline-none"
          />
          {error && (
            <div className="rounded-lg bg-[color:var(--error)]/10 px-3 py-2 text-[12.5px] text-[color:var(--error)]">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-hairline bg-canvas px-3 py-1.5 text-[12.5px] font-medium text-body hover:bg-surface-card"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-1.5 text-[12.5px] font-medium text-on-primary transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Guardar
            </button>
          </div>
        </form>
      )}

      {/* Lista de celos */}
      {cycles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-hairline bg-surface-soft px-6 py-10 text-center">
          <Heart className="mx-auto h-7 w-7 text-muted" />
          <p className="mt-2 text-[13px] text-body">Aún no hay celos registrados.</p>
          <p className="mt-1 text-[11.5px] text-muted">
            Empieza registrando el más reciente para activar la predicción.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-hairline-soft overflow-hidden rounded-xl border border-hairline bg-canvas">
          {cycles.map((c) => {
            const start = parseDate(c.start_date)
            const end = c.end_date ? parseDate(c.end_date) : addDays(start, HEAT_DURATION_DAYS)
            return (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                  <Heart className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-medium text-ink">
                    {fmtDate(start)} → {fmtDate(end)}
                    {!c.end_date && <span className="ml-1 text-[11px] text-muted">(estimado)</span>}
                  </p>
                  {(c.was_mated || c.notes) && (
                    <p className="text-[12px] text-muted truncate">
                      {c.was_mated && <span className="font-medium text-pink-600">Cruzada</span>}
                      {c.was_mated && c.notes && ' · '}
                      {c.notes}
                    </p>
                  )}
                </div>
                {c.resulted_in_litter_id && (
                  <Link
                    href={`/litters/${c.resulted_in_litter_id}`}
                    className="text-[12px] font-medium text-body hover:text-ink"
                  >
                    Ver camada →
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {/* Camadas resultantes (resumen) */}
      {litters.length > 0 && (
        <div className="rounded-xl border border-hairline bg-canvas p-4">
          <h4 className="mb-2 text-[13px] font-semibold text-ink">Camadas como madre</h4>
          <ul className="divide-y divide-hairline-soft">
            {litters.slice(0, 5).map((l) => (
              <li key={l.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2.5">
                  <Baby className="h-3.5 w-3.5 text-muted" />
                  <span className="text-[13px] text-ink">
                    {l.status === 'born' && l.birth_date
                      ? `Nacida ${fmtDate(parseDate(l.birth_date))}`
                      : l.status === 'mated' && l.mating_date
                        ? `Gestación desde ${fmtDate(parseDate(l.mating_date))}`
                        : 'Planificada'}
                  </span>
                  {l.puppy_count != null && (
                    <span className="text-[11.5px] text-muted">· {l.puppy_count} cachorros</span>
                  )}
                </div>
                <Link href={`/litters/${l.id}`} className="text-[12px] font-medium text-body hover:text-ink">
                  Ver →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Link al planificador global */}
      <p className="text-[11.5px] text-muted">
        💡 Para ver todas tus hembras en un calendario único, ve a{' '}
        <Link href="/reproduccion" className="text-ink underline">
          Calendario reproductivo
        </Link>
        .
      </p>
    </div>
  )
}
