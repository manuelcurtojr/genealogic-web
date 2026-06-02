'use client'

/**
 * Editor de configuración del Embudo: pipelines y pasos.
 * Reglas (validadas en servidor): cada pipeline >=1 normal, >=1 ganado, >=1 perdido.
 */
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Trash2, ChevronUp, ChevronDown, ArrowLeft, Star } from 'lucide-react'
import { useT } from '@/components/i18n/locale-provider'
import type { Pipeline, Stage, StageType } from '@/lib/pipelines/types'
import {
  createPipeline,
  renamePipeline,
  deletePipeline,
  createStage,
  updateStage,
  deleteStage,
  reorderStage,
  setEntryStage,
} from '@/lib/pipelines/config-actions'

type Res = { ok: boolean; error?: string }

export default function FunnelConfig({ pipelines }: { pipelines: Pipeline[] }) {
  const t = useT()
  const router = useRouter()
  const [pending, start] = useTransition()
  const [pid, setPid] = useState(pipelines[0]?.id ?? '')
  const pipeline = pipelines.find((p) => p.id === pid) ?? pipelines[0]

  const [newStageName, setNewStageName] = useState('')
  const [newStageType, setNewStageType] = useState<StageType>('normal')

  function run(promise: Promise<Res>) {
    start(async () => {
      const r = await promise
      if (!r.ok && r.error) alert(r.error)
      router.refresh()
    })
  }

  function addPipeline() {
    const name = window.prompt(t('Nombre del nuevo pipeline'))
    if (name && name.trim()) run(createPipeline(name.trim()))
  }
  function rename(p: Pipeline) {
    const name = window.prompt(t('Nuevo nombre'), p.name)
    if (name && name.trim()) run(renamePipeline(p.id, name.trim()))
  }
  function removePipeline(p: Pipeline) {
    if (window.confirm(t('¿Borrar este pipeline?'))) run(deletePipeline(p.id))
  }

  const typeLabel: Record<StageType, string> = {
    normal: t('Normal'),
    won: t('Ganado'),
    lost: t('Perdido'),
  }

  // Opciones de handoff: pasos de OTROS pipelines (al ganar, clona allí)
  const handoffOptions = pipelines
    .filter((p) => p.id !== pipeline?.id)
    .flatMap((p) => p.stages.map((s) => ({ id: s.id, label: `${t(p.name)} → ${t(s.name)}` })))

  if (!pipeline) {
    return (
      <div className="max-w-3xl mx-auto py-10">
        <p className="text-body">{t('No hay pipelines configurados.')}</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-1">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Link href="/embudo" className="text-muted hover:text-ink">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-ink tracking-tight">{t('Configurar embudo')}</h1>
        </div>
        <button
          onClick={addPipeline}
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-lg bg-ink text-on-primary px-3 py-2 text-xs font-bold hover:opacity-90 disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" /> {t('Pipeline')}
        </button>
      </div>

      {/* Pestañas de pipeline */}
      <div className="flex gap-2 border-b border-hairline mb-5 overflow-x-auto">
        {pipelines.map((p) => (
          <button
            key={p.id}
            onClick={() => setPid(p.id)}
            className={
              'px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px ' +
              (p.id === pipeline.id ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink')
            }
          >
            {t(p.name)}
          </button>
        ))}
      </div>

      {/* Cabecera del pipeline seleccionado */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-ink">{t(pipeline.name)}</h2>
          <button onClick={() => rename(pipeline)} className="text-xs text-muted hover:text-ink underline">
            {t('Renombrar')}
          </button>
        </div>
        <button
          onClick={() => removePipeline(pipeline)}
          disabled={pending}
          className="text-xs text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 disabled:opacity-50"
        >
          <Trash2 className="w-3.5 h-3.5" /> {t('Borrar pipeline')}
        </button>
      </div>

      {/* Pasos */}
      <ul className="space-y-2.5 mb-4">
        {pipeline.stages.map((s, i) => (
          <StageRow
            key={s.id}
            stage={s}
            index={i}
            total={pipeline.stages.length}
            pending={pending}
            typeLabel={typeLabel}
            handoffOptions={handoffOptions}
            onReorder={(dir) => run(reorderStage(s.id, dir))}
            onSetEntry={() => run(setEntryStage(pipeline.id, s.id))}
            onUpdate={(patch) => run(updateStage(s.id, patch))}
            onDelete={() => {
              if (window.confirm(t('¿Borrar este paso?'))) run(deleteStage(s.id))
            }}
          />
        ))}
      </ul>

      {/* Añadir paso */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-hairline p-3">
        <input
          value={newStageName}
          onChange={(e) => setNewStageName(e.target.value)}
          placeholder={t('Nombre del paso')}
          className="flex-1 min-w-[140px] rounded-lg border border-hairline bg-canvas px-3 h-9 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ink/10"
        />
        <select
          value={newStageType}
          onChange={(e) => setNewStageType(e.target.value as StageType)}
          className="rounded-lg border border-hairline bg-canvas px-2.5 h-9 text-sm text-ink"
        >
          <option value="normal">{typeLabel.normal}</option>
          <option value="won">{typeLabel.won}</option>
          <option value="lost">{typeLabel.lost}</option>
        </select>
        <button
          onClick={() => {
            if (newStageName.trim()) {
              run(createStage(pipeline.id, newStageName.trim(), newStageType))
              setNewStageName('')
              setNewStageType('normal')
            }
          }}
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-lg bg-ink text-on-primary px-3 h-9 text-xs font-bold hover:opacity-90 disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" /> {t('Añadir paso')}
        </button>
      </div>

      <p className="mt-3 text-[11px] text-muted">
        {t('Cada pipeline necesita al menos 1 paso normal, 1 ganado y 1 perdido.')}
      </p>
    </div>
  )
}

function StageRow({
  stage,
  index,
  total,
  pending,
  typeLabel,
  handoffOptions,
  onReorder,
  onSetEntry,
  onUpdate,
  onDelete,
}: {
  stage: Stage
  index: number
  total: number
  pending: boolean
  typeLabel: Record<StageType, string>
  handoffOptions: { id: string; label: string }[]
  onReorder: (dir: 'up' | 'down') => void
  onSetEntry: () => void
  onUpdate: (patch: {
    name?: string
    type?: StageType
    loss_reasons?: string[]
    celebrate?: boolean
    handoff_stage_id?: string | null
  }) => void
  onDelete: () => void
}) {
  const t = useT()
  const [name, setName] = useState(stage.name)
  const tone = stage.type === 'won' ? 'emerald' : stage.type === 'lost' ? 'rose' : 'ink'

  return (
    <li className="rounded-xl border border-hairline bg-canvas p-3">
      <div className="flex items-center gap-2">
        <div className="flex flex-col">
          <button
            onClick={() => onReorder('up')}
            disabled={pending || index === 0}
            className="text-muted hover:text-ink disabled:opacity-30"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => onReorder('down')}
            disabled={pending || index === total - 1}
            className="text-muted hover:text-ink disabled:opacity-30"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => name.trim() && name !== stage.name && onUpdate({ name: name.trim() })}
          className="flex-1 min-w-0 rounded-lg border border-hairline bg-canvas px-3 h-9 text-sm font-medium text-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
        />

        <select
          value={stage.type}
          onChange={(e) => onUpdate({ type: e.target.value as StageType })}
          disabled={pending}
          className={
            'rounded-lg border px-2.5 h-9 text-xs font-semibold ' +
            (tone === 'emerald'
              ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
              : tone === 'rose'
              ? 'border-rose-300 text-rose-700 bg-rose-50'
              : 'border-hairline text-ink bg-canvas')
          }
        >
          <option value="normal">{typeLabel.normal}</option>
          <option value="won">{typeLabel.won}</option>
          <option value="lost">{typeLabel.lost}</option>
        </select>

        <button
          onClick={onSetEntry}
          title={t('Paso de entrada (donde caen las solicitudes nuevas)')}
          className={'p-1.5 rounded-lg ' + (stage.is_entry ? 'text-amber-500' : 'text-muted hover:text-ink')}
        >
          <Star className="w-4 h-4" fill={stage.is_entry ? 'currentColor' : 'none'} />
        </button>

        <button onClick={onDelete} disabled={pending} className="p-1.5 text-rose-500 hover:text-rose-700 disabled:opacity-50">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Opciones según tipo */}
      {stage.type === 'lost' && (
        <div className="mt-2.5 pl-8">
          <label className="text-[11px] text-muted block mb-1">{t('Motivos de pérdida (uno por línea)')}</label>
          <textarea
            defaultValue={(stage.loss_reasons || []).join('\n')}
            onBlur={(e) =>
              onUpdate({
                loss_reasons: e.target.value
                  .split('\n')
                  .map((r) => r.trim())
                  .filter(Boolean),
              })
            }
            rows={3}
            className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
          />
        </div>
      )}
      {stage.type === 'won' && (
        <div className="mt-2.5 pl-8 flex flex-wrap items-center gap-4">
          <label className="inline-flex items-center gap-2 text-xs text-body">
            <input
              type="checkbox"
              defaultChecked={stage.celebrate}
              onChange={(e) => onUpdate({ celebrate: e.target.checked })}
              className="accent-ink"
            />
            {t('Celebrar con confeti')}
          </label>
          <label className="inline-flex items-center gap-2 text-xs text-body">
            {t('Al ganar, clonar a:')}
            <select
              defaultValue={stage.handoff_stage_id ?? ''}
              onChange={(e) => onUpdate({ handoff_stage_id: e.target.value || null })}
              className="rounded-lg border border-hairline bg-canvas px-2 h-8 text-xs text-ink"
            >
              <option value="">{t('Nada')}</option>
              {handoffOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
    </li>
  )
}
