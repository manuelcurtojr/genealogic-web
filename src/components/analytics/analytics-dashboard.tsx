'use client'

import { useEffect, useMemo, useState } from 'react'
import { isNativeApp } from '@/lib/is-native'
import { useT } from '@/components/i18n/locale-provider'
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

// Pastels Cal — más sutiles que primarios fuertes
const COLORS = ['#fb923c', '#3b82f6', '#8b5cf6', '#34d399', '#f59e0b', '#ec4899', '#06b6d4', '#ef4444']

function fmt(n: number) { return n.toLocaleString('es-ES') }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-hairline bg-canvas px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
      <p className="mb-1 text-[11.5px] text-muted">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-[12.5px] font-medium" style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

export default function AnalyticsDashboard({ dogs, kennelDogs, litters, kennel, vetCount, awardsCount, profile, userId }: Props) {
  const t = useT()
  const [activeSection, setActiveSection] = useState('resumen')
  const [native, setNative] = useState(false)
  useEffect(() => { setNative(isNativeApp()) }, [])

  const stats = useMemo(() => {
    // Breed distribution for pie
    const byBreed: Record<string, number> = {}
    dogs.forEach((d: any) => { const b = d.breed?.name || t('Sin raza'); byBreed[b] = (byBreed[b] || 0) + 1 })
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
    { key: 'resumen', label: t('Resumen'), icon: BarChart3 },
    { key: 'reproduccion', label: t('Reproducción'), icon: Baby },
    { key: 'criadero', label: t('Criadero'), icon: Dog },
  ]

  function Card({ icon: Icon, label, value, color }: any) {
    return (
      <div className="rounded-xl border border-hairline bg-canvas p-5">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" style={{ color }} />
          <span className="text-[12px] font-medium text-muted">{label}</span>
        </div>
        <p className="mt-3 text-[28px] font-semibold tabular-nums tracking-[-0.04em] text-ink leading-none">
          {typeof value === 'number' ? fmt(value) : value}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">{t('Métricas')}</p>
        <h1 className="mt-1.5 text-[32px] sm:text-[40px] font-semibold leading-[1.1] tracking-[-0.04em] text-ink">
          {t('Analíticas')}
        </h1>
      </div>

      <div className="inline-flex gap-1 rounded-lg bg-surface-card p-1">
        {sections.map(s => {
          const Icon = s.icon
          const active = activeSection === s.key
          return (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-4 py-1.5 text-[13px] font-medium transition-colors ${
                active ? 'bg-canvas text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)]' : 'text-muted hover:text-ink'
              }`}
            >
              <Icon className="h-4 w-4" /> {s.label}
            </button>
          )
        })}
      </div>

      {activeSection === 'resumen' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
            <Card icon={Dog} label={t('Perros')} value={stats.totalDogs} color="#fb923c" />
            <Card icon={Baby} label={t('Camadas')} value={stats.totalLitters} color="#8b5cf6" />
            <Card icon={Tag} label={t('En venta')} value={stats.forSale} color="#34d399" />
            <Card icon={Stethoscope} label={t('Registros vet.')} value={stats.vetCount} color="#3b82f6" />
            <Card icon={Trophy} label={t('Logros')} value={stats.awardsCount} color="#f59e0b" />
          </div>

          {stats.breedPie.length > 0 && (
            <div className="rounded-xl border border-hairline bg-canvas p-5">
              <h3 className="text-[16px] font-semibold tracking-[-0.02em] text-ink mb-4">{t('Distribución por raza')}</h3>
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
            <Card icon={Baby} label={t('Camadas totales')} value={stats.totalLitters} color="#8b5cf6" />
            <Card icon={Dog} label={t('Cachorros')} value={stats.totalPuppies} color="#34d399" />
            <Card icon={BarChart3} label={t('Promedio cachorros')} value={stats.avgPuppies} color="#3b82f6" />
            <Card icon={Dog} label={t('Reproductores')} value={stats.reproductors} color="#fb923c" />
          </div>

          {stats.littersChart.length > 0 && (
            <div className="rounded-xl border border-hairline bg-canvas p-5">
              <h3 className="text-[16px] font-semibold tracking-[-0.02em] text-ink mb-4">{t('Camadas por año')}</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.littersChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Camadas" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {stats.topReproducers.length > 0 && (
            <div className="rounded-xl border border-hairline bg-canvas p-5">
              <h3 className="text-[16px] font-semibold tracking-[-0.02em] text-ink mb-4">{t('Top reproductores')}</h3>
              <div className="space-y-2">
                {stats.topReproducers.map((r: any) => (
                  <div key={r.name} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: (r.sex === 'male' ? '#017DFA' : '#e84393') + '15' }}>
                      <Dog className="w-4 h-4" style={{ color: r.sex === 'male' ? '#017DFA' : '#e84393' }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[14px] font-medium text-ink">{r.name}</p>
                      <p className="text-[10px] text-muted">{r.count} {t('camadas')}</p>
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
            <Card icon={Dog} label={t('Total perros')} value={stats.totalKennelDogs} color="#fb923c" />
            <Card icon={Dog} label={t('Retenidos')} value={stats.retained} color="#34d399" />
            <Card icon={Dog} label={t('Transferidos')} value={stats.transferred} color="#f59e0b" />
            <Card icon={Dog} label={t('Con genealogía')} value={stats.withPedigree} color="#8b5cf6" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            <Card icon={Dog} label={t('Machos')} value={stats.males} color="#017DFA" />
            <Card icon={Dog} label={t('Hembras')} value={stats.females} color="#e84393" />
            <Card icon={BarChart3} label={t('Edad promedio')} value={`${stats.avgAge} ${t('años')}`} color="#3b82f6" />
          </div>
        </div>
      )}

    </div>
  )
}
