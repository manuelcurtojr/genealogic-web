'use client'

/**
 * Tablero del Embudo. NO es kanban de arrastrar: pipelines como pestañas →
 * pasos como pestañas → lista de fichas. Al pinchar una ficha se abre el
 * detalle completo en un panel lateral derecho. El "+" y el engranaje abren
 * el panel de configuración del funnel.
 *  - Solicitud nueva → resaltada (borde + pill), se quita al abrir.
 *  - Mover a paso GANADO → confeti + popup.  Mover a paso PERDIDO → encuesta.
 */
import { useMemo, useState, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'
import {
  Sparkles, X, Plus, Settings, Mail, Phone, Clock, AlertTriangle,
  ChevronDown, ChevronUp, TrendingUp, Trophy, XCircle, Inbox, ChevronRight,
  MapPin, Coins, Wallet, Hourglass,
} from 'lucide-react'
import { useT } from '@/components/i18n/locale-provider'
import { moveEntryToStage, markEntrySeen } from '@/lib/pipelines/actions'
import type { Pipeline, Stage, FunnelEntry } from '@/lib/pipelines/types'
import { scoreLead } from '@/lib/pipelines/lead-score'
import LeadPanel from './lead-panel'
import ConfigPanel from './config-panel'

type ConfigState = { mode: 'create' } | { mode: 'edit'; pipelineId: string }

function fireConfetti() {
  const end = Date.now() + 900
  const colors = ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d']
  confetti({ particleCount: 150, spread: 95, startVelocity: 45, origin: { y: 0.5 }, colors })
  ;(function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0 }, colors })
    confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1 }, colors })
    if (Date.now() < end) requestAnimationFrame(frame)
  })()
}

