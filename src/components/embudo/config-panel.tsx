'use client'

/** Panel lateral para crear / configurar un funnel (pipeline + pasos). */
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { useT } from '@/components/i18n/locale-provider'
import Drawer from './drawer'
import StageRow from './stage-row'
import type { Pipeline, StageType } from '@/lib/pipelines/types'
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

type State = { mode: 'create' } | { mode: 'edit'; pipelineId: string }
type Res = { ok: boolean; error?: string }

export default function ConfigPanel({
  pipelines,
  state,
  onState,
  onClose,
}: {
  pipelines: Pipeline[]
  state: State
  onState: (s: State) => void
  onClose: () => void
}) {
  const t = useT()
  const router = useRouter()
  const [pending, start] = useTransition()
  const [name, setName] = useState('')
  const [newStageName, setNewStageName] = useState('')
  const [newStageType, setNewStageType] = useState<StageType>('normal')

  function run(promise: Promise<Res>) {
    start(async () => {
      const r = await promise
      if (!r.ok && r.error) alert(r.error)
      router.refresh()
    })
  }

  const typeLabel: Record<StageType, string> = {
    normal: t('Normal'),
    won: t('Ganado'),
    lost: t('Perdido'),
  }

  // ── modo crear ──
  if (state.mode === 'create') {
    return (
      <Drawer title={t('Nuevo embudo')} onClose={onClose}>
        <label className="block text-xs font-semibold text-muted mb-1.5">{t('Nombre del embudo')}</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && create()}
          placeholder={t('Ej. Lista de espera')}
          className="w-full rounded-lg border border-hairline bg-canvas px-3 h-10 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ink/10"
        />
        <p className="mt-2 text-[11px] text-muted">
          {t('Se crea con un paso normal, uno ganado y uno perdido. Luego los configuras.')}
        </p>
        <button
          onClick={create}
          disabled={pending || !name.trim()}
          className="mt-4 inline-flex items-center justify-center gap-1.5 w-full rounded-lg bg-ink text-on-primary px-4 py-2.5 text-sm font-bold hover:opacity-90 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> {t('Crear embudo')}
        </button>
      </Drawer>
    )
  }

  function create() {
    if (!name.trim()) return
    start(async () => {
      const r = await createPipeline(name.trim())
      if (!r.ok) {
        alert(r.error)
        return
      }
      onState({ mode: 'edit', pipelineId: r.id })
      router.refresh()
    })
  }

  // ── modo editar ──
  const pipeline = pipelines.find((p) => p.id === state.pipelineId)
  if (!pipeline) {
    return (
      <Drawer title={t('Configurar embudo')} onClose={onClose}>
        <p className="text-sm text-muted">{t('Cargando…')}</p>
      </Drawer>
    )
  }

  const handoffOptions = pipelines
    .filter((p) => p.id !== pipeline.id)
    .flatMap((p) => p.stages.map((s) => ({ id: s.id, label: `${t(p.name)} → ${t(s.name)}` })))

  function rename() {
    const nm = window.prompt(t('Nuevo nombre'), pipeline!.name)
    if (nm && nm.trim()) run(renamePipeline(pipeline!.id, nm.trim()))
  }
  function remove() {
    if (window.confirm(t('¿Borrar este pipeline?'))) {
      run(deletePipeline(pipeline!.id))
      onClose()
    }
  }

  return (
    <Drawer
      title={
        <span className="inline-flex items-center gap-2">
          {t(pipeline.name)}
          <button onClick={rename} className="text-xs font-normal text-muted hover:text-ink underline">
            {t('Renombrar')}
          </button>
        </span>
      }
      subtitle={t('Configura los pasos del embudo')}
      onClose={onClose}
      footer={
        <button
          onClick={remove}
          disabled={pending}
          className="text-xs text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 disabled:opacity-50"
        >
          <Trash2 className="w-3.5 h-3.5" /> {t('Borrar pipeline')}
        </button>
      }
    >
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
            onDelete={() => window.confirm(t('¿Borrar este paso?')) && run(deleteStage(s.id))}
          />
        ))}
      </ul>

      <div className="rounded-xl border border-dashed border-hairline p-3 space-y-2">
        <input
          value={newStageName}
          onChange={(e) => setNewStageName(e.target.value)}
          placeholder={t('Nombre del paso')}
          className="w-full rounded-lg border border-hairline bg-canvas px-3 h-9 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ink/10"
        />
        <div className="flex gap-2">
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
            className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-ink text-on-primary px-3 h-9 text-xs font-bold hover:opacity-90 disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" /> {t('Añadir paso')}
          </button>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-muted">
        {t('Cada pipeline necesita al menos 1 paso normal, 1 ganado y 1 perdido.')}
      </p>
    </Drawer>
  )
}
