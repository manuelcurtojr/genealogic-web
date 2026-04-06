'use client'

import { useMemo, useState } from 'react'
import {
  BarChart3, Dog, Baby, HandCoins, Users, TrendingUp, TrendingDown, Target,
  Heart, Globe, MapPin, Trophy, Stethoscope, Camera, Gem, Clock, ArrowRightLeft,
  Tag, FileText, Flame, ChevronDown
} from 'lucide-react'

interface Props {
  dogs: any[]; kennelDogs: any[]; litters: any[]; deals: any[]; contacts: any[]
  kennel: any; pipelines: any[]; vetCount: number; awardsCount: number
  submissions: any[]; profile: any; genesTransactions: any[]; userId: string
}

const WON = /ganad|entregad/i
const LOST = /perdid|cancelad/i

function fmt(n: number) { return n.toLocaleString('es-ES') }
function pct(a: number, b: number) { return b > 0 ? Math.round((a / b) * 100) : 0 }

export default function AnalyticsDashboard({ dogs, kennelDogs, litters, deals, contacts, kennel, pipelines, vetCount, awardsCount, submissions, profile, genesTransactions, userId }: Props) {
  const [activeSection, setActiveSection] = useState('resumen')

  const stats = useMemo(() => {
    // Pipeline stages
    const allStages = pipelines.flatMap((p: any) => (p.stages || []).map((s: any) => ({ ...s, pipelineName: p.name })))
    const wonStages = allStages.filter((s: any) => WON.test(s.name))
    const lostStages = allStages.filter((s: any) => LOST.test(s.name))
    const wonStageIds = new Set(wonStages.map((s: any) => s.id))
    const lostStageIds = new Set(lostStages.map((s: any) => s.id))

    const wonDeals = deals.filter(d => wonStageIds.has(d.stage_id))
    const lostDeals = deals.filter(d => lostStageIds.has(d.stage_id))
    const activeDeals = deals.filter(d => !wonStageIds.has(d.stage_id) && !lostStageIds.has(d.stage_id))
    const totalRevenue = wonDeals.reduce((s, d) => s + (Number(d.value) || 0), 0)
    const lostRevenue = lostDeals.reduce((s, d) => s + (Number(d.value) || 0), 0)
    const activeRevenue = activeDeals.reduce((s, d) => s + (Number(d.value) || 0), 0)
    const resolved = wonDeals.length + lostDeals.length
    const winRate = pct(wonDeals.length, resolved)
    const avgTicket = wonDeals.length > 0 ? Math.round(totalRevenue / wonDeals.length) : 0

    // Time to close
    const closeTimes = wonDeals.map(d => {
      const created = new Date(d.created_at).getTime()
      return (Date.now() - created) / (1000 * 60 * 60 * 24)
    }).filter(d => d > 0)
    const avgCloseTime = closeTimes.length > 0 ? Math.round(closeTimes.reduce((a, b) => a + b, 0) / closeTimes.length) : 0

    // Loss reasons
    const lossReasons: Record<string, number> = {}
    lostDeals.forEach(d => { const r = d.lost_reason || 'Sin especificar'; lossReasons[r] = (lossReasons[r] || 0) + 1 })
    const topLosses = Object.entries(lossReasons).sort((a, b) => b[1] - a[1]).slice(0, 5)

    // Deals by stage
    const dealsByStage = allStages.map((s: any) => ({
      name: s.name, color: s.color || '#666',
      count: deals.filter(d => d.stage_id === s.id).length,
      value: deals.filter(d => d.stage_id === s.id).reduce((sum: number, d: any) => sum + (Number(d.value) || 0), 0),
    })).filter(s => s.count > 0)

    // Clients by country
    const byCountry: Record<string, number> = {}
    contacts.forEach(c => { if (c.country) byCountry[c.country] = (byCountry[c.country] || 0) + 1 })
    const topCountries = Object.entries(byCountry).sort((a, b) => b[1] - a[1]).slice(0, 10)

    // Clients by city
    const byCity: Record<string, number> = {}
    contacts.forEach(c => { if (c.city) byCity[c.city] = (byCity[c.city] || 0) + 1 })
    const topCities = Object.entries(byCity).sort((a, b) => b[1] - a[1]).slice(0, 10)

    // Breeds distribution
    const byBreed: Record<string, number> = {}
    dogs.forEach(d => { const b = d.breed?.name || 'Sin raza'; byBreed[b] = (byBreed[b] || 0) + 1 })
    const breedDist = Object.entries(byBreed).sort((a, b) => b[1] - a[1])

    // Sex distribution
    const males = dogs.filter(d => d.sex === 'male').length
    const females = dogs.filter(d => d.sex === 'female').length

    // Litters stats
    const totalPuppies = litters.reduce((s, l) => s + (l.puppy_count || 0), 0)
    const avgPuppiesPerLitter = litters.length > 0 ? (totalPuppies / litters.length).toFixed(1) : '0'
    const littersByYear: Record<string, number> = {}
    litters.forEach(l => { const y = new Date(l.created_at).getFullYear().toString(); littersByYear[y] = (littersByYear[y] || 0) + 1 })

    // Top reproducers
    const fatherCounts: Record<string, { name: string; count: number }> = {}
    const motherCounts: Record<string, { name: string; count: number }> = {}
    litters.forEach(l => {
      if (l.father_id) {
        const dog = kennelDogs.find((d: any) => d.id === l.father_id)
        if (dog) fatherCounts[l.father_id] = { name: dog.name, count: (fatherCounts[l.father_id]?.count || 0) + 1 }
      }
      if (l.mother_id) {
        const dog = kennelDogs.find((d: any) => d.id === l.mother_id)
        if (dog) motherCounts[l.mother_id] = { name: dog.name, count: (motherCounts[l.mother_id]?.count || 0) + 1 }
      }
    })
    const topSires = Object.values(fatherCounts).sort((a, b) => b.count - a.count).slice(0, 5)
    const topDams = Object.values(motherCounts).sort((a, b) => b.count - a.count).slice(0, 5)

    // Submissions by month
    const subsByMonth: Record<string, number> = {}
    submissions.forEach(s => {
      const m = new Date(s.created_at).toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
      subsByMonth[m] = (subsByMonth[m] || 0) + 1
    })

    // Breed demand from submissions
    const breedDemand: Record<string, number> = {}
    submissions.forEach(s => {
      const names = s.data?.breed_interest_names
      if (names) names.split(',').forEach((n: string) => { const t = n.trim(); if (t) breedDemand[t] = (breedDemand[t] || 0) + 1 })
    })
    const topDemand = Object.entries(breedDemand).sort((a, b) => b[1] - a[1]).slice(0, 5)

    // Revenue by breed (from deals with contacts linked to dogs)
    const revenueByBreed: Record<string, number> = {}
    wonDeals.forEach(d => {
      // Try to find breed from contact or title
      breedDist.forEach(([breed]) => {
        if (d.title?.toLowerCase().includes(breed.toLowerCase())) {
          revenueByBreed[breed] = (revenueByBreed[breed] || 0) + (Number(d.value) || 0)
        }
      })
    })

    // Monthly deals trend
    const dealsByMonth: Record<string, { created: number; won: number; lost: number }> = {}
    deals.forEach(d => {
      const m = new Date(d.created_at).toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
      if (!dealsByMonth[m]) dealsByMonth[m] = { created: 0, won: 0, lost: 0 }
      dealsByMonth[m].created++
      if (wonStageIds.has(d.stage_id)) dealsByMonth[m].won++
      if (lostStageIds.has(d.stage_id)) dealsByMonth[m].lost++
    })

    // Dogs transferred
    const transferred = kennelDogs.filter((d: any) => d.owner_id !== userId).length
    const retained = kennelDogs.filter((d: any) => d.owner_id === userId).length

    // Pedigree completeness
    const withFullPedigree = dogs.filter(d => d.father_id && d.mother_id).length

    // Age
    const ages = dogs.filter(d => d.birth_date).map(d => (Date.now() - new Date(d.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    const avgAge = ages.length > 0 ? (ages.reduce((a, b) => a + b, 0) / ages.length).toFixed(1) : '0'

    // Genes
    const genesSpent = genesTransactions.filter((t: any) => t.type === 'gasto').reduce((s: number, t: any) => s + Math.abs(t.amount), 0)
    const genesEarned = genesTransactions.filter((t: any) => t.type === 'ingreso').reduce((s: number, t: any) => s + t.amount, 0)

    return {
      // General
      totalDogs: dogs.length, forSale: dogs.filter(d => d.is_for_sale).length,
      activeLitters: litters.filter(l => l.status !== 'born').length, totalLitters: litters.length,
      openDeals: activeDeals.length, totalContacts: contacts.length, totalSubmissions: submissions.length,
      // Sales
      totalRevenue, lostRevenue, activeRevenue, winRate, avgTicket, avgCloseTime,
      wonDeals: wonDeals.length, lostDeals: lostDeals.length, activeDealsCount: activeDeals.length,
      topLosses, dealsByStage, dealsByMonth: Object.entries(dealsByMonth),
      topCountries, topCities,
      // Reproduction
      totalPuppies, avgPuppiesPerLitter, littersByYear: Object.entries(littersByYear),
      males: litters.reduce((s, l) => s, 0), // would need puppy sex data
      reproductors: kennelDogs.filter((d: any) => d.is_reproductive).length,
      topSires, topDams,
      // Kennel
      breedDist, maleCount: males, femaleCount: females, avgAge,
      transferred, retained, withFullPedigree, totalKennelDogs: kennelDogs.length,
      // Forms
      subsByMonth: Object.entries(subsByMonth), topDemand,
      // Activity
      vetCount, awardsCount, genesBalance: profile?.genes || 0, genesSpent, genesEarned,
      accountAge: profile?.created_at ? ((Date.now() - new Date(profile.created_at).getTime()) / (365.25 * 24 * 60 * 60 * 1000)).toFixed(1) : '0',
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
      <h1 className="text-2xl font-bold mb-6">Analiticas</h1>

      {/* Section tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {sections.map(s => {
          const Icon = s.icon
          return (
            <button key={s.key} onClick={() => setActiveSection(s.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                activeSection === s.key
                  ? 'bg-[#D74709]/15 text-[#D74709] border border-[#D74709]/30'
                  : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
              }`}>
              <Icon className="w-3.5 h-3.5" /> {s.label}
            </button>
          )
        })}
      </div>

      {/* === RESUMEN === */}
      {activeSection === 'resumen' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card icon={Dog} label="Perros" value={stats.totalDogs} color="#D74709" />
            <Card icon={Tag} label="En venta" value={stats.forSale} color="#10B981" />
            <Card icon={Baby} label="Camadas" value={stats.totalLitters} color="#8B5CF6" />
            <Card icon={HandCoins} label="Negocios abiertos" value={stats.openDeals} color="#F59E0B" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card icon={TrendingUp} label="Revenue total" value={`${fmt(stats.totalRevenue)} EUR`} color="#10B981" />
            <Card icon={Target} label="Tasa conversion" value={`${stats.winRate}%`} color="#D74709" />
            <Card icon={Users} label="Contactos" value={stats.totalContacts} color="#3B82F6" />
            <Card icon={FileText} label="Solicitudes" value={stats.totalSubmissions} color="#EC4899" />
          </div>

          {/* Quick funnel */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Embudo de ventas</h3>
            <div className="flex items-center gap-3 text-center">
              <div className="flex-1 bg-blue-500/10 rounded-lg p-3">
                <p className="text-2xl font-bold text-blue-400">{stats.totalSubmissions}</p>
                <p className="text-[10px] text-white/40">Solicitudes</p>
              </div>
              <ChevronDown className="w-4 h-4 text-white/20 -rotate-90" />
              <div className="flex-1 bg-yellow-500/10 rounded-lg p-3">
                <p className="text-2xl font-bold text-yellow-400">{stats.openDeals + stats.wonDeals + stats.lostDeals}</p>
                <p className="text-[10px] text-white/40">Negocios</p>
              </div>
              <ChevronDown className="w-4 h-4 text-white/20 -rotate-90" />
              <div className="flex-1 bg-green-500/10 rounded-lg p-3">
                <p className="text-2xl font-bold text-green-400">{stats.wonDeals}</p>
                <p className="text-[10px] text-white/40">Ganados</p>
              </div>
              <ChevronDown className="w-4 h-4 text-white/20 -rotate-90" />
              <div className="flex-1 bg-red-500/10 rounded-lg p-3">
                <p className="text-2xl font-bold text-red-400">{stats.lostDeals}</p>
                <p className="text-[10px] text-white/40">Perdidos</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === VENTAS === */}
      {activeSection === 'ventas' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Card icon={TrendingUp} label="Revenue ganado" value={`${fmt(stats.totalRevenue)} EUR`} color="#10B981" />
            <Card icon={TrendingDown} label="Revenue perdido" value={`${fmt(stats.lostRevenue)} EUR`} color="#EF4444" />
            <Card icon={HandCoins} label="Pipeline activo" value={`${fmt(stats.activeRevenue)} EUR`} color="#3B82F6" />
            <Card icon={Target} label="Win rate" value={`${stats.winRate}%`} color="#D74709" />
            <Card icon={Clock} label="Tiempo cierre" value={`${stats.avgCloseTime} dias`} color="#8B5CF6" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Stage concentration */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Negocios por etapa</h3>
              <div className="space-y-2">
                {stats.dealsByStage.map((s: any) => {
                  const max = Math.max(...stats.dealsByStage.map((x: any) => x.count), 1)
                  return (
                    <div key={s.name} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                      <span className="text-xs text-white/50 w-32 truncate">{s.name}</span>
                      <div className="flex-1 h-4 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(s.count / max) * 100}%`, background: s.color, opacity: 0.6 }} />
                      </div>
                      <span className="text-xs font-bold text-white/60 w-6 text-right">{s.count}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Loss reasons */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Razones de perdida</h3>
              {stats.topLosses.length === 0 ? (
                <p className="text-xs text-white/25 text-center py-4">Sin datos</p>
              ) : (
                <div className="space-y-2">
                  {stats.topLosses.map(([reason, count]) => (
                    <div key={reason} className="flex items-center justify-between bg-red-500/5 rounded-lg px-3 py-2">
                      <span className="text-xs text-white/50 truncate">{reason}</span>
                      <span className="text-sm font-bold text-red-400">{count as number}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Clients geography */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 flex items-center gap-1"><Globe className="w-3 h-3" /> Clientes por pais</h3>
              {stats.topCountries.length === 0 ? <p className="text-xs text-white/25 text-center py-4">Sin datos</p> : (
                <div className="space-y-1.5">
                  {stats.topCountries.map(([country, count]) => (
                    <div key={country} className="flex items-center justify-between text-xs">
                      <span className="text-white/60">{country}</span>
                      <span className="font-bold text-white/40">{count as number}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 flex items-center gap-1"><MapPin className="w-3 h-3" /> Top ciudades</h3>
              {stats.topCities.length === 0 ? <p className="text-xs text-white/25 text-center py-4">Sin datos</p> : (
                <div className="space-y-1.5">
                  {stats.topCities.map(([city, count]) => (
                    <div key={city} className="flex items-center justify-between text-xs">
                      <span className="text-white/60">{city}</span>
                      <span className="font-bold text-white/40">{count as number}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* === REPRODUCCION === */}
      {activeSection === 'reproduccion' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card icon={Baby} label="Camadas totales" value={stats.totalLitters} color="#8B5CF6" />
            <Card icon={Dog} label="Cachorros nacidos" value={stats.totalPuppies} color="#D74709" />
            <Card icon={BarChart3} label="Media por camada" value={stats.avgPuppiesPerLitter} color="#3B82F6" />
            <Card icon={Heart} label="Reproductores" value={stats.reproductors} color="#EC4899" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Litters by year */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Camadas por ano</h3>
              {stats.littersByYear.length === 0 ? <p className="text-xs text-white/25 text-center py-4">Sin datos</p> : (
                <div className="space-y-2">
                  {stats.littersByYear.map(([year, count]) => (
                    <div key={year} className="flex items-center justify-between">
                      <span className="text-sm text-white/60">{year}</span>
                      <span className="text-lg font-bold text-purple-400">{count as number}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top reproducers */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Top reproductores</h3>
              <div className="space-y-3">
                {stats.topSires.length > 0 && (
                  <div>
                    <p className="text-[10px] text-blue-400 uppercase mb-1">Machos</p>
                    {stats.topSires.map((s: any) => (
                      <div key={s.name} className="flex items-center justify-between text-xs py-0.5">
                        <span className="text-white/60 truncate">{s.name}</span>
                        <span className="font-bold text-blue-400">{s.count} camadas</span>
                      </div>
                    ))}
                  </div>
                )}
                {stats.topDams.length > 0 && (
                  <div>
                    <p className="text-[10px] text-pink-400 uppercase mb-1">Hembras</p>
                    {stats.topDams.map((s: any) => (
                      <div key={s.name} className="flex items-center justify-between text-xs py-0.5">
                        <span className="text-white/60 truncate">{s.name}</span>
                        <span className="font-bold text-pink-400">{s.count} camadas</span>
                      </div>
                    ))}
                  </div>
                )}
                {stats.topSires.length === 0 && stats.topDams.length === 0 && (
                  <p className="text-xs text-white/25 text-center py-4">Sin datos</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === CRIADERO === */}
      {activeSection === 'criadero' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card icon={Dog} label="Perros del criadero" value={stats.totalKennelDogs} color="#D74709" />
            <Card icon={ArrowRightLeft} label="Transferidos" value={stats.transferred} color="#8B5CF6" />
            <Card icon={Dog} label="Retenidos" value={stats.retained} color="#10B981" />
            <Card icon={BarChart3} label="Edad media" value={`${stats.avgAge} anos`} color="#3B82F6" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Breed distribution */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Distribucion por raza</h3>
              <div className="space-y-2">
                {stats.breedDist.map(([breed, count]) => {
                  const max = Math.max(...stats.breedDist.map(([, c]) => c as number), 1)
                  return (
                    <div key={breed} className="flex items-center gap-2">
                      <span className="text-xs text-white/50 w-28 truncate">{breed}</span>
                      <div className="flex-1 h-4 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-[#D74709]/50" style={{ width: `${((count as number) / (max as number)) * 100}%` }} />
                      </div>
                      <span className="text-xs font-bold text-white/60 w-6 text-right">{count as number}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Sex + pedigree */}
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Distribucion por sexo</h3>
                <div className="flex gap-4">
                  <div className="flex-1 text-center bg-blue-500/10 rounded-lg p-3">
                    <p className="text-2xl font-bold text-blue-400">{stats.maleCount}</p>
                    <p className="text-[10px] text-white/40">Machos</p>
                  </div>
                  <div className="flex-1 text-center bg-pink-500/10 rounded-lg p-3">
                    <p className="text-2xl font-bold text-pink-400">{stats.femaleCount}</p>
                    <p className="text-[10px] text-white/40">Hembras</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Pedigree</h3>
                <div className="flex gap-4">
                  <div className="flex-1 text-center bg-green-500/10 rounded-lg p-3">
                    <p className="text-2xl font-bold text-green-400">{stats.withFullPedigree}</p>
                    <p className="text-[10px] text-white/40">Con padres</p>
                  </div>
                  <div className="flex-1 text-center bg-white/5 rounded-lg p-3">
                    <p className="text-2xl font-bold text-white/40">{stats.totalDogs - stats.withFullPedigree}</p>
                    <p className="text-[10px] text-white/40">Sin padres</p>
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
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <Card icon={FileText} label="Solicitudes totales" value={stats.totalSubmissions} color="#EC4899" />
            <Card icon={Target} label="Conversion a negocio" value={`${pct(deals.length, stats.totalSubmissions)}%`} color="#D74709" />
            <Card icon={TrendingUp} label="Conversion a venta" value={`${pct(stats.wonDeals, stats.totalSubmissions)}%`} color="#10B981" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Solicitudes por mes</h3>
              {stats.subsByMonth.length === 0 ? <p className="text-xs text-white/25 text-center py-4">Sin datos</p> : (
                <div className="space-y-1.5">
                  {stats.subsByMonth.map(([month, count]) => (
                    <div key={month} className="flex items-center justify-between">
                      <span className="text-xs text-white/50">{month}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-3 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-pink-500/50" style={{ width: `${Math.min(((count as number) / Math.max(...stats.subsByMonth.map(([, c]) => c as number), 1)) * 100, 100)}%` }} />
                        </div>
                        <span className="text-xs font-bold text-pink-400 w-6 text-right">{count as number}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Razas mas demandadas</h3>
              {stats.topDemand.length === 0 ? <p className="text-xs text-white/25 text-center py-4">Sin datos</p> : (
                <div className="space-y-2">
                  {stats.topDemand.map(([breed, count], i) => (
                    <div key={breed} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#D74709] w-5">{i + 1}</span>
                      <span className="text-sm text-white/60 flex-1">{breed}</span>
                      <span className="text-sm font-bold text-white/40">{count as number}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* === ACTIVIDAD === */}
      {activeSection === 'actividad' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card icon={Stethoscope} label="Registros veterinarios" value={stats.vetCount} color="#3B82F6" />
            <Card icon={Trophy} label="Premios/titulos" value={stats.awardsCount} color="#F59E0B" />
            <Card icon={Gem} label="Genes disponibles" value={stats.genesBalance} color="#8B5CF6" />
            <Card icon={Clock} label="Antiguedad" value={`${stats.accountAge} anos`} color="#06B6D4" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Historial de genes</h3>
              <div className="flex gap-4 mb-4">
                <div className="flex-1 text-center bg-green-500/10 rounded-lg p-3">
                  <p className="text-lg font-bold text-green-400">+{stats.genesEarned}</p>
                  <p className="text-[10px] text-white/40">Comprados</p>
                </div>
                <div className="flex-1 text-center bg-red-500/10 rounded-lg p-3">
                  <p className="text-lg font-bold text-red-400">-{stats.genesSpent}</p>
                  <p className="text-[10px] text-white/40">Gastados</p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Resumen de actividad</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/50">Perros registrados</span>
                  <span className="font-bold text-white/60">{stats.totalDogs}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/50">Camadas registradas</span>
                  <span className="font-bold text-white/60">{stats.totalLitters}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/50">Contactos CRM</span>
                  <span className="font-bold text-white/60">{stats.totalContacts}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/50">Negocios creados</span>
                  <span className="font-bold text-white/60">{deals.length}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/50">Registros veterinarios</span>
                  <span className="font-bold text-white/60">{stats.vetCount}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/50">Premios ganados</span>
                  <span className="font-bold text-white/60">{stats.awardsCount}</span>
                </div>
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
    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
      </div>
      <p className="text-sm font-bold">{typeof value === 'number' ? fmt(value) : value}</p>
      <p className="text-[10px] text-white/40 mt-0.5">{label}</p>
    </div>
  )
}
