'use client'

import { useState, useEffect, useRef } from 'react'
import ToggleSwitch from '@/components/ui/toggle'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { X, Loader2, Search, ChevronDown, CreditCard, GitBranch, Weight, ImageIcon, Eye, EyeOff, Dog, Stethoscope, Trophy, FileText, Lock, Globe, Shield, Dna, Heart, History } from 'lucide-react'
import { Portal } from '@/components/ui/portal'
import { BRAND } from '@/lib/constants'
import { formatDogName, type AffixFormat } from '@/lib/affix'
import { generateSlug } from '@/lib/slug'
import GalleryTab from './edit-tabs/gallery-tab'
import SaludTab from './edit-tabs/salud-tab'
import PalmaresTab from './edit-tabs/palmares-tab'
import PedigreePdfTab from './edit-tabs/pedigree-pdf-tab'
import GeneticaTab from './edit-tabs/genetica-tab'
import ReproduccionTab from './edit-tabs/reproduccion-tab'
import ImportPedigreeTab from './import-pedigree-tab'
import HistoricoTab from './edit-tabs/historico-tab'

interface DogFormPanelProps {
  open: boolean
  onClose: () => void
  onSaved?: (newDogId?: string) => void
  editDogId?: string | null
  userId: string
  defaultLitterId?: string | null
  defaultBreedId?: string | null
  defaultFatherId?: string | null
  defaultMotherId?: string | null
  defaultKennelId?: string | null
  defaultKennelName?: string | null
  defaultAffixFormat?: string | null
}

const TABS = [
  { key: 'datos', label: 'Datos', icon: Dog },
  { key: 'salud', label: 'Salud', icon: Stethoscope },
  { key: 'reproduccion', label: 'Reproducción', icon: Heart, femaleOnly: true },
  { key: 'genetica', label: 'Genética', icon: Dna },
  { key: 'palmares', label: 'Palmarés', icon: Trophy },
  { key: 'pedigree-pdf', label: 'Genealogía PDF', icon: FileText },
  { key: 'historico', label: 'Histórico', icon: History },
] as const

type TabKey = typeof TABS[number]['key']

