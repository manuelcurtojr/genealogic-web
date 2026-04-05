import { createClient } from '@/lib/supabase/server'
import { Plus, HandCoins } from 'lucide-react'

export default async function DealsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: pipelines } = await supabase
    .from('pipelines')
    .select(`
      id, name,
      stages:pipeline_stages(id, name, position, color)
    `)
    .eq('owner_id', user!.id)
    .order('created_at')

  const { data: deals } = await supabase
    .from('deals')
    .select(`
      id, title, value, currency,
      stage:pipeline_stages(id, name, color),
      contact:contacts(id, name)
    `)
    .eq('owner_id', user!.id)
    .order('updated_at', { ascending: false })

  // Group deals by stage
  const dealsByStage: Record<string, any[]> = {}
  deals?.forEach((d: any) => {
    const stageId = (d.stage as any)?.id || 'no-stage'
    if (!dealsByStage[stageId]) dealsByStage[stageId] = []
    dealsByStage[stageId].push(d)
  })

  const allStages = pipelines?.flatMap((p: any) =>
    ((p.stages as any[]) || []).sort((a: any, b: any) => a.position - b.position)
  ) || []

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Negocios</h1>
          <p className="text-white/50 text-sm mt-1">{deals?.length || 0} negocios activos</p>
        </div>
        <button className="bg-[#D74709] hover:bg-[#c03d07] text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition">
          <Plus className="w-4 h-4" /> Nuevo negocio
        </button>
      </div>

      {allStages.length === 0 ? (
        <div className="text-center py-20">
          <HandCoins className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/40 text-lg">No tienes pipelines configurados</p>
          <p className="text-white/25 text-sm mt-2">Crea un pipeline para organizar tus ventas</p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {allStages.map((stage: any) => {
            const stageDeals = dealsByStage[stage.id] || []
            return (
              <div key={stage.id} className="flex-shrink-0 w-72">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: stage.color || '#666' }} />
                  <span className="text-sm font-semibold text-white/70">{stage.name}</span>
                  <span className="text-xs text-white/30 ml-auto">{stageDeals.length}</span>
                </div>
                <div className="space-y-2">
                  {stageDeals.map((deal: any) => (
                    <div key={deal.id} className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/[0.07] transition cursor-pointer">
                      <p className="text-sm font-medium text-white">{deal.title}</p>
                      {(deal.contact as any)?.name && (
                        <p className="text-xs text-white/40 mt-1">{(deal.contact as any).name}</p>
                      )}
                      {deal.value && (
                        <p className="text-xs text-[#D74709] font-semibold mt-1">{deal.value} {deal.currency}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
