'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { X, Loader2, Search, ChevronDown, CreditCard, GitBranch, Weight, ImageIcon, Eye, EyeOff } from 'lucide-react'
import { BRAND } from '@/lib/constants'

interface DogFormPanelProps {
  open: boolean
  onClose: () => void
  onSaved?: () => void
  editDogId?: string | null
  userId: string
  defaultLitterId?: string | null
  defaultBreedId?: string | null
}

export default function DogFormPanel({ open, onClose, onSaved, editDogId, userId, defaultLitterId, defaultBreedId }: DogFormPanelProps) {
  const router = useRouter()
  const isEdit = !!editDogId
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

  const [form, setForm] = useState({
    name: '', sex: 'male', birth_date: '', registration: '', microchip: '',
    weight: '', height: '', breed_id: '', color_id: '', kennel_id: '',
    father_id: '', mother_id: '', is_public: true,
  })

  useEffect(() => {
    if (!open) return
    setDataLoading(true); setError('')
    const supabase = createClient()

    async function load() {
      const [bRes, cRes, kRes, mRes, fRes] = await Promise.all([
        supabase.from('breeds').select('id, name').order('name'),
        supabase.from('colors').select('id, name, breed_id').order('name'),
        supabase.from('kennels').select('id, name, logo_url').eq('owner_id', userId).order('name'),
        supabase.from('dogs').select('id, name, sex, thumbnail_url, breed_id').eq('owner_id', userId).eq('sex', 'male').order('name'),
        supabase.from('dogs').select('id, name, sex, thumbnail_url, breed_id').eq('owner_id', userId).eq('sex', 'female').order('name'),
      ])
      setBreeds(bRes.data || [])
      setAllColors(cRes.data || [])
      setColors(cRes.data || [])
      setKennels(kRes.data || [])
      setAllMaleDogs(mRes.data || [])
      setAllFemaleDogs(fRes.data || [])
      setMaleDogs(mRes.data || [])
      setFemaleDogs(fRes.data || [])

      if (editDogId) {
        const { data: dog } = await supabase.from('dogs').select('*').eq('id', editDogId).single()
        if (dog) {
          setForm({
            name: dog.name || '', sex: dog.sex || 'male', birth_date: dog.birth_date || '',
            registration: dog.registration || '', microchip: dog.microchip || '',
            weight: dog.weight?.toString() || '', height: dog.height?.toString() || '',
            breed_id: dog.breed_id || '', color_id: dog.color_id || '',
            kennel_id: dog.kennel_id || '', father_id: dog.father_id || '',
            mother_id: dog.mother_id || '', is_public: dog.is_public ?? true,
          })
          if (dog.breed_id) filterByBreed(dog.breed_id, cRes.data || [], mRes.data || [], fRes.data || [])
        }
      } else {
        const breedId = defaultBreedId || ''
        setForm({ name: '', sex: 'male', birth_date: '', registration: '', microchip: '', weight: '', height: '', breed_id: breedId, color_id: '', kennel_id: '', father_id: '', mother_id: '', is_public: true })
        if (breedId) filterByBreed(breedId, cRes.data || [], mRes.data || [], fRes.data || [])
      }
      setDataLoading(false)
    }
    load()
  }, [open, editDogId, userId])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  function filterByBreed(breedId: string, colorsData?: any[], malesData?: any[], femalesData?: any[]) {
    const c = colorsData || allColors, m = malesData || allMaleDogs, f = femalesData || allFemaleDogs
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

  const handleSubmit = async () => {
    if (!form.name.trim()) return
    setLoading(true); setError('')
    const supabase = createClient()
    const payload = {
      name: form.name.trim(), sex: form.sex,
      birth_date: form.birth_date || null, registration: form.registration || null,
      microchip: form.microchip || null,
      weight: form.weight ? parseFloat(form.weight) : null,
      height: form.height ? parseFloat(form.height) : null,
      breed_id: form.breed_id || null, color_id: form.color_id || null,
      kennel_id: form.kennel_id || null, father_id: form.father_id || null,
      mother_id: form.mother_id || null, is_public: form.is_public,
    }
    if (isEdit) {
      const { error: err } = await supabase.from('dogs').update(payload).eq('id', editDogId!)
      setLoading(false); if (err) { setError(err.message); return }
    } else {
      const { error: err } = await supabase.from('dogs').insert({ ...payload, owner_id: userId })
      setLoading(false); if (err) { setError(err.message); return }
    }
    onClose(); if (onSaved) onSaved(); router.refresh()
  }

  // Selected items for display
  const selBreed = breeds.find(b => b.id === form.breed_id)
  const selFather = allMaleDogs.find(d => d.id === form.father_id)
  const selMother = allFemaleDogs.find(d => d.id === form.mother_id)
  const selKennel = kennels.find(k => k.id === form.kennel_id)

  return (
    <>
      <div className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />

      <div className={`fixed top-0 right-0 h-full w-full max-w-xl z-[70] bg-gray-900 border-l border-white/10 shadow-2xl transition-transform duration-300 flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
          <h2 className="text-lg font-semibold">{isEdit ? 'Editar perro' : defaultLitterId ? 'Anadir cachorro' : 'Anadir perro'}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition"><X className="w-5 h-5" /></button>
        </div>

        {/* Scrollable content */}
        {dataLoading ? (
          <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-white/30" /></div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{error}</div>}

            {/* === IDENTIDAD === */}
            <Section icon={CreditCard} title="Identidad">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nombre *" value={form.name} onChange={v => set('name', v)} />
                <div>
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1 block">Sexo *</label>
                  <div className="flex gap-2">
                    {(['male', 'female'] as const).map(s => (
                      <button key={s} type="button" onClick={() => set('sex', s)}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition ${
                          form.sex === s
                            ? s === 'male' ? 'border-blue-400 bg-blue-400/10 text-blue-400' : 'border-pink-400 bg-pink-400/10 text-pink-400'
                            : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10'
                        }`}>
                        {s === 'male' ? '♂ Macho' : '♀ Hembra'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Fecha de nacimiento" value={form.birth_date} onChange={v => set('birth_date', v)} type="date" />
                <Field label="Microchip" value={form.microchip} onChange={v => set('microchip', v)} placeholder="Numero de microchip" />
              </div>
              <Field label="Registro" value={form.registration} onChange={v => set('registration', v)} placeholder="UKC, FCI, etc." />
            </Section>

            {/* === GENEALOGIA — horizontal card-style selectors === */}
            <Section icon={GitBranch} title="Genealogia">
              <div className="flex gap-2 overflow-x-auto pb-1">
                <GenealogyCard label="RAZA" name={selBreed?.name} onClear={() => set('breed_id', '')}
                  selector={<DogSearch items={breeds.map(b => ({ id: b.id, name: b.name, image: null }))} value={form.breed_id} onChange={v => set('breed_id', v)} placeholder="Buscar raza..." />} />
                <GenealogyCard label="PADRE" name={selFather?.name} image={selFather?.thumbnail_url} sexColor={BRAND.male} onClear={() => set('father_id', '')}
                  disabled={!form.breed_id}
                  selector={<DogSearch items={maleDogs.filter(d => d.id !== editDogId).map(d => ({ id: d.id, name: d.name, image: d.thumbnail_url }))} value={form.father_id} onChange={v => set('father_id', v)} placeholder="Buscar padre..." sexColor={BRAND.male} />} />
                <GenealogyCard label="MADRE" name={selMother?.name} image={selMother?.thumbnail_url} sexColor={BRAND.female} onClear={() => set('mother_id', '')}
                  disabled={!form.breed_id}
                  selector={<DogSearch items={femaleDogs.filter(d => d.id !== editDogId).map(d => ({ id: d.id, name: d.name, image: d.thumbnail_url }))} value={form.mother_id} onChange={v => set('mother_id', v)} placeholder="Buscar madre..." sexColor={BRAND.female} />} />
                <GenealogyCard label="CRIADERO" name={selKennel?.name} image={selKennel?.logo_url} onClear={() => set('kennel_id', '')}
                  selector={<DogSearch items={kennels.map(k => ({ id: k.id, name: k.name, image: k.logo_url }))} value={form.kennel_id} onChange={v => set('kennel_id', v)} placeholder="Buscar criadero..." />} />
              </div>
              {!form.breed_id && <p className="text-[11px] text-white/30 mt-1">Selecciona una raza para filtrar padres y colores</p>}
              {form.breed_id && (
                <DogSearch items={colors.map(c => ({ id: c.id, name: c.name, image: null }))} value={form.color_id} onChange={v => set('color_id', v)} placeholder="Buscar color..." label="Color" />
              )}
            </Section>

            {/* === MEDIDAS === */}
            <Section icon={Weight} title="Medidas">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Peso (kg)" value={form.weight} onChange={v => set('weight', v)} type="number" />
                <Field label="Altura (cm)" value={form.height} onChange={v => set('height', v)} type="number" />
              </div>
            </Section>

            {/* === GALERIA === */}
            <Section icon={ImageIcon} title="Galeria">
              <div className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center">
                <ImageIcon className="w-8 h-8 text-white/20 mx-auto mb-2" />
                <p className="text-xs text-white/30">Arrastra fotos aqui o haz clic para subir</p>
                <p className="text-[10px] text-white/20 mt-1">Proximamente</p>
              </div>
            </Section>

            {/* === VISIBILIDAD === */}
            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3">
              <div className="flex items-center gap-2">
                {form.is_public ? <Eye className="w-4 h-4 text-green-400" /> : <EyeOff className="w-4 h-4 text-white/30" />}
                <div>
                  <p className="text-sm font-medium">{form.is_public ? 'Perfil publico' : 'Perfil privado'}</p>
                  <p className="text-xs text-white/40">{form.is_public ? 'Otros usuarios pueden ver este perro' : 'Solo tu puedes ver este perro'}</p>
                </div>
              </div>
              <button type="button" onClick={() => set('is_public', !form.is_public)}
                className={`w-10 h-5 rounded-full transition relative ${form.is_public ? 'bg-[#D74709]' : 'bg-white/20'}`}>
                <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition ${form.is_public ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 flex-shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition">Cancelar</button>
          <button onClick={handleSubmit} disabled={loading || !form.name.trim() || dataLoading}
            className="bg-[#D74709] hover:bg-[#c03d07] text-white font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-50 flex items-center gap-2 text-sm">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Guardando...' : isEdit ? 'Actualizar perro' : 'Crear perro'}
          </button>
        </div>
      </div>
    </>
  )
}

/* --- Helpers --- */

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-[#D74709]" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition" />
    </div>
  )
}

/* Genealogy card — shows selected item as a mini card, click to open selector */
function GenealogyCard({ label, name, image, sexColor, onClear, selector, disabled }: {
  label: string; name?: string; image?: string | null; sexColor?: string; onClear: () => void; selector: React.ReactNode; disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative flex-shrink-0" style={{ width: 160 }}>
      <div
        onClick={() => { if (!disabled) setOpen(!open) }}
        className={`w-full bg-white/5 border border-white/10 rounded-lg p-3 flex items-center gap-2.5 cursor-pointer transition min-h-[60px] ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:border-white/20'} ${open ? 'border-[#D74709]' : ''}`}
      >
        {name ? (
          <>
            {image && (
              <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-white/5 border-2" style={{ borderColor: sexColor || 'rgba(255,255,255,0.1)' }}>
                <img src={image} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-bold text-white truncate">{name}</p>
              <p className="text-[10px] text-white/30 uppercase">{label}</p>
            </div>
          </>
        ) : (
          <div className="w-full text-center">
            <p className="text-[10px] text-white/30 uppercase">{label}</p>
            <p className="text-[11px] text-white/40 mt-0.5">Seleccionar</p>
          </div>
        )}
      </div>
      {/* Dropdown */}
      {open && !disabled && (
        <div className="absolute z-[80] top-full mt-1 left-0 w-[260px] bg-gray-800 border border-white/10 rounded-lg shadow-xl max-h-52 overflow-hidden">
          {selector}
          {name && (
            <button onClick={() => { onClear(); setOpen(false) }} className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 border-t border-white/5">
              Quitar seleccion
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/* Search selector with photo */
function DogSearch({ items, value, onChange, placeholder, sexColor, label }: {
  items: { id: string; name: string; image: string | null }[]; value: string; onChange: (v: string) => void; placeholder?: string; sexColor?: string; label?: string
}) {
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const filtered = items.filter(d => d.name.toLowerCase().includes(search.toLowerCase()))

  useEffect(() => { if (inputRef.current) inputRef.current.focus() }, [])

  // If used standalone (with label), render inline
  if (label) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    const selected = items.find(i => i.id === value)
    useEffect(() => {
      const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
      document.addEventListener('mousedown', handler); return () => document.removeEventListener('mousedown', handler)
    }, [])

    return (
      <div ref={ref} className="relative">
        <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">{label}</label>
        <div onClick={() => setOpen(!open)} className={`w-full bg-white/5 border rounded-lg px-3 py-2 text-sm flex items-center gap-2 cursor-pointer transition hover:border-white/20 ${open ? 'border-[#D74709]' : 'border-white/10'}`}>
          <span className={selected ? 'text-white' : 'text-white/30'}>{selected?.name || placeholder}</span>
          <div className="ml-auto flex items-center gap-1">
            {value && <span onClick={e => { e.stopPropagation(); onChange(''); setOpen(false) }} className="text-white/30 hover:text-white/60"><X className="w-3 h-3" /></span>}
            <ChevronDown className={`w-3.5 h-3.5 text-white/30 transition ${open ? 'rotate-180' : ''}`} />
          </div>
        </div>
        {open && (
          <div className="absolute z-[80] mt-1 w-full bg-gray-800 border border-white/10 rounded-lg shadow-xl max-h-48 flex flex-col">
            <InnerSearch items={items} value={value} onChange={v => { onChange(v); setOpen(false) }} placeholder={placeholder} sexColor={sexColor} />
          </div>
        )}
      </div>
    )
  }

  // Embedded in GenealogyCard dropdown
  return <InnerSearch items={items} value={value} onChange={onChange} placeholder={placeholder} sexColor={sexColor} />
}

function InnerSearch({ items, value, onChange, placeholder, sexColor }: {
  items: { id: string; name: string; image: string | null }[]; value: string; onChange: (v: string) => void; placeholder?: string; sexColor?: string
}) {
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const filtered = items.filter(d => d.name.toLowerCase().includes(search.toLowerCase()))
  useEffect(() => { if (inputRef.current) inputRef.current.focus() }, [])

  return (
    <>
      <div className="p-2 border-b border-white/5">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input ref={inputRef} value={search} onChange={e => setSearch(e.target.value)} placeholder={placeholder || 'Buscar...'}
            className="w-full bg-white/5 border border-white/10 rounded pl-8 pr-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:border-[#D74709] focus:outline-none" />
        </div>
      </div>
      <div className="overflow-y-auto flex-1 max-h-40">
        {filtered.length === 0 ? <p className="text-sm text-white/30 p-3 text-center">Sin resultados</p> : filtered.map(item => (
          <button key={item.id} type="button" onClick={() => { onChange(item.id); setSearch('') }}
            className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 transition ${item.id === value ? 'bg-[#D74709]/15 text-[#D74709]' : 'text-white/70 hover:bg-white/5'}`}>
            {item.image !== null && (
              <div className="w-7 h-7 rounded-full border-2 overflow-hidden flex-shrink-0 bg-white/5" style={{ borderColor: sexColor || 'rgba(255,255,255,0.1)' }}>
                {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><img src="/icon.svg" alt="" className="w-3.5 h-3.5 opacity-30" /></div>}
              </div>
            )}
            <span className="truncate">{item.name}</span>
          </button>
        ))}
      </div>
    </>
  )
}
