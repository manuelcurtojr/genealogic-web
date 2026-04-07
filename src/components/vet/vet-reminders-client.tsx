'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Stethoscope, Plus, Check, Clock, AlertTriangle, Syringe, Bug, Search as SearchIcon, Filter, Dog, X, Loader2, Sparkles, Calendar } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import VetReminderForm from './vet-reminder-form'

interface Props {
  initialReminders: any[]
  dogs: any[]
  templates: any[]
  userId: string
}

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  vaccine: { label: 'Vacuna', color: '#10B981', icon: Syringe },
  deworming: { label: 'Desparasitación', color: '#F59E0B', icon: Bug },
  checkup: { label: 'Revisión', color: '#3B82F6', icon: Stethoscope },
  custom: { label: 'Personalizado', color: '#8B5CF6', icon: Calendar },
}

export default function VetRemindersClient({ initialReminders, dogs, templates, userId }: Props) {
  const [reminders, setReminders] = useState(initialReminders)
  const [showForm, setShowForm] = useState(false)
  const [editingReminder, setEditingReminder] = useState<any>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'completed'>('pending')
  const [dogFilter, setDogFilter] = useState('')
  const [generatingFor, setGeneratingFor] = useState<string | null>(null)

  const fetchReminders = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('vet_reminders')
      .select('*, dog:dogs(id, name, sex, thumbnail_url, breed:breeds(name))')
      .eq('owner_id', userId)
      .order('due_date', { ascending: true })
    setReminders(data || [])
  }, [userId])

  const today = new Date().toISOString().split('T')[0]

  const filtered = reminders.filter(r => {
    if (dogFilter && r.dog_id !== dogFilter) return false
    if (filter === 'pending') return !r.completed_date
    if (filter === 'overdue') return !r.completed_date && r.due_date < today
    if (filter === 'completed') return !!r.completed_date
    return true
  })

  const pendingCount = reminders.filter(r => !r.completed_date).length
  const overdueCount = reminders.filter(r => !r.completed_date && r.due_date < today).length

  const markCompleted = async (id: string) => {
    const supabase = createClient()
    const reminder = reminders.find(r => r.id === id)
    await supabase.from('vet_reminders').update({ completed_date: today }).eq('id', id)

    // If recurrence is set, create next reminder
    if (reminder?.recurrence_days) {
      const nextDate = new Date(today)
      nextDate.setDate(nextDate.getDate() + reminder.recurrence_days)
      await supabase.from('vet_reminders').insert({
        dog_id: reminder.dog_id,
        template_id: reminder.template_id,
        owner_id: userId,
        title: reminder.title,
        type: reminder.type,
        due_date: nextDate.toISOString().split('T')[0],
        auto_generated: true,
        recurrence_days: reminder.recurrence_days,
      })
    }

    fetchReminders()
  }

  const deleteReminder = async (id: string) => {
    const supabase = createClient()
    await supabase.from('vet_reminders').delete().eq('id', id)
    fetchReminders()
  }

  // Auto-generate reminders for a dog based on templates
  const autoGenerate = async (dogId: string) => {
    setGeneratingFor(dogId)
    const dog = dogs.find(d => d.id === dogId)
    if (!dog?.birth_date) { setGeneratingFor(null); return }

    const supabase = createClient()
    const birthDate = new Date(dog.birth_date)
    const ageMonths = (Date.now() - birthDate.getTime()) / (30.44 * 24 * 60 * 60 * 1000)
    const isPuppy = ageMonths < 12

    // Filter templates applicable to this dog's age
    const applicable = templates.filter(t => {
      if (t.applies_to === 'puppy' && !isPuppy) return false
      if (t.applies_to === 'adult' && isPuppy) return false
      return true
    })

    const newReminders = []
    for (const tmpl of applicable) {
      // Check if already exists
      const existing = reminders.find(r => r.dog_id === dogId && r.template_id === tmpl.id && !r.completed_date)
      if (existing) continue

      let dueDate: Date
      if (tmpl.applies_to === 'puppy' && tmpl.default_interval_days === 0) {
        // Primovacunación: 6-8 weeks from birth
        dueDate = new Date(birthDate)
        dueDate.setDate(dueDate.getDate() + 42) // 6 weeks
      } else if (tmpl.applies_to === 'puppy') {
        // Based on last similar reminder or birth + offset
        dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + tmpl.default_interval_days)
      } else {
        // Adult: next occurrence from today
        dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + tmpl.default_interval_days)
      }

      // Don't create past reminders for puppies
      if (dueDate < new Date() && isPuppy) {
        dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + 7) // A week from now
      }

      newReminders.push({
        dog_id: dogId,
        template_id: tmpl.id,
        owner_id: userId,
        title: tmpl.name,
        type: tmpl.type,
        due_date: dueDate.toISOString().split('T')[0],
        auto_generated: true,
        recurrence_days: tmpl.type === 'vaccine' && tmpl.applies_to === 'adult' ? tmpl.default_interval_days : (tmpl.type === 'deworming' ? tmpl.default_interval_days : null),
      })
    }

    if (newReminders.length > 0) {
      await supabase.from('vet_reminders').insert(newReminders)
      fetchReminders()
    }
    setGeneratingFor(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Recordatorios veterinarios</h1>
          <p className="text-white/40 text-sm mt-0.5">Gestiona vacunas, desparasitaciones y revisiones de tus perros</p>
        </div>
        <button onClick={() => { setEditingReminder(null); setShowForm(true) }}
          className="flex items-center gap-1.5 bg-[#D74709] hover:bg-[#c03d07] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition">
          <Plus className="w-4 h-4" /> Nuevo recordatorio
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-xl font-bold">{reminders.length}</p>
            <p className="text-[10px] text-white/30">Total</p>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-xl font-bold">{pendingCount}</p>
            <p className="text-[10px] text-white/30">Pendientes</p>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-xl font-bold">{overdueCount}</p>
            <p className="text-[10px] text-white/30">Vencidos</p>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
            <Check className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-xl font-bold">{reminders.filter(r => r.completed_date).length}</p>
            <p className="text-[10px] text-white/30">Completados</p>
          </div>
        </div>
      </div>

      {/* Filters + Dog search + Auto-generate */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex bg-white/5 border border-white/10 rounded-lg overflow-hidden">
          {[
            { key: 'pending', label: 'Pendientes' },
            { key: 'overdue', label: 'Vencidos' },
            { key: 'completed', label: 'Completados' },
            { key: 'all', label: 'Todos' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key as any)}
              className={`px-3 py-2 text-xs font-medium transition ${filter === f.key ? 'bg-[#D74709]/15 text-[#D74709]' : 'text-white/40 hover:text-white/60'}`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Dog filter with search */}
        <DogSearchFilter
          dogs={dogs}
          value={dogFilter}
          onChange={setDogFilter}
          placeholder="Filtrar por perro..."
        />

        {/* Auto-generate with search */}
        <AutoGenerateButton
          dogs={dogs.filter(d => d.birth_date)}
          generatingFor={generatingFor}
          onGenerate={autoGenerate}
        />
      </div>

      {/* Reminders list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white/5 border border-white/10 rounded-xl">
          <Stethoscope className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-white/40 text-sm">No hay recordatorios {filter !== 'all' ? 'en esta categoría' : ''}</p>
          <p className="text-xs text-white/25 mt-1">Añade un recordatorio o usa auto-generar</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => {
            const dog = r.dog as any
            const typeConf = TYPE_CONFIG[r.type] || TYPE_CONFIG.custom
            const TypeIcon = typeConf.icon
            const isOverdue = !r.completed_date && r.due_date < today
            const isDueToday = r.due_date === today
            const isDueSoon = !r.completed_date && !isOverdue && !isDueToday && r.due_date <= new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
            const sexColor = dog?.sex === 'male' ? BRAND.male : BRAND.female

            return (
              <div key={r.id}
                className={`bg-white/5 border rounded-xl p-3 flex items-center gap-3 transition ${
                  r.completed_date ? 'border-white/5 opacity-50' : isOverdue ? 'border-red-500/30 bg-red-500/5' : isDueSoon ? 'border-amber-500/20' : 'border-white/10'
                }`}>
                {/* Type icon */}
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: typeConf.color + '15' }}>
                  <TypeIcon className="w-4.5 h-4.5" style={{ color: typeConf.color }} />
                </div>

                {/* Dog avatar + name */}
                <div className="flex items-center gap-2 min-w-[140px] flex-shrink-0">
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-white/5 border flex-shrink-0" style={{ borderColor: sexColor }}>
                    {dog?.thumbnail_url ? <img src={dog.thumbnail_url} alt="" className="w-full h-full object-cover" /> : null}
                  </div>
                  <span className="text-xs font-medium truncate">{dog?.name || '?'}</span>
                </div>

                {/* Reminder info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{r.title}</p>
                  <div className="flex items-center gap-2 text-[10px] text-white/30">
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: typeConf.color + '15', color: typeConf.color }}>
                      {typeConf.label}
                    </span>
                    {r.auto_generated && <span className="text-purple-400">Auto</span>}
                    {r.recurrence_days && <span>↻ cada {r.recurrence_days}d</span>}
                    {r.notes && <span className="truncate">{r.notes}</span>}
                  </div>
                </div>

                {/* Date */}
                <div className="text-right flex-shrink-0">
                  <p className={`text-xs font-semibold ${
                    r.completed_date ? 'text-green-400' : isOverdue ? 'text-red-400' : isDueToday ? 'text-[#D74709]' : isDueSoon ? 'text-amber-400' : 'text-white/50'
                  }`}>
                    {r.completed_date
                      ? new Date(r.completed_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
                      : new Date(r.due_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })
                    }
                  </p>
                  <p className="text-[9px] text-white/20">
                    {r.completed_date ? 'Completado' : isOverdue ? 'Vencido' : isDueToday ? 'Hoy' : isDueSoon ? 'Próximo' : ''}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!r.completed_date && (
                    <button onClick={() => markCompleted(r.id)}
                      className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 hover:bg-green-500/20 transition"
                      title="Marcar como completado">
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => { setEditingReminder(r); setShowForm(true) }}
                    className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/30 hover:bg-white/10 hover:text-white/60 transition"
                    title="Editar">
                    <Calendar className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteReminder(r.id)}
                    className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20 hover:bg-red-500/10 hover:text-red-400 transition"
                    title="Eliminar">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Form panel */}
      <VetReminderForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditingReminder(null) }}
        onSaved={fetchReminders}
        initialData={editingReminder}
        dogs={dogs}
        templates={templates}
        userId={userId}
      />
    </div>
  )
}

