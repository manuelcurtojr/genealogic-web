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
import { Sparkles, X, Plus, Settings, Mail, Phone, Clock } from 'lucide-react'
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
    return <div className="w-full px-6 py-10 text-body">{t('No hay pipelines configurados.')}</div>
  }

  const stageEntries = byStage.get(stageId) || []

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight mb-5">{t('Embudo')}</h1>

      {/* ─── Pestañas de pipeline + crear/configurar ─── */}
      <div className="flex items-center gap-1 border-b border-hairline mb-5 overflow-x-auto">
        {pipelines.map((p) => {
          const active = p.id === pipeline.id
          const unseen = p.stages.reduce((n, s) => n + (unseenByStage.get(s.id) || 0), 0)
          return (
            <button
              key={p.id}
              onClick={() => selectPipeline(p)}
              className={
                'relative px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ' +
                (active ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink')
              }
            >
              {t(p.name)}
              {unseen > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-amber-400 text-amber-950 text-[10px] font-bold align-middle">
                  {unseen}
                </span>
              )}
            </button>
          )
        })}
        <button
          onClick={() => setConfig({ mode: 'edit', pipelineId: pipeline.id })}
          title={t('Configurar este embudo')}
          className="ml-1 p-2 text-muted hover:text-ink"
        >
          <Settings className="w-4 h-4" />
        </button>
        <button
          onClick={() => setConfig({ mode: 'create' })}
          title={t('Nuevo embudo')}
          className="p-2 text-muted hover:text-ink"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* ─── Pestañas de paso ─── */}
      <div className="flex flex-wrap gap-2 mb-5">
        {pipeline.stages.map((s) => {
          const active = s.id === stageId
          const count = (byStage.get(s.id) || []).length
          const unseen = unseenByStage.get(s.id) || 0
          const tone = s.type === 'won' ? 'emerald' : s.type === 'lost' ? 'rose' : 'ink'
          return (
            <button
              key={s.id}
              onClick={() => setStageId(s.id)}
              className={
                'inline-flex items-center gap-1.5 rounded-full px-3.5 h-9 text-[13px] font-medium transition-colors border ' +
                (active
                  ? tone === 'emerald'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : tone === 'rose'
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-ink text-on-primary border-ink'
                  : 'bg-canvas text-body border-hairline hover:bg-surface-soft')
              }
            >
              {t(s.name)}
              <span className={'text-[11px] ' + (active ? 'opacity-80' : 'text-muted')}>{count}</span>
              {unseen > 0 && <span className="w-2 h-2 rounded-full bg-amber-400" aria-hidden />}
            </button>
          )
        })}
      </div>

      {/* ─── Lista de fichas ─── */}
      {stageEntries.length === 0 ? (
        <div className="rounded-2xl border border-hairline bg-surface-soft/30 px-4 py-20 text-center">
          <p className="text-sm text-muted">{t('No hay fichas en este paso.')}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {stageEntries.map((e) => {
            const isNew = !e.seen_by_breeder_at
            return (
              <li key={e.id}>
                <button
                  onClick={() => openLead(e)}
                  className={
                    'w-full text-left rounded-xl border bg-canvas p-4 transition-all hover:shadow-md hover:border-ink/20 ' +
                    (isNew ? 'border-amber-400 ring-2 ring-amber-300/40' : 'border-hairline')
                  }
                >
                  <div className="flex items-center gap-2 mb-1">
                    {isNew && (
                      <span className="inline-flex items-center rounded-full bg-amber-400 text-amber-950 text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wide">
                        {t('Nueva')}
                      </span>
                    )}
                    <span className="font-semibold text-ink truncate">{e.applicant_name || t('Sin nombre')}</span>
                    {e.preference_sex && (
                      <span className="text-xs text-muted">
                        {e.preference_sex === 'male' ? t('Macho') : t('Hembra')}
                      </span>
                    )}
                    <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted">
                      <Clock className="w-3 h-3" /> {new Date(e.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
                    {e.applicant_email && (
                      <span className="inline-flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3" /> {e.applicant_email}
                      </span>
                    )}
                    {e.applicant_phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {e.applicant_phone}
                      </span>
                    )}
                  </div>
                  {e.applicant_message && (
                    <p className="mt-1.5 text-[13px] text-body line-clamp-2">{e.applicant_message}</p>
                  )}
                  {e.lost_reason && (
                    <p className="mt-1.5 text-[12px] text-rose-600">
                      {t('Motivo')}: {t(e.lost_reason)}
                    </p>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
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
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/30 backdrop-blur-sm"
          onClick={() => setParty(null)}
        >
          <div className="rounded-3xl bg-canvas border border-hairline shadow-2xl px-10 py-8 text-center max-w-sm mx-4">
            <Sparkles className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-ink">{party.title}</h2>
            <p className="mt-1 text-sm text-body">{party.subtitle}</p>
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4" onClick={onCancel}>
      <div className="w-full max-w-md rounded-2xl bg-canvas border border-hairline shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
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
          className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ink/10 mb-4"
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
