'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, GripVertical, HandCoins } from 'lucide-react'
import PipelineSummary from './pipeline-summary'
import DealForm from './deal-form'

interface DealsPageClientProps {
  initialDeals: any[]
  stages: any[]
  contacts: any[]
  pipelineId: string
  userId: string
}

export default function DealsPageClient({ initialDeals, stages, contacts, pipelineId, userId }: DealsPageClientProps) {
  const [deals, setDeals] = useState(initialDeals)
  const [showForm, setShowForm] = useState(false)
  const [editingDeal, setEditingDeal] = useState<any>(null)
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null)

  const sortedStages = [...stages].sort((a, b) => a.position - b.position)

  const wonStageNames = ['Venta ganada', 'Cachorro entregado', 'Perro entregado']
  const lostStageNames = ['Venta perdida', 'Reserva cancelada']

  const dealsWithStageName = deals.map(d => ({
    ...d,
    stage_name: stages.find((s: any) => s.id === d.stage_id)?.name || '',
  }))

  const dealsByStage = (stageId: string) => deals.filter(d => d.stage_id === stageId)

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

  const handleDragLeave = () => {
    setDragOverStageId(null)
  }

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    setDragOverStageId(null)
    const dealId = e.dataTransfer.getData('dealId')
    if (!dealId) return

    // Optimistic update
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage_id: stageId } : d))

    const supabase = createClient()
    await supabase.from('deals').update({ stage_id: stageId }).eq('id', dealId)
  }

  const handleNewDeal = () => {
    setEditingDeal(null)
    setShowForm(true)
  }

  const handleEditDeal = (deal: any) => {
    setEditingDeal(deal)
    setShowForm(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Negocios</h1>
          <p className="text-white/50 text-sm mt-1">{deals.length} negocios activos</p>
        </div>
        <button
          onClick={handleNewDeal}
          className="bg-[#D74709] hover:bg-[#c03d07] text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> Nuevo negocio
        </button>
      </div>

      {/* Pipeline summary */}
      <PipelineSummary deals={dealsWithStageName} wonStageNames={wonStageNames} lostStageNames={lostStageNames} />

      {/* Kanban board */}
      {sortedStages.length === 0 ? (
        <div className="text-center py-20">
          <HandCoins className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/40 text-lg">No tienes pipeline configurado</p>
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
                {/* Column header */}
                <div className="p-3 border-b border-white/5 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: stage.color || '#666' }} />
                  <span className="text-xs font-semibold text-white/60 uppercase tracking-wider truncate">{stage.name}</span>
                  <span className="text-[11px] text-white/30 ml-auto bg-white/10 rounded-full w-5 h-5 flex items-center justify-center">{stageDeals.length}</span>
                </div>

                {/* Cards */}
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

      {/* Deal form */}
      {showForm && (
        <DealForm
          open={showForm}
          onClose={() => { setShowForm(false); setEditingDeal(null) }}
          onSaved={fetchDeals}
          initialData={editingDeal}
          stages={sortedStages}
          contacts={contacts}
          pipelineId={pipelineId}
          userId={userId}
        />
      )}
    </div>
  )
}
