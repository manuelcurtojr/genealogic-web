'use client'

import { useState, useEffect, useRef } from 'react'
import ToggleSwitch from '@/components/ui/toggle'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { X, Loader2, Search, ChevronDown, CreditCard, GitBranch, Weight, ImageIcon, Eye, EyeOff, Dog, Stethoscope, Trophy, FileText, History, Lock, Globe } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import { formatDogName, type AffixFormat } from '@/lib/affix'
import { generateSlug } from '@/lib/slug'
import GalleryTab from './edit-tabs/gallery-tab'
import SaludTab from './edit-tabs/salud-tab'
import PalmaresTab from './edit-tabs/palmares-tab'
import HistorialTab from './edit-tabs/historial-tab'
import PedigreePdfTab from './edit-tabs/pedigree-pdf-tab'
import ImportPedigreeTab from './import-pedigree-tab'

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
  asContribution?: boolean
}

const TABS = [
  { key: 'datos', label: 'Datos', icon: Dog },
  { key: 'salud', label: 'Salud', icon: Stethoscope },
  { key: 'palmares', label: 'Palmarés', icon: Trophy },
  { key: 'pedigree-pdf', label: 'Pedigree PDF', icon: FileText },
  { key: 'historial', label: 'Historial', icon: History },
] as const

type TabKey = typeof TABS[number]['key']

