'use client'

import { useEffect, useMemo, useState } from 'react'
import { isNativeApp } from '@/lib/is-native'
import {
  BarChart3, Dog, Baby, Trophy, Stethoscope,
  Tag
} from 'lucide-react'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts'

interface Props {
  dogs: any[]; kennelDogs: any[]; litters: any[]
  kennel: any; vetCount: number; awardsCount: number
  profile: any; userId: string
}

const COLORS = ['#D74709', '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#06B6D4', '#EF4444']

function fmt(n: number) { return n.toLocaleString('es-ES') }

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

export default function AnalyticsDashboard({ dogs, kennelDogs, litters, kennel, vetCount, awardsCount, profile, userId }: Props) {
  const [activeSection, setActiveSection] = useState('resumen')
  const [native, setNative] = useState(false)
  useEffect(() => { setNative(isNativeApp()) }, [])

  const stats = useMemo(() => {
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

    const transferred = kennelDogs.filter((d: any) => d.owner_id !== userId).length
    const withPedigree = dogs.filter((d: any) => d.father_id && d.mother_id).length
    const ages = dogs.filter((d: any) => d.birth_date).map((d: any) => (Date.now() - new Date(d.birth_date).getTime()) / (365.25 * 86400000))
    const avgAge = ages.length > 0 ? (ages.reduce((a: number, b: number) => a + b, 0) / ages.length).toFixed(1) : '0'

    return {
      totalDogs: dogs.length, forSale: dogs.filter((d: any) => d.is_for_sale).length,
      totalLitters: litters.length, totalPuppies, avgPuppies,
      breedPie, males, females, littersChart, topReproducers,
      reproductors: Math.max(
        kennelDogs.filter((d: any) => d.is_reproductive).length,
        dogs.filter((d: any) => d.is_reproductive).length
      ),
      totalKennelDogs: kennelDogs.length, transferred,
      retained: kennelDogs.filter((d: any) => d.owner_id === userId).length,
      withPedigree, avgAge,
      vetCount, awardsCount,
      accountAge: profile?.created_at ? ((Date.now() - new Date(profile.created_at).getTime()) / (365.25 * 86400000)).toFixed(1) : '0',
    }
  }, [dogs, kennelDogs, litters, userId, profile, vetCount, awardsCount])

  const sections = [
    { key: 'resumen', label: 'Resumen', icon: BarChart3 },
    { key: 'reproduccion', label: 'Reproducción', icon: Baby },
    { key: 'criadero', label: 'Criadero', icon: Dog },
  ]

  function Card({ icon: Icon, label, value, color }: any) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: color + '15' }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
        </div>
        <p className="text-xl sm:text-2xl font-bold">{typeof value === 'number' ? fmt(value) : value}</p>
        <p className="text-xs text-white/40 mt-1">{label}</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Analíticas</h1>
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

      {activeSection === 'resumen' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
            <Card icon={Dog} label="Perros" value={stats.totalDogs} color="#D74709" />
            <Card icon={Baby} label="Camadas" value={stats.totalLitters} color="#8B5CF6" />
            <Card icon={Tag} label="En venta" value={stats.forSale} color="#10B981" />
            <Card icon={Stethoscope} label="Registros vet." value={stats.vetCount} color="#3B82F6" />
            <Card icon={Trophy} label="Logros" value={stats.awardsCount} color="#F59E0B" />
          </div>

          {stats.breedPie.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3">Distribución por raza</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={stats.breedPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e: any) => e.name}>
                    {stats.breedPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {activeSection === 'reproduccion' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <Card icon={Baby} label="Camadas totales" value={stats.totalLitters} color="#8B5CF6" />
            <Card icon={Dog} label="Cachorros" value={stats.totalPuppies} color="#10B981" />
            <Card icon={BarChart3} label="Promedio cachorros" value={stats.avgPuppies} color="#3B82F6" />
            <Card icon={Dog} label="Reproductores" value={stats.reproductors} color="#D74709" />
          </div>

          {stats.littersChart.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3">Camadas por año</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.littersChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#fff6' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#fff6' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Camadas" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {stats.topReproducers.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3">Top reproductores</h3>
              <div className="space-y-2">
                {stats.topReproducers.map((r: any) => (
                  <div key={r.name} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: (r.sex === 'male' ? '#017DFA' : '#e84393') + '15' }}>
                      <Dog className="w-4 h-4" style={{ color: r.sex === 'male' ? '#017DFA' : '#e84393' }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold">{r.name}</p>
                      <p className="text-[10px] text-white/40">{r.count} camadas</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeSection === 'criadero' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <Card icon={Dog} label="Total perros" value={stats.totalKennelDogs} color="#D74709" />
            <Card icon={Dog} label="Retenidos" value={stats.retained} color="#10B981" />
            <Card icon={Dog} label="Transferidos" value={stats.transferred} color="#F59E0B" />
            <Card icon={Dog} label="Con pedigree" value={stats.withPedigree} color="#8B5CF6" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            <Card icon={Dog} label="Machos" value={stats.males} color="#017DFA" />
            <Card icon={Dog} label="Hembras" value={stats.females} color="#e84393" />
            <Card icon={BarChart3} label="Edad promedio" value={`${stats.avgAge} años`} color="#3B82F6" />
          </div>
        </div>
      )}

    </div>
  )
}
