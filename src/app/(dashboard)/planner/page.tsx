'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Dna, Heart } from 'lucide-react'
import SearchableSelect from '@/components/ui/searchable-select'
import PedigreeTree from '@/components/pedigree/pedigree-tree'
import { calculateCOIFromParents, getCOILevel, getCOIInterpretation } from '@/components/pedigree/coi-calculator'

export default function PlannerPage() {
  const [males, setMales] = useState<{ value: string; label: string }[]>([])
  const [females, setFemales] = useState<{ value: string; label: string }[]>([])
  const [sireId, setSireId] = useState('')
  const [damId, setDamId] = useState('')
  const [pedigreeData, setPedigreeData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Load dogs
  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: allDogs } = await supabase
        .from('dogs')
        .select('id, name, sex')
        .eq('owner_id', user.id)
        .order('name')

      const dogs = allDogs || []
      setMales(dogs.filter(d => d.sex === 'male').map(d => ({ value: d.id, label: d.name })))
      setFemales(dogs.filter(d => d.sex === 'female').map(d => ({ value: d.id, label: d.name })))
    }
    load()
  }, [])

  // Load pedigree when both selected
  useEffect(() => {
    if (!sireId || !damId) { setPedigreeData([]); return }

    async function loadPedigree() {
      setLoading(true)
      const supabase = createClient()

      // Get pedigree for both parents
      const [sireRes, damRes] = await Promise.all([
        supabase.rpc('get_pedigree', { dog_uuid: sireId, max_gen: 5 }),
        supabase.rpc('get_pedigree', { dog_uuid: damId, max_gen: 5 }),
      ])

      const sireData = sireRes.data || []
      const damData = damRes.data || []

      // Merge unique nodes
      const nodeMap = new Map<string, any>()
      ;[...sireData, ...damData].forEach(n => nodeMap.set(n.id, n))

      // Create a virtual root
      const virtualRoot = {
        id: 'virtual-litter',
        name: 'Camada Hipotetica',
        sex: 'unknown',
        registration: null,
        father_id: sireId,
        mother_id: damId,
        generation: 0,
        photo_url: null,
        breed_name: null,
        color_name: null,
      }
      nodeMap.set(virtualRoot.id, virtualRoot)

      setPedigreeData(Array.from(nodeMap.values()))
      setLoading(false)
    }
    loadPedigree()
  }, [sireId, damId])

  // Calculate COI
  const coi = useMemo(() => {
    if (!sireId || !damId || pedigreeData.length === 0) return null
    return calculateCOIFromParents(sireId, damId, pedigreeData, 10)
  }, [sireId, damId, pedigreeData])

  const coiLevel = coi !== null ? getCOILevel(coi) : null
  const coiText = coi !== null ? getCOIInterpretation(coi) : ''

  const coiColors: Record<string, { bg: string; text: string; border: string }> = {
    green: { bg: 'bg-green-500/15', text: 'text-green-400', border: 'border-green-500/30' },
    orange: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
    red: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Planificador de Cruces</h1>
        <p className="text-sm text-white/40 mt-1">Selecciona un macho y una hembra para ver el pedigri combinado y calcular el COI</p>
      </div>

      {/* Parent selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white/5 border border-blue-400/30 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-3">Padre (Macho)</h3>
          <SearchableSelect
            options={males}
            value={sireId}
            onChange={setSireId}
            placeholder="Seleccionar macho..."
          />
        </div>
        <div className="bg-white/5 border border-pink-400/30 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-pink-400 uppercase tracking-wider mb-3">Madre (Hembra)</h3>
          <SearchableSelect
            options={females}
            value={damId}
            onChange={setDamId}
            placeholder="Seleccionar hembra..."
          />
        </div>
      </div>

      {/* COI Result */}
      {coi !== null && coiLevel && (
        <div className={`${coiColors[coiLevel].bg} border ${coiColors[coiLevel].border} rounded-xl p-5 mb-6`}>
          <div className="flex items-center gap-3">
            <Dna className={`w-6 h-6 ${coiColors[coiLevel].text}`} />
            <div>
              <p className={`text-2xl font-bold ${coiColors[coiLevel].text}`}>COI: {coi}%</p>
              <p className={`text-sm ${coiColors[coiLevel].text} opacity-80 mt-0.5`}>{coiText}</p>
            </div>
          </div>
          {/* COI bar */}
          <div className="mt-4 h-3 rounded-full bg-white/10 overflow-hidden flex">
            <div className="bg-green-500 h-full" style={{ width: '25%' }} />
            <div className="bg-orange-500 h-full" style={{ width: '25%' }} />
            <div className="bg-red-500 h-full" style={{ width: '50%' }} />
          </div>
          <div className="flex justify-between text-[10px] text-white/30 mt-1 px-0.5">
            <span>0%</span>
            <span>6.25%</span>
            <span>12.5%</span>
            <span>25%</span>
          </div>
          {/* Indicator */}
          <div className="relative h-4 -mt-1">
            <div
              className={`absolute w-2 h-2 rounded-full ${coiColors[coiLevel].text.replace('text-', 'bg-')} -translate-x-1`}
              style={{ left: `${Math.min((coi / 25) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Combined Pedigree */}
      {loading ? (
        <div className="text-center py-12 text-white/30">Cargando pedigri combinado...</div>
      ) : pedigreeData.length > 1 ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 overflow-x-auto">
          <h2 className="text-lg font-bold mb-4">Pedigri Combinado</h2>
          <PedigreeTree data={pedigreeData} rootId="virtual-litter" />
        </div>
      ) : sireId && damId ? (
        <div className="text-center py-12 text-white/30">No hay datos de pedigri disponibles</div>
      ) : (
        <div className="text-center py-20">
          <Heart className="w-12 h-12 mx-auto mb-4 text-white/10" />
          <p className="text-white/30">Selecciona un macho y una hembra para comenzar</p>
        </div>
      )}
    </div>
  )
}
