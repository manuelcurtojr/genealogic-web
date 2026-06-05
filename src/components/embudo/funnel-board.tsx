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
} from 'lucide-react'
import { useT } from '@/components/i18n/locale-provider'
import { moveEntryToStage, markEntrySeen } from '@/lib/pipelines/actions'
import type { Pipeline, Stage, FunnelEntry } from '@/lib/pipelines/types'
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
}: {
  kennelName: string
  pipelines: Pipeline[]
  entries: FunnelEntry[]
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

  // ─── Stats globales para el hero ───
  // Solo cuenta entries CON stage (orphans van por separado).
  const allActiveEntries = entries.filter((e) => e.stage_id)
  const wonStages = new Set(
    pipelines.flatMap((p) => p.stages.filter((s) => s.type === 'won').map((s) => s.id)),
  )
  const lostStages = new Set(
    pipelines.flatMap((p) => p.stages.filter((s) => s.type === 'lost').map((s) => s.id)),
  )
  const wonCount = allActiveEntries.filter((e) => wonStages.has(e.stage_id!)).length
  const lostCount = allActiveEntries.filter((e) => lostStages.has(e.stage_id!)).length
  const inProgressCount = allActiveEntries.length - wonCount - lostCount
  const totalUnseenAll = pipelines.reduce(
    (n, p) => n + p.stages.reduce((m, s) => m + (unseenByStage.get(s.id) || 0), 0),
    0,
  )

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-7 space-y-6 sm:space-y-7">
      {/* ═══ HERO HEADER ═══ */}
      <section className="relative overflow-hidden rounded-3xl border border-hairline bg-gradient-to-br from-canvas via-canvas to-surface-soft/60 p-6 sm:p-7">
        <div
          aria-hidden
          className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-[#FE6620]/8 blur-3xl pointer-events-none"
        />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#FE6620]">
              {t('Pipeline')} · {kennelName}
            </p>
            <h1 className="mt-1.5 text-[28px] sm:text-[36px] font-bold tracking-[-0.035em] text-ink leading-[1.05]">
              {t('Embudo')}
            </h1>
            <p className="mt-2 text-[13.5px] text-body max-w-xl leading-snug">
              {t('Solicitudes que entran por tu formulario, ordenadas por estado. Mueve fichas entre pasos para reflejar dónde está cada cliente.')}
            </p>
          </div>
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
              className="inline-flex items-center gap-1.5 rounded-lg bg-ink text-on-primary px-3 py-2 text-[12.5px] font-bold hover:opacity-90 transition-opacity"
            >
              <Plus className="h-3.5 w-3.5" />
              {t('Nuevo embudo')}
            </button>
          </div>
        </div>

        {/* Stats compactas */}
        <div className="relative mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <StatChip
            icon={Inbox}
            label={t('En curso')}
            value={inProgressCount}
            tone="neutral"
          />
          <StatChip
            icon={Trophy}
            label={t('Ganadas')}
            value={wonCount}
            tone="emerald"
          />
          <StatChip
            icon={XCircle}
            label={t('Perdidas')}
            value={lostCount}
            tone="rose"
          />
          <StatChip
            icon={Sparkles}
            label={t('Sin leer')}
            value={totalUnseenAll}
            tone={totalUnseenAll > 0 ? 'amber' : 'neutral'}
          />
        </div>
      </section>

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
                <LeadCard key={e.id} entry={e} onClick={() => openLead(e)} t={t} />
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ─── Pipeline tabs (pills grandes) + Stage chips ─── */}
      <div className="rounded-2xl border border-hairline bg-canvas p-3 sm:p-4 space-y-3">
        {/* Pipeline tabs como pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-1 px-1">
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
              <LeadCard key={e.id} entry={e} onClick={() => openLead(e)} t={t} showLossReason />
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

function LeadCard({
  entry, onClick, t, showLossReason = false,
}: {
  entry: FunnelEntry
  onClick: () => void
  t: (k: string) => string
  showLossReason?: boolean
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
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-ink truncate min-w-0 text-[14px]">
              {entry.applicant_name || t('Sin nombre')}
            </span>
            {isNew && (
              <span className="flex-shrink-0 inline-flex items-center rounded-full bg-amber-400 text-amber-950 text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wide">
                {t('Nueva')}
              </span>
            )}
            {entry.preference_sex && (
              <span className="flex-shrink-0 text-[11px] text-muted">
                · {entry.preference_sex === 'male' ? t('Macho') : t('Hembra')}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11.5px] text-muted mt-0.5">
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
          {entry.applicant_message && (
            <p className="mt-1.5 text-[12.5px] text-body line-clamp-1 leading-snug">
              &ldquo;{entry.applicant_message}&rdquo;
            </p>
          )}
          {showLossReason && entry.lost_reason && (
            <p className="mt-1 text-[11.5px] text-rose-600 font-medium inline-flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              {t('Motivo')}: {t(entry.lost_reason)}
            </p>
          )}
        </div>
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
