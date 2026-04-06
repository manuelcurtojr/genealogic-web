import { TrendingUp, Trophy, XCircle } from 'lucide-react'
import { BRAND } from '@/lib/constants'

interface PipelineSummaryProps {
  deals: any[]
  wonStageNames: string[]
  lostStageNames: string[]
}

export default function PipelineSummary({ deals, wonStageNames, lostStageNames }: PipelineSummaryProps) {
  const totalValue = deals.reduce((sum, d) => sum + (d.value || 0), 0)
  const wonDeals = deals.filter(d => wonStageNames.includes(d.stage_name))
  const wonValue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0)
  const lostDeals = deals.filter(d => lostStageNames.includes(d.stage_name))
  const lostValue = lostDeals.reduce((sum, d) => sum + (d.value || 0), 0)

  const cards = [
    { icon: TrendingUp, label: 'Total pipeline', value: totalValue, count: deals.length, color: BRAND.primary },
    { icon: Trophy, label: 'Ganados', value: wonValue, count: wonDeals.length, color: BRAND.success },
    { icon: XCircle, label: 'Perdidos', value: lostValue, count: lostDeals.length, color: BRAND.danger },
  ]

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {cards.map((c) => (
        <div key={c.label} className="bg-white/5 border border-white/10 rounded-xl p-4" style={{ borderLeftWidth: 4, borderLeftColor: c.color }}>
          <div className="flex items-center gap-2 mb-2">
            <c.icon className="w-4 h-4" style={{ color: c.color }} />
            <span className="text-xs text-white/40 font-medium">{c.label}</span>
          </div>
          <p className="text-xl font-bold" style={{ color: c.color }}>
            {c.value.toLocaleString('es-ES')} €
          </p>
          <p className="text-xs text-white/30 mt-0.5">{c.count} negocios</p>
        </div>
      ))}
    </div>
  )
}
