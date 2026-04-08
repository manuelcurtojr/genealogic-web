'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Heart } from 'lucide-react'
import SearchableSelect from '@/components/ui/searchable-select'
import PedigreeTree from '@/components/pedigree/pedigree-tree'

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

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold">Planificador de Cruces</h1>
        <p className="text-xs sm:text-sm text-white/40 mt-1">Selecciona un macho y una hembra para ver el pedigri combinado y calcular el COI</p>
      </div>

      {/* Parent selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-white/5 border border-blue-400/30 rounded-xl p-3 sm:p-5">
          <h3 className="text-xs sm:text-sm font-semibold text-blue-400 uppercase tracking-wider mb-2 sm:mb-3">Padre (Macho)</h3>
          <SearchableSelect
            options={males}
            value={sireId}
            onChange={setSireId}
            placeholder="Seleccionar macho..."
          />
        </div>
        <div className="bg-white/5 border border-pink-400/30 rounded-xl p-3 sm:p-5">
          <h3 className="text-xs sm:text-sm font-semibold text-pink-400 uppercase tracking-wider mb-2 sm:mb-3">Madre (Hembra)</h3>
          <SearchableSelect
            options={females}
            value={damId}
            onChange={setDamId}
            placeholder="Seleccionar hembra..."
          />
        </div>
      </div>

      {/* Combined Pedigree */}
      {loading ? (
        <div className="text-center py-12 text-white/30">Cargando pedigrí combinado...</div>
      ) : pedigreeData.length > 1 ? (
        <div>
          <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-3">Genealogía</h2>
          <PedigreeTree data={pedigreeData} rootId="virtual-litter" />
        </div>
      ) : sireId && damId ? (
        <div className="text-center py-12 text-white/30">No hay datos de pedigrí disponibles</div>
      ) : (
        <div className="text-center py-20">
          <Heart className="w-12 h-12 mx-auto mb-4 text-white/10" />
          <p className="text-white/30">Selecciona un macho y una hembra para comenzar</p>
        </div>
      )}
    </div>
  )
}