export default function DogFormPanel({ open, onClose, onSaved, editDogId, userId, defaultLitterId, defaultBreedId, defaultFatherId, defaultMotherId, defaultKennelId, defaultKennelName, defaultAffixFormat, asContribution }: DogFormPanelProps) {
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
  const [kennels, setKennels] = useState<any[]>([])
  const [maleDogs, setMaleDogs] = useState<any[]>([])
  const [femaleDogs, setFemaleDogs] = useState<any[]>([])
  const [allMaleDogs, setAllMaleDogs] = useState<any[]>([])
  const [allFemaleDogs, setAllFemaleDogs] = useState<any[]>([])
  const [originalForm, setOriginalForm] = useState<any>(null)

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
      const [bRes, cRes, kRes, mRes, fRes] = await Promise.all([
        supabase.from('breeds').select('id, name').order('name'),
        supabase.from('colors').select('id, name, breed_id').order('name'),
        supabase.from('kennels').select('id, name, logo_url').eq('owner_id', userId).order('name'),
        supabase.from('dogs').select('id, name, sex, thumbnail_url, breed_id').eq('sex', 'male').order('name').limit(500),
        supabase.from('dogs').select('id, name, sex, thumbnail_url, breed_id').eq('sex', 'female').order('name').limit(500),
      ])
      setBreeds(bRes.data || []); setAllColors(cRes.data || []); setColors(cRes.data || [])
      setKennels(kRes.data || []); setAllMaleDogs(mRes.data || []); setAllFemaleDogs(fRes.data || [])
      setMaleDogs(mRes.data || []); setFemaleDogs(fRes.data || [])

      if (editDogId) {
        const { data: dog } = await supabase.from('dogs').select('*').eq('id', editDogId).single()
        if (dog) {
          const f = { name: dog.name || '', sex: dog.sex || 'male', birth_date: dog.birth_date || '', registration: dog.registration || '', microchip: dog.microchip || '', weight: dog.weight?.toString() || '', height: dog.height?.toString() || '', breed_id: dog.breed_id || '', color_id: dog.color_id || '', kennel_id: dog.kennel_id || '', father_id: dog.father_id || '', mother_id: dog.mother_id || '', is_public: dog.is_public ?? true }
          setForm(f)
          setOriginalForm(f)
          if (dog.breed_id) filterByBreed(dog.breed_id, cRes.data || [], mRes.data || [], fRes.data || [])
        }
      } else {
        setForm({ name: '', sex: 'male', birth_date: '', registration: '', microchip: '', weight: '', height: '', breed_id: defaultBreedId || '', color_id: '', kennel_id: defaultKennelId || '', father_id: defaultFatherId || '', mother_id: defaultMotherId || '', is_public: true })
        if (defaultBreedId) filterByBreed(defaultBreedId, cRes.data || [], mRes.data || [], fRes.data || [])
        setOriginalForm(null)
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
      setColors(c.filter((cl: any) => !cl.breed_id || cl.breed_id === breedId))
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
      if (originalForm) {
        const changes: { field_name: string; old_value: string | null; new_value: string | null }[] = []
        const fields = ['name', 'sex', 'birth_date', 'registration', 'microchip', 'weight', 'height', 'breed_id', 'color_id', 'kennel_id', 'father_id', 'mother_id', 'is_public', 'is_for_sale', 'sale_price', 'sale_location', 'breeder_id']
        for (const f of fields) {
          const ov = String(originalForm[f] || ''), nv = String((form as any)[f] || '')
          if (ov !== nv) changes.push({ field_name: f, old_value: ov || null, new_value: nv || null })
        }
        if (changes.length > 0) await supabase.from('dog_changes').insert(changes.map(c => ({ ...c, dog_id: editDogId!, user_id: userId })))
      }
    } else {
      const slug = generateSlug(payload.name)
      const insertData = asContribution
        ? { ...payload, slug, contributor_id: userId, owner_id: null, is_public: true }
        : { ...payload, slug, owner_id: userId }
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
    <>
      <div className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      <div className={`fixed top-0 right-0 h-full w-full sm:max-w-xl z-[70] bg-gray-900 border-l border-white/10 shadow-2xl transition-transform duration-300 flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 flex-shrink-0">
          <h2 className="text-base sm:text-lg font-semibold">{isEdit ? 'Editar perro' : defaultLitterId ? 'Añadir cachorro' : 'Añadir perro'}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition p-1"><X className="w-5 h-5" /></button>
        </div>

        {/* Create mode toggle */}
        {!isEdit && !isFromLitter && (
          <div className="flex border-b border-white/10 px-4 flex-shrink-0">
            <button onClick={() => setCreateMode('manual')} className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap transition border-b-2 -mb-px ${createMode === 'manual' ? 'border-[#D74709] text-[#D74709]' : 'border-transparent text-white/40 hover:text-white/60'}`}>
              <Dog className="w-3.5 h-3.5" /> Manual
            </button>
            <button onClick={() => setCreateMode('import')} className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap transition border-b-2 -mb-px ${createMode === 'import' ? 'border-[#D74709] text-[#D74709]' : 'border-transparent text-white/40 hover:text-white/60'}`}>
              <Globe className="w-3.5 h-3.5" /> Importar pedigree
            </button>
          </div>
        )}

        {/* Edit tabs */}
        {isEdit && (
          <div className="flex border-b border-white/10 px-4 overflow-x-auto flex-shrink-0">
            {TABS.map(t => {
              const Icon = t.icon
              return (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap transition border-b-2 -mb-px ${activeTab === t.key ? 'border-[#D74709] text-[#D74709]' : 'border-transparent text-white/40 hover:text-white/60'}`}>
                  <Icon className="w-3.5 h-3.5" /><span className="hidden sm:inline">{t.label}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Content */}
        {!isEdit && !isFromLitter && createMode === 'import' ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <ImportPedigreeTab userId={userId} kennelId={defaultKennelId || undefined} onImported={() => { onClose(); onSaved?.(); router.refresh() }} />
          </div>
        ) : dataLoading ? (
          <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-white/30" /></div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
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
                          <p className="text-[10px] text-[#D74709] mt-1 font-medium">{formatDogName(form.name.trim(), defaultKennelName!, defaultAffixFormat as AffixFormat)}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">Sexo *</label>
                        <div className="flex gap-2">
                          {(['male', 'female'] as const).map(s => (
                            <button key={s} type="button" onClick={() => set('sex', s)}
                              className={`flex-1 py-2.5 rounded-lg text-xs font-semibold border transition ${form.sex === s
                                ? (s === 'male' ? 'border-blue-400 bg-blue-400/10 text-blue-400' : 'border-pink-400 bg-pink-400/10 text-pink-400')
                                : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10'}`}>
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
                          <SelectCard label="Padre" name={selFather?.name} image={selFather?.thumbnail_url} sexColor={BRAND.male} onClear={() => set('father_id', '')}
                            selector={<SearchList items={maleDogs.filter(d => d.id !== editDogId).map(d => ({ id: d.id, name: d.name, image: d.thumbnail_url }))} value={form.father_id} onChange={v => set('father_id', v)} placeholder="Buscar padre..." sexColor={BRAND.male} />} />
                          <SelectCard label="Madre" name={selMother?.name} image={selMother?.thumbnail_url} sexColor={BRAND.female} onClear={() => set('mother_id', '')}
                            selector={<SearchList items={femaleDogs.filter(d => d.id !== editDogId).map(d => ({ id: d.id, name: d.name, image: d.thumbnail_url }))} value={form.mother_id} onChange={v => set('mother_id', v)} placeholder="Buscar madre..." sexColor={BRAND.female} />} />
                        </>
                      )}
                      <SelectCard label="Criadero" name={selKennel?.name} image={selKennel?.logo_url} onClear={() => set('kennel_id', '')}
                        selector={<SearchList items={kennels.map(k => ({ id: k.id, name: k.name, image: k.logo_url }))} value={form.kennel_id} onChange={v => set('kennel_id', v)} placeholder="Buscar criadero..." />} />
                    </div>
                  )}
                </Section>

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
                    <p className="text-xs text-white/30 text-center py-4">
                      {isFromLitter ? 'Guarda el cachorro para subir fotos' : 'Guarda el perro primero para subir fotos'}
                    </p>
                  )}
                </Section>

                {/* Visibility */}
                <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    {form.is_public ? <Eye className="w-5 h-5 text-green-400" /> : <EyeOff className="w-5 h-5 text-white/30" />}
                    <div>
                      <p className="text-sm font-medium">{form.is_public ? 'Público' : 'Privado'}</p>
                      <p className="text-xs text-white/40">{form.is_public ? 'Visible para otros' : 'Solo tú'}</p>
                    </div>
                  </div>
                  <ToggleSwitch value={form.is_public} onChange={(v) => set('is_public', v)} />
                </div>
              </div>
            )}

            {activeTab === 'salud' && editDogId && <SaludTab dogId={editDogId} userId={userId} />}
            {activeTab === 'palmares' && editDogId && <PalmaresTab dogId={editDogId} userId={userId} />}
            {activeTab === 'pedigree-pdf' && editDogId && <PedigreePdfTab dogId={editDogId} dogName={form.name} userId={userId} />}
            {activeTab === 'historial' && editDogId && <HistorialTab dogId={editDogId} />}
          </div>
        )}

        {/* Footer */}
        {activeTab === 'datos' && createMode === 'manual' && (
          <div className="flex items-center justify-end gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-white/10 flex-shrink-0">
            <button onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition">Cancelar</button>
            <button onClick={handleSubmit} disabled={loading || !form.name.trim() || dataLoading}
              className="bg-[#D74709] hover:bg-[#c03d07] text-white font-semibold px-5 py-2.5 rounded-lg transition disabled:opacity-50 flex items-center gap-2 text-sm">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear perro'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}

/* ── Helper Components ── */

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-[#D74709]" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition" />
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
      <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">{label}</label>
      <div onClick={() => { if (!disabled) setOpen(!open) }}
        className={`w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 flex items-center gap-3 cursor-pointer transition ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:border-white/20'} ${open ? 'border-[#D74709]' : ''}`}>
        {image && (
          <div className="w-8 h-8 rounded-full border-2 overflow-hidden flex-shrink-0 bg-white/5" style={{ borderColor: sexColor || 'rgba(255,255,255,0.1)' }}>
            <img src={image} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        {sexColor && !image && <div className="w-1 h-6 rounded-full flex-shrink-0" style={{ backgroundColor: sexColor }} />}
        <span className={`flex-1 text-sm ${name ? 'text-white font-medium' : 'text-white/30'}`}>{name || 'Seleccionar...'}</span>
        <ChevronDown className={`w-4 h-4 text-white/30 transition ${open ? 'rotate-180' : ''}`} />
      </div>
      {open && !disabled && (
        <div className="absolute z-[80] top-full mt-1 left-0 right-0 bg-gray-800 border border-white/10 rounded-lg shadow-xl max-h-56 overflow-hidden">
          {selector}
          {name && <button onClick={() => { onClear(); setOpen(false) }} className="w-full text-left px-3 py-2.5 text-xs text-red-400 hover:bg-red-500/10 border-t border-white/5">Quitar selección</button>}
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
      <div className="p-2.5 border-b border-white/5">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input ref={inputRef} value={search} onChange={e => setSearch(e.target.value)} placeholder={placeholder || 'Buscar...'}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#D74709] focus:outline-none" />
        </div>
      </div>
      <div className="overflow-y-auto max-h-44">
        {filtered.length === 0 ? (
          <p className="text-sm text-white/30 p-4 text-center">Sin resultados</p>
        ) : filtered.map(item => (
          <button key={item.id} type="button" onClick={() => { onChange(item.id); setSearch('') }}
            className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-2.5 transition ${item.id === value ? 'bg-[#D74709]/15 text-[#D74709]' : 'text-white/70 hover:bg-white/5'}`}>
            {item.image !== null && (
              <div className="w-7 h-7 rounded-full border-2 overflow-hidden flex-shrink-0 bg-white/5" style={{ borderColor: sexColor || 'rgba(255,255,255,0.1)' }}>
                {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><img src="/icon.svg" alt="" className="w-3 h-3 opacity-30" /></div>}
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
      <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">{label}</label>
      <div onClick={() => setOpen(!open)}
        className={`w-full bg-white/5 border rounded-lg px-3 py-2.5 text-sm flex items-center gap-2 cursor-pointer transition hover:border-white/20 ${open ? 'border-[#D74709]' : 'border-white/10'}`}>
        <span className={sel ? 'text-white' : 'text-white/30'}>{sel?.name || placeholder}</span>
        <div className="ml-auto flex items-center gap-1.5">
          {value && <span onClick={e => { e.stopPropagation(); onChange(''); setOpen(false) }} className="text-white/30 hover:text-white/60"><X className="w-3.5 h-3.5" /></span>}
          <ChevronDown className={`w-4 h-4 text-white/30 transition ${open ? 'rotate-180' : ''}`} />
        </div>
      </div>
      {open && (
        <div className="absolute z-[80] mt-1 w-full bg-gray-800 border border-white/10 rounded-lg shadow-xl max-h-48 flex flex-col">
          <SearchList items={items} value={value} onChange={v => { onChange(v); setOpen(false) }} placeholder={placeholder} />
        </div>
      )}
    </div>
  )
}

function LockedCard({ label, name, sexColor }: { label: string; name?: string; sexColor?: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 flex items-center gap-2.5 opacity-60">
      {sexColor && <div className="w-1 h-6 rounded-full flex-shrink-0" style={{ backgroundColor: sexColor }} />}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-white/30 uppercase font-semibold">{label}</p>
        <p className="text-sm font-medium text-white truncate">{name || '—'}</p>
      </div>
      <Lock className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />
    </div>
  )
}
