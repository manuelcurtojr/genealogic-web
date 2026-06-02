'use client'

/**
 * Fila de edición de un paso del embudo. Componente "tonto": recibe el paso y
 * callbacks; no llama a server actions directamente (lo hace el padre).
 * Compartido entre el editor a página completa y el panel lateral.
 */
import { useState } from 'react'
import { Trash2, ChevronUp, ChevronDown, Star } from 'lucide-react'
import { useT } from '@/components/i18n/locale-provider'
import type { Stage, StageType } from '@/lib/pipelines/types'

export default function StageRow({
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
