'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, GripVertical, HandCoins, ChevronDown, Settings, Trash2, X, Loader2, BarChart3 } from 'lucide-react'
import PipelineSummary from './pipeline-summary'
import CrmDashboard from './crm-dashboard'
import DealForm from './deal-form'

interface DealsPageClientProps {
  initialDeals: any[]
  pipelines: any[]
  contacts: any[]
  userId: string
}

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

  const activePipeline = pipelines.find(p => p.id === activePipelineId)
  const stages = activePipeline?.stages || []
  const sortedStages = [...stages].sort((a: any, b: any) => a.position - b.position)
  const pipelineDeals = deals.filter(d => d.pipeline_id === activePipelineId)

  const wonStageNames = ['Venta ganada', 'Cachorro entregado', 'Perro entregado']
  const lostStageNames = ['Venta perdida', 'Reserva cancelada']

  const dealsWithStageName = pipelineDeals.map(d => ({
    ...d,
    stage_name: stages.find((s: any) => s.id === d.stage_id)?.name || '',
  }))

  const dealsByStage = (stageId: string) => pipelineDeals.filter(d => d.stage_id === stageId)

  const fetchDeals = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('deals')
      .select('id, title, value, currency, contact_id, stage_id, pipeline_id, lost_reason, contact:contacts(id, name)')
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
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage_id: stageId } : d))
    const supabase = createClient()
    await supabase.from('deals').update({ stage_id: stageId }).eq('id', dealId)
  }

  const handleNewDeal = () => { setEditingDeal(null); setShowForm(true) }
  const handleEditDeal = (deal: any) => { setEditingDeal(deal); setShowForm(true) }

  async function createPipeline() {
    if (!newPipelineName.trim()) return
    setCreating(true)
    const supabase = createClient()

    // Create pipeline
    const { data: newPipeline, error } = await supabase
      .from('pipelines')
      .insert({ name: newPipelineName.trim(), owner_id: userId })
      .select('id, name')
      .single()

    if (error || !newPipeline) { setCreating(false); return }

    // Create default stages
    const defaultStages = [
      { name: 'Nuevo lead', position: 0, color: '#3B82F6' },
      { name: 'Contactado', position: 1, color: '#06B6D4' },
      { name: 'Negociacion', position: 2, color: '#F59E0B' },
      { name: 'Propuesta', position: 3, color: '#8B5CF6' },
      { name: 'Cerrado', position: 4, color: '#10B981' },
      { name: 'Perdido', position: 5, color: '#EF4444' },
    ]

    const { data: createdStages } = await supabase
      .from('pipeline_stages')
      .insert(defaultStages.map(s => ({ ...s, pipeline_id: newPipeline.id })))
      .select('id, name, position, color')

    const fullPipeline = { ...newPipeline, stages: (createdStages || []).sort((a, b) => a.position - b.position) }
    setPipelines(prev => [...prev, fullPipeline])
    setActivePipelineId(newPipeline.id)
    setNewPipelineName('')
    setShowNewPipeline(false)
    setCreating(false)
  }

  async function deletePipeline(pipelineId: string) {
    if (!confirm('Eliminar este pipeline y todos sus negocios?')) return
    const supabase = createClient()
    // Delete deals in this pipeline first
    await supabase.from('deals').delete().eq('pipeline_id', pipelineId)
    await supabase.from('pipeline_stages').delete().eq('pipeline_id', pipelineId)
    await supabase.from('pipelines').delete().eq('id', pipelineId)

    setPipelines(prev => prev.filter(p => p.id !== pipelineId))
    setDeals(prev => prev.filter(d => d.pipeline_id !== pipelineId))
    if (activePipelineId === pipelineId) {
      const remaining = pipelines.filter(p => p.id !== pipelineId)
      setActivePipelineId(remaining[0]?.id || '')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Negocios</h1>
          <p className="text-white/50 text-sm mt-1">{pipelineDeals.length} negocios en este pipeline</p>
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
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        {pipelines.map(p => (
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
              ({deals.filter(d => d.pipeline_id === p.id).length})
            </span>
          </button>
        ))}

        {/* Add pipeline */}
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
                <button
                  onClick={() => { setShowNewPipeline(true); setShowPipelineMenu(false) }}
                  className="w-full text-left px-4 py-2.5 text-sm text-white/70 hover:bg-white/5 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Crear pipeline
                </button>
                {pipelines.length > 1 && activePipeline && (
                  <button
                    onClick={() => { deletePipeline(activePipelineId); setShowPipelineMenu(false) }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 border-t border-white/5"
                  >
                    <Trash2 className="w-4 h-4" /> Eliminar &quot;{activePipeline.name}&quot;
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* New pipeline modal */}
      {showNewPipeline && (
        <>
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" onClick={() => setShowNewPipeline(false)} />
          <div className="fixed z-[101] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] max-w-[90vw] bg-gray-900 border border-white/10 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
              <h3 className="text-sm font-semibold">Nuevo Pipeline</h3>
              <button onClick={() => setShowNewPipeline(false)} className="text-white/30 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">Nombre</label>
                <input
                  type="text"
                  value={newPipelineName}
                  onChange={e => setNewPipelineName(e.target.value)}
                  placeholder="Ej: Ventas cachorros, Montas..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && createPipeline()}
                />
              </div>
              <p className="text-[11px] text-white/30">Se crearan 6 etapas por defecto que puedes personalizar despues.</p>
              <div className="flex gap-2">
                <button onClick={() => setShowNewPipeline(false)} className="flex-1 py-2.5 rounded-lg text-sm text-white/50 bg-white/5 hover:bg-white/10 transition">Cancelar</button>
                <button onClick={createPipeline} disabled={creating || !newPipelineName.trim()} className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-[#D74709] hover:bg-[#c03d07] text-white transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {creating ? 'Creando...' : 'Crear pipeline'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Dashboard or Pipeline summary */}
      {showDashboard ? (
        <CrmDashboard deals={dealsWithStageName} stages={sortedStages} wonStageNames={wonStageNames} lostStageNames={lostStageNames} />
      ) : (
        <PipelineSummary deals={dealsWithStageName} wonStageNames={wonStageNames} lostStageNames={lostStageNames} />
      )}

      {/* Kanban board */}
      {sortedStages.length === 0 ? (
        <div className="text-center py-20">
          <HandCoins className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/40 text-lg">No tienes pipeline configurado</p>
          <button onClick={() => setShowNewPipeline(true)} className="mt-4 text-sm text-[#D74709] hover:text-[#c03d07] font-medium">
            Crear tu primer pipeline
          </button>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: '60vh' }}>
          {sortedStages.map((stage: any) => {
            const stageDeals = dealsByStage(stage.id)
            const isDragOver = dragOverStageId === stage.id
            return (
              <div
                key={stage.id}
                className={`flex-shrink-0 w-72 bg-white/[0.03] border border-white/5 rounded-xl flex flex-col transition ${isDragOver ? 'bg-white/[0.06] border-[#D74709]/30' : ''}`}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                <div className="p-3 border-b border-white/5 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: stage.color || '#666' }} />
                  <span className="text-xs font-semibold text-white/60 uppercase tracking-wider truncate">{stage.name}</span>
                  <span className="text-[11px] text-white/30 ml-auto bg-white/10 rounded-full w-5 h-5 flex items-center justify-center">{stageDeals.length}</span>
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
                            <p className="text-xs text-[#D74709] font-semibold mt-1">{Number(deal.value).toLocaleString('es-ES')} {deal.currency || 'EUR'}</p>
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
