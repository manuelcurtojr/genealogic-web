'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Heart, Mars, Venus, Dna } from 'lucide-react'
import SearchableSelect from '@/components/ui/searchable-select'
import PedigreeTree from '@/components/pedigree/pedigree-tree'
import GeneticsForecast from '@/components/planner/genetics-forecast'
import { BRAND } from '@/lib/constants'
import { useT } from '@/components/i18n/locale-provider'

export default function PlannerPage() {
  const t = useT()
  const [males, setMales] = useState<{ value: string; label: string }[]>([])
  const [females, setFemales] = useState<{ value: string; label: string }[]>([])
  const [sireId, setSireId] = useState('')
  const [damId, setDamId] = useState('')
  const [pedigreeData, setPedigreeData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

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

  useEffect(() => {
    if (!sireId || !damId) { setPedigreeData([]); return }

    async function loadPedigree() {
      setLoading(true)
      const supabase = createClient()

      const [sireRes, damRes] = await Promise.all([
        supabase.rpc('get_pedigree', { dog_uuid: sireId, max_gen: 5 }),
        supabase.rpc('get_pedigree', { dog_uuid: damId, max_gen: 5 }),
      ])

      const sireData = sireRes.data || []
      const damData = damRes.data || []

      const nodeMap = new Map<string, any>()
      ;[...sireData, ...damData].forEach(n => nodeMap.set(n.id, n))

      const virtualRoot = {
        id: 'virtual-litter',
        name: t('Camada hipotética'),
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
    <div className="space-y-6 sm:space-y-8">
      <div>
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">{t('Crianza')}</p>
        <h1 className="mt-1.5 text-[32px] sm:text-[40px] font-semibold leading-[1.1] tracking-[-0.04em] text-ink">
          {t('Simulador de cruces')}
        </h1>
        <p className="mt-2 text-[14px] text-body">
          {t('Selecciona un macho y una hembra para ver la genealogía combinada de la camada hipotética.')}
        </p>
      </div>

      {/* Parent selectors */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-hairline bg-canvas p-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md" style={{ backgroundColor: BRAND.male }}>
              <Mars className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">{t('Padre (macho)')}</h3>
          </div>
          <SearchableSelect
            options={males}
            value={sireId}
            onChange={setSireId}
            placeholder={t('Seleccionar macho...')}
          />
        </div>
        <div className="rounded-xl border border-hairline bg-canvas p-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md" style={{ backgroundColor: BRAND.female }}>
              <Venus className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">{t('Madre (hembra)')}</h3>
          </div>
          <SearchableSelect
            options={females}
            value={damId}
            onChange={setDamId}
            placeholder={t('Seleccionar hembra...')}
          />
        </div>
      </div>

      {/* Genetics Forecast — solo cuando ambos padres están seleccionados */}
      {sireId && damId && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-[22px] font-semibold tracking-[-0.04em] text-ink">
            <Dna className="h-5 w-5" />
            {t('Predicción genética')}
          </h2>
          <GeneticsForecast sireId={sireId} damId={damId} />
        </section>
      )}

      {/* Combined pedigree */}
      {loading ? (
        <div className="rounded-xl border border-dashed border-hairline bg-surface-soft px-6 py-16 text-center text-[14px] text-muted">
          {t('Cargando genealogía combinada...')}
        </div>
      ) : pedigreeData.length > 1 ? (
        <section className="-mx-4 lg:mx-0">
          <h2 className="mb-4 px-4 text-[22px] font-semibold tracking-[-0.04em] text-ink lg:px-0">
            {t('Genealogía combinada')}
          </h2>
          {/* Ruta reservada (solo insiders vía middleware) → siempre Pro. */}
          <PedigreeTree data={pedigreeData} rootId="virtual-litter" showCoi={true} />
        </section>
      ) : sireId && damId ? (
        <div className="rounded-xl border border-dashed border-hairline bg-surface-soft px-6 py-16 text-center">
          <p className="text-[14px] text-body">{t('No hay datos de genealogía disponibles para este cruce.')}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-hairline bg-surface-soft px-6 py-20 text-center">
          <Heart className="mx-auto h-10 w-10 text-muted" />
          <p className="mt-3 text-[14px] text-body">{t('Selecciona un macho y una hembra para comenzar.')}</p>
        </div>
      )}
    </div>
  )
}
