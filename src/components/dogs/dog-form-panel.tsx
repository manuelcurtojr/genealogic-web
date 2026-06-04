'use client'

import { useState, useEffect, useRef } from 'react'
import ToggleSwitch from '@/components/ui/toggle'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { X, Loader2, Search, ChevronDown, ChevronRight, CreditCard, GitBranch, Weight, ImageIcon, Eye, EyeOff, Dog, Stethoscope, Trophy, FileText, Lock, Globe, Shield, Dna, Heart, History, ArrowRightLeft, Settings2 } from 'lucide-react'
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
import PedigreeEditor from '@/components/pedigree/pedigree-editor'
import TransferPanel from '@/components/kennel/transfer-panel'
import { useT } from '@/components/i18n/locale-provider'
import { getDogParents } from '@/lib/dogs/get-dog-parents'

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
  { key: 'gestion', label: 'Gestión', icon: Settings2 },
] as const

type TabKey = typeof TABS[number]['key']

export default function DogFormPanel({ open, onClose, onSaved, editDogId, userId, defaultLitterId, defaultBreedId, defaultFatherId, defaultMotherId, defaultKennelId, defaultKennelName, defaultAffixFormat }: DogFormPanelProps) {
  const router = useRouter()
  const t = useT()
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

  // Estado/visibilidad gestionados como toggles INSTANTÁNEOS (persisten al
  // cambiar, sin pasar por "Actualizar"). Viven en la pestaña Gestión.
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [showInKennel, setShowInKennel] = useState(true)
  const [isReproductive, setIsReproductive] = useState(false)
  const [savingField, setSavingField] = useState<string | null>(null)

  // Paneles secundarios lanzados desde Gestión.
  const [pedigreeOpen, setPedigreeOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)

  // ── In Memoriam ──────────────────────────────────────────────────────
  // deceased_at: fecha de fallecimiento (null = vivo). Marcar es IRREVERSIBLE
  // desde la UI (lo revierte solo soporte). El perro fallecido deja de contar
  // para el límite del plan, pero su ficha y genealogía se conservan.
  const [deceasedAt, setDeceasedAt] = useState<string | null>(null)
  const [confirmDeceased, setConfirmDeceased] = useState(false)
  const [deceasedLoading, setDeceasedLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setActiveTab('datos'); setCreateMode('manual'); setDataLoading(true); setError('')
    const supabase = createClient()
    async function load() {
      // NOTA: la tabla `colors` NO tiene columna breed_id — la relación
      // raza↔color vive en la pivote `breed_colors` (breed_id, color_id).
      const [bRes, cRes, bcRes, kRes, mRes, fRes] = await Promise.all([
        supabase.from('breeds').select('id, name').order('name'),
        supabase.from('colors').select('id, name').order('name'),
        supabase.from('breed_colors').select('breed_id, color_id'),
        supabase.from('kennels').select('id, name, logo_url').eq('owner_id', userId).order('name'),
        supabase.from('dogs').select('id, name, sex, thumbnail_url, breed_id').eq('sex', 'male').order('name').limit(500),
        supabase.from('dogs').select('id, name, sex, thumbnail_url, breed_id').eq('sex', 'female').order('name').limit(500),
      ])

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
          setDeceasedAt(dog.deceased_at || null)
          setThumbnailUrl(dog.thumbnail_url || null)
          setShowInKennel(dog.show_in_kennel ?? true)
          setIsReproductive(dog.is_reproductive ?? false)
          if (dog.breed_id) filterByBreed(dog.breed_id, cRes.data || [], mRes.data || [], fRes.data || [])

          // Asegurar que padre/madre ACTUALES estén en las listas: la carga
          // limit(500) sobre 70k+ perros casi nunca los incluye, así que el
          // padre asignado salía vacío. Se resuelven server-side (admin) para
          // incluir ancestros importados/privados.
          try {
            const parents = await getDogParents(editDogId)
            if (parents.length) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const merge = (arr: any[], add: any[]) => {
                const seen = new Set(arr.map((x) => x.id))
                return [...arr, ...add.filter((x) => !seen.has(x.id))]
              }
              const mp = parents.filter((p) => p.sex === 'male')
              const fp = parents.filter((p) => p.sex === 'female')
              setAllMaleDogs((prev) => merge(prev, mp))
              setMaleDogs((prev) => merge(prev, mp))
              setAllFemaleDogs((prev) => merge(prev, fp))
              setFemaleDogs((prev) => merge(prev, fp))
            }
          } catch {
            /* noop */
          }

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
        setDeceasedAt(null); setThumbnailUrl(null); setShowInKennel(true); setIsReproductive(false); setExternalOwner(null)
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

  // Toggle instantáneo de un campo de estado/visibilidad (Gestión). Optimista
  // + persiste; si falla, revierte y muestra el error.
  const persistField = async (field: 'is_public' | 'show_in_kennel' | 'is_reproductive', value: boolean) => {
    if (!editDogId) return
    setError(''); setSavingField(field)
    const prev = field === 'is_public' ? form.is_public : field === 'show_in_kennel' ? showInKennel : isReproductive
    if (field === 'is_public') set('is_public', value)
    else if (field === 'show_in_kennel') setShowInKennel(value)
    else setIsReproductive(value)
    const supabase = createClient()
    const { error: err } = await supabase.from('dogs').update({ [field]: value }).eq('id', editDogId)
    setSavingField(null)
    if (err) {
      // revertir
      if (field === 'is_public') set('is_public', prev)
      else if (field === 'show_in_kennel') setShowInKennel(prev)
      else setIsReproductive(prev)
      setError(err.message)
      return
    }
    onSaved?.()
    router.refresh()
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
      litter_id: isFromLitter ? defaultLitterId : undefined,
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
      if (err) {
        setError(err.message)
        return
      }
      if (onSaved) onSaved(newDog?.id)
      onClose(); router.refresh()
      return
    }
    onClose(); if (onSaved) onSaved(); router.refresh()
  }

  const handleMarkDeceased = async () => {
    if (!editDogId) return
    setDeceasedLoading(true); setError('')
    const supabase = createClient()
    const today = new Date().toISOString().slice(0, 10)
    const { error: err } = await supabase
      .from('dogs')
      .update({ deceased_at: today, deceased_locked: true })
      .eq('id', editDogId)
    setDeceasedLoading(false)
    if (err) { setError(err.message); return }
    setDeceasedAt(today)
    setConfirmDeceased(false)
    if (onSaved) onSaved()
    router.refresh()
  }

  const selBreed = breeds.find(b => b.id === form.breed_id)
  const selFather = allMaleDogs.find(d => d.id === form.father_id)
  const selMother = allFemaleDogs.find(d => d.id === form.mother_id)
  const selKennel = kennels.find(k => k.id === form.kennel_id)
  const sexLabel = form.sex === 'male' ? t('Macho') : form.sex === 'female' ? t('Hembra') : null
  const visibleTabs = TABS.filter((tab) => !('femaleOnly' in tab && tab.femaleOnly) || form.sex === 'female')

  // ── Contenido de la pestaña "Datos" (compartido creación/edición) ──────
  const datosContent = (
    <div className="space-y-5">
      {/* Identity */}
      <Section icon={CreditCard} title={t('Identidad')}>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Field label={isFromLitter && kennelAffix ? t('Nombre del cachorro *') : t('Nombre *')} value={form.name} onChange={v => set('name', v)} placeholder={isFromLitter && kennelAffix ? t('Solo el nombre (sin afijo)') : ''} />
              {isFromLitter && kennelAffix && form.name.trim() && (
                <p className="text-[10px] text-ink mt-1 font-medium">{formatDogName(form.name.trim(), defaultKennelName!, defaultAffixFormat as AffixFormat)}</p>
              )}
            </div>
            <div>
              <label className="text-[11px] font-semibold text-body uppercase tracking-wider mb-1.5 block">{t('Sexo *')}</label>
              <div className="flex gap-2">
                {(['male', 'female'] as const).map(s => (
                  <button key={s} type="button" onClick={() => set('sex', s)}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-semibold border transition ${form.sex === s
                      ? (s === 'male' ? 'border-blue-400 bg-blue-400/10 text-blue-400' : 'border-pink-400 bg-pink-400/10 text-pink-400')
                      : 'border-hairline bg-surface-card text-body hover:bg-surface-card'}`}>
                    {s === 'male' ? `♂ ${t('Macho')}` : `♀ ${t('Hembra')}`}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label={t('Nacimiento')} value={form.birth_date} onChange={v => set('birth_date', v)} type="date" />
            <Field label={t('Microchip')} value={form.microchip} onChange={v => set('microchip', v)} placeholder={t('Número')} />
          </div>
          <Field label={t('Registro')} value={form.registration} onChange={v => set('registration', v)} placeholder="UKC, FCI, etc." />
        </div>
      </Section>

      {/* Genealogy */}
      <Section icon={GitBranch} title={isFromLitter ? t('Genealogía (de la camada)') : t('Genealogía')}>
        {isFromLitter ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <LockedCard label={t('Raza')} name={selBreed?.name} />
              <LockedCard label={t('Criadero')} name={selKennel?.name} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <LockedCard label={t('Padre')} name={selFather?.name} sexColor={BRAND.male} />
              <LockedCard label={t('Madre')} name={selMother?.name} sexColor={BRAND.female} />
            </div>
            {form.breed_id && <DropdownSearch label={t('Color')} items={colors.map(c => ({ id: c.id, name: c.name, image: null }))} value={form.color_id} onChange={v => set('color_id', v)} placeholder={t('Buscar color...')} />}
          </div>
        ) : (
          <div className="space-y-3">
            <SelectCard label={t('Raza')} name={selBreed?.name} onClear={() => set('breed_id', '')}
              selector={<SearchList items={breeds.map(b => ({ id: b.id, name: b.name, image: null }))} value={form.breed_id} onChange={v => set('breed_id', v)} placeholder={t('Buscar raza...')} />} />
            {form.breed_id && (
              <>
                <DropdownSearch label={t('Color')} items={colors.map(c => ({ id: c.id, name: c.name, image: null }))} value={form.color_id} onChange={v => set('color_id', v)} placeholder={t('Buscar color...')} />
                {isEdit ? (
                  <>
                    <LockedParentCard label={t('Padre')} dog={selFather} sexColor={BRAND.male} />
                    <LockedParentCard label={t('Madre')} dog={selMother} sexColor={BRAND.female} />
                    <p className="text-[11px] text-muted leading-snug px-1">
                      {t('Los padres están bloqueados aquí para proteger la integridad de la genealogía. Para modificarlos usa')} <strong>{t('Gestión → Editar genealogía')}</strong>.
                    </p>
                  </>
                ) : (
                  <>
                    <SelectCard label={t('Padre')} name={selFather?.name} image={selFather?.thumbnail_url} sexColor={BRAND.male} onClear={() => set('father_id', '')}
                      selector={<SearchList items={maleDogs.filter(d => d.id !== editDogId).map(d => ({ id: d.id, name: d.name, image: d.thumbnail_url }))} value={form.father_id} onChange={v => set('father_id', v)} placeholder={t('Buscar padre...')} sexColor={BRAND.male} />} />
                    <SelectCard label={t('Madre')} name={selMother?.name} image={selMother?.thumbnail_url} sexColor={BRAND.female} onClear={() => set('mother_id', '')}
                      selector={<SearchList items={femaleDogs.filter(d => d.id !== editDogId).map(d => ({ id: d.id, name: d.name, image: d.thumbnail_url }))} value={form.mother_id} onChange={v => set('mother_id', v)} placeholder={t('Buscar madre...')} sexColor={BRAND.female} />} />
                  </>
                )}
              </>
            )}
            <SelectCard label={t('Criadero')} name={selKennel?.name} image={selKennel?.logo_url} onClear={() => set('kennel_id', '')}
              selector={<SearchList items={kennels.map(k => ({ id: k.id, name: k.name, image: k.logo_url }))} value={form.kennel_id} onChange={v => set('kennel_id', v)} placeholder={t('Buscar criadero...')} />} />
          </div>
        )}
      </Section>

      {/* Measurements */}
      {!isFromLitter && (
        <Section icon={Weight} title={t('Medidas')}>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('Peso (kg)')} value={form.weight} onChange={v => set('weight', v)} type="number" />
            <Field label={t('Altura (cm)')} value={form.height} onChange={v => set('height', v)} type="number" />
          </div>
        </Section>
      )}

      {/* Gallery */}
      <Section icon={ImageIcon} title={t('Galería')}>
        {editDogId ? (
          <GalleryTab dogId={editDogId} userId={userId} />
        ) : (
          <p className="text-xs text-muted text-center py-4">
            {isFromLitter ? t('Guarda el cachorro para subir fotos') : t('Guarda el perro primero para subir fotos')}
          </p>
        )}
      </Section>

      {/* Visibilidad — solo en creación (en edición se gestiona en "Gestión") */}
      {!isEdit && (
        <div className="flex items-center justify-between bg-surface-card border border-hairline rounded-xl p-4">
          <div className="flex items-center gap-3">
            {form.is_public ? <Eye className="w-5 h-5 text-green-400" /> : <EyeOff className="w-5 h-5 text-muted" />}
            <div>
              <p className="text-sm font-medium">{form.is_public ? t('Público') : t('Privado')}</p>
              <p className="text-xs text-muted">{form.is_public ? t('Visible para otros') : t('Solo tú')}</p>
            </div>
          </div>
          <ToggleSwitch value={form.is_public} onChange={(v) => set('is_public', v)} />
        </div>
      )}
    </div>
  )

  // ── Contenido de la pestaña "Gestión" (solo edición) ───────────────────
  const gestionContent = (
    <div className="space-y-6">
      {externalOwner && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center gap-3">
          {externalOwner.avatar_url ? (
            <img src={externalOwner.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-amber-700" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink truncate">{externalOwner.display_name || externalOwner.email || t('Propietario sin nombre')}</p>
            <p className="text-[11px] text-amber-700 mt-0.5 leading-snug">{t('Este perro ya fue transferido. La propiedad ahora es de otro usuario.')}</p>
          </div>
        </div>
      )}

      {/* Visibilidad y estado */}
      <div>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted">{t('Visibilidad y estado')}</p>
        <div className="mt-3 space-y-2.5">
          <ToggleCard icon={Globe} accent="emerald" title={t('Visible en tu criadero')}
            desc={t('Aparece en la web pública de tu criadero.')} value={showInKennel}
            saving={savingField === 'show_in_kennel'} onChange={(v) => persistField('show_in_kennel', v)} />
          <ToggleCard icon={Eye} accent="blue" title={t('Perfil público')}
            desc={t('Visible en el directorio y el buscador de Genealogic.')} value={form.is_public}
            saving={savingField === 'is_public'} onChange={(v) => persistField('is_public', v)} />
          <ToggleCard icon={Heart} accent="pink" title={t('Reproductor')} fill
            desc={t('Aparece en tu calendario reproductivo y en el catálogo de reproductores.')} value={isReproductive}
            saving={savingField === 'is_reproductive'} onChange={(v) => persistField('is_reproductive', v)} />
        </div>
      </div>

      {/* Acciones */}
      <div>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted">{t('Acciones')}</p>
        <div className="mt-3 space-y-2.5">
          <ActionCard icon={GitBranch} accent="violet" title={t('Editar genealogía')}
            desc={t('Añade o cambia padres y construye el árbol genealógico.')} cta={t('Abrir')}
            onClick={() => setPedigreeOpen(true)} />
          {!externalOwner && (
            <ActionCard icon={ArrowRightLeft} accent="amber" title={t('Transferir a otro dueño')}
              desc={t('Pasa la propiedad de este perro a otro usuario de Genealogic.')} cta={t('Abrir')}
              onClick={() => setTransferOpen(true)} />
          )}
          {deceasedAt ? (
            <div className="flex items-center gap-3 rounded-2xl border border-hairline bg-canvas p-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-rose-500 flex-shrink-0">
                <Heart className="h-4 w-4 fill-current" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-medium text-ink">{t('En memoria')}</p>
                <p className="text-[11.5px] text-muted leading-snug">
                  {t('Fallecido el')} {new Date(deceasedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}. {t('Para revertirlo, escribe a soporte.')}
                </p>
              </div>
            </div>
          ) : (
            <ActionCard icon={Heart} accent="rose" title={t('Marcar In Memoriam')}
              desc={t('Su ficha y genealogía se conservan; se oculta del directorio público.')} cta={t('Marcar')} danger
              onClick={() => setConfirmDeceased(true)} />
          )}
        </div>
      </div>
    </div>
  )

  const tabBody = (
    <>
      {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-500 mb-4">{error}</div>}
      {activeTab === 'datos' && datosContent}
      {activeTab === 'salud' && editDogId && <SaludTab dogId={editDogId} userId={userId} />}
      {activeTab === 'reproduccion' && editDogId && form.sex === 'female' && <ReproduccionTab dogId={editDogId} userId={userId} />}
      {activeTab === 'genetica' && editDogId && <GeneticaTab dogId={editDogId} userId={userId} />}
      {activeTab === 'palmares' && editDogId && <PalmaresTab dogId={editDogId} userId={userId} />}
      {activeTab === 'pedigree-pdf' && editDogId && <PedigreePdfTab dogId={editDogId} dogName={form.name} userId={userId} />}
      {activeTab === 'historico' && editDogId && <HistoricoTab dogId={editDogId} />}
      {activeTab === 'gestion' && editDogId && gestionContent}
    </>
  )

  return (
    <Portal>
      <>
      <div className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      <div
        className={`fixed top-0 right-0 h-dvh w-full z-[70] bg-canvas border-l border-hairline shadow-[-12px_0_32px_rgba(0,0,0,0.12)] transition-transform duration-300 flex flex-col overflow-x-hidden ${isEdit ? 'sm:max-w-3xl' : 'sm:max-w-xl'} ${open ? 'translate-x-0' : 'translate-x-full pointer-events-none'}`}
        style={{ paddingTop: 'var(--safe-area-top)', paddingBottom: 'var(--safe-area-bottom)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-hairline flex-shrink-0">
          {isEdit ? (
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-full overflow-hidden border border-hairline bg-surface-card flex-shrink-0 flex items-center justify-center">
                {thumbnailUrl ? <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" /> : <Dog className="h-5 w-5 text-muted" />}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-[15px] sm:text-base font-semibold tracking-[-0.01em] text-ink">{form.name || t('Editar perro')}</h2>
                {(selBreed?.name || sexLabel) && (
                  <p className="truncate text-[12px] text-muted">{[selBreed?.name, sexLabel].filter(Boolean).join(' · ')}</p>
                )}
              </div>
            </div>
          ) : (
            <h2 className="text-base sm:text-lg font-semibold tracking-[-0.01em]">{defaultLitterId ? t('Añadir cachorro') : t('Añadir perro')}</h2>
          )}
          <button onClick={onClose} className="text-muted hover:text-ink transition p-1 flex-shrink-0"><X className="w-5 h-5" /></button>
        </div>

        {/* Create mode toggle (solo creación) */}
        {!isEdit && !isFromLitter && (
          <div className="flex border-b border-hairline px-4 flex-shrink-0">
            <button onClick={() => setCreateMode('manual')} className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap transition border-b-2 -mb-px ${createMode === 'manual' ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-body'}`}>
              <Dog className="w-3.5 h-3.5" /> {t('Manual')}
            </button>
            <button onClick={() => setCreateMode('import')} className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap transition border-b-2 -mb-px ${createMode === 'import' ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-body'}`}>
              <Globe className="w-3.5 h-3.5" /> {t('Importar genealogía')}
            </button>
          </div>
        )}

        {/* CUERPO */}
        {!isEdit && !isFromLitter && createMode === 'import' ? (
          <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
            <ImportPedigreeTab userId={userId} kennelId={defaultKennelId || undefined} onImported={() => { onClose(); onSaved?.(); router.refresh() }} />
          </div>
        ) : dataLoading ? (
          <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted" /></div>
        ) : isEdit ? (
          // EDICIÓN: navegación lateral (desktop) / pills (móvil) + contenido
          <div className="flex-1 min-h-0 flex flex-col sm:flex-row overflow-hidden">
            {/* Móvil: pills scrollables */}
            <nav className="sm:hidden flex gap-1.5 overflow-x-auto px-4 py-2.5 border-b border-hairline flex-shrink-0">
              {visibleTabs.map((tab) => {
                const Icon = tab.icon
                const active = activeTab === tab.key
                return (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium whitespace-nowrap transition ${active ? 'bg-ink text-on-primary' : 'bg-surface-card text-body hover:text-ink'}`}>
                    <Icon className="w-3.5 h-3.5" /> {t(tab.label)}
                  </button>
                )
              })}
            </nav>
            {/* Desktop: sidebar */}
            <nav className="hidden sm:flex sm:flex-col gap-0.5 w-52 flex-shrink-0 border-r border-hairline p-3 overflow-y-auto">
              {visibleTabs.map((tab) => {
                const Icon = tab.icon
                const active = activeTab === tab.key
                return (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    className={`relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition ${active ? 'bg-surface-card text-ink font-medium shadow-[0_1px_2px_rgba(17,17,17,0.04)]' : 'text-muted hover:text-ink hover:bg-surface-soft'}`}>
                    {active && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-ink" />}
                    <Icon className={`h-4 w-4 flex-shrink-0 ${active ? 'text-ink' : 'text-muted'}`} /> <span className="truncate">{t(tab.label)}</span>
                  </button>
                )
              })}
            </nav>
            {/* Contenido */}
            <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
              {tabBody}
            </div>
          </div>
        ) : (
          // CREACIÓN: una sola columna
          <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
            {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-500 mb-4">{error}</div>}
            {datosContent}
          </div>
        )}

        {/* Footer — guardar (solo pestaña Datos, modo manual) */}
        {activeTab === 'datos' && createMode === 'manual' && (
          <div className="flex items-center justify-end gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-hairline flex-shrink-0">
            <button onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm text-body hover:text-ink hover:bg-surface-card transition">{t('Cancelar')}</button>
            <button onClick={handleSubmit} disabled={loading || !form.name.trim() || dataLoading}
              className="bg-ink text-on-primary hover:opacity-90 font-semibold px-5 py-2.5 rounded-lg transition disabled:opacity-50 flex items-center gap-2 text-sm">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? t('Guardando...') : isEdit ? t('Actualizar') : t('Crear perro')}
            </button>
          </div>
        )}
      </div>

      {/* Paneles secundarios lanzados desde Gestión (encima del editor) */}
      {isEdit && editDogId && (
        <>
          <PedigreeEditor open={pedigreeOpen} onClose={() => { setPedigreeOpen(false); router.refresh() }} dogId={editDogId} userId={userId} />
          <TransferPanel open={transferOpen} onClose={() => { setTransferOpen(false); router.refresh() }}
            dog={transferOpen ? { id: editDogId, name: form.name, thumbnail_url: thumbnailUrl, breed_name: selBreed?.name } : null} />
        </>
      )}

      {/* Modal de confirmación "Marcar como fallecido" */}
      {confirmDeceased && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50"
          onClick={() => !deceasedLoading && setConfirmDeceased(false)}>
          <div className="bg-canvas border border-hairline rounded-2xl p-6 max-w-sm w-full shadow-xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                <Heart className="w-5 h-5 text-rose-500" />
              </div>
              <h3 className="text-base font-semibold">{t('Marcar como fallecido')}</h3>
            </div>
            <p className="text-sm text-body leading-relaxed">
              {form.name ? <strong>{form.name}</strong> : t('Este perro')} {t('aparecerá como «En memoria». Su ficha, genealogía, fotos y palmarés se conservan, pero se oculta del directorio público.')}
            </p>
            <p className="mt-2 text-xs text-muted">
              {t('Esta acción es irreversible desde la app. Si te equivocas, escribe a soporte.')}
            </p>
            <div className="flex items-center justify-end gap-3 mt-5">
              <button onClick={() => setConfirmDeceased(false)} disabled={deceasedLoading}
                className="px-4 py-2.5 rounded-lg text-sm text-body hover:text-ink hover:bg-surface-card transition disabled:opacity-50">
                {t('Cancelar')}
              </button>
              <button onClick={handleMarkDeceased} disabled={deceasedLoading}
                className="bg-rose-500 text-white hover:opacity-90 font-semibold px-5 py-2.5 rounded-lg transition disabled:opacity-50 flex items-center gap-2 text-sm">
                {deceasedLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {deceasedLoading ? t('Marcando...') : t('Sí, marcar')}
              </button>
            </div>
          </div>
        </div>
      )}
      </>
    </Portal>
  )
}

/* ── Helper Components ── */

const ACCENTS: Record<string, string> = {
  emerald: 'text-emerald-600 bg-emerald-50',
  blue: 'text-blue-600 bg-blue-50',
  pink: 'text-pink-600 bg-pink-50',
  violet: 'text-violet-600 bg-violet-50',
  amber: 'text-amber-600 bg-amber-50',
  rose: 'text-rose-500 bg-rose-50',
}

const TOGGLE_COLOR: Record<string, string> = {
  emerald: 'bg-emerald-500',
  blue: 'bg-blue-500',
  pink: 'bg-pink-500',
}

function ToggleCard({ icon: Icon, accent, title, desc, value, onChange, saving, fill }: { icon: React.ElementType; accent: string; title: string; desc: string; value: boolean; onChange: (v: boolean) => void; saving?: boolean; fill?: boolean }) {
  return (
    <div className={`flex items-center gap-3 rounded-2xl border bg-canvas p-3.5 transition-colors ${value ? 'border-ink/15' : 'border-hairline'}`}>
      <div className={`flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0 ${ACCENTS[accent]}`}>
        <Icon className={`h-4 w-4 ${fill && value ? 'fill-current' : ''}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-medium text-ink">{title}</p>
        <p className="text-[11.5px] text-muted leading-snug">{desc}</p>
      </div>
      {saving ? <Loader2 className="h-4 w-4 animate-spin text-muted flex-shrink-0" /> : <ToggleSwitch value={value} onChange={onChange} color={TOGGLE_COLOR[accent] || 'bg-ink'} />}
    </div>
  )
}

function ActionCard({ icon: Icon, accent, title, desc, cta, onClick, danger }: { icon: React.ElementType; accent: string; title: string; desc: string; cta: string; onClick: () => void; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-hairline bg-canvas p-3.5 text-left transition hover:bg-surface-soft hover:border-ink/20">
      <div className={`flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0 ${ACCENTS[accent]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-medium text-ink">{title}</p>
        <p className="text-[11.5px] text-muted leading-snug">{desc}</p>
      </div>
      <span className={`inline-flex items-center gap-0.5 text-[12.5px] font-medium flex-shrink-0 ${danger ? 'text-rose-500' : 'text-ink'}`}>
        {cta} <ChevronRight className="h-3.5 w-3.5" />
      </span>
    </button>
  )
}

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
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-surface-card border border-hairline rounded-lg px-3 py-2.5 text-base sm:text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none transition" />
    </div>
  )
}

function SelectCard({ label, name, image, sexColor, onClear, selector, disabled }: { label: string; name?: string; image?: string | null; sexColor?: string; onClear: () => void; selector: React.ReactNode; disabled?: boolean }) {
  const t = useT()
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
        <span className={`flex-1 text-[14px] `}>{name || t('Seleccionar...')}</span>
        <ChevronDown className={`w-4 h-4 text-muted transition ${open ? 'rotate-180' : ''}`} />
      </div>
      {open && !disabled && (
        <div className="absolute z-[80] top-full mt-1 left-0 right-0 bg-canvas border border-hairline rounded-lg shadow-lg max-h-56 overflow-hidden">
          {selector}
          {name && <button onClick={() => { onClear(); setOpen(false) }} className="w-full text-left px-3 py-2.5 text-xs text-red-400 hover:bg-red-500/10 border-t border-hairline">{t('Quitar selección')}</button>}
        </div>
      )}
    </div>
  )
}

function SearchList({ items, value, onChange, placeholder, sexColor }: { items: { id: string; name: string; image: string | null }[]; value: string; onChange: (v: string) => void; placeholder?: string; sexColor?: string }) {
  const t = useT()
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const filtered = items.filter(d => d.name.toLowerCase().includes(search.toLowerCase()))
  useEffect(() => { inputRef.current?.focus() }, [])

  return (
    <>
      <div className="p-2.5 border-b border-hairline">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
          <input ref={inputRef} value={search} onChange={e => setSearch(e.target.value)} placeholder={placeholder || t('Buscar...')}
            className="w-full bg-surface-card border border-hairline rounded-lg pl-8 pr-3 py-2 text-base sm:text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none" />
        </div>
      </div>
      <div className="overflow-y-auto max-h-44">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted p-4 text-center">{t('Sin resultados')}</p>
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
        <div className="absolute z-[80] mt-1 w-full bg-canvas border border-hairline rounded-lg shadow-lg max-h-48 flex flex-col">
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

function LockedParentCard({ label, dog, sexColor }: {
  label: string
  dog?: { id: string; name: string; thumbnail_url?: string | null } | null
  sexColor?: string
}) {
  const t = useT()
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
        <span className="flex-1 text-[14px] text-ink truncate">{dog?.name || t('Sin asignar')}</span>
        <Lock className="w-3.5 h-3.5 text-muted flex-shrink-0" />
      </div>
    </div>
  )
}
