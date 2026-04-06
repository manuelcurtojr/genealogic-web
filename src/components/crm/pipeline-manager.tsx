'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Plus, Trash2, GripVertical, ChevronLeft, Loader2, Settings, Pencil } from 'lucide-react'

interface Stage {
  id: string
  name: string
  position: number
  color: string
}

interface Pipeline {
  id: string
  name: string
  stages: Stage[]
}

interface Props {
  open: boolean
  onClose: () => void
  pipelines: Pipeline[]
  deals: any[]
  userId: string
  onPipelinesChanged: () => void
}

const STAGE_COLORS = ['#3B82F6', '#06B6D4', '#8B5CF6', '#F59E0B', '#14B8A6', '#EC4899', '#EF4444', '#10B981', '#6366F1', '#F97316']

const DEFAULT_PIPELINES = [
  {
    name: 'Ventas',
    stages: [
      { name: 'Contacto nuevo', position: 0, color: '#3B82F6' },
      { name: 'Primer mensaje enviado', position: 1, color: '#06B6D4' },
      { name: 'Informacion recibida', position: 2, color: '#8B5CF6' },
      { name: 'Oferta enviada', position: 3, color: '#F59E0B' },
      { name: 'Seguimiento', position: 4, color: '#14B8A6' },
      { name: 'Venta ganada', position: 98, color: '#10B981' },
      { name: 'Venta perdida', position: 99, color: '#EF4444' },
    ],
  },
  {
    name: 'Seguimiento',
    stages: [
      { name: 'Reserva en firme', position: 0, color: '#3B82F6' },
      { name: 'Esperando camada', position: 1, color: '#8B5CF6' },
      { name: 'Cachorro asignado', position: 2, color: '#F59E0B' },
      { name: 'Pendiente de envio', position: 3, color: '#06B6D4' },
      { name: 'Perro entregado', position: 98, color: '#10B981' },
      { name: 'Reserva cancelada', position: 99, color: '#EF4444' },
    ],
  },
]

type Mode = 'list' | 'create' | 'edit'

interface EditStage {
  id: string | null // null = new stage
  name: string
  color: string
  position: number
  isWon: boolean
  isLost: boolean
}

