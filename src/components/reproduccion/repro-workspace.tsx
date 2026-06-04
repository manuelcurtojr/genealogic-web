'use client'

import { useMemo, useState } from 'react'
import { Img } from '@/components/ui/img'
import { Search, Plus, Heart, Baby, ArrowLeft, Dna, CalendarRange, X } from 'lucide-react'
import { useT } from '@/components/i18n/locale-provider'
import ReproduccionTab from '@/components/dogs/edit-tabs/reproduccion-tab'
import AnnualReproCalendar from './annual-repro-calendar'
import HeatCycleForm from './heat-cycle-form'
import { computeReproInfo, fmtDate, daysBetween, todayLocal, type HeatCycleLike, type LitterLike, type ReproState } from '@/lib/repro/cycle'

interface Female { id: string; name: string; slug: string | null; thumbnail_url: string | null; birth_date: string | null }

interface Props {
  females: Female[]
  cycles: HeatCycleLike[]
  litters: LitterLike[]
  userId: string
}

type View = 'ciclo' | 'anual'
type StateFilter = 'all' | ReproState

const STATE_DOT: Record<ReproState, string> = {
  in_heat: 'bg-blue-500',
  mated_pending: 'bg-amber-500',
  pregnant: 'bg-pink-500',
  idle: 'bg-slate-300',
}
const STATE_TEXT: Record<ReproState, string> = {
  in_heat: 'text-blue-600',
  mated_pending: 'text-amber-600',
  pregnant: 'text-pink-600',
  idle: 'text-muted',
}