export default function FunnelBoard({
  kennelName,
  pipelines,
  entries,
  paidByEntry = {},
  kennelBreeds = [],
}: {
  kennelName: string
  pipelines: Pipeline[]
  entries: FunnelEntry[]
  /** Cobrado real por reserva (Σ pagos pagados), calculado en el servidor. */
  paidByEntry?: Record<string, number>
  /** Razas que cría el criadero (para el selector de raza de interés del panel). */
  kennelBreeds?: string[]
}) {
  const t = useT()
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [pipelineId, setPipelineId] = useState<string>(pipelines[0]?.id ?? '')
  const pipeline = useMemo(() => pipelines.find((p) => p.id === pipelineId) ?? pipelines[0], [pipelines, pipelineId])
  const entryStage = useMemo(() => pipeline?.stages.find((s) => s.is_entry) ?? pipeline?.stages[0], [pipeline])
  const [stageId, setStageId] = useState<string>(entryStage?.id ?? '')

  const [selected, setSelected] = useState<FunnelEntry | null>(null)
  const [config, setConfig] = useState<ConfigState | null>(null)
  const [loss, setLoss] = useState<{ entryId: string; stageId: string; reasons: string[] } | null>(null)
  const [party, setParty] = useState<{ title: string; subtitle: string } | null>(null)
  const [showOrphans, setShowOrphans] = useState(false)

  // Leads HUÉRFANOS (stage_id=null) — entraron en BBDD pero no se les asignó
  // un paso del embudo. Causa: pipeline_stages sin is_entry=true (criador
  // borró el paso "Interesados" o equivalente). Si no los pintamos aquí,
  // quedan completamente invisibles → leads perdidos a ojo del criador.
  const orphanEntries = useMemo(
    () => entries.filter((e) => !e.stage_id).sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)),
    [entries],
  )

  const byStage = useMemo(() => {
    const m = new Map<string, FunnelEntry[]>()
    for (const e of entries) {
      if (!e.stage_id) continue
      const arr = m.get(e.stage_id) || []
      arr.push(e)
      m.set(e.stage_id, arr)
    }
    return m
  }, [entries])

  const unseenByStage = useMemo(() => {
    const m = new Map<string, number>()
    for (const e of entries) {
      if (!e.stage_id || e.seen_by_breeder_at) continue
      m.set(e.stage_id, (m.get(e.stage_id) || 0) + 1)
    }
    return m
  }, [entries])

  // ─── Métricas de dinero del pipeline ACTIVO ───
  // Valor total = Σ total acordado; Cobrado = Σ pagos pagados (fuente real);
  // Pendiente = Σ (total − cobrado) sin bajar de 0. Excluye pasos "perdidos".
  const money = useMemo(() => {
    const empty = { total: 0, paid: 0, pending: 0, count: 0, currency: 'EUR' as string }
    if (!pipeline) return empty
    const lostSet = new Set(pipeline.stages.filter((s) => s.type === 'lost').map((s) => s.id))
    let total = 0, paid = 0, pending = 0, count = 0
    let currency: string | null = null
    for (const e of entries) {
      if (e.pipeline_id !== pipeline.id || !e.stage_id || lostSet.has(e.stage_id)) continue
      count++
      const p = paidByEntry[e.id] || 0
      paid += p
      if (e.total_price_cents != null) {
        total += e.total_price_cents
        pending += Math.max(0, e.total_price_cents - p)
      }
      if (!currency && e.currency) currency = e.currency
    }
    return { total, paid, pending, count, currency: currency || 'EUR' }
  }, [entries, pipeline, paidByEntry])

  // ─── Conteos del pipeline ACTIVO (NO se mezclan pipelines) ───
  // Las etiquetas de ganado/perdido usan el nombre real del paso cuando hay
  // uno solo (p.ej. "Entregado"/"Reserva cancelada" en Reservas), evitando
  // mezclar "ventas ganadas" con "cachorros entregados".
  const counts = useMemo(() => {
    const empty = { inProgress: 0, won: 0, lost: 0, unseen: 0, wonLabel: 'Ganadas', lostLabel: 'Perdidas' }
    if (!pipeline) return empty
    const wonStages = pipeline.stages.filter((s) => s.type === 'won')
    const lostStages = pipeline.stages.filter((s) => s.type === 'lost')
    const wonSet = new Set(wonStages.map((s) => s.id))
    const lostSet = new Set(lostStages.map((s) => s.id))
    let inProgress = 0, won = 0, lost = 0, unseen = 0
    for (const e of entries) {
      if (e.pipeline_id !== pipeline.id || !e.stage_id) continue
      if (wonSet.has(e.stage_id)) won++
      else if (lostSet.has(e.stage_id)) lost++
      else inProgress++
      if (!e.seen_by_breeder_at) unseen++
    }
    return {
      inProgress, won, lost, unseen,
      wonLabel: wonStages.length === 1 ? wonStages[0].name : 'Ganadas',
      lostLabel: lostStages.length === 1 ? lostStages[0].name : 'Perdidas',
    }
  }, [entries, pipeline])

  function selectPipeline(p: Pipeline) {
    setPipelineId(p.id)
    const entry = p.stages.find((s) => s.is_entry) ?? p.stages[0]
    setStageId(entry?.id ?? '')
  }

  const doMove = useCallback(
    (entry: FunnelEntry, target: Stage, lossReason?: string, lossDetail?: string) => {
      startTransition(async () => {
        const res = await moveEntryToStage(entry.id, target.id, lossReason ? { lossReason, lossDetail } : undefined)
        if (!res.ok) {
          if (res.needLossReason) {
            setLoss({ entryId: entry.id, stageId: target.id, reasons: res.reasons || [] })
            return
          }
          alert(res.error)
          return
        }
        setLoss(null)
        setSelected(null)
        if (res.celebrate) {
          fireConfetti()
          setParty({
            title: `🎉 ${t(target.name)}`,
            subtitle: entry.applicant_name ? `${entry.applicant_name} · ${kennelName}` : kennelName,
          })
        }
        router.refresh()
      })
    },
    [router, t, kennelName],
  )

  function openLead(entry: FunnelEntry) {
    if (!entry.seen_by_breeder_at) {
      startTransition(async () => {
        await markEntrySeen(entry.id)
        router.refresh()
      })
    }
    setSelected(entry)
  }

  if (!pipeline) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-surface-soft flex items-center justify-center text-muted mb-4">
          <TrendingUp className="h-5 w-5" />
        </div>
        <p className="text-[16px] font-bold text-ink">{t('No hay pipelines configurados.')}</p>
        <button
          type="button"
          onClick={() => setConfig({ mode: 'create' })}
          className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-ink text-on-primary px-4 py-2.5 text-[13px] font-bold hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('Crear el primero')}
        </button>
      </div>
    )
  }

  const stageEntries = byStage.get(stageId) || []

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-7 space-y-5 sm:space-y-6">
      {/* ─── Banner SOLICITUDES SIN ASIGNAR ─── */}
      {orphanEntries.length > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-200 text-amber-800 flex-shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-amber-900 text-[14px]">
                {orphanEntries.length === 1
                  ? t('1 solicitud sin asignar')
                  : `${orphanEntries.length} ${t('solicitudes sin asignar')}`}
              </p>
              <p className="text-[12.5px] text-amber-800 mt-0.5 leading-snug">
                {t('Estos leads entraron sin paso porque ningún paso del embudo está marcado como "Entrada". Marca uno en configuración o atiéndelos aquí.')}
              </p>
              <button
                type="button"
                onClick={() => setShowOrphans((o) => !o)}
                className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-bold text-amber-900 hover:text-amber-950"
              >
                {showOrphans ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {showOrphans ? t('Ocultar') : t('Ver solicitudes')}
              </button>
            </div>
          </div>
          {showOrphans && (
            <ul className="mt-4 space-y-2">
              {orphanEntries.map((e) => (
                <LeadCard key={e.id} entry={e} onClick={() => openLead(e)} t={t} showScore={pipeline.slug !== 'reservas'} />
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ─── Pipeline tabs (pills grandes) + Stage chips ─── */}
      <div className="rounded-2xl border border-hairline bg-canvas p-3 sm:p-4 space-y-3">
        {/* Pipeline tabs (pills) + acciones del embudo (config / nuevo), antes en el hero */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-1 px-1 min-w-0">
          {pipelines.map((p) => {
            const active = p.id === pipeline.id
            const unseen = p.stages.reduce((n, s) => n + (unseenByStage.get(s.id) || 0), 0)
            const totalInPipeline = entries.filter((e) => e.pipeline_id === p.id).length
            return (
              <button
                key={p.id}
                onClick={() => selectPipeline(p)}
                className={`relative shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-bold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-ink text-on-primary shadow-sm'
                    : 'text-body hover:bg-surface-soft hover:text-ink'
                }`}
              >
                <TrendingUp className={`h-3.5 w-3.5 ${active ? 'opacity-90' : 'opacity-60'}`} />
                {t(p.name)}
                <span className={`text-[10.5px] font-bold ${active ? 'opacity-80' : 'text-muted'} tabular-nums`}>
                  {totalInPipeline}
                </span>
                {unseen > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-amber-400 text-amber-950 text-[9px] font-bold">
                    {unseen}
                  </span>
                )}
              </button>
            )
          })}
          </div>
          {/* Acciones del embudo (movidas desde el hero) */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => setConfig({ mode: 'edit', pipelineId: pipeline.id })}
              title={t('Configurar este embudo')}
              className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-muted hover:text-ink hover:bg-surface-soft border border-hairline transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setConfig({ mode: 'create' })}
              className="inline-flex items-center gap-1.5 rounded-lg bg-ink text-on-primary px-3 py-2 text-[12.5px] font-bold hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('Nuevo embudo')}</span>
            </button>
          </div>
        </div>

        {/* Panel de métricas del pipeline activo: dinero + conteos (sin mezclar pipelines) */}
        <PipelineStats money={money} counts={counts} slug={pipeline.slug} t={t} />

        {/* Separador */}
        <div className="border-t border-hairline -mx-3 sm:-mx-4" />

        {/* Stage chips */}
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {pipeline.stages.map((s) => {
            const active = s.id === stageId
            const count = (byStage.get(s.id) || []).length
            const unseen = unseenByStage.get(s.id) || 0
            const StageIcon = s.type === 'won' ? Trophy : s.type === 'lost' ? XCircle : Inbox
            const baseTone =
              s.type === 'won'
                ? active
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : s.type === 'lost'
                ? active
                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                : active
                ? 'bg-ink text-on-primary border-ink shadow-sm'
                : 'bg-canvas text-body border-hairline hover:bg-surface-soft hover:border-ink/30'
            return (
              <button
                key={s.id}
                onClick={() => setStageId(s.id)}
                className={`relative inline-flex items-center gap-1.5 rounded-full px-3 h-8 text-[12.5px] font-semibold transition-all border ${baseTone}`}
              >
                <StageIcon className="h-3 w-3" />
                {t(s.name)}
                <span className={`text-[10.5px] tabular-nums ${active ? 'opacity-80' : 'opacity-70'}`}>
                  {count}
                </span>
                {unseen > 0 && (
                  <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-amber-400" aria-hidden />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ─── Lista de fichas del stage activo ─── */}
      {stageEntries.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-hairline bg-surface-soft/30 px-6 py-16 text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-canvas border border-hairline flex items-center justify-center text-muted">
            <Inbox className="h-5 w-5" />
          </div>
          <p className="mt-4 text-[14px] font-semibold text-ink">{t('No hay fichas en este paso.')}</p>
          <p className="mt-1 text-[12.5px] text-muted max-w-sm mx-auto leading-snug">
            {t('Cuando un lead entre en este paso, aparecerá aquí.')}
          </p>
        </div>
      ) : (
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
            {t(pipeline.stages.find((s) => s.id === stageId)?.name || 'Paso')} · {stageEntries.length} {stageEntries.length === 1 ? t('ficha') : t('fichas')}
          </p>
          <ul className="space-y-2">
            {stageEntries.map((e) => (
              <LeadCard key={e.id} entry={e} onClick={() => openLead(e)} t={t} showLossReason showScore={pipeline.slug !== 'reservas'} />
            ))}
          </ul>
        </div>
      )}

      {/* ─── Panel lateral: detalle del lead ─── */}
      {selected && (
        <LeadPanel
          entry={selected}
          pipeline={pipeline}
          pending={pending}
          onMove={(target) => doMove(selected, target)}
          onClose={() => setSelected(null)}
          kennelBreeds={kennelBreeds}
        />
      )}

      {/* ─── Panel lateral: configurar funnel ─── */}
      {config && (
        <ConfigPanel pipelines={pipelines} state={config} onState={setConfig} onClose={() => setConfig(null)} />
      )}

      {/* ─── Modal: motivo de pérdida ─── */}
      {loss && (
        <LossSurvey
          reasons={loss.reasons}
          pending={pending}
          onCancel={() => setLoss(null)}
          onConfirm={(reason, detail) => {
            const target = pipeline.stages.find((s) => s.id === loss.stageId)
            const entry = entries.find((e) => e.id === loss.entryId)
            if (target && entry) doMove(entry, target, reason, detail)
          }}
        />
      )}

      {/* ─── Overlay: celebración ─── */}
      {party && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-ink/30 backdrop-blur-sm p-4"
          style={{ paddingTop: 'max(1rem, var(--safe-area-top))', paddingBottom: 'max(1rem, var(--safe-area-bottom))' }}
          onClick={() => setParty(null)}
        >
          <div className="w-full max-w-sm rounded-3xl bg-canvas border border-hairline shadow-2xl px-6 py-8 sm:px-10 text-center">
            <Sparkles className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-ink break-words">{party.title}</h2>
            <p className="mt-1 text-sm text-body break-words">{party.subtitle}</p>
            <button
              onClick={() => setParty(null)}
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-ink text-on-primary px-5 py-2.5 text-sm font-bold hover:opacity-90"
            >
              {t('Seguir')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Building blocks del diseño ─────────────────────────────────────────────

function StatChip({
  icon: Icon, label, value, tone,
}: {
  icon: React.ElementType
  label: string
  value: number
  tone: 'neutral' | 'emerald' | 'rose' | 'amber'
}) {
  const toneClass =
    tone === 'emerald'
      ? 'border-emerald-200 bg-emerald-50/60'
      : tone === 'rose'
      ? 'border-rose-200 bg-rose-50/60'
      : tone === 'amber'
      ? 'border-amber-300 bg-amber-50'
      : 'border-hairline bg-surface-soft/40'
  const iconClass =
    tone === 'emerald'
      ? 'bg-emerald-100 text-emerald-700'
      : tone === 'rose'
      ? 'bg-rose-100 text-rose-700'
      : tone === 'amber'
      ? 'bg-amber-200 text-amber-800'
      : 'bg-canvas text-muted border border-hairline'
  return (
    <div className={`rounded-xl border px-3 py-2.5 flex items-center gap-2.5 min-w-0 ${toneClass}`}>
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 ${iconClass}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted leading-none">{label}</p>
        <p className="mt-0.5 text-[18px] font-bold text-ink leading-none tabular-nums">{value}</p>
      </div>
    </div>
  )
}

function fmtMoney(cents: number, currency: string | null): string {
  const cur = currency || 'EUR'
  try {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(cents / 100)
  } catch {
    return `${Math.round(cents / 100).toLocaleString('es-ES')} ${cur}`
  }
}

/**
 * Panel de métricas del pipeline ACTIVO. Fusiona el dinero (valor / cobrado /
 * pendiente) con los conteos del estado (en curso / ganadas / perdidas / sin
 * leer). Todo es del pipeline activo — no se suman pipelines distintos.
 */
function PipelineStats({
  money, counts, slug, t,
}: {
  money: { total: number; paid: number; pending: number; count: number; currency: string }
  counts: { inProgress: number; won: number; lost: number; unseen: number; wonLabel: string; lostLabel: string }
  slug: string | null
  t: (k: string) => string
}) {
  if (money.count === 0 && counts.inProgress === 0 && counts.won === 0 && counts.lost === 0) return null
  const isReservas = slug === 'reservas'
  return (
    <div className="space-y-2.5">
      {/* Dinero */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <MoneyChip
          icon={Coins}
          label={isReservas ? t('Valor total') : t('Valor potencial')}
          value={fmtMoney(money.total, money.currency)}
          tone="ink"
        />
        <MoneyChip icon={Wallet} label={t('Cobrado')} value={fmtMoney(money.paid, money.currency)} tone="emerald" />
        <MoneyChip
          icon={Hourglass}
          label={t('Pendiente de cobro')}
          value={fmtMoney(money.pending, money.currency)}
          tone="amber"
        />
      </div>
      {/* Conteos por estado */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <StatChip icon={Inbox} label={t('En curso')} value={counts.inProgress} tone="neutral" />
        <StatChip icon={Trophy} label={t(counts.wonLabel)} value={counts.won} tone="emerald" />
        <StatChip icon={XCircle} label={t(counts.lostLabel)} value={counts.lost} tone="rose" />
        <StatChip icon={Sparkles} label={t('Sin leer')} value={counts.unseen} tone={counts.unseen > 0 ? 'amber' : 'neutral'} />
      </div>
    </div>
  )
}

function MoneyChip({
  icon: Icon, label, value, tone,
}: {
  icon: React.ElementType
  label: string
  value: string
  tone: 'ink' | 'emerald' | 'amber' | 'neutral'
}) {
  const toneClass =
    tone === 'emerald'
      ? 'border-emerald-200 bg-emerald-50/60'
      : tone === 'amber'
      ? 'border-amber-200 bg-amber-50/60'
      : tone === 'ink'
      ? 'border-hairline bg-ink/[0.03]'
      : 'border-hairline bg-surface-soft/40'
  const iconClass =
    tone === 'emerald'
      ? 'bg-emerald-100 text-emerald-700'
      : tone === 'amber'
      ? 'bg-amber-100 text-amber-700'
      : tone === 'ink'
      ? 'bg-ink text-on-primary'
      : 'bg-canvas text-muted border border-hairline'
  return (
    <div className={`rounded-xl border px-3 py-2.5 flex items-center gap-2.5 min-w-0 ${toneClass}`}>
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 ${iconClass}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted leading-none truncate">{label}</p>
        <p className="mt-0.5 text-[16px] font-bold text-ink leading-none tabular-nums truncate">{value}</p>
      </div>
    </div>
  )
}

function LeadCard({
  entry, onClick, t, showLossReason = false, showScore = true,
}: {
  entry: FunnelEntry
  onClick: () => void
  t: (k: string) => string
  showLossReason?: boolean
  showScore?: boolean
}) {
  const isNew = !entry.seen_by_breeder_at
  const initial = (entry.applicant_name || entry.applicant_email || '?')[0]?.toUpperCase() || '?'
  return (
    <li>
      <button
        onClick={onClick}
        className={`group w-full text-left rounded-xl border bg-canvas px-4 py-3.5 transition-all hover:shadow-md hover:border-ink/30 min-w-0 flex items-center gap-3 ${
          isNew ? 'border-amber-400 ring-2 ring-amber-300/40' : 'border-hairline'
        }`}
      >
        {/* Avatar con iniciales */}
        <div className={`flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0 text-[14px] font-bold ${
          isNew ? 'bg-amber-400 text-amber-950' : 'bg-surface-soft text-ink'
        }`}>
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          {/* Nombre + estado + qué reserva (sexo/color) */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-ink truncate min-w-0 text-[14px]">
              {entry.applicant_name || t('Sin nombre')}
            </span>
            {isNew && (
              <span className="flex-shrink-0 inline-flex items-center rounded-full bg-amber-400 text-amber-950 text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wide">
                {t('Nueva')}
              </span>
            )}
            {(entry.preference_sex || entry.preference_color) && (
              <span className="flex-shrink-0 inline-flex items-center rounded-md bg-surface-soft text-body text-[10.5px] font-medium px-1.5 py-0.5">
                {[
                  entry.preference_sex ? (entry.preference_sex === 'male' ? t('Macho') : t('Hembra')) : null,
                  entry.preference_color || null,
                ].filter(Boolean).join(' · ')}
              </span>
            )}
          </div>
          {/* Meta: país · email · teléfono · fecha */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11.5px] text-muted mt-0.5">
            {entry.applicant_country && (
              <span className="inline-flex items-center gap-1 flex-shrink-0 min-w-0 max-w-full truncate">
                <MapPin className="w-3 h-3 flex-shrink-0" /> <span className="truncate">{entry.applicant_country}</span>
              </span>
            )}
            {entry.applicant_email && (
              <span className="inline-flex items-center gap-1 min-w-0 max-w-full truncate">
                <Mail className="w-3 h-3 flex-shrink-0" /> <span className="truncate">{entry.applicant_email}</span>
              </span>
            )}
            {entry.applicant_phone && (
              <span className="inline-flex items-center gap-1 flex-shrink-0">
                <Phone className="w-3 h-3 flex-shrink-0" /> {entry.applicant_phone}
              </span>
            )}
            <span className="inline-flex items-center gap-1 flex-shrink-0 ml-auto">
              <Clock className="w-3 h-3" /> {new Date(entry.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
            </span>
          </div>
          {/* Dinero (reservas) o mensaje (leads) */}
          {entry.deposit_amount_cents != null ? (
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px]">
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 text-emerald-700 font-semibold px-1.5 py-0.5">
                <Coins className="w-3 h-3" /> {t('Pagado')} {fmtMoney(entry.deposit_amount_cents, entry.currency)}
              </span>
              {entry.total_price_cents != null && entry.total_price_cents > entry.deposit_amount_cents && (
                <>
                  <span className="text-muted">{t('de')} {fmtMoney(entry.total_price_cents, entry.currency)}</span>
                  <span className="inline-flex items-center rounded-md bg-amber-50 text-amber-700 font-semibold px-1.5 py-0.5">
                    {t('Faltan')} {fmtMoney(entry.total_price_cents - entry.deposit_amount_cents, entry.currency)}
                  </span>
                </>
              )}
            </div>
          ) : entry.applicant_message ? (
            <p className="mt-1.5 text-[12.5px] text-body line-clamp-1 leading-snug">
              &ldquo;{entry.applicant_message}&rdquo;
            </p>
          ) : null}
          {showLossReason && entry.lost_reason && (
            <p className="mt-1 text-[11.5px] text-rose-600 font-medium inline-flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              {t('Motivo')}: {t(entry.lost_reason)}
            </p>
          )}
        </div>
        {showScore && (() => {
          const q = scoreLead(entry)
          const tone =
            q.score >= 4 ? 'text-emerald-600' : q.score === 3 ? 'text-amber-500' : 'text-rose-400'
          return (
            <div
              className={`flex flex-col items-center flex-shrink-0 w-12 ${tone}`}
              title={`${t('Calidad')}: ${t(q.label)} — ${q.reasons.map((r) => t(r)).join(' · ')}`}
              aria-label={`${t('Calidad')} ${t(q.label)}`}
            >
              <div className="text-[10px] leading-none tracking-[-1px]">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className={i <= q.score ? '' : 'opacity-25'}>★</span>
                ))}
              </div>
              <span className="text-[8.5px] font-bold uppercase tracking-wide mt-1">{t(q.label)}</span>
            </div>
          )
        })()}
        <ChevronRight className="h-4 w-4 text-muted group-hover:text-ink group-hover:translate-x-0.5 transition-all flex-shrink-0" />
      </button>
    </li>
  )
}

/** Encuesta de motivo al mover a un paso perdido. */
function LossSurvey({
  reasons,
  pending,
  onCancel,
  onConfirm,
}: {
  reasons: string[]
  pending: boolean
  onCancel: () => void
  onConfirm: (reason: string, detail: string) => void
}) {
  const t = useT()
  const [reason, setReason] = useState(reasons[0] || '')
  const [detail, setDetail] = useState('')
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-ink/40 backdrop-blur-sm p-4"
      style={{ paddingTop: 'max(1rem, var(--safe-area-top))', paddingBottom: 'max(1rem, var(--safe-area-bottom))' }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-canvas border border-hairline shadow-2xl p-5 sm:p-6 max-h-full overflow-y-auto overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-ink">{t('¿Por qué se perdió?')}</h3>
          <button onClick={onCancel} className="text-muted hover:text-ink">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-2 mb-4">
          {reasons.map((r) => (
            <label
              key={r}
              className={
                'flex items-center gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer text-sm ' +
                (reason === r ? 'border-ink bg-surface-soft' : 'border-hairline hover:bg-surface-soft/50')
              }
            >
              <input type="radio" name="loss" checked={reason === r} onChange={() => setReason(r)} className="accent-ink" />
              <span className="text-ink">{t(r)}</span>
            </label>
          ))}
        </div>
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder={t('Detalle (opcional)')}
          rows={2}
          className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-base sm:text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ink/10 mb-4"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-lg px-4 py-2 text-sm font-medium text-body hover:bg-surface-soft">
            {t('Cancelar')}
          </button>
          <button
            onClick={() => onConfirm(reason, detail)}
            disabled={pending || !reason}
            className="rounded-lg bg-rose-600 text-white px-4 py-2 text-sm font-bold hover:bg-rose-700 disabled:opacity-50"
          >
            {t('Confirmar')}
          </button>
        </div>
      </div>
    </div>
  )
}