export default function PipelineManager({ open, onClose, pipelines, deals, userId, onPipelinesChanged }: Props) {
  const [mode, setMode] = useState<Mode>('list')
  const [editingPipelineId, setEditingPipelineId] = useState<string | null>(null)
  const [pipelineName, setPipelineName] = useState('')
  const [editStages, setEditStages] = useState<EditStage[]>([])
  const [saving, setSaving] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  function openCreate() {
    setMode('create')
    setPipelineName('')
  }

  function openEdit(pipeline: Pipeline) {
    setMode('edit')
    setEditingPipelineId(pipeline.id)
    setPipelineName(pipeline.name)
    const sorted = [...pipeline.stages].sort((a, b) => a.position - b.position)
    setEditStages(sorted.map(s => ({
      id: s.id,
      name: s.name,
      color: s.color || '#3B82F6',
      position: s.position,
      isWon: s.position === 98,
      isLost: s.position === 99,
    })))
  }

  function goBack() {
    setMode('list')
    setEditingPipelineId(null)
    setPipelineName('')
    setEditStages([])
  }

  function handleClose() {
    goBack()
    onClose()
  }

  // === CREATE ===
  async function handleCreate() {
    if (!pipelineName.trim()) return
    setSaving(true)
    const supabase = createClient()

    const { data: newPipeline } = await supabase
      .from('pipelines')
      .insert({ name: pipelineName.trim(), owner_id: userId })
      .select('id')
      .single()

    if (newPipeline) {
      const defaultDef = DEFAULT_PIPELINES.find(dp => dp.name.toLowerCase() === pipelineName.trim().toLowerCase())
      const stageDefs = defaultDef?.stages || [
        { name: 'Nuevo', position: 0, color: '#3B82F6' },
        { name: 'En progreso', position: 1, color: '#F59E0B' },
        { name: 'Ganado', position: 98, color: '#10B981' },
        { name: 'Perdido', position: 99, color: '#EF4444' },
      ]
      await supabase.from('pipeline_stages').insert(
        stageDefs.map(s => ({ ...s, pipeline_id: newPipeline.id }))
      )
    }

    setSaving(false)
    onPipelinesChanged()
    goBack()
  }

  // === SAVE EDIT ===
  async function handleSaveEdit() {
    if (!editingPipelineId || !pipelineName.trim()) return
    setSaving(true)
    const supabase = createClient()

    // Update pipeline name
    await supabase.from('pipelines').update({ name: pipelineName.trim() }).eq('id', editingPipelineId)

    const pipeline = pipelines.find(p => p.id === editingPipelineId)
    const existingIds = new Set(pipeline?.stages.map(s => s.id) || [])

    // Recalculate positions for normal stages (not won/lost)
    const normalStages = editStages.filter(s => !s.isWon && !s.isLost)
    const wonStage = editStages.find(s => s.isWon)
    const lostStage = editStages.find(s => s.isLost)

    const allStages = [
      ...normalStages.map((s, i) => ({ ...s, position: i })),
      ...(wonStage ? [{ ...wonStage, position: 98 }] : []),
      ...(lostStage ? [{ ...lostStage, position: 99 }] : []),
    ]

    // Delete removed stages
    const currentIds = new Set(allStages.filter(s => s.id).map(s => s.id!))
    for (const oldId of existingIds) {
      if (!currentIds.has(oldId)) {
        await supabase.from('pipeline_stages').delete().eq('id', oldId)
      }
    }

    // Upsert stages
    for (const stage of allStages) {
      if (stage.id && existingIds.has(stage.id)) {
        await supabase.from('pipeline_stages').update({
          name: stage.name,
          color: stage.color,
          position: stage.position,
        }).eq('id', stage.id)
      } else {
        await supabase.from('pipeline_stages').insert({
          pipeline_id: editingPipelineId,
          name: stage.name,
          color: stage.color,
          position: stage.position,
        })
      }
    }

    setSaving(false)
    onPipelinesChanged()
    goBack()
  }

  // === DELETE PIPELINE ===
  async function handleDeletePipeline(pipelineId: string) {
    const dealCount = deals.filter((d: any) => d.pipeline_id === pipelineId).length
    if (!confirm(`Eliminar este pipeline${dealCount > 0 ? ` y sus ${dealCount} negocios` : ''}? Esta accion no se puede deshacer.`)) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('deals').delete().eq('pipeline_id', pipelineId)
    await supabase.from('pipeline_stages').delete().eq('pipeline_id', pipelineId)
    await supabase.from('pipelines').delete().eq('id', pipelineId)
    setSaving(false)
    onPipelinesChanged()
    goBack()
  }

  // === STAGE EDITING ===
  function addStage() {
    const normalStages = editStages.filter(s => !s.isWon && !s.isLost)
    const newPos = normalStages.length
    const color = STAGE_COLORS[newPos % STAGE_COLORS.length]
    const wonIdx = editStages.findIndex(s => s.isWon)
    // Insert before won/lost stages
    const insertAt = wonIdx >= 0 ? wonIdx : editStages.length
    const updated = [...editStages]
    updated.splice(insertAt, 0, { id: null, name: '', color, position: newPos, isWon: false, isLost: false })
    setEditStages(updated)
  }

  function removeStage(idx: number) {
    const stage = editStages[idx]
    if (stage.isWon || stage.isLost) return
    if (stage.id) {
      const stageDeals = deals.filter((d: any) => d.stage_id === stage.id)
      if (stageDeals.length > 0) {
        alert(`No se puede eliminar esta etapa porque tiene ${stageDeals.length} negocios. Muevelos primero.`)
        return
      }
    }
    setEditStages(prev => prev.filter((_, i) => i !== idx))
  }

  function updateStage(idx: number, field: string, value: string) {
    setEditStages(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s))
  }

  // Drag reorder (only normal stages)
  function handleDragStart(idx: number) {
    if (editStages[idx].isWon || editStages[idx].isLost) return
    setDragIdx(idx)
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault()
    if (editStages[idx].isWon || editStages[idx].isLost) return
    setDragOverIdx(idx)
  }

  function handleDrop(idx: number) {
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setDragOverIdx(null); return }
    if (editStages[idx].isWon || editStages[idx].isLost) { setDragIdx(null); setDragOverIdx(null); return }

    const updated = [...editStages]
    const [moved] = updated.splice(dragIdx, 1)
    updated.splice(idx, 0, moved)
    setEditStages(updated)
    setDragIdx(null)
    setDragOverIdx(null)
  }

  // Create mode stage preview
  const createStagePreview = (() => {
    const match = DEFAULT_PIPELINES.find(dp => dp.name.toLowerCase() === pipelineName.trim().toLowerCase())
    return match?.stages || [
      { name: 'Nuevo', position: 0, color: '#3B82F6' },
      { name: 'En progreso', position: 1, color: '#F59E0B' },
      { name: 'Ganado', position: 98, color: '#10B981' },
      { name: 'Perdido', position: 99, color: '#EF4444' },
    ]
  })()

  return (
    <>
      <div className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={handleClose} />
      <div className={`fixed top-0 right-0 h-full w-full max-w-md z-[70] bg-gray-900 border-l border-white/10 shadow-2xl transition-transform duration-300 flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            {mode !== 'list' && (
              <button onClick={goBack} className="text-white/40 hover:text-white transition mr-1">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-lg font-semibold">
              {mode === 'list' ? 'Pipelines' : mode === 'create' ? 'Nuevo Pipeline' : 'Editar Pipeline'}
            </h2>
          </div>
          <button onClick={handleClose} className="text-white/40 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* === LIST MODE === */}
          {mode === 'list' && (
            <div className="space-y-3">
              {pipelines.map((p: any) => {
                const dealCount = deals.filter((d: any) => d.pipeline_id === p.id).length
                const stageCount = p.stages?.length || 0
                return (
                  <button
                    key={p.id}
                    onClick={() => openEdit(p)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-4 text-left hover:border-[#D74709]/40 hover:bg-white/[0.06] transition group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{p.name}</p>
                        <p className="text-xs text-white/40 mt-0.5">{stageCount} etapas · {dealCount} negocios</p>
                      </div>
                      <Pencil className="w-4 h-4 text-white/20 group-hover:text-[#D74709] transition" />
                    </div>
                    {/* Stage dots preview */}
                    <div className="flex gap-1 mt-2.5">
                      {[...(p.stages || [])].sort((a: any, b: any) => a.position - b.position).map((s: any) => (
                        <div key={s.id} className="h-1.5 flex-1 rounded-full" style={{ background: s.color || '#666' }} />
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* === CREATE MODE === */}
          {mode === 'create' && (
            <div className="space-y-5">
              <div>
                <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">Nombre del pipeline</label>
                <input
                  type="text"
                  value={pipelineName}
                  onChange={e => setPipelineName(e.target.value)}
                  placeholder="Ej: Ventas, Seguimiento, Montas..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                />
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-white/50 mb-1">Etapas que se crearan:</p>
                {createStagePreview.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 py-0.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                    <span className="text-sm text-white/60">{s.name}</span>
                    {s.position >= 98 && <span className="text-[10px] text-white/25 ml-auto">{s.position === 98 ? 'Ganado' : 'Perdido'}</span>}
                  </div>
                ))}
                <p className="text-[11px] text-white/20 pt-1">Escribe &quot;Ventas&quot; o &quot;Seguimiento&quot; para etapas predefinidas.</p>
              </div>
            </div>
          )}

          {/* === EDIT MODE === */}
          {mode === 'edit' && (
            <div className="space-y-5">
              {/* Pipeline name */}
              <div>
                <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">Nombre del pipeline</label>
                <input
                  type="text"
                  value={pipelineName}
                  onChange={e => setPipelineName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition"
                />
              </div>

              {/* Stage editor */}
              <div>
                <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-2 block">Etapas</label>
                <div className="space-y-1.5">
                  {editStages.map((stage, idx) => {
                    const isSpecial = stage.isWon || stage.isLost
                    const isDragTarget = dragOverIdx === idx && dragIdx !== idx
                    return (
                      <div
                        key={stage.id || `new-${idx}`}
                        draggable={!isSpecial}
                        onDragStart={() => handleDragStart(idx)}
                        onDragOver={e => handleDragOver(e, idx)}
                        onDragEnd={() => { setDragIdx(null); setDragOverIdx(null) }}
                        onDrop={() => handleDrop(idx)}
                        className={`flex items-center gap-2 bg-white/[0.03] border rounded-lg px-2 py-1.5 transition ${
                          isDragTarget ? 'border-[#D74709]/50 bg-[#D74709]/5' : 'border-white/5'
                        } ${dragIdx === idx ? 'opacity-40' : ''}`}
                      >
                        {/* Drag handle */}
                        {!isSpecial ? (
                          <GripVertical className="w-3.5 h-3.5 text-white/15 cursor-grab active:cursor-grabbing flex-shrink-0" />
                        ) : (
                          <div className="w-3.5 flex-shrink-0" />
                        )}

                        {/* Color picker */}
                        <input
                          type="color"
                          value={stage.color}
                          onChange={e => updateStage(idx, 'color', e.target.value)}
                          className="w-5 h-5 rounded border-0 bg-transparent cursor-pointer flex-shrink-0 p-0"
                          style={{ WebkitAppearance: 'none' }}
                        />

                        {/* Name input */}
                        <input
                          type="text"
                          value={stage.name}
                          onChange={e => updateStage(idx, 'name', e.target.value)}
                          placeholder="Nombre de etapa"
                          className="flex-1 bg-transparent border-0 text-sm text-white placeholder:text-white/25 focus:outline-none min-w-0"
                        />

                        {/* Special badge */}
                        {stage.isWon && <span className="text-[9px] font-bold text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded flex-shrink-0">GANADO</span>}
                        {stage.isLost && <span className="text-[9px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded flex-shrink-0">PERDIDO</span>}

                        {/* Delete button */}
                        {!isSpecial && (
                          <button
                            onClick={() => removeStage(idx)}
                            className="text-white/15 hover:text-red-400 transition flex-shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Add stage button */}
                <button
                  onClick={addStage}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-white/10 text-xs text-white/40 hover:text-white/60 hover:border-white/20 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Anadir etapa
                </button>
              </div>

              {/* Delete pipeline */}
              {pipelines.length > 1 && editingPipelineId && (
                <div className="pt-4 border-t border-white/5">
                  <button
                    onClick={() => handleDeletePipeline(editingPipelineId)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm text-red-400 bg-red-500/5 border border-red-500/15 hover:bg-red-500/10 transition"
                  >
                    <Trash2 className="w-4 h-4" /> Eliminar pipeline
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 flex-shrink-0">
          {mode === 'list' ? (
            <>
              <div />
              <button
                onClick={openCreate}
                className="bg-[#D74709] hover:bg-[#c03d07] text-white font-semibold px-6 py-2.5 rounded-lg transition flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" /> Nuevo pipeline
              </button>
            </>
          ) : (
            <>
              <button onClick={goBack} className="px-4 py-2.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition">
                Cancelar
              </button>
              <button
                onClick={mode === 'create' ? handleCreate : handleSaveEdit}
                disabled={saving || !pipelineName.trim()}
                className="bg-[#D74709] hover:bg-[#c03d07] text-white font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-50 flex items-center gap-2 text-sm"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? 'Guardando...' : mode === 'create' ? 'Crear pipeline' : 'Guardar cambios'}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
