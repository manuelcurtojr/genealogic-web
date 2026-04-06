'use client'

import { useMemo } from 'react'
import { Wallet, BarChart3, TrendingUp, TrendingDown, Target, Clock, AlertTriangle } from 'lucide-react'

interface Props {
  deals: any[]
  stages: any[]
  wonStageNames: string[]
  lostStageNames: string[]
}

export default function CrmDashboard({ deals, stages, wonStageNames, lostStageNames }: Props) {
  const stats = useMemo(() => {
    const won = deals.filter(d => wonStageNames.includes(d.stage_name))
    const lost = deals.filter(d => lostStageNames.includes(d.stage_name))
    const active = deals.filter(d => !wonStageNames.includes(d.stage_name) && !lostStageNames.includes(d.stage_name))

    const totalPotential = active.reduce((s, d) => s + (Number(d.value) || 0), 0)
    const totalWon = won.reduce((s, d) => s + (Number(d.value) || 0), 0)
    const totalLost = lost.reduce((s, d) => s + (Number(d.value) || 0), 0)
    const completed = won.length + lost.length
    const winRate = completed > 0 ? Math.round((won.length / completed) * 100) : 0
    const avgTicket = won.length > 0 ? Math.round(totalWon / won.length) : 0

    // Deals by stage
    const byStage = stages.map(s => ({
      name: s.name,
      color: s.color || '#666',
      count: deals.filter(d => d.stage_id === s.id).length,
      value: deals.filter(d => d.stage_id === s.id).reduce((sum: number, d: any) => sum + (Number(d.value) || 0), 0),
    }))

    // Loss reasons
    const lossReasons: Record<string, number> = {}
    lost.forEach(d => {
      const reason = d.lost_reason || 'Sin especificar'
      lossReasons[reason] = (lossReasons[reason] || 0) + 1
    })
    const topLosses = Object.entries(lossReasons)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    return { totalPotential, totalWon, totalLost, winRate, avgTicket, active: active.length, won: won.length, lost: lost.length, byStage, topLosses, total: deals.length }
  }, [deals, stages, wonStageNames, lostStageNames])

  const fmt = (v: number) => v.toLocaleString('es-ES')

  return (
    <div className="space-y-6 mb-6">
      {/* Financial summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <MetricCard icon={Wallet} label="Potencial activo" value={`${fmt(stats.totalPotential)} EUR`} color="#3B82F6" />
        <MetricCard icon={TrendingUp} label="Ganado" value={`${fmt(stats.totalWon)} EUR`} color="#10B981" />
        <MetricCard icon={TrendingDown} label="Perdido" value={`${fmt(stats.totalLost)} EUR`} color="#EF4444" />
        <MetricCard icon={Target} label="Tasa de conversion" value={`${stats.winRate}%`} color="#D74709" />
        <MetricCard icon={BarChart3} label="Ticket medio" value={`${fmt(stats.avgTicket)} EUR`} color="#8B5CF6" />
      </div>

      {/* Two-column: Stage funnel + Win rate */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Stage concentration */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Concentracion por etapas</h3>
          <div className="space-y-2">
            {stats.byStage.map(s => {
              const maxCount = Math.max(...stats.byStage.map(x => x.count), 1)
              const pct = (s.count / maxCount) * 100
              return (
                <div key={s.name} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                  <span className="text-xs text-white/60 w-28 truncate">{s.name}</span>
                  <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: s.color, opacity: 0.6 }} />
                  </div>
                  <span className="text-xs font-bold text-white/70 w-6 text-right">{s.count}</span>
                  <span className="text-[10px] text-white/30 w-16 text-right">{fmt(s.value)} EUR</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Win rate circle + stats */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center">
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Tasa de conversion</h3>
          {/* SVG donut */}
          <div className="relative w-28 h-28 mb-3">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
              <circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke="#D74709"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${stats.winRate * 2.64} ${264 - stats.winRate * 2.64}`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold">{stats.winRate}%</span>
            </div>
          </div>
          <div className="flex gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-green-400">{stats.won}</p>
              <p className="text-[10px] text-white/30">Ganados</p>
            </div>
            <div>
              <p className="text-lg font-bold text-red-400">{stats.lost}</p>
              <p className="text-[10px] text-white/30">Perdidos</p>
            </div>
            <div>
              <p className="text-lg font-bold text-blue-400">{stats.active}</p>
              <p className="text-[10px] text-white/30">Activos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loss reasons */}
      {stats.topLosses.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" /> Razones de perdida
          </h3>
          <div className="flex gap-3 overflow-x-auto">
            {stats.topLosses.map(([reason, count]) => (
              <div key={reason} className="flex-shrink-0 bg-red-500/5 border border-red-500/15 rounded-lg px-4 py-2.5 min-w-[140px]">
                <p className="text-sm font-semibold text-red-400">{count}</p>
                <p className="text-xs text-white/40 truncate">{reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
      </div>
      <p className="text-sm font-bold">{value}</p>
      <p className="text-[10px] text-white/40 mt-0.5">{label}</p>
    </div>
  )
}
