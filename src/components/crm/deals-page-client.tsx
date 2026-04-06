'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, GripVertical, HandCoins, Trash2, X, Loader2, BarChart3, Trophy, XCircle, Copy } from 'lucide-react'
import PipelineSummary from './pipeline-summary'
import CrmDashboard from './crm-dashboard'
import DealForm from './deal-form'

interface DealsPageClientProps {
  initialDeals: any[]
  pipelines: any[]
  contacts: any[]
  userId: string
}

const WON_PATTERNS = /ganad|entregad/i
const LOST_PATTERNS = /perdid|cancelad/i

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

export default function DealsPageClient({ initialDeals, pipelines: initialPipelines, contacts, userId }: DealsPageClientProps) {
  const [deals, setDeals] = useState(initialDeals)
  const [pipelines, setPipelines] = useState(initialPipelines)
  const [activePipelineId, setActivePipelineId] = useState(initialPipelines[0]?.id || '')
  const [showForm, setShowForm] = useState(false)
  const [editingDeal, setEditingDeal] = useState<any>(null)
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null)
  const [showPipelineMenu, setShowPipelineMenu] = useState(false)
  const [showNewPipeline, setShowNewPipeline] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)
  const [newPipelineName, setNewPipelineName] = useState('')
  const [creating, setCreating] = useState(false)

  // Won/Lost modals
  const [wonModal, setWonModal] = useState<{ dealId: string; dealTitle: string } | null>(null)
  const [lostModal, setLostModal] = useState<{ dealId: string; stageId: string } | null>(null)
  const [lostReason, setLostReason] = useState('')
  const [savingLost, setSavingLost] = useState(false)
  const [cloning, setCloning] = useState(false)

  const activePipeline = pipelines.find((p: any) => p.id === activePipelineId)
  const stages = activePipeline?.stages || []
  const sortedStages = [...stages].sort((a: any, b: any) => a.position - b.position)
  const pipelineDeals = deals.filter((d: any) => d.pipeline_id === activePipelineId)

  const isWonStage = (name: string) => WON_PATTERNS.test(name)
  const isLostStage = (name: string) => LOST_PATTERNS.test(name)

  const dealsWithStageName = pipelineDeals.map((d: any) => ({
    ...d,
    stage_name: stages.find((s: any) => s.id === d.stage_id)?.name || '',
  }))

  const dealsByStage = (stageId: string) => pipelineDeals.filter((d: any) => d.stage_id === stageId)

  const fetchDeals = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('deals')
      .select('id, title, value, currency, contact_id, stage_id, pipeline_id, lost_reason, is_reservation, advance_amount, contact:contacts(id, name)')
      .eq('owner_id', userId)
      .order('updated_at', { ascending: false })
    setDeals(data || [])
  }, [userId])

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData('dealId', dealId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverStageId(stageId)
  }

  const handleDragLeave = () => setDragOverStageId(null)

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    setDragOverStageId(null)
    const dealId = e.dataTransfer.getData('dealId')
    if (!dealId) return

    const targetStage = stages.find((s: any) => s.id === stageId)
    if (!targetStage) return

    // Check if moving to won/lost stage
    if (isWonStage(targetStage.name)) {
      const deal = deals.find((d: any) => d.id === dealId)
      // Move first, then show modal
      setDeals(prev => prev.map((d: any) => d.id === dealId ? { ...d, stage_id: stageId } : d))
      const supabase = createClient()
      await supabase.from('deals').update({ stage_id: stageId }).eq('id', dealId)
      setWonModal({ dealId, dealTitle: deal?.title || '' })
      return
    }

    if (isLostStage(targetStage.name)) {
      setLostModal({ dealId, stageId })
      return
    }

    // Normal move
    setDeals(prev => prev.map((d: any) => d.id === dealId ? { ...d, stage_id: stageId } : d))
    const supabase = createClient()
    await supabase.from('deals').update({ stage_id: stageId }).eq('id', dealId)
  }

  const handleSaveLostReason = async () => {
    if (!lostModal) return
    setSavingLost(true)
    const supabase = createClient()
    await supabase.from('deals').update({
      stage_id: lostModal.stageId,
      lost_reason: lostReason || null,
    }).eq('id', lostModal.dealId)
    setDeals(prev => prev.map((d: any) => d.id === lostModal.dealId ? { ...d, stage_id: lostModal.stageId, lost_reason: lostReason } : d))
    setSavingLost(false)
    setLostModal(null)
    setLostReason('')
  }

  const handleCloneToSeguimiento = async () => {
    if (!wonModal) return
    setCloning(true)
    const supabase = createClient()

    // Find Seguimiento pipeline
    const seguimiento = pipelines.find((p: any) => /seguimiento/i.test(p.name))
    if (!seguimiento || !seguimiento.stages?.length) {
      setCloning(false)
      setWonModal(null)
      return
    }

    const firstStage = [...seguimiento.stages].sort((a: any, b: any) => a.position - b.position)[0]
    const originalDeal = deals.find((d: any) => d.id === wonModal.dealId)

    if (originalDeal && firstStage) {
      await supabase.from('deals').insert({
        title: `${originalDeal.title} (Logistica)`,
        value: originalDeal.value,
        currency: originalDeal.currency,
        contact_id: originalDeal.contact_id,
        is_reservation: originalDeal.is_reservation,
        advance_amount: originalDeal.advance_amount,
        stage_id: firstStage.id,
        pipeline_id: seguimiento.id,
        owner_id: userId,
      })
      await fetchDeals()
    }

    setCloning(false)
    setWonModal(null)
  }

  const handleNewDeal = () => { setEditingDeal(null); setShowForm(true) }
  const handleEditDeal = (deal: any) => { setEditingDeal(deal); setShowForm(true) }

  async function createPipeline(customName?: string) {
    const name = customName || newPipelineName.trim()
    if (!name) return
    setCreating(true)
    const supabase = createClient()

    const { data: newPipeline, error } = await supabase
      .from('pipelines')
      .insert({ name, owner_id: userId })
      .select('id, name')
      .single()

    if (error || !newPipeline) { setCreating(false); return }

    // Find matching default stages
    const defaultDef = DEFAULT_PIPELINES.find(dp => dp.name.toLowerCase() === name.toLowerCase())
    const stageDefs = defaultDef?.stages || [
      { name: 'Nuevo', position: 0, color: '#3B82F6' },
      { name: 'En progreso', position: 1, color: '#F59E0B' },
      { name: 'Ganado', position: 98, color: '#10B981' },
      { name: 'Perdido', position: 99, color: '#EF4444' },
    ]

    const { data: createdStages } = await supabase
      .from('pipeline_stages')
      .insert(stageDefs.map(s => ({ ...s, pipeline_id: newPipeline.id })))
      .select('id, name, position, color')

    const fullPipeline = { ...newPipeline, stages: (createdStages || []).sort((a, b) => a.position - b.position) }
    setPipelines((prev: any) => [...prev, fullPipeline])
    setActivePipelineId(newPipeline.id)
    setNewPipelineName('')
    setShowNewPipeline(false)
    setCreating(false)
  }

  async function deletePipeline(pipelineId: string) {
    if (!confirm('Eliminar este pipeline y todos sus negocios?')) return
    const supabase = createClient()
    await supabase.from('deals').delete().eq('pipeline_id', pipelineId)
    await supabase.from('pipeline_stages').delete().eq('pipeline_id', pipelineId)
    await supabase.from('pipelines').delete().eq('id', pipelineId)
    setPipelines((prev: any) => prev.filter((p: any) => p.id !== pipelineId))
    setDeals((prev: any) => prev.filter((d: any) => d.pipeline_id !== pipelineId))
    if (activePipelineId === pipelineId) {
      const remaining = pipelines.filter((p: any) => p.id !== pipelineId)
      setActivePipelineId(remaining[0]?.id || '')
    }
  }

  // Check if we need to show "Create default pipelines" button
  const hasNoPipelines = pipelines.length === 0

  const wonStageNames = sortedStages.filter((s: any) => isWonStage(s.name)).map((s: any) => s.name)
  const lostStageNames = sortedStages.filter((s: any) => isLostStage(s.name)).map((s: any) => s.name)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Negocios</h1>
          <p className="text-white/50 text-sm mt-1">{pipelineDeals.length} negocios en {activePipeline?.name || 'pipeline'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDashboard(!showDashboard)}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition border ${showDashboard ? 'bg-[#D74709]/15 text-[#D74709] border-[#D74709]/30' : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'}`}
          >
            <BarChart3 className="w-4 h-4" /> Dashboard
          </button>
          <button onClick={handleNewDeal} className="bg-[#D74709] hover:bg-[#c03d07] text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition">
            <Plus className="w-4 h-4" /> Nuevo negocio
          </button>
        </div>
      </div>

      {/* Pipeline tabs */}
      {!hasNoPipelines && (
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
          {pipelines.map((p: any) => (
            <button
              key={p.id}
              onClick={() => setActivePipelineId(p.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                activePipelineId === p.id
                  ? 'bg-[#D74709]/15 text-[#D74709] border border-[#D74709]/30'
                  : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
              }`}
            >
              {p.name}
              <span className="text-[11px] opacity-60 ml-1">
                ({deals.filter((d: any) => d.pipeline_id === p.id).length})
              </span>
            </button>
          ))}
          <div className="relative">
            <button
              onClick={() => setShowPipelineMenu(!showPipelineMenu)}
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white/60 hover:bg-white/10 transition"
            >
              <Plus className="w-4 h-4" />
            </button>
            {showPipelineMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowPipelineMenu(false)} />
                <div className="absolute z-40 top-full mt-1 left-0 w-56 bg-gray-800 border border-white/10 rounded-lg shadow-xl overflow-hidden">
                  <button onClick={() => { setShowNewPipeline(true); setShowPipelineMenu(false) }} className="w-full text-left px-4 py-2.5 text-sm text-white/70 hover:bg-white/5 flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Crear pipeline
                  </button>
                  {pipelines.length > 1 && activePipeline && (
                    <button onClick={() => { deletePipeline(activePipelineId); setShowPipelineMenu(false) }} className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 border-t border-white/5">
                      <Trash2 className="w-4 h-4" /> Eliminar &quot;{activePipeline.name}&quot;
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* New pipeline slide panel */}
      <div className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${showNewPipeline ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setShowNewPipeline(false)} />
      <div className={`fixed top-0 right-0 h-full w-full max-w-md z-[70] bg-gray-900 border-l border-white/10 shadow-2xl transition-transform duration-300 flex flex-col ${showNewPipeline ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 flex-shrink-0">
          <h2 className="text-lg font-semibold">Nuevo Pipeline</h2>
          <button onClick={() => setShowNewPipeline(false)} className="text-white/40 hover:text-white transition"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">Nombre del pipeline</label>
            <input type="text" value={newPipelineName} onChange={e => setNewPipelineName(e.target.value)}
              placeholder="Ej: Ventas, Seguimiento, Montas..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition"
              autoFocus onKeyDown={e => e.key === 'Enter' && createPipeline()} />
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-white/50">Etapas que se crearan:</p>
            {(() => {
              const match = DEFAULT_PIPELINES.find(dp => dp.name.toLowerCase() === newPipelineName.trim().toLowerCase())
              const stagesToShow = match?.stages || [
                { name: 'Nuevo', position: 0, color: '#3B82F6' },
                { name: 'En progreso', position: 1, color: '#F59E0B' },
                { name: 'Ganado', position: 98, color: '#10B981' },
                { name: 'Perdido', position: 99, color: '#EF4444' },
              ]
              return stagesToShow.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                  <span className="text-sm text-white/60">{s.name}</span>
                  {s.position >= 98 && <span className="text-[10px] text-white/25 ml-auto">{s.position === 98 ? 'Ganado' : 'Perdido'}</span>}
                </div>
              ))
            })()}
            <p className="text-[11px] text-white/25 pt-1">Escribe &quot;Ventas&quot; o &quot;Seguimiento&quot; para usar etapas predefinidas.</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 flex-shrink-0">
          <button onClick={() => setShowNewPipeline(false)} className="px-4 py-2.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition">Cancelar</button>
          <button onClick={() => createPipeline()} disabled={creating || !newPipelineName.trim()}
            className="bg-[#D74709] hover:bg-[#c03d07] text-white font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-50 flex items-center gap-2 text-sm">
            {creating && <Loader2 className="w-4 h-4 animate-spin" />}
            {creating ? 'Creando...' : 'Crear pipeline'}
          </button>
        </div>
      </div>

      {/* Dashboard or Pipeline summary */}
      {showDashboard ? (
        <CrmDashboard deals={dealsWithStageName} stages={sortedStages} wonStageNames={wonStageNames} lostStageNames={lostStageNames} />
      ) : (
        <PipelineSummary deals={dealsWithStageName} wonStageNames={wonStageNames} lostStageNames={lostStageNames} />
      )}

      {/* Kanban board */}
      {hasNoPipelines ? (
        <div className="text-center py-20">
          <HandCoins className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/40 text-lg mb-2">No tienes pipelines configurados</p>
          <p className="text-sm text-white/30 mb-6">Crea los pipelines por defecto de Genealogic: Ventas y Seguimiento</p>
          <button
            onClick={async () => {
              setCreating(true)
              for (const def of DEFAULT_PIPELINES) {
                await createPipeline(def.name)
              }
              setCreating(false)
            }}
            disabled={creating}
            className="bg-[#D74709] hover:bg-[#c03d07] text-white px-6 py-3 rounded-lg text-sm font-semibold transition disabled:opacity-50 inline-flex items-center gap-2"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Crear Ventas + Seguimiento
          </button>
        </div>
      ) : sortedStages.length === 0 ? (
        <div className="text-center py-20">
          <HandCoins className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/40 text-lg">Este pipeline no tiene etapas</p>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: '60vh' }}>
          {sortedStages.map((stage: any) => {
            const stageDeals = dealsByStage(stage.id)
            const isDragOver = dragOverStageId === stage.id
            const stageValue = stageDeals.reduce((s: number, d: any) => s + (Number(d.value) || 0), 0)
            const isWon = isWonStage(stage.name)
            const isLost = isLostStage(stage.name)
            return (
              <div
                key={stage.id}
                className={`flex-shrink-0 w-72 bg-white/[0.03] border border-white/5 rounded-xl flex flex-col transition ${isDragOver ? 'bg-white/[0.06] border-[#D74709]/30' : ''}`}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                <div className="p-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: stage.color || '#666' }} />
                    <span className="text-xs font-semibold text-white/60 uppercase tracking-wider truncate flex-1">{stage.name}</span>
                    <span className="text-[11px] text-white/30 bg-white/10 rounded-full w-5 h-5 flex items-center justify-center">{stageDeals.length}</span>
                  </div>
                  {stageValue > 0 && (
                    <p className="text-[10px] text-white/25 mt-1 pl-5">{stageValue.toLocaleString('es-ES')} EUR</p>
                  )}
                </div>
                <div className="p-2 flex-1 space-y-2 min-h-[100px]">
                  {stageDeals.map((deal: any) => (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, deal.id)}
                      onClick={() => handleEditDeal(deal)}
                      className="bg-white/5 border border-white/10 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-[#D74709]/40 hover:bg-white/[0.07] transition group"
                      style={{ borderLeftWidth: 3, borderLeftColor: stage.color || '#666' }}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="w-3.5 h-3.5 text-white/15 group-hover:text-white/30 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{deal.title}</p>
                          {(deal.contact as any)?.name && (
                            <p className="text-xs text-white/40 mt-1 truncate">{(deal.contact as any).name}</p>
                          )}
                          {deal.value && (
                            <p className="text-xs text-[#D74709] font-semibold mt-1">
                              {Number(deal.value).toLocaleString('es-ES')} {deal.currency || 'EUR'}
                              {deal.is_reservation && deal.advance_amount && (
                                <span className="text-white/30 font-normal ml-1">(Reserva: {Number(deal.advance_amount).toLocaleString('es-ES')})</span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Won modal */}
      {wonModal && (
        <>
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" onClick={() => setWonModal(null)} />
          <div className="fixed z-[101] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] max-w-[90vw] bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-green-500/15 mx-auto flex items-center justify-center mb-4">
                <Trophy className="w-10 h-10 text-green-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Venta ganada</h3>
              <p className="text-sm text-white/50 mb-6">&quot;{wonModal.dealTitle}&quot; se ha movido a la etapa de ganado.</p>

              {/* Check if Seguimiento pipeline exists */}
              {pipelines.find((p: any) => /seguimiento/i.test(p.name)) && (
                <button
                  onClick={handleCloneToSeguimiento}
                  disabled={cloning}
                  className="w-full mb-3 flex items-center justify-center gap-2 bg-[#D74709]/10 border border-[#D74709]/30 text-[#D74709] font-semibold py-3 rounded-lg hover:bg-[#D74709]/20 transition disabled:opacity-50"
                >
                  {cloning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                  Clonar a Seguimiento
                </button>
              )}
              <button onClick={() => setWonModal(null)} className="w-full py-3 rounded-lg text-sm text-white/50 bg-white/5 hover:bg-white/10 transition">
                Solo cerrar venta
              </button>
            </div>
          </div>
        </>
      )}

      {/* Lost modal */}
      {lostModal && (
        <>
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" onClick={() => { setLostModal(null); setLostReason('') }} />
          <div className="fixed z-[101] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] max-w-[90vw] bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="w-14 h-14 rounded-full bg-red-500/15 mx-auto flex items-center justify-center mb-4">
                <XCircle className="w-7 h-7 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-center mb-4">Razon de perdida</h3>
              <div className="space-y-2 mb-4">
                {['Precio demasiado alto', 'Compro en otro criadero', 'Dejo de contestar', 'Problema de salud/logistica', 'Otro'].map(reason => (
                  <button
                    key={reason}
                    onClick={() => setLostReason(reason)}
                    className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition border ${
                      lostReason === reason
                        ? 'border-red-500/50 bg-red-500/10 text-red-400'
                        : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
              {lostReason === 'Otro' && (
                <input
                  type="text"
                  placeholder="Especificar razon..."
                  value={lostReason === 'Otro' ? '' : lostReason}
                  onChange={e => setLostReason(e.target.value || 'Otro')}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-red-500 focus:outline-none mb-4"
                  autoFocus
                />
              )}
              <div className="flex gap-2">
                <button onClick={() => { setLostModal(null); setLostReason('') }} className="flex-1 py-2.5 rounded-lg text-sm text-white/50 bg-white/5 hover:bg-white/10 transition">Cancelar</button>
                <button onClick={handleSaveLostReason} disabled={savingLost || !lostReason} className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-red-500 hover:bg-red-600 text-white transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {savingLost && <Loader2 className="w-4 h-4 animate-spin" />}
                  Marcar como perdido
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {showForm && (
        <DealForm
          open={showForm}
          onClose={() => { setShowForm(false); setEditingDeal(null) }}
          onSaved={fetchDeals}
          initialData={editingDeal}
          stages={sortedStages}
          contacts={contacts}
          pipelineId={activePipelineId}
          userId={userId}
        />
      )}
    </div>
  )
}