export default function DogFormPanel({ open, onClose, onSaved, editDogId, userId, defaultLitterId, defaultBreedId, defaultFatherId, defaultMotherId, defaultKennelId, defaultKennelName, defaultAffixFormat }: DogFormPanelProps) {
  const router = useRouter()
  const isEdit = !!editDogId
  const [activeTab, setActiveTab] = useState<TabKey>('datos')
  const [createMode, setCreateMode] = useState<'manual' | 'import'>('manual')
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(false)
  const [error, setError] = useState('')

  const [breeds, setBreeds] = useState<any[]>([])
  const [colors, setColors] = useState<any[]>([])
  const [allColors, setAllColors] = useState<any[]>([])
  // Mapa breed_id → Set(color_id) desde la pivote breed_colors. Ref (no
  // state) porque filterByBreed lo lee sincrónicamente al cambiar de raza.
  const breedColorsRef = useRef<Map<string, Set<string>>>(new Map())
  const [kennels, setKennels] = useState<any[]>([])
  const [maleDogs, setMaleDogs] = useState<any[]>([])
  const [femaleDogs, setFemaleDogs] = useState<any[]>([])
  const [allMaleDogs, setAllMaleDogs] = useState<any[]>([])
  const [allFemaleDogs, setAllFemaleDogs] = useState<any[]>([])
  // Si el perro tiene un owner distinto al criador (transferido al cliente),
  // mostramos su info en el form para que el criador SEPA con quién está
  // tratando. No se puede editar desde aquí (los cambios de propietario
  // van por /reservas → transfer).
  const [externalOwner, setExternalOwner] = useState<{
    id: string; display_name: string | null; email: string | null; avatar_url: string | null
  } | null>(null)

  const [form, setForm] = useState({
    name: '', sex: 'male', birth_date: '', registration: '', microchip: '',
    weight: '', height: '', breed_id: '', color_id: '', kennel_id: '',
    father_id: '', mother_id: '', is_public: true,
  })

  useEffect(() => {
    if (!open) return
    setActiveTab('datos'); setCreateMode('manual'); setDataLoading(true); setError('')
    const supabase = createClient()
    async function load() {
      // NOTA: la tabla `colors` NO tiene columna breed_id — la relación
      // raza↔color vive en la pivote `breed_colors` (breed_id, color_id).
      // Antes el código pedía colors.select('id, name, breed_id') → el
      // select fallaba con error 42703 → cRes.data = null → el selector de
      // color salía vacío en TODOS los perros. Bug de creación/edición.
      const [bRes, cRes, bcRes, kRes, mRes, fRes] = await Promise.all([
        supabase.from('breeds').select('id, name').order('name'),
        supabase.from('colors').select('id, name').order('name'),
        supabase.from('breed_colors').select('breed_id, color_id'),
        supabase.from('kennels').select('id, name, logo_url').eq('owner_id', userId).order('name'),
        supabase.from('dogs').select('id, name, sex, thumbnail_url, breed_id').eq('sex', 'male').order('name').limit(500),
        supabase.from('dogs').select('id, name, sex, thumbnail_url, breed_id').eq('sex', 'female').order('name').limit(500),
      ])

      // Construir mapa breed_id → Set(color_id) para filtrar colores por raza.
      const bcMap = new Map<string, Set<string>>()
      for (const row of (bcRes.data || []) as { breed_id: string; color_id: string }[]) {
        if (!bcMap.has(row.breed_id)) bcMap.set(row.breed_id, new Set())
        bcMap.get(row.breed_id)!.add(row.color_id)
      }
      breedColorsRef.current = bcMap

      setBreeds(bRes.data || []); setAllColors(cRes.data || []); setColors(cRes.data || [])
      setKennels(kRes.data || []); setAllMaleDogs(mRes.data || []); setAllFemaleDogs(fRes.data || [])
      setMaleDogs(mRes.data || []); setFemaleDogs(fRes.data || [])

      if (editDogId) {
        const { data: dog } = await supabase.from('dogs').select('*').eq('id', editDogId).single()
        if (dog) {
          const f = { name: dog.name || '', sex: dog.sex || 'male', birth_date: dog.birth_date || '', registration: dog.registration || '', microchip: dog.microchip || '', weight: dog.weight?.toString() || '', height: dog.height?.toString() || '', breed_id: dog.breed_id || '', color_id: dog.color_id || '', kennel_id: dog.kennel_id || '', father_id: dog.father_id || '', mother_id: dog.mother_id || '', is_public: dog.is_public ?? true }
          setForm(f)
          if (dog.breed_id) filterByBreed(dog.breed_id, cRes.data || [], mRes.data || [], fRes.data || [])

          // Cargar info de quien posee el perro AHORA (puede ser distinto al
          // criador si el perro ya fue transferido al cliente). Util para
          // que el criador vea "Este perro ya tiene otro propietario" sin
          // confusión al editar.
          if (dog.owner_id && dog.owner_id !== userId) {
            const { data: ownerProfile } = await supabase
              .from('profiles')
              .select('display_name, email, avatar_url')
              .eq('id', dog.owner_id)
              .maybeSingle()
            setExternalOwner(ownerProfile ? {
              id: dog.owner_id,
              display_name: ownerProfile.display_name,
              email: ownerProfile.email,
              avatar_url: ownerProfile.avatar_url,
            } : null)
          } else {
            setExternalOwner(null)
          }
        }
      } else {
        setForm({ name: '', sex: 'male', birth_date: '', registration: '', microchip: '', weight: '', height: '', breed_id: defaultBreedId || '', color_id: '', kennel_id: defaultKennelId || '', father_id: defaultFatherId || '', mother_id: defaultMotherId || '', is_public: true })
        if (defaultBreedId) filterByBreed(defaultBreedId, cRes.data || [], mRes.data || [], fRes.data || [])
      }
      setDataLoading(false)
    }
    load()
  }, [open, editDogId, userId])

  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, onClose])

  function filterByBreed(breedId: string, cd?: any[], md?: any[], fd?: any[]) {
    const c = cd || allColors, m = md || allMaleDogs, f = fd || allFemaleDogs
    if (!breedId) { setColors(c); setMaleDogs(m); setFemaleDogs(f) }
    else {
      // Filtrar colores por la pivote breed_colors. Si la raza NO tiene
      // colores configurados (solo 117 de ~244 razas los tienen), mostramos
      // TODOS — mejor un selector con todo que un selector vacío.
      const allowedColors = breedColorsRef.current.get(breedId)
      setColors(
        allowedColors && allowedColors.size > 0
          ? c.filter((cl: any) => allowedColors.has(cl.id))
          : c,
      )
      setMaleDogs(m.filter((d: any) => d.breed_id === breedId))
      setFemaleDogs(f.filter((d: any) => d.breed_id === breedId))
    }
  }

  const set = (field: string, value: any) => {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'breed_id') { filterByBreed(value); next.color_id = ''; next.father_id = ''; next.mother_id = '' }
      return next
    })
  }

  const isFromLitter = !isEdit && !!defaultLitterId
  const kennelAffix = defaultKennelName && defaultAffixFormat

  const handleSubmit = async () => {
    if (!form.name.trim()) return
    setLoading(true); setError('')
    const supabase = createClient()
    const finalName = kennelAffix ? formatDogName(form.name.trim(), defaultKennelName!, defaultAffixFormat as AffixFormat) : form.name.trim()
    const payload = {
      name: finalName, sex: form.sex, birth_date: form.birth_date || null,
      registration: form.registration || null, microchip: form.microchip || null,
      weight: form.weight ? parseFloat(form.weight) : null, height: form.height ? parseFloat(form.height) : null,
      breed_id: form.breed_id || null, color_id: form.color_id || null, kennel_id: form.kennel_id || null,
      father_id: form.father_id || null, mother_id: form.mother_id || null,
      is_public: form.is_public, breeder_id: isFromLitter ? userId : undefined,
    }

    if (isEdit) {
      const { error: err } = await supabase.from('dogs').update(payload).eq('id', editDogId!)
      setLoading(false)
      if (err) { setError(err.message); return }
    } else {
      const slug = generateSlug(payload.name)
      const insertData = { ...payload, slug, owner_id: userId }
      const { data: newDog, error: err } = await supabase.from('dogs').insert(insertData).select('id, slug').single()
      setLoading(false)
      if (err) { setError(err.message); return }
      if (onSaved) onSaved(newDog?.id)
      onClose(); router.refresh()
      return
    }
    onClose(); if (onSaved) onSaved(); router.refresh()
  }

  const selBreed = breeds.find(b => b.id === form.breed_id)
  const selFather = allMaleDogs.find(d => d.id === form.father_id)
  const selMother = allFemaleDogs.find(d => d.id === form.mother_id)
  const selKennel = kennels.find(k => k.id === form.kennel_id)

  return (
    <Portal>
      <>
      <div className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      <div
        // overflow-x-hidden corta cualquier desbordamiento horizontal de
        // hijos (autocompletes, inputs con contenido largo, breadcrumb URLs
        // de pedigrees) — el panel mobile tenía scroll horizontal cuando
        // algún field interior excedía el viewport.
        className={`fixed top-0 right-0 h-full w-full sm:max-w-xl z-[70] bg-white border-l border-hairline shadow-[-12px_0_32px_rgba(0,0,0,0.12)] transition-transform duration-300 flex flex-col overflow-x-hidden ${open ? 'translate-x-0' : 'translate-x-full pointer-events-none'}`}
        style={{ paddingTop: 'var(--safe-area-top)', paddingBottom: 'var(--safe-area-bottom)' }}
      >

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-hairline flex-shrink-0">
          <h2 className="text-base sm:text-lg font-semibold">{isEdit ? 'Editar perro' : defaultLitterId ? 'Añadir cachorro' : 'Añadir perro'}</h2>
          <button onClick={onClose} className="text-muted hover:text-ink transition p-1"><X className="w-5 h-5" /></button>
        </div>

        {/* Create mode toggle */}
        {!isEdit && !isFromLitter && (
          <div className="flex border-b border-hairline px-4 flex-shrink-0">
            <button onClick={() => setCreateMode('manual')} className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap transition border-b-2 -mb-px ${createMode === 'manual' ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-body'}`}>
              <Dog className="w-3.5 h-3.5" /> Manual
            </button>
            <button onClick={() => setCreateMode('import')} className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap transition border-b-2 -mb-px ${createMode === 'import' ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-body'}`}>
              <Globe className="w-3.5 h-3.5" /> Importar genealogía
            </button>
          </div>
        )}

        {/* Edit tabs — en mobile usamos un <select> nativo (mejor UX que
            tabs con solo iconos). En sm+ vuelven los tabs horizontales. */}
        {isEdit && (
          <>
            {/* Mobile: select */}
            <div className="sm:hidden px-4 py-2.5 border-b border-hairline flex-shrink-0">
              <label className="text-[10.5px] font-semibold text-muted uppercase tracking-wider block mb-1">
                Sección
              </label>
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value as TabKey)}
                className="w-full bg-surface-card border border-hairline rounded-lg px-3 py-2.5 text-[16px] text-ink focus:border-ink focus:outline-none"
              >
                {TABS
                  .filter((t) => !('femaleOnly' in t && t.femaleOnly) || form.sex === 'female')
                  .map(t => (
                    <option key={t.key} value={t.key}>{t.label}</option>
                  ))}
              </select>
            </div>
            {/* Desktop: tabs */}
            <div className="hidden sm:flex border-b border-hairline px-4 overflow-x-auto flex-shrink-0">
              {TABS
                .filter((t) => !('femaleOnly' in t && t.femaleOnly) || form.sex === 'female')
                .map(t => {
                const Icon = t.icon
                return (
                  <button key={t.key} onClick={() => setActiveTab(t.key)}
                    className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap transition border-b-2 -mb-px ${activeTab === t.key ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-body'}`}>
                    <Icon className="w-3.5 h-3.5" /><span>{t.label}</span>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {/* Content. min-w-0 imprescindible en mobile: sin él, un hijo con
            min-w intrínseco (ej autocomplete dropdown w-full sobre contenido
            largo) forzaba al flex-1 a expandirse y rompía el scroll horizontal. */}
        {!isEdit && !isFromLitter && createMode === 'import' ? (
          <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
            <ImportPedigreeTab userId={userId} kennelId={defaultKennelId || undefined} onImported={() => { onClose(); onSaved?.(); router.refresh() }} />
          </div>
        ) : dataLoading ? (
          <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted" /></div>
        ) : (
          <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
            {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400 mb-4">{error}</div>}

            {activeTab === 'datos' && (
              <div className="space-y-5">
                {/* Identity */}
                <Section icon={CreditCard} title="Identidad">
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Field label={isFromLitter && kennelAffix ? 'Nombre del cachorro *' : 'Nombre *'} value={form.name} onChange={v => set('name', v)} placeholder={isFromLitter && kennelAffix ? 'Solo el nombre (sin afijo)' : ''} />
                        {isFromLitter && kennelAffix && form.name.trim() && (
                          <p className="text-[10px] text-ink mt-1 font-medium">{formatDogName(form.name.trim(), defaultKennelName!, defaultAffixFormat as AffixFormat)}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-body uppercase tracking-wider mb-1.5 block">Sexo *</label>
                        <div className="flex gap-2">
                          {(['male', 'female'] as const).map(s => (
                            <button key={s} type="button" onClick={() => set('sex', s)}
                              className={`flex-1 py-2.5 rounded-lg text-xs font-semibold border transition ${form.sex === s
                                ? (s === 'male' ? 'border-blue-400 bg-blue-400/10 text-blue-400' : 'border-pink-400 bg-pink-400/10 text-pink-400')
                                : 'border-hairline bg-surface-card text-body hover:bg-surface-card'}`}>
                              {s === 'male' ? '♂ Macho' : '♀ Hembra'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Nacimiento" value={form.birth_date} onChange={v => set('birth_date', v)} type="date" />
                      <Field label="Microchip" value={form.microchip} onChange={v => set('microchip', v)} placeholder="Número" />
                    </div>
                    <Field label="Registro" value={form.registration} onChange={v => set('registration', v)} placeholder="UKC, FCI, etc." />
                  </div>
                </Section>

                {/* Genealogy */}
                <Section icon={GitBranch} title={isFromLitter ? 'Genealogía (de la camada)' : 'Genealogía'}>
                  {isFromLitter ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <LockedCard label="Raza" name={selBreed?.name} />
                        <LockedCard label="Criadero" name={selKennel?.name} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <LockedCard label="Padre" name={selFather?.name} sexColor={BRAND.male} />
                        <LockedCard label="Madre" name={selMother?.name} sexColor={BRAND.female} />
                      </div>
                      {form.breed_id && <DropdownSearch label="Color" items={colors.map(c => ({ id: c.id, name: c.name, image: null }))} value={form.color_id} onChange={v => set('color_id', v)} placeholder="Buscar color..." />}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <SelectCard label="Raza" name={selBreed?.name} onClear={() => set('breed_id', '')}
                        selector={<SearchList items={breeds.map(b => ({ id: b.id, name: b.name, image: null }))} value={form.breed_id} onChange={v => set('breed_id', v)} placeholder="Buscar raza..." />} />
                      {form.breed_id && (
                        <>
                          <DropdownSearch label="Color" items={colors.map(c => ({ id: c.id, name: c.name, image: null }))} value={form.color_id} onChange={v => set('color_id', v)} placeholder="Buscar color..." />

                          {/* Padre y Madre — BLOQUEADOS en modo edición.
                              Editar pedigree desde aquí rompería el árbol
                              genealógico (descendientes, COI, hermanos).
                              Para cambiarlos hay que usar el editor de
                              pedigree dedicado (PedigreeEditor o el
                              importador). */}
                          {isEdit ? (
                            <>
                              <LockedParentCard label="Padre" dog={selFather} sexColor={BRAND.male} />
                              <LockedParentCard label="Madre" dog={selMother} sexColor={BRAND.female} />
                              <p className="text-[11px] text-muted leading-snug px-1">
                                Los padres están bloqueados aquí para proteger la integridad de la genealogía.
                                Para modificarlos usa el <strong>editor de genealogía</strong> desde la ficha pública del perro.
                              </p>
                            </>
                          ) : (
                            <>
                              <SelectCard label="Padre" name={selFather?.name} image={selFather?.thumbnail_url} sexColor={BRAND.male} onClear={() => set('father_id', '')}
                                selector={<SearchList items={maleDogs.filter(d => d.id !== editDogId).map(d => ({ id: d.id, name: d.name, image: d.thumbnail_url }))} value={form.father_id} onChange={v => set('father_id', v)} placeholder="Buscar padre..." sexColor={BRAND.male} />} />
                              <SelectCard label="Madre" name={selMother?.name} image={selMother?.thumbnail_url} sexColor={BRAND.female} onClear={() => set('mother_id', '')}
                                selector={<SearchList items={femaleDogs.filter(d => d.id !== editDogId).map(d => ({ id: d.id, name: d.name, image: d.thumbnail_url }))} value={form.mother_id} onChange={v => set('mother_id', v)} placeholder="Buscar madre..." sexColor={BRAND.female} />} />
                            </>
                          )}
                        </>
                      )}
                      <SelectCard label="Criadero" name={selKennel?.name} image={selKennel?.logo_url} onClear={() => set('kennel_id', '')}
                        selector={<SearchList items={kennels.map(k => ({ id: k.id, name: k.name, image: k.logo_url }))} value={form.kennel_id} onChange={v => set('kennel_id', v)} placeholder="Buscar criadero..." />} />
                    </div>
                  )}
                </Section>

                {/* Owner externo — solo si el perro está en manos de otro
                    usuario (transferido al cliente final). El criador necesita
                    saber con quién está tratando sin tener que ir a /reservas. */}
                {isEdit && externalOwner && (
                  <Section icon={Shield} title="Propietario actual">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
                      {externalOwner.avatar_url ? (
                        <img src={externalOwner.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <Shield className="w-4 h-4 text-amber-700" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-ink truncate">
                          {externalOwner.display_name || externalOwner.email || 'Propietario sin nombre'}
                        </p>
                        {externalOwner.display_name && externalOwner.email && (
                          <p className="text-xs text-muted truncate">{externalOwner.email}</p>
                        )}
                        <p className="text-[11px] text-amber-700 mt-0.5 leading-snug">
                          Este perro ya fue transferido. Para cambiar el propietario usa <strong>Reservas → Transferencia</strong>.
                        </p>
                      </div>
                    </div>
                  </Section>
                )}

                {/* Measurements */}
                {!isFromLitter && (
                  <Section icon={Weight} title="Medidas">
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Peso (kg)" value={form.weight} onChange={v => set('weight', v)} type="number" />
                      <Field label="Altura (cm)" value={form.height} onChange={v => set('height', v)} type="number" />
                    </div>
                  </Section>
                )}

                {/* Gallery */}
                <Section icon={ImageIcon} title="Galería">
                  {editDogId ? (
                    <GalleryTab dogId={editDogId} userId={userId} />
                  ) : (
                    <p className="text-xs text-muted text-center py-4">
                      {isFromLitter ? 'Guarda el cachorro para subir fotos' : 'Guarda el perro primero para subir fotos'}
                    </p>
                  )}
                </Section>

                {/* Visibility */}
                <div className="flex items-center justify-between bg-surface-card border border-hairline rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    {form.is_public ? <Eye className="w-5 h-5 text-green-400" /> : <EyeOff className="w-5 h-5 text-muted" />}
                    <div>
                      <p className="text-sm font-medium">{form.is_public ? 'Público' : 'Privado'}</p>
                      <p className="text-xs text-muted">{form.is_public ? 'Visible para otros' : 'Solo tú'}</p>
                    </div>
                  </div>
                  <ToggleSwitch value={form.is_public} onChange={(v) => set('is_public', v)} />
                </div>
              </div>
            )}

            {activeTab === 'salud' && editDogId && <SaludTab dogId={editDogId} userId={userId} />}
            {activeTab === 'reproduccion' && editDogId && form.sex === 'female' && <ReproduccionTab dogId={editDogId} userId={userId} />}
            {activeTab === 'genetica' && editDogId && <GeneticaTab dogId={editDogId} userId={userId} />}
            {activeTab === 'palmares' && editDogId && <PalmaresTab dogId={editDogId} userId={userId} />}
            {activeTab === 'pedigree-pdf' && editDogId && <PedigreePdfTab dogId={editDogId} dogName={form.name} userId={userId} />}
            {activeTab === 'historico' && editDogId && <HistoricoTab dogId={editDogId} />}
          </div>
        )}

        {/* Footer */}
        {activeTab === 'datos' && createMode === 'manual' && (
          <div className="flex items-center justify-end gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-hairline flex-shrink-0">
            <button onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm text-body hover:text-ink hover:bg-surface-card transition">Cancelar</button>
            <button onClick={handleSubmit} disabled={loading || !form.name.trim() || dataLoading}
              className="bg-ink text-on-primary hover:opacity-90 font-semibold px-5 py-2.5 rounded-lg transition disabled:opacity-50 flex items-center gap-2 text-sm">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear perro'}
            </button>
          </div>
        )}
      </div>

      </>
    </Portal>
  )
}

/* ── Helper Components ── */

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-ink" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-body uppercase tracking-wider mb-1.5 block">{label}</label>
      {/* text-base (16px) en mobile para evitar el zoom automático de iOS
          Safari al hacer focus en inputs <16px. Reduce a sm en desktop
          (14px) para mantener la densidad visual. */}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-surface-card border border-hairline rounded-lg px-3 py-2.5 text-base sm:text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none transition" />
    </div>
  )
}

function SelectCard({ label, name, image, sexColor, onClear, selector, disabled }: { label: string; name?: string; image?: string | null; sexColor?: string; onClear: () => void; selector: React.ReactNode; disabled?: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={ref} className="relative">
      <label className="text-[11px] font-semibold text-body uppercase tracking-wider mb-1.5 block">{label}</label>
      <div onClick={() => { if (!disabled) setOpen(!open) }}
        className={`w-full bg-surface-card border border-hairline rounded-lg px-3 py-2.5 flex items-center gap-3 cursor-pointer transition ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:border-hairline'} ${open ? 'border-ink' : ''}`}>
        {image && (
          <div className="w-8 h-8 rounded-full border-2 overflow-hidden flex-shrink-0 bg-surface-card" style={{ borderColor: sexColor || 'rgba(255,255,255,0.1)' }}>
            <img src={image} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        {sexColor && !image && <div className="w-1 h-6 rounded-full flex-shrink-0" style={{ backgroundColor: sexColor }} />}
        <span className={`flex-1 text-[14px] `}>{name || 'Seleccionar...'}</span>
        <ChevronDown className={`w-4 h-4 text-muted transition ${open ? 'rotate-180' : ''}`} />
      </div>
      {open && !disabled && (
        <div className="absolute z-[80] top-full mt-1 left-0 right-0 bg-white border border-hairline rounded-lg shadow-lg max-h-56 overflow-hidden">
          {selector}
          {name && <button onClick={() => { onClear(); setOpen(false) }} className="w-full text-left px-3 py-2.5 text-xs text-red-400 hover:bg-red-500/10 border-t border-hairline">Quitar selección</button>}
        </div>
      )}
    </div>
  )
}

function SearchList({ items, value, onChange, placeholder, sexColor }: { items: { id: string; name: string; image: string | null }[]; value: string; onChange: (v: string) => void; placeholder?: string; sexColor?: string }) {
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const filtered = items.filter(d => d.name.toLowerCase().includes(search.toLowerCase()))
  useEffect(() => { inputRef.current?.focus() }, [])

  return (
    <>
      <div className="p-2.5 border-b border-hairline">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
          <input ref={inputRef} value={search} onChange={e => setSearch(e.target.value)} placeholder={placeholder || 'Buscar...'}
            className="w-full bg-surface-card border border-hairline rounded-lg pl-8 pr-3 py-2 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none" />
        </div>
      </div>
      <div className="overflow-y-auto max-h-44">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted p-4 text-center">Sin resultados</p>
        ) : filtered.map(item => (
          <button key={item.id} type="button" onClick={() => { onChange(item.id); setSearch('') }}
            className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-2.5 transition ${item.id === value ? 'bg-surface-card text-ink' : 'text-ink hover:bg-surface-card'}`}>
            {item.image !== null && (
              <div className="w-7 h-7 rounded-full border-2 overflow-hidden flex-shrink-0 bg-surface-card" style={{ borderColor: sexColor || 'rgba(255,255,255,0.1)' }}>
                {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><img src="/icon.svg?v=2" alt="" className="w-3 h-3 opacity-30" /></div>}
              </div>
            )}
            <span className="truncate">{item.name}</span>
          </button>
        ))}
      </div>
    </>
  )
}

function DropdownSearch({ label, items, value, onChange, placeholder }: { label: string; items: { id: string; name: string; image: string | null }[]; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const sel = items.find(i => i.id === value)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={ref} className="relative">
      <label className="text-[11px] font-semibold text-body uppercase tracking-wider mb-1.5 block">{label}</label>
      <div onClick={() => setOpen(!open)}
        className={`w-full bg-surface-card border rounded-lg px-3 py-2.5 text-sm flex items-center gap-2 cursor-pointer transition hover:border-hairline ${open ? 'border-ink' : 'border-hairline'}`}>
        <span className={sel ? "text-ink" : "text-muted"}>{sel?.name || placeholder}</span>
        <div className="ml-auto flex items-center gap-1.5">
          {value && <span onClick={e => { e.stopPropagation(); onChange(''); setOpen(false) }} className="text-muted hover:text-body"><X className="w-3.5 h-3.5" /></span>}
          <ChevronDown className={`w-4 h-4 text-muted transition ${open ? 'rotate-180' : ''}`} />
        </div>
      </div>
      {open && (
        <div className="absolute z-[80] mt-1 w-full bg-white border border-hairline rounded-lg shadow-lg max-h-48 flex flex-col">
          <SearchList items={items} value={value} onChange={v => { onChange(v); setOpen(false) }} placeholder={placeholder} />
        </div>
      )}
    </div>
  )
}

function LockedCard({ label, name, sexColor }: { label: string; name?: string; sexColor?: string }) {
  return (
    <div className="bg-surface-card border border-hairline rounded-lg px-3 py-2.5 flex items-center gap-2.5 opacity-60">
      {sexColor && <div className="w-1 h-6 rounded-full flex-shrink-0" style={{ backgroundColor: sexColor }} />}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-muted uppercase font-semibold">{label}</p>
        <p className="truncate text-[14px] font-medium text-ink">{name || '—'}</p>
      </div>
      <Lock className="w-3.5 h-3.5 text-muted flex-shrink-0" />
    </div>
  )
}

/**
 * LockedParentCard — versión read-only para padres en modo edición.
 *
 * Padre/Madre NUNCA deben editarse desde el form del perro (rompe el árbol:
 * descendientes, COI, hermanos quedan inconsistentes). Aquí solo mostramos
 * lo que hay, con el thumbnail, y un atajo a la ficha para que el usuario
 * pueda navegar al editor de pedigree si quiere cambiar la relación.
 */
function LockedParentCard({ label, dog, sexColor }: {
  label: string
  dog?: { id: string; name: string; thumbnail_url?: string | null } | null
  sexColor?: string
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-body uppercase tracking-wider mb-1.5 block">{label}</label>
      <div className="w-full bg-surface-card border border-hairline rounded-lg px-3 py-2.5 flex items-center gap-3 opacity-90">
        {dog?.thumbnail_url ? (
          <div className="w-8 h-8 rounded-full border-2 overflow-hidden flex-shrink-0 bg-surface-card" style={{ borderColor: sexColor || 'rgba(255,255,255,0.1)' }}>
            <img src={dog.thumbnail_url} alt="" className="w-full h-full object-cover" />
          </div>
        ) : sexColor ? (
          <div className="w-1 h-6 rounded-full flex-shrink-0" style={{ backgroundColor: sexColor }} />
        ) : null}
        <span className="flex-1 text-[14px] text-ink truncate">{dog?.name || 'Sin asignar'}</span>
        <Lock className="w-3.5 h-3.5 text-muted flex-shrink-0" />
      </div>
    </div>
  )
}
