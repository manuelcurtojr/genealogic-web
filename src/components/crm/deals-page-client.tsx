'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, GripVertical, HandCoins, Trash2, X, Loader2, BarChart3, Trophy, XCircle, Copy, Settings } from 'lucide-react'
import PipelineSummary from './pipeline-summary'
import CrmDashboard from './crm-dashboard'
import DealForm from './deal-form'
import PipelineManager from './pipeline-manager'

interface DealsPageClientProps {
  initialDeals: any[]
  pipelines: any[]
  contacts: any[]
  userId: string
}

const WON_PATTERNS = /ganad|entregad/i
const LOST_PATTERNS = /perdid|cancelad/i

export default function DealsPageClient({ initialDeals, pipelines: initialPipelines, contacts, userId }: DealsPageClientProps) {
  const [deals, setDeals] = useState(initialDeals)
  const [pipelines, setPipelines] = useState(initialPipelines)
  const [activePipelineId, setActivePipelineId] = useState(initialPipelines[0]?.id || '')
  const [showForm, setShowForm] = useState(false)
  const [editingDeal, setEditingDeal] = useState<any>(null)
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null)
  const [showPipelineManager, setShowPipelineManager] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)

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

  const refreshPipelines = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('pipelines')
      .select('id, name, stages:pipeline_stages(id, name, position, color)')
      .eq('owner_id', userId)
      .order('created_at')
    const updated = (data || []).map((p: any) => ({
      ...p,
      stages: p.stages ? [...p.stages].sort((a: any, b: any) => a.position - b.position) : [],
    }))
    setPipelines(updated)
    if (updated.length > 0 && !updated.find((p: any) => p.id === activePipelineId)) {
      setActivePipelineId(updated[0].id)
    }
    await fetchDeals()
  }, [userId, activePipelineId, fetchDeals])

  const hasNoPipelines = pipelines.length === 0

  const wonStageNames = sortedStages.filter((s: any) => isWonStage(s.name)).map((s: any) => s.name)
  const lostStageNames = sortedStages.filter((s: any) => isLostStage(s.name)).map((s: any) => s.name)

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Negocios</h1>
          <p className="text-white/50 text-xs sm:text-sm mt-1">{pipelineDeals.length} negocios en {activePipeline?.name || 'pipeline'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDashboard(!showDashboard)}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-2 transition border ${showDashboard ? 'bg-[#D74709]/15 text-[#D74709] border-[#D74709]/30' : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'}`}
          >
            <BarChart3 className="w-4 h-4" /> Dashboard
          </button>
          <button onClick={handleNewDeal} className="bg-[#D74709] hover:bg-[#c03d07] text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 transition">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nuevo negocio</span><span className="sm:hidden">Nuevo</span>
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
          <button
            onClick={() => setShowPipelineManager(true)}
            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white/60 hover:bg-white/10 transition"
            title="Gestionar pipelines"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Pipeline Manager */}
      <PipelineManager
        open={showPipelineManager}
        onClose={() => setShowPipelineManager(false)}
        pipelines={pipelines}
        deals={deals}
        userId={userId}
        onPipelinesChanged={refreshPipelines}
      />

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
            onClick={() => setShowPipelineManager(true)}
            className="bg-[#D74709] hover:bg-[#c03d07] text-white px-6 py-3 rounded-lg text-sm font-semibold transition inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Crear pipeline
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
                className={`flex-shrink-0 w-60 sm:w-72 bg-white/[0.03] border border-white/5 rounded-xl flex flex-col transition ${isDragOver ? 'bg-white/[0.06] border-[#D74709]/30' : ''}`}
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
          allPipelines={pipelines}
          userId={userId}
        />
      )}
    </div>
  )
}