export default function ReproWorkspace({ females, cycles, litters, userId }: Props) {
  const t = useT()
  const today = todayLocal()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [view, setView] = useState<View>('ciclo')
  const [search, setSearch] = useState('')
  const [stateFilter, setStateFilter] = useState<StateFilter>('all')
  const [formOpen, setFormOpen] = useState(false)

  // Estado reproductivo por hembra (para los puntos de la lista)
  const infoById = useMemo(() => {
    const m = new Map<string, ReturnType<typeof computeReproInfo>>()
    for (const f of females) m.set(f.id, computeReproInfo(f.id, cycles, litters, today))
    return m
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [females, cycles, litters])

  const counts = useMemo(() => {
    const c = { in_heat: 0, mated_pending: 0, pregnant: 0, idle: 0 }
    for (const f of females) c[infoById.get(f.id)!.state]++
    return c
  }, [females, infoById])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return females.filter((f) => {
      if (q && !f.name.toLowerCase().includes(q)) return false
      if (stateFilter !== 'all' && infoById.get(f.id)!.state !== stateFilter) return false
      return true
    })
  }, [females, search, stateFilter, infoById])

  const selected = selectedId ? females.find((f) => f.id === selectedId) || null : null
  const selectedInfo = selected ? infoById.get(selected.id)! : null

  const keyDate = (info: ReturnType<typeof computeReproInfo>): string => {
    if (info.state === 'pregnant' && info.expectedBirth) {
      const d = daysBetween(today, info.expectedBirth)
      return d >= 0 ? `${t('Parto en')} ${d} ${t('d')}` : t('Parto pasado')
    }
    if (info.state === 'mated_pending') return t('Confirmar preñez')
    if (info.state === 'in_heat') return t('En celo ahora')
    if (info.nextHeatForecast) return `${t('Próx. celo ~')}${fmtDate(info.nextHeatForecast)}`
    return t('En reposo')
  }

  const STATE_FILTERS: { key: StateFilter; label: string; n: number }[] = [
    { key: 'all', label: t('Todas'), n: females.length },
    { key: 'in_heat', label: t('En celo'), n: counts.in_heat },
    { key: 'mated_pending', label: t('Montadas'), n: counts.mated_pending },
    { key: 'pregnant', label: t('Gestantes'), n: counts.pregnant },
    { key: 'idle', label: t('Reposo'), n: counts.idle },
  ]

  const femaleCyclesFor = (id: string) => cycles.filter((c) => c.dog_id === id)
  const femaleLittersFor = (id: string) => litters.filter((l) => l.mother_id === id)

  return (
    <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
      {/* ── Columna izquierda: roster con estado + buscador ── */}
      <aside className={`${selected ? 'hidden lg:block' : ''} rounded-2xl border border-hairline bg-canvas`}>
        <div className="flex items-center justify-between gap-2 border-b border-hairline px-4 py-3">
          <p className="text-[13px] font-semibold text-ink">{t('Reproductoras')} <span className="text-muted">({females.length})</span></p>
          <button onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-1 rounded-lg bg-ink px-2.5 py-1.5 text-[12px] font-medium text-on-primary transition hover:opacity-90">
            <Plus className="h-3.5 w-3.5" /> {t('Celo')}
          </button>
        </div>
        <div className="space-y-2 p-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('Buscar hembra...')}
              className="w-full rounded-lg border border-hairline bg-canvas py-2 pl-8 pr-3 text-[13px] text-ink placeholder:text-muted focus:border-ink focus:outline-none" />
          </div>
          <div className="flex flex-wrap gap-1">
            {STATE_FILTERS.map((f) => (
              <button key={f.key} onClick={() => setStateFilter(f.key)}
                className={`rounded-full px-2.5 py-1 text-[11.5px] font-medium transition ${stateFilter === f.key ? 'bg-ink text-on-primary' : 'bg-surface-soft text-body hover:text-ink'}`}>
                {f.label} <span className="tabular-nums opacity-70">{f.n}</span>
              </button>
            ))}
          </div>
        </div>
        <ul className="max-h-[60vh] overflow-y-auto px-2 pb-3">
          {filtered.length === 0 ? (
            <li className="px-3 py-6 text-center text-[12.5px] text-muted">{t('Sin hembras.')}</li>
          ) : filtered.map((f) => {
            const info = infoById.get(f.id)!
            const isSel = f.id === selectedId
            return (
              <li key={f.id}>
                <button onClick={() => { setSelectedId(f.id); setView('ciclo') }}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition ${isSel ? 'bg-surface-card' : 'hover:bg-surface-soft'}`}>
                  <div className="relative flex-shrink-0">
                    {f.thumbnail_url
                      ? <Img w={200} src={f.thumbnail_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                      : <div className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-100"><Heart className="h-4 w-4 text-pink-500" /></div>}
                    <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-canvas ${STATE_DOT[info.state]}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium text-ink">{f.name}</p>
                    <p className={`truncate text-[11.5px] ${STATE_TEXT[info.state]}`}>{keyDate(info)}</p>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      </aside>

      {/* ── Columna derecha: detalle de la hembra o resumen ── */}
      <section className={`${selected ? '' : 'hidden lg:block'} min-w-0`}>
        {!selected ? (
          <div className="rounded-2xl border border-hairline bg-canvas p-6">
            <p className="text-[13px] font-semibold text-ink">{t('Resumen del criadero')}</p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {([
                { k: 'in_heat', label: 'En celo', n: counts.in_heat, dot: STATE_DOT.in_heat },
                { k: 'mated_pending', label: 'Montadas', n: counts.mated_pending, dot: STATE_DOT.mated_pending },
                { k: 'pregnant', label: 'Gestantes', n: counts.pregnant, dot: STATE_DOT.pregnant },
                { k: 'idle', label: 'En reposo', n: counts.idle, dot: STATE_DOT.idle },
              ] as const).map((s) => (
                <div key={s.k} className="rounded-xl border border-hairline p-3">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${s.dot}`} />
                  <p className="mt-2 text-[22px] font-semibold tabular-nums text-ink leading-none">{s.n}</p>
                  <p className="mt-1 text-[11.5px] text-muted">{t(s.label)}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-[13px] text-muted">{t('Selecciona una reproductora en la izquierda para ver su ciclo y su año reproductivo.')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header de la hembra */}
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedId(null)} className="lg:hidden rounded-lg p-1.5 text-muted hover:bg-surface-card hover:text-ink"><ArrowLeft className="h-5 w-5" /></button>
              {selected.thumbnail_url
                ? <Img w={200} src={selected.thumbnail_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                : <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100"><Heart className="h-4.5 w-4.5 text-pink-500" /></div>}
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-[18px] font-semibold tracking-[-0.01em] text-ink">{selected.name}</h2>
                {selectedInfo && <p className={`text-[12.5px] font-medium ${STATE_TEXT[selectedInfo.state]}`}>{selectedInfo.stateLabel}</p>}
              </div>
            </div>

            {/* Selector de vistas */}
            <div className="inline-flex gap-1 rounded-xl bg-surface-soft p-1">
              <button onClick={() => setView('ciclo')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition ${view === 'ciclo' ? 'bg-canvas text-ink shadow-sm' : 'text-muted hover:text-ink'}`}>
                <Dna className="h-3.5 w-3.5" /> {t('Ciclo')}
              </button>
              <button onClick={() => setView('anual')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition ${view === 'anual' ? 'bg-canvas text-ink shadow-sm' : 'text-muted hover:text-ink'}`}>
                <CalendarRange className="h-3.5 w-3.5" /> {t('Año')}
              </button>
            </div>

            {/* Contenido de la vista */}
            {view === 'ciclo' ? (
              <ReproduccionTab key={selected.id} dogId={selected.id} userId={userId} />
            ) : (
              <AnnualReproCalendar cycles={femaleCyclesFor(selected.id)} litters={femaleLittersFor(selected.id)} />
            )}
          </div>
        )}
      </section>

      {/* Registrar celo (cualquier hembra) */}
      <HeatCycleForm
        open={formOpen}
        females={females.map((f) => ({ id: f.id, name: f.name }))}
        defaultFemaleId={selectedId || females[0]?.id}
        onClose={() => setFormOpen(false)}
        onSaved={() => { setFormOpen(false); window.location.reload() }}
      />
    </div>
  )
}
