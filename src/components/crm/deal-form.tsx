'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Loader2, Search, ChevronDown, FileText, MessageSquare, Upload, Trash2 } from 'lucide-react'
import SearchableSelect from '@/components/ui/searchable-select'
import ConfirmDialog from '@/components/ui/confirm-dialog'
import DealActivity from './deal-activity'

interface DealFormProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  initialData?: any
  stages: { id: string; name: string; color?: string }[]
  contacts: { id: string; name: string }[]
  pipelineId: string
  allPipelines?: any[]
  userId: string
}

const TABS = [
  { key: 'detalles', label: 'Detalles', icon: FileText },
  { key: 'actividades', label: 'Actividades', icon: MessageSquare },
  { key: 'documentos', label: 'Documentos', icon: Upload },
] as const

type TabKey = typeof TABS[number]['key']

export default function DealForm({ open, onClose, onSaved, initialData, stages, contacts, pipelineId, allPipelines, userId }: DealFormProps) {
  const isEdit = !!initialData
  const [activeTab, setActiveTab] = useState<TabKey>('detalles')
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  // Reference data fetched from supabase
  const [dogs, setDogs] = useState<{ id: string; name: string; thumbnail_url: string | null }[]>([])
  const [litters, setLitters] = useState<{ id: string; name: string }[]>([])

  const [form, setForm] = useState(() => ({
    title: '',
    value: '',
    currency: 'EUR',
    is_reservation: false,
    advance_amount: '',
    payment_completed: false,
    contact_id: '',
    pipeline_id: '',
    stage_id: '',
    dog_ids: [] as string[],
    litter_id: '',
    lost_reason: '',
    preferred_sex: 'any' as string,
    preferred_color: '',
    queue_position: '' as string,
  }))

  // Reset form when panel opens/closes or initialData changes
  useEffect(() => {
    if (!open) return
    setActiveTab('detalles')
    setError('')
    setDataLoading(true)

    const supabase = createClient()

    async function load() {
      // Fetch dogs and litters
      const [dogsRes, littersRes] = await Promise.all([
        supabase.from('dogs').select('id, name, thumbnail_url').eq('owner_id', userId).order('name'),
        supabase.from('litters').select('id, father:dogs!litters_father_id_fkey(name), mother:dogs!litters_mother_id_fkey(name)').eq('owner_id', userId).order('created_at', { ascending: false }),
      ])
      setDogs(dogsRes.data || [])
      setLitters((littersRes.data || []).map((l: any) => ({
        id: l.id,
        name: `${(l.father as any)?.name || '?'} × ${(l.mother as any)?.name || '?'}`,
      })))

      if (initialData) {
        // Fetch linked dogs for this deal
        const { data: linkedDogs } = await supabase
          .from('deal_dogs')
          .select('dog_id')
          .eq('deal_id', initialData.id)
        const dogIds = (linkedDogs || []).map((d: any) => d.dog_id)

        setForm({
          title: initialData.title || '',
          value: initialData.value?.toString() || '',
          currency: initialData.currency || 'EUR',
          is_reservation: initialData.is_reservation || false,
          advance_amount: initialData.advance_amount?.toString() || '',
          payment_completed: initialData.payment_completed || false,
          contact_id: initialData.contact_id || '',
          pipeline_id: initialData.pipeline_id || pipelineId,
          stage_id: initialData.stage_id || stages[0]?.id || '',
          dog_ids: dogIds,
          litter_id: initialData.litter_id || '',
          lost_reason: initialData.lost_reason || '',
          preferred_sex: initialData.preferred_sex || 'any',
          preferred_color: initialData.preferred_color || '',
          queue_position: initialData.queue_position?.toString() || '',
        })
      } else {
        setForm({
          title: '',
          value: '',
          currency: 'EUR',
          is_reservation: false,
          advance_amount: '',
          payment_completed: false,
          contact_id: '',
          pipeline_id: pipelineId,
          stage_id: stages[0]?.id || '',
          dog_ids: [],
          litter_id: '',
          lost_reason: '',
          preferred_sex: 'any',
          preferred_color: '',
          queue_position: '',
        })
      }
      setDataLoading(false)
    }
    load()
  }, [open, initialData, userId, stages])

  // Escape key to close
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  const set = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }))

  // Compute stages for the selected pipeline
  const selectedPipeline = allPipelines?.find((p: any) => p.id === form.pipeline_id)
  const availableStages = selectedPipeline
    ? [...(selectedPipeline.stages || [])].sort((a: any, b: any) => a.position - b.position)
    : stages
  const stageOptions = availableStages.map((s: any) => ({ value: s.id, label: s.name }))

  const currentStage = availableStages.find((s: any) => s.id === form.stage_id)
  const isLostStage = currentStage ? /perdid|cancelada/i.test(currentStage.name) : false

  const handleSubmit = async () => {
    if (!form.title.trim()) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const payload: any = {
      title: form.title.trim(),
      value: form.value ? parseFloat(form.value) : null,
      currency: form.currency,
      is_reservation: form.is_reservation,
      advance_amount: form.is_reservation && form.advance_amount ? parseFloat(form.advance_amount) : null,
      payment_completed: form.is_reservation ? form.payment_completed : false,
      contact_id: form.contact_id || null,
      stage_id: form.stage_id || null,
      pipeline_id: form.pipeline_id || pipelineId,
      litter_id: form.litter_id || null,
      preferred_sex: form.litter_id ? (form.preferred_sex || 'any') : null,
      preferred_color: form.litter_id ? (form.preferred_color || null) : null,
      queue_position: form.litter_id && form.queue_position ? parseInt(form.queue_position) : null,
      lost_reason: isLostStage ? (form.lost_reason || null) : null,
    }

    let dealId: string | null = null

    if (isEdit) {
      const { error: err } = await supabase.from('deals').update(payload).eq('id', initialData.id)
      if (err) { setError(err.message); setLoading(false); return }
      dealId = initialData.id
    } else {
      const { data, error: err } = await supabase.from('deals').insert({ ...payload, owner_id: userId }).select('id').single()
      if (err) { setError(err.message); setLoading(false); return }
      dealId = data?.id || null
    }

    // Sync deal_dogs
    if (dealId) {
      await supabase.from('deal_dogs').delete().eq('deal_id', dealId)
      if (form.dog_ids.length > 0) {
        await supabase.from('deal_dogs').insert(
          form.dog_ids.map(dogId => ({ deal_id: dealId!, dog_id: dogId }))
        )
      }
    }

    setLoading(false)
    onSaved()
    onClose()
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const supabase = createClient()
      const dealId = initialData.id
      await supabase.from('deal_activities').delete().eq('deal_id', dealId)
      await supabase.from('deal_dogs').delete().eq('deal_id', dealId)
      await supabase.from('form_submissions').update({ deal_id: null } as any).eq('deal_id', dealId)
      await supabase.from('deals').delete().eq('id', dealId)
    } catch (err) {
      console.error('Delete deal error:', err)
    }
    setDeleting(false)
    setShowDelete(false)
    onSaved()
    onClose()
  }

  const toggleDog = (dogId: string) => {
    setForm(prev => ({
      ...prev,
      dog_ids: prev.dog_ids.includes(dogId)
        ? prev.dog_ids.filter(id => id !== dogId)
        : [...prev.dog_ids, dogId],
    }))
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`fixed top-0 right-0 h-full w-full sm:max-w-xl z-[70] bg-gray-900 border-l border-white/10 shadow-2xl transition-transform duration-300 flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 flex-shrink-0">
          <h2 className="text-base sm:text-lg font-semibold">{isEdit ? 'Editar negocio' : 'Nuevo negocio'}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs - only in edit mode */}
        {isEdit && (
          <div className="flex border-b border-white/10 px-4 overflow-x-auto flex-shrink-0">
            {TABS.map(t => {
              const Icon = t.icon
              const active = activeTab === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap transition border-b-2 -mb-px ${
                    active
                      ? 'border-[#D74709] text-[#D74709]'
                      : 'border-transparent text-white/40 hover:text-white/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />{t.label}
                </button>
              )
            })}
          </div>
        )}

        {/* Content */}
        {dataLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-white/30" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400 mb-4">{error}</div>
            )}

            {/* TAB: DETALLES */}
            {activeTab === 'detalles' && (
              <div className="space-y-5">
                {/* Title */}
                <div>
                  <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">Titulo *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => set('title', e.target.value)}
                    placeholder="Ej: Venta cachorro a Juan"
                    autoFocus
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition"
                  />
                </div>

                {/* Value + Currency */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">Valor</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.value}
                      onChange={e => set('value', e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">Moneda</label>
                    <select
                      value={form.currency}
                      onChange={e => set('currency', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#D74709] focus:outline-none transition appearance-none"
                    >
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                </div>

                {/* Reservation toggle */}
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-white flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.is_reservation}
                        onChange={e => set('is_reservation', e.target.checked)}
                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#D74709] focus:ring-[#D74709] focus:ring-offset-0"
                      />
                      Es una reserva
                    </label>
                  </div>

                  {form.is_reservation && (
                    <div className="space-y-3 pl-6 border-l-2 border-[#D74709]/30 ml-2">
                      <div>
                        <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">Anticipo</label>
                        <input
                          type="number"
                          step="0.01"
                          value={form.advance_amount}
                          onChange={e => set('advance_amount', e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition"
                        />
                      </div>
                      <label className="text-sm text-white/70 flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={form.payment_completed}
                          onChange={e => set('payment_completed', e.target.checked)}
                          className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#D74709] focus:ring-[#D74709] focus:ring-offset-0"
                        />
                        Pago completado
                      </label>
                    </div>
                  )}
                </div>

                {/* Contact selector */}
                <InlineSearch
                  label="Contacto"
                  items={contacts.map(c => ({ id: c.id, name: c.name }))}
                  value={form.contact_id}
                  onChange={v => set('contact_id', v)}
                  placeholder="Buscar contacto..."
                />

                {/* Pipeline selector */}
                {allPipelines && allPipelines.length > 1 && (
                  <SearchableSelect
                    label="Pipeline"
                    options={allPipelines.map((p: any) => ({ value: p.id, label: p.name }))}
                    value={form.pipeline_id}
                    onChange={v => {
                      const pl = allPipelines.find((p: any) => p.id === v)
                      const firstStage = pl?.stages?.sort((a: any, b: any) => a.position - b.position)?.[0]
                      set('pipeline_id', v)
                      if (firstStage) set('stage_id', firstStage.id)
                    }}
                    placeholder="Seleccionar pipeline"
                  />
                )}

                {/* Stage selector */}
                <SearchableSelect
                  label="Etapa"
                  options={stageOptions}
                  value={form.stage_id}
                  onChange={v => set('stage_id', v)}
                  placeholder="Seleccionar etapa"
                />

                {/* Dogs linked (multi-select) */}
                <MultiDogSearch
                  label="Perros vinculados"
                  items={dogs}
                  selectedIds={form.dog_ids}
                  onToggle={toggleDog}
                  placeholder="Buscar perro..."
                />

                {/* Litter linked (single select) */}
                <InlineSearch
                  label="Camada vinculada"
                  items={litters.map(l => ({ id: l.id, name: l.name }))}
                  value={form.litter_id}
                  onChange={v => set('litter_id', v)}
                  placeholder="Buscar camada..."
                />

                {/* Waiting list preferences — shown when litter is linked */}
                {form.litter_id && (
                  <div className="bg-purple-500/5 border border-purple-500/15 rounded-xl p-4 space-y-3">
                    <p className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider">Lista de espera</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">Preferencia sexo</label>
                        <select
                          value={form.preferred_sex}
                          onChange={e => set('preferred_sex', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#D74709] focus:outline-none transition appearance-none"
                        >
                          <option value="any">Cualquiera</option>
                          <option value="male">♂ Macho</option>
                          <option value="female">♀ Hembra</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">Color preferido</label>
                        <input
                          type="text"
                          value={form.preferred_color}
                          onChange={e => set('preferred_color', e.target.value)}
                          placeholder="Ej: Negro, Tricolor..."
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">Posición cola</label>
                        <input
                          type="number"
                          min="1"
                          value={form.queue_position}
                          onChange={e => set('queue_position', e.target.value)}
                          placeholder="1, 2, 3..."
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Lost reason - only if stage is lost */}
                {isLostStage && (
                  <div>
                    <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">Razon de perdida</label>
                    <input
                      type="text"
                      value={form.lost_reason}
                      onChange={e => set('lost_reason', e.target.value)}
                      placeholder="Motivo por el que se perdio el negocio"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition"
                    />
                  </div>
                )}
              </div>
            )}

            {/* TAB: ACTIVIDADES */}
            {activeTab === 'actividades' && isEdit && initialData?.id && (
              <DealActivity dealId={initialData.id} userId={userId} contactId={form.contact_id} />
            )}

            {/* TAB: DOCUMENTOS */}
            {activeTab === 'documentos' && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-white/20 transition cursor-pointer">
                  <Upload className="w-8 h-8 text-white/20 mx-auto mb-3" />
                  <p className="text-sm text-white/50 font-medium">Arrastra archivos aqui o haz clic para subir</p>
                  <p className="text-xs text-white/30 mt-1">PDF, imagenes, documentos (max 10MB)</p>
                </div>
                <p className="text-xs text-white/30 text-center">Los documentos subidos estaran vinculados a este negocio</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-t border-white/10 flex-shrink-0">
          <div>
            {isEdit && (
              <button
                type="button"
                onClick={() => setShowDelete(true)}
                className="text-sm text-red-400 hover:text-red-300 transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !form.title.trim() || dataLoading}
              className="bg-[#D74709] hover:bg-[#c03d07] text-white font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Guardando...' : isEdit ? 'Guardar' : 'Crear negocio'}
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={showDelete}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
        title="Eliminar negocio"
        message="Se eliminara este negocio y todos sus datos asociados. Esta accion no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        loading={deleting}
      />
    </>
  )
}

/* ---- Inline search (single select) ---- */
function InlineSearch({ label, items, value, onChange, placeholder }: {
  label: string
  items: { id: string; name: string }[]
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const sel = items.find(i => i.id === value)
  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  return (
    <div ref={ref} className="relative">
      <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">{label}</label>
      <div
        onClick={() => { setOpen(!open); setSearch('') }}
        className={`w-full bg-white/5 border rounded-lg px-3 py-2 text-sm flex items-center gap-2 cursor-pointer transition hover:border-white/20 ${open ? 'border-[#D74709]' : 'border-white/10'}`}
      >
        <span className={sel ? 'text-white flex-1 truncate' : 'text-white/30 flex-1'}>{sel?.name || placeholder}</span>
        <div className="ml-auto flex items-center gap-1 flex-shrink-0">
          {value && (
            <span onClick={e => { e.stopPropagation(); onChange(''); setOpen(false) }} className="text-white/30 hover:text-white/60 transition">
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-white/30 transition ${open ? 'rotate-180' : ''}`} />
        </div>
      </div>
      {open && (
        <div className="absolute z-[80] mt-1 w-full bg-gray-800 border border-white/10 rounded-lg shadow-xl max-h-48 flex flex-col">
          <div className="p-2 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <input
                ref={inputRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={placeholder || 'Buscar...'}
                className="w-full bg-white/5 border border-white/10 rounded pl-8 pr-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:border-[#D74709] focus:outline-none"
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <p className="text-sm text-white/30 p-3 text-center">Sin resultados</p>
            ) : (
              filtered.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { onChange(item.id); setOpen(false); setSearch('') }}
                  className={`w-full text-left px-3 py-2 text-sm transition ${
                    item.id === value
                      ? 'bg-[#D74709]/15 text-[#D74709]'
                      : 'text-white/70 hover:bg-white/5'
                  }`}
                >
                  <span className="truncate">{item.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ---- Multi-select dog search ---- */
function MultiDogSearch({ label, items, selectedIds, onToggle, placeholder }: {
  label: string
  items: { id: string; name: string; thumbnail_url: string | null }[]
  selectedIds: string[]
  onToggle: (id: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
  const selectedDogs = items.filter(i => selectedIds.includes(i.id))

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  return (
    <div ref={ref} className="relative">
      <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">{label}</label>

      {/* Selected dogs pills */}
      {selectedDogs.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedDogs.map(dog => (
            <span
              key={dog.id}
              className="inline-flex items-center gap-1 bg-[#D74709]/15 text-[#D74709] text-xs font-medium px-2 py-1 rounded-md"
            >
              {dog.name}
              <button type="button" onClick={() => onToggle(dog.id)} className="hover:text-white transition">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div
        onClick={() => { setOpen(!open); setSearch('') }}
        className={`w-full bg-white/5 border rounded-lg px-3 py-2 text-sm flex items-center gap-2 cursor-pointer transition hover:border-white/20 ${open ? 'border-[#D74709]' : 'border-white/10'}`}
      >
        <span className="text-white/30 flex-1">{placeholder || 'Seleccionar...'}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-white/30 transition ${open ? 'rotate-180' : ''}`} />
      </div>

      {open && (
        <div className="absolute z-[80] mt-1 w-full bg-gray-800 border border-white/10 rounded-lg shadow-xl max-h-56 flex flex-col">
          <div className="p-2 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <input
                ref={inputRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={placeholder || 'Buscar...'}
                className="w-full bg-white/5 border border-white/10 rounded pl-8 pr-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:border-[#D74709] focus:outline-none"
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <p className="text-sm text-white/30 p-3 text-center">Sin resultados</p>
            ) : (
              filtered.map(item => {
                const selected = selectedIds.includes(item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onToggle(item.id)}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 transition ${
                      selected
                        ? 'bg-[#D74709]/15 text-[#D74709]'
                        : 'text-white/70 hover:bg-white/5'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                      selected ? 'bg-[#D74709] border-[#D74709]' : 'border-white/20 bg-white/5'
                    }`}>
                      {selected && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    {item.thumbnail_url && (
                      <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 bg-white/5 border border-white/10">
                        <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <span className="truncate">{item.name}</span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
