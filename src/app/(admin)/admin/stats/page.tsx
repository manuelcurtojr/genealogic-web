import { createClient } from '@/lib/supabase/server'
import AdminStatsClient from '@/components/admin/admin-stats-client'

export default async function AdminStatsPage() {
  const supabase = await createClient()

  // Fetch all data needed for charts
  const [
    profilesRes, dogsRes, kennelsRes, littersRes, dealsRes, genesRes,
    breedsRes, dogsByBreedRes, dogsBySexRes,
  ] = await Promise.all([
    supabase.from('profiles').select('id, role, created_at, country, status'),
    supabase.from('dogs').select('id, sex, breed_id, created_at, is_public, is_for_sale'),
    supabase.from('kennels').select('id, created_at'),
    supabase.from('litters').select('id, status, created_at'),
    supabase.from('deals').select('id, value, currency, created_at'),
    supabase.from('genes_transactions').select('id, amount, type, created_at'),
    supabase.from('breeds').select('id, name'),
    supabase.from('dogs').select('breed_id'),
    supabase.from('dogs').select('sex'),
  ])

  const profiles = profilesRes.data || []
  const dogs = dogsRes.data || []
  const kennels = kennelsRes.data || []
  const litters = littersRes.data || []
  const deals = dealsRes.data || []
  const genesTx = genesRes.data || []
  const breeds = breedsRes.data || []

  // Users by month (last 12 months)
  const usersByMonth = getMonthlyData(profiles, 12)
  const dogsByMonth = getMonthlyData(dogs, 12)
  const kennelsByMonth = getMonthlyData(kennels, 12)

  // Users by role
  const roleDistribution = [
    { name: 'Free', value: profiles.filter(p => p.role === 'free').length, color: '#6B7280' },
    { name: 'Pro', value: profiles.filter(p => p.role === 'pro').length, color: '#8B5CF6' },
    { name: 'Admin', value: profiles.filter(p => p.role === 'admin').length, color: '#EF4444' },
  ]

  // Dogs by sex
  const sexDistribution = [
    { name: 'Machos', value: dogs.filter(d => d.sex === 'male').length, color: '#017DFA' },
    { name: 'Hembras', value: dogs.filter(d => d.sex === 'female').length, color: '#e84393' },
    { name: 'Sin definir', value: dogs.filter(d => !d.sex).length, color: '#6B7280' },
  ]

  // Top breeds
  const breedCounts: Record<string, number> = {}
  dogs.forEach(d => { if (d.breed_id) breedCounts[d.breed_id] = (breedCounts[d.breed_id] || 0) + 1 })
  const topBreeds = Object.entries(breedCounts)
    .map(([id, count]) => ({ name: breeds.find(b => b.id === id)?.name || '?', value: count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)

  // Users by country
  const countryCounts: Record<string, number> = {}
  profiles.forEach(p => { if (p.country) countryCounts[p.country] = (countryCounts[p.country] || 0) + 1 })
  const topCountries = Object.entries(countryCounts)
    .map(([country, count]) => ({ name: country, value: count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)

  // Genes economy
  const genesIn = genesTx.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const genesOut = genesTx.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)
  const genesMonthly = getMonthlyGenesData(genesTx, 12)

  // Litters by status
  const litterStatus = [
    { name: 'Planificada', value: litters.filter(l => l.status === 'planned').length, color: '#6B7280' },
    { name: 'En gestación', value: litters.filter(l => l.status === 'mated').length, color: '#F59E0B' },
    { name: 'Nacida', value: litters.filter(l => l.status === 'born').length, color: '#10B981' },
  ]

  // Deals value
  const totalDealValue = deals.reduce((s, d) => s + (Number(d.value) || 0), 0)
  const dealsMonthly = getMonthlyDealsData(deals, 12)

  return (
    <AdminStatsClient
      usersByMonth={usersByMonth}
      dogsByMonth={dogsByMonth}
      kennelsByMonth={kennelsByMonth}
      roleDistribution={roleDistribution}
      sexDistribution={sexDistribution}
      topBreeds={topBreeds}
      topCountries={topCountries}
      litterStatus={litterStatus}
      genesMonthly={genesMonthly}
      dealsMonthly={dealsMonthly}
      totals={{
        users: profiles.length,
        dogs: dogs.length,
        kennels: kennels.length,
        litters: litters.length,
        deals: deals.length,
        totalDealValue,
        dogsPublic: dogs.filter(d => d.is_public).length,
        dogsForSale: dogs.filter(d => d.is_for_sale).length,
        genesIn,
        genesOut,
      }}
    />
  )
}

function getMonthlyData(items: any[], months: number) {
  const result = []
  const now = new Date()
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
    const count = items.filter(item => item.created_at?.startsWith(key)).length
    result.push({ month: label, count })
  }
  return result
}

function getMonthlyGenesData(items: any[], months: number) {
  const result = []
  const now = new Date()
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
    const monthItems = items.filter(t => t.created_at?.startsWith(key))
    const inFlow = monthItems.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
    const outFlow = monthItems.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)
    result.push({ month: label, entrada: inFlow, gasto: outFlow })
  }
  return result
}

function getMonthlyDealsData(items: any[], months: number) {
  const result = []
  const now = new Date()
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
    const monthItems = items.filter(t => t.created_at?.startsWith(key))
    const value = monthItems.reduce((s, t) => s + (Number(t.value) || 0), 0)
    const count = monthItems.length
    result.push({ month: label, valor: value, cantidad: count })
  }
  return result
}