/* ---- Dog search filter ---- */
function DogSearchFilter({ dogs, value, onChange, placeholder }: {
  dogs: any[]; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedDog = dogs.find(d => d.id === value)
  const filtered = dogs.filter(d => d.name.toLowerCase().includes(search.toLowerCase()))

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  useEffect(() => { if (open && inputRef.current) inputRef.current.focus() }, [open])

  return (
    <div ref={ref} className="relative">
      <button onClick={() => { setOpen(!open); setSearch('') }}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition ${
          value ? 'bg-[#D74709]/10 text-[#D74709] border-[#D74709]/20' : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'
        }`}>
        <Dog className="w-3.5 h-3.5" />
        {selectedDog ? selectedDog.name : (placeholder || 'Todos los perros')}
        {value && (
          <span onClick={e => { e.stopPropagation(); onChange(''); setOpen(false) }} className="ml-1 hover:text-white transition">
            <X className="w-3 h-3" />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-72 bg-gray-800 border border-white/10 rounded-lg shadow-xl z-30 flex flex-col">
          <div className="p-2 border-b border-white/5">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <input ref={inputRef} value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar perro..." className="w-full bg-white/5 border border-white/10 rounded pl-8 pr-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:border-[#D74709] focus:outline-none" />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto">
            <button onClick={() => { onChange(''); setOpen(false) }}
              className={`w-full text-left px-3 py-2 text-xs transition ${!value ? 'bg-[#D74709]/15 text-[#D74709]' : 'text-white/50 hover:bg-white/5'}`}>
              Todos los perros
            </button>
            {filtered.map(d => (
              <button key={d.id} onClick={() => { onChange(d.id); setOpen(false); setSearch('') }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition text-left ${
                  d.id === value ? 'bg-[#D74709]/15 text-[#D74709]' : 'text-white/60 hover:bg-white/5'
                }`}>
                <div className="w-5 h-5 rounded-full overflow-hidden bg-white/5 flex-shrink-0 border" style={{ borderColor: d.sex === 'male' ? BRAND.male : BRAND.female }}>
                  {d.thumbnail_url ? <img src={d.thumbnail_url} alt="" className="w-full h-full object-cover" /> : null}
                </div>
                <span className="truncate">{d.name}</span>
              </button>
            ))}
            {filtered.length === 0 && <p className="text-[10px] text-white/20 px-3 py-3 text-center">Sin resultados</p>}
          </div>
        </div>
      )}
    </div>
  )
}

