'use client'

import { useMemo, useState } from 'react'
import {
  BarChart3, Dog, Baby, HandCoins, Users, TrendingUp, TrendingDown, Target,
  Heart, Globe, MapPin, Trophy, Stethoscope, Gem, Clock, ArrowRightLeft,
  Tag, FileText, Flame, ChevronDown
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts'

interface Props {
  dogs: any[]; kennelDogs: any[]; litters: any[]; deals: any[]; contacts: any[]
  kennel: any; pipelines: any[]; vetCount: number; awardsCount: number
  submissions: any[]; profile: any; genesTransactions: any[]; userId: string
}

const WON = /ganad|entregad/i
const LOST = /perdid|cancelad/i
const COLORS = ['#D74709', '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#06B6D4', '#EF4444']

function fmt(n: number) { return n.toLocaleString('es-ES') }
function pct(a: number, b: number) { return b > 0 ? Math.round((a / b) * 100) : 0 }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 border border-white/10 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-white/50 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs font-semibold" style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

export default function AnalyticsDashboard({ dogs, kennelDogs, litters, deals, contacts, kennel, pipelines, vetCount, awardsCount, submissions, profile, genesTransactions, userId }: Props) {
  const [activeSection, setActiveSection] = useState('resumen')

  const stats = useMemo(() => {
    // Flatten all stages from all pipelines
    const allStages: any[] = []
    pipelines.forEach((p: any) => {
      const stages = Array.isArray(p.stages) ? p.stages : []
      stages.forEach((s: any) => allStages.push({ ...s, pipelineName: p.name }))
    })

    const wonStageIds = new Set(allStages.filter((s: any) => WON.test(s.name)).map((s: any) => s.id))
    const lostStageIds = new Set(allStages.filter((s: any) => LOST.test(s.name)).map((s: any) => s.id))

    // Debug: log for troubleshooting

    const wonDeals = deals.filter((d: any) => wonStageIds.has(d.stage_id))
    const lostDeals = deals.filter((d: any) => lostStageIds.has(d.stage_id))
    const activeDeals = deals.filter((d: any) => !wonStageIds.has(d.stage_id) && !lostStageIds.has(d.stage_id))

    const totalRevenue = wonDeals.reduce((s: number, d: any) => s + (Number(d.value) || 0), 0)
    const lostRevenue = lostDeals.reduce((s: number, d: any) => s + (Number(d.value) || 0), 0)
    const activeRevenue = activeDeals.reduce((s: number, d: any) => s + (Number(d.value) || 0), 0)
    const resolved = wonDeals.length + lostDeals.length
    const winRate = pct(wonDeals.length, resolved)
    const avgTicket = wonDeals.length > 0 ? Math.round(totalRevenue / wonDeals.length) : 0

    const closeTimes = wonDeals.map((d: any) => (Date.now() - new Date(d.created_at).getTime()) / 86400000).filter((d: number) => d > 0)
    const avgCloseTime = closeTimes.length > 0 ? Math.round(closeTimes.reduce((a: number, b: number) => a + b, 0) / closeTimes.length) : 0

    // Loss reasons
    const lossReasons: Record<string, number> = {}
    lostDeals.forEach((d: any) => { const r = d.lost_reason || 'Sin especificar'; lossReasons[r] = (lossReasons[r] || 0) + 1 })
    const topLosses = Object.entries(lossReasons).sort((a, b) => b[1] - a[1]).slice(0, 5)

    // Deals by stage for chart
    const dealsByStage = allStages.map((s: any) => ({
      name: s.name.length > 15 ? s.name.slice(0, 14) + '…' : s.name,
      count: deals.filter((d: any) => d.stage_id === s.id).length,
      value: deals.filter((d: any) => d.stage_id === s.id).reduce((sum: number, d: any) => sum + (Number(d.value) || 0), 0),
      color: s.color || '#666',
    })).filter((s: any) => s.count > 0)

    // Monthly deals trend (last 6 months)
    const monthlyDeals: any[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('es-ES', { month: 'short' })
      const monthDeals = deals.filter((deal: any) => deal.created_at?.startsWith(key))
      monthlyDeals.push({
        name: label,
        Creados: monthDeals.length,
        Ganados: monthDeals.filter((deal: any) => wonStageIds.has(deal.stage_id)).length,
        Perdidos: monthDeals.filter((deal: any) => lostStageIds.has(deal.stage_id)).length,
      })
    }

    // Clients by country
    const byCountry: Record<string, number> = {}
    contacts.forEach((c: any) => { if (c.country) byCountry[c.country] = (byCountry[c.country] || 0) + 1 })
    const countryData = Object.entries(byCountry).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value }))

    // Breed distribution for pie
    const byBreed: Record<string, number> = {}
    dogs.forEach((d: any) => { const b = d.breed?.name || 'Sin raza'; byBreed[b] = (byBreed[b] || 0) + 1 })
    const breedPie = Object.entries(byBreed).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }))

    // Sex
    const males = dogs.filter((d: any) => d.sex === 'male').length
    const females = dogs.filter((d: any) => d.sex === 'female').length

    // Litters
    const totalPuppies = litters.reduce((s: number, l: any) => s + (l.puppy_count || 0), 0)
    const avgPuppies = litters.length > 0 ? (totalPuppies / litters.length).toFixed(1) : '0'

    // Litters by year for chart
    const littersByYear: Record<string, number> = {}
    litters.forEach((l: any) => { const y = new Date(l.created_at).getFullYear().toString(); littersByYear[y] = (littersByYear[y] || 0) + 1 })
    const littersChart = Object.entries(littersByYear).map(([name, value]) => ({ name, Camadas: value }))

    // Top reproducers
    const parentCounts: Record<string, { name: string; count: number; sex: string }> = {}
    litters.forEach((l: any) => {
      ;[{ id: l.father_id, sex: 'male' }, { id: l.mother_id, sex: 'female' }].forEach(({ id, sex }) => {
        if (!id) return
        const dog = kennelDogs.find((d: any) => d.id === id)
        if (dog) parentCounts[id] = { name: dog.name, count: (parentCounts[id]?.count || 0) + 1, sex }
      })
    })
    const topReproducers = Object.values(parentCounts).sort((a, b) => b.count - a.count).slice(0, 6)

    // Submissions monthly for area chart
    const subMonthly: any[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('es-ES', { month: 'short' })
      subMonthly.push({ name: label, Solicitudes: submissions.filter((s: any) => s.created_at?.startsWith(key)).length })
    }

    // Breed demand
    const breedDemand: Record<string, number> = {}
    submissions.forEach((s: any) => {
      const names = s.data?.breed_interest_names
      if (names) names.split(',').forEach((n: string) => { const t = n.trim(); if (t) breedDemand[t] = (breedDemand[t] || 0) + 1 })
    })
    const demandChart = Object.entries(breedDemand).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value]) => ({ name, Solicitudes: value }))

    const transferred = kennelDogs.filter((d: any) => d.owner_id !== userId).length
    const withPedigree = dogs.filter((d: any) => d.father_id && d.mother_id).length
    const ages = dogs.filter((d: any) => d.birth_date).map((d: any) => (Date.now() - new Date(d.birth_date).getTime()) / (365.25 * 86400000))
    const avgAge = ages.length > 0 ? (ages.reduce((a: number, b: number) => a + b, 0) / ages.length).toFixed(1) : '0'
    const genesSpent = genesTransactions.filter((t: any) => t.type === 'gasto').reduce((s: number, t: any) => s + Math.abs(t.amount), 0)
    const genesEarned = genesTransactions.filter((t: any) => t.type === 'ingreso').reduce((s: number, t: any) => s + t.amount, 0)

    return {
      totalDogs: dogs.length, forSale: dogs.filter((d: any) => d.is_for_sale).length,
      totalLitters: litters.length, totalPuppies, avgPuppies,
      totalRevenue, lostRevenue, activeRevenue, winRate, avgTicket, avgCloseTime,
      wonDeals: wonDeals.length, lostDeals: lostDeals.length, activeDealsCount: activeDeals.length,
      totalDeals: deals.length,
      topLosses, dealsByStage, monthlyDeals, countryData, breedPie,
      males, females, littersChart, topReproducers,
      reproductors: Math.max(
        kennelDogs.filter((d: any) => d.is_reproductive).length,
        dogs.filter((d: any) => d.is_reproductive).length
      ),
      totalKennelDogs: kennelDogs.length, transferred,
      retained: kennelDogs.filter((d: any) => d.owner_id === userId).length,
      withPedigree, avgAge,
      totalContacts: contacts.length, totalSubmissions: submissions.length,
      subMonthly, demandChart,
      vetCount, awardsCount, genesBalance: profile?.genes || 0, genesSpent, genesEarned,
      accountAge: profile?.created_at ? ((Date.now() - new Date(profile.created_at).getTime()) / (365.25 * 86400000)).toFixed(1) : '0',
    }
  }, [dogs, kennelDogs, litters, deals, contacts, pipelines, submissions, genesTransactions, userId, profile])

  const sections = [
    { key: 'resumen', label: 'Resumen', icon: BarChart3 },
    { key: 'ventas', label: 'Ventas y CRM', icon: HandCoins },
    { key: 'reproduccion', label: 'Reproduccion', icon: Baby },
    { key: 'criadero', label: 'Criadero', icon: Dog },
    { key: 'formularios', label: 'Formularios', icon: FileText },
    { key: 'actividad', label: 'Actividad', icon: Flame },
  ]

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Analiticas</h1>
      <div className="flex gap-2 mb-4 sm:mb-6 overflow-x-auto pb-1 -mx-1 px-1">
        {sections.map(s => {
          const Icon = s.icon
          return (
            <button key={s.key} onClick={() => setActiveSection(s.key)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition ${activeSection === s.key ? 'bg-[#D74709]/15 text-[#D74709] border border-[#D74709]/30' : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'}`}>
              <Icon className="w-3.5 h-3.5" /> {s.label}
            </button>
          )
        })}
      </div>

      {/* === RESUMEN === */}
      {activeSection === 'resumen' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <Card icon={Dog} label="Perros" value={stats.totalDogs} color="#D74709" />
            <Card icon={Tag} label="En venta" value={stats.forSale} color="#10B981" />
            <Card icon={Baby} label="Camadas" value={stats.totalLitters} color="#8B5CF6" />
            <Card icon={HandCoins} label="Negocios" value={stats.totalDeals} color="#F59E0B" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <Card icon={TrendingUp} label="Revenue" value={`${fmt(stats.totalRevenue)} €`} color="#10B981" />
            <Card icon={Target} label="Win rate" value={`${stats.winRate}%`} color="#D74709" />
            <Card icon={Users} label="Contactos" value={stats.totalContacts} color="#3B82F6" />
            <Card icon={FileText} label="Solicitudes" value={stats.totalSubmissions} color="#EC4899" />
          </div>

          {/* Funnel */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Embudo de ventas</h3>
            <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-3 text-center">
              {[
                { label: 'Solicitudes', value: stats.totalSubmissions, color: 'blue' },
                { label: 'Negocios', value: stats.totalDeals, color: 'yellow' },
                { label: 'Ganados', value: stats.wonDeals, color: 'green' },
                { label: 'Perdidos', value: stats.lostDeals, color: 'red' },
              ].map((s, i) => (
                <div key={s.label} className="flex items-center gap-3 flex-1">
                  {i > 0 && <ChevronDown className="w-4 h-4 text-white/20 -rotate-90 flex-shrink-0" />}
                  <div className={`flex-1 bg-${s.color}-500/10 rounded-lg p-3`}>
                    <p className={`text-2xl font-bold text-${s.color}-400`}>{s.value}</p>
                    <p className="text-[10px] text-white/40">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly trend chart */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 overflow-x-auto">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Tendencia mensual de negocios</h3>
            <div className="min-w-[320px]">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={stats.monthlyDeals}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Creados" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} strokeWidth={2} />
                <Area type="monotone" dataKey="Ganados" stroke="#10B981" fill="#10B981" fillOpacity={0.1} strokeWidth={2} />
                <Area type="monotone" dataKey="Perdidos" stroke="#EF4444" fill="#EF4444" fillOpacity={0.05} strokeWidth={2} />
                <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }} />
              </AreaChart>
            </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* === VENTAS === */}
      {activeSection === 'ventas' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
            <Card icon={TrendingUp} label="Ganado" value={`${fmt(stats.totalRevenue)} €`} color="#10B981" />
            <Card icon={TrendingDown} label="Perdido" value={`${fmt(stats.lostRevenue)} €`} color="#EF4444" />
            <Card icon={HandCoins} label="Pipeline" value={`${fmt(stats.activeRevenue)} €`} color="#3B82F6" />
            <Card icon={Target} label="Win rate" value={`${stats.winRate}%`} color="#D74709" />
            <Card icon={Clock} label="Cierre medio" value={`${stats.avgCloseTime}d`} color="#8B5CF6" />
          </div>

          {/* Deals by stage bar chart */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 overflow-x-auto">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Negocios por etapa</h3>
            <div className="min-w-[320px]">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.dealsByStage} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Negocios" radius={[0, 4, 4, 0]}>
                  {stats.dealsByStage.map((s: any, i: number) => <Cell key={i} fill={s.color} fillOpacity={0.7} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Loss reasons */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Razones de perdida</h3>
              {stats.topLosses.length === 0 ? <p className="text-xs text-white/25 text-center py-8">Sin datos</p> : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stats.topLosses.map(([name, value]) => ({ name: (name as string).length > 20 ? (name as string).slice(0, 19) + '…' : name, Perdidos: value }))}>
                    <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Perdidos" fill="#EF4444" fillOpacity={0.6} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Clients by country */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 flex items-center gap-1"><Globe className="w-3 h-3" /> Clientes por pais</h3>
              {stats.countryData.length === 0 ? <p className="text-xs text-white/25 text-center py-8">Sin datos</p> : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stats.countryData}>
                    <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Clientes" fill="#3B82F6" fillOpacity={0.6} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {/* === REPRODUCCION === */}
      {activeSection === 'reproduccion' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <Card icon={Baby} label="Camadas" value={stats.totalLitters} color="#8B5CF6" />
            <Card icon={Dog} label="Cachorros" value={stats.totalPuppies} color="#D74709" />
            <Card icon={BarChart3} label="Media/camada" value={stats.avgPuppies} color="#3B82F6" />
            <Card icon={Heart} label="Reproductores" value={stats.reproductors} color="#EC4899" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Litters by year */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Camadas por ano</h3>
              {stats.littersChart.length === 0 ? <p className="text-xs text-white/25 text-center py-8">Sin datos</p> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.littersChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Camadas" fill="#8B5CF6" fillOpacity={0.6} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Top reproducers */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Top reproductores</h3>
              {stats.topReproducers.length === 0 ? <p className="text-xs text-white/25 text-center py-8">Sin datos</p> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.topReproducers.map((r: any) => ({ name: r.name.length > 15 ? r.name.slice(0, 14) + '…' : r.name, Camadas: r.count, fill: r.sex === 'male' ? '#3B82F6' : '#EC4899' }))} layout="vertical">
                    <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" width={110} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Camadas" radius={[0, 4, 4, 0]}>
                      {stats.topReproducers.map((r: any, i: number) => <Cell key={i} fill={r.sex === 'male' ? '#3B82F6' : '#EC4899'} fillOpacity={0.6} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {/* === CRIADERO === */}
      {activeSection === 'criadero' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <Card icon={Dog} label="Perros criadero" value={stats.totalKennelDogs} color="#D74709" />
            <Card icon={ArrowRightLeft} label="Transferidos" value={stats.transferred} color="#8B5CF6" />
            <Card icon={Dog} label="Retenidos" value={stats.retained} color="#10B981" />
            <Card icon={BarChart3} label="Edad media" value={`${stats.avgAge} a`} color="#3B82F6" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Breed pie chart */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 overflow-x-auto">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Distribucion por raza</h3>
              {stats.breedPie.length === 0 ? <p className="text-xs text-white/25 text-center py-8">Sin datos</p> : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={stats.breedPie} cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={2} dataKey="value" label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`} labelLine={false}>
                      {stats.breedPie.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.7} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Sex + pedigree */}
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4">
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Sexo</h3>
                <div className="flex gap-4">
                  <div className="flex-1 text-center bg-blue-500/10 rounded-lg p-3">
                    <p className="text-2xl font-bold text-blue-400">{stats.males}</p>
                    <p className="text-[10px] text-white/40">Machos ({pct(stats.males, stats.totalDogs)}%)</p>
                  </div>
                  <div className="flex-1 text-center bg-pink-500/10 rounded-lg p-3">
                    <p className="text-2xl font-bold text-pink-400">{stats.females}</p>
                    <p className="text-[10px] text-white/40">Hembras ({pct(stats.females, stats.totalDogs)}%)</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4">
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Pedigree</h3>
                <div className="flex gap-4">
                  <div className="flex-1 text-center bg-green-500/10 rounded-lg p-3">
                    <p className="text-2xl font-bold text-green-400">{stats.withPedigree}</p>
                    <p className="text-[10px] text-white/40">Con padres ({pct(stats.withPedigree, stats.totalDogs)}%)</p>
                  </div>
                  <div className="flex-1 text-center bg-white/5 rounded-lg p-3">
                    <p className="text-2xl font-bold text-white/40">{stats.totalDogs - stats.withPedigree}</p>
                    <p className="text-[10px] text-white/40">Incompleto</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === FORMULARIOS === */}
      {activeSection === 'formularios' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2 sm:gap-3">
            <Card icon={FileText} label="Solicitudes" value={stats.totalSubmissions} color="#EC4899" />
            <Card icon={Target} label="→ Negocio" value={`${pct(stats.totalDeals, stats.totalSubmissions)}%`} color="#D74709" />
            <Card icon={TrendingUp} label="→ Venta" value={`${pct(stats.wonDeals, stats.totalSubmissions)}%`} color="#10B981" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Submissions area chart */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Solicitudes por mes</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={stats.subMonthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="Solicitudes" stroke="#EC4899" fill="#EC4899" fillOpacity={0.1} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Breed demand */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Razas mas demandadas</h3>
              {stats.demandChart.length === 0 ? <p className="text-xs text-white/25 text-center py-8">Sin datos</p> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.demandChart}>
                    <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Solicitudes" fill="#D74709" fillOpacity={0.6} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {/* === ACTIVIDAD === */}
      {activeSection === 'actividad' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <Card icon={Stethoscope} label="Vet records" value={stats.vetCount} color="#3B82F6" />
            <Card icon={Trophy} label="Premios" value={stats.awardsCount} color="#F59E0B" />
            <Card icon={Gem} label="Genes" value={stats.genesBalance} color="#8B5CF6" />
            <Card icon={Clock} label="Antiguedad" value={`${stats.accountAge}a`} color="#06B6D4" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Genes</h3>
              <div className="flex gap-4 mb-4">
                <div className="flex-1 text-center bg-green-500/10 rounded-lg p-3">
                  <p className="text-lg font-bold text-green-400">+{stats.genesEarned}</p>
                  <p className="text-[10px] text-white/40">Comprados</p>
                </div>
                <div className="flex-1 text-center bg-red-500/10 rounded-lg p-3">
                  <p className="text-lg font-bold text-red-400">-{stats.genesSpent}</p>
                  <p className="text-[10px] text-white/40">Gastados</p>
                </div>
                <div className="flex-1 text-center bg-purple-500/10 rounded-lg p-3">
                  <p className="text-lg font-bold text-purple-400">{stats.genesBalance}</p>
                  <p className="text-[10px] text-white/40">Balance</p>
                </div>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Resumen</h3>
              <div className="space-y-2">
                {[
                  { l: 'Perros registrados', v: stats.totalDogs },
                  { l: 'Camadas', v: stats.totalLitters },
                  { l: 'Contactos CRM', v: stats.totalContacts },
                  { l: 'Negocios', v: stats.totalDeals },
                  { l: 'Registros veterinarios', v: stats.vetCount },
                  { l: 'Premios', v: stats.awardsCount },
                ].map(r => (
                  <div key={r.l} className="flex items-center justify-between text-xs">
                    <span className="text-white/50">{r.l}</span>
                    <span className="font-bold text-white/60">{r.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Card({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 sm:p-3">
      <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color }} />
        </div>
      </div>
      <p className="text-xs sm:text-sm font-bold">{typeof value === 'number' ? fmt(value) : value}</p>
      <p className="text-[9px] sm:text-[10px] text-white/40 mt-0.5">{label}</p>
    </div>
  )
}