/* ---- Auto-generate button with dog search ---- */
function AutoGenerateButton({ dogs, generatingFor, onGenerate }: {
  dogs: any[]; generatingFor: string | null; onGenerate: (dogId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = dogs.filter(d => d.name.toLowerCase().includes(search.toLowerCase()))

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  useEffect(() => { if (open && inputRef.current) inputRef.current.focus() }, [open])

  return (
    <div ref={ref} className="relative ml-auto">
      <button onClick={() => { setOpen(!open); setSearch('') }}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium hover:bg-purple-500/15 transition">
        <Sparkles className="w-3.5 h-3.5" /> Auto-generar
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-72 bg-gray-800 border border-white/10 rounded-lg shadow-xl z-30 flex flex-col">
          <p className="text-[10px] text-white/30 px-3 pt-2 pb-1">Busca un perro para generar recordatorios automáticos según su edad</p>
          <div className="p-2 border-b border-white/5">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <input ref={inputRef} value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar perro..." className="w-full bg-white/5 border border-white/10 rounded pl-8 pr-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:border-purple-500 focus:outline-none" />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.map(d => (
              <button key={d.id} onClick={() => { onGenerate(d.id); setOpen(false) }}
                disabled={generatingFor === d.id}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/60 hover:bg-white/5 transition text-left disabled:opacity-50">
                <div className="w-5 h-5 rounded-full overflow-hidden bg-white/5 flex-shrink-0 border" style={{ borderColor: d.sex === 'male' ? BRAND.male : BRAND.female }}>
                  {d.thumbnail_url ? <img src={d.thumbnail_url} alt="" className="w-full h-full object-cover" /> : null}
                </div>
                <span className="truncate flex-1">{d.name}</span>
                {generatingFor === d.id && <Loader2 className="w-3 h-3 animate-spin" />}
              </button>
            ))}
            {filtered.length === 0 && <p className="text-[10px] text-white/20 px-3 py-3 text-center">{dogs.length === 0 ? 'Tus perros necesitan fecha de nacimiento' : 'Sin resultados'}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
