'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Img } from '@/components/ui/img'
import { createClient } from '@/lib/supabase/client'
import { Stethoscope, Plus, Check, Clock, AlertTriangle, Syringe, Bug, Search as SearchIcon, Filter, Dog, X, Loader2, Sparkles, Calendar } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import { useT } from '@/components/i18n/locale-provider'
import VetReminderForm from './vet-reminder-form'

interface Props {
  initialReminders: any[]
  dogs: any[]
  templates: any[]
  userId: string
}

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  vaccine: { label: 'Vacuna', color: '#34d399', icon: Syringe },
  deworming: { label: 'Desparasitación', color: '#f59e0b', icon: Bug },
  checkup: { label: 'Revisión', color: '#3b82f6', icon: Stethoscope },
  custom: { label: 'Personalizado', color: '#8b5cf6', icon: Calendar },
}

export default function VetRemindersClient({ initialReminders, dogs, templates, userId }: Props) {
  const t = useT()
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
    const applicable = templates.filter(tpl => {
      if (tpl.applies_to === 'puppy' && !isPuppy) return false
      if (tpl.applies_to === 'adult' && isPuppy) return false
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

  const stats = [
    { label: t('Total'), value: reminders.length, icon: Stethoscope, color: '#3b82f6' },
    { label: t('Pendientes'), value: pendingCount, icon: Clock, color: '#f59e0b' },
    { label: t('Vencidos'), value: overdueCount, icon: AlertTriangle, color: '#ef4444' },
    { label: t('Completados'), value: reminders.filter(r => r.completed_date).length, icon: Check, color: '#34d399' },
  ]

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">{t('Salud')}</p>
          <h1 className="mt-1.5 text-[32px] sm:text-[40px] font-semibold leading-[1.1] tracking-[-0.04em] text-ink">
            {t('Recordatorios vet.')}
          </h1>
          <p className="mt-2 text-[14px] text-body">
            {t('Vacunas, desparasitaciones y revisiones de tus perros.')}
          </p>
        </div>
        <button
          onClick={() => { setEditingReminder(null); setShowForm(true) }}
          className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-[13px] font-medium text-on-primary transition-colors hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> {t('Recordatorio')}
        </button>
      </div>

      {/* KPIs */}
      <section className="grid gap-3 grid-cols-2 sm:grid-cols-4 sm:gap-4">
        {stats.map(s => (
          <div key={s.label} className="rounded-xl border border-hairline bg-canvas p-4">
            <div className="flex items-center gap-2">
              <s.icon className="h-4 w-4" style={{ color: s.color }} />
              <span className="text-[12px] font-medium text-muted">{s.label}</span>
            </div>
            <p className="mt-3 text-[24px] font-semibold tabular-nums tracking-[-0.04em] text-ink leading-none">
              {s.value}
            </p>
          </div>
        ))}
      </section>

      {/* Filters + Dog search + Auto-generate */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex gap-1 rounded-lg bg-surface-card p-1">
          {[
            { key: 'pending', label: t('Pendientes') },
            { key: 'overdue', label: t('Vencidos') },
            { key: 'completed', label: t('Completados') },
            { key: 'all', label: t('Todos') },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as any)}
              className={`rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                filter === f.key ? 'bg-canvas text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)]' : 'text-muted hover:text-ink'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Dog filter with search */}
        <DogSearchFilter
          dogs={dogs}
          value={dogFilter}
          onChange={setDogFilter}
          placeholder={t('Filtrar por perro...')}
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
        <div className="rounded-xl border border-dashed border-hairline bg-surface-soft px-6 py-16 text-center">
          <Stethoscope className="mx-auto h-10 w-10 text-muted" />
          <p className="mt-3 text-[14px] text-body">
            {t('No hay recordatorios')} {filter !== 'all' ? t('en esta categoría') : t('todavía')}.
          </p>
          <p className="text-[12.5px] text-muted">{t('Añade uno o usa auto-generar.')}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-hairline bg-canvas">
          <ul className="divide-y divide-hairline-soft">
            {filtered.map(r => {
              const dog = r.dog as any
              const typeConf = TYPE_CONFIG[r.type] || TYPE_CONFIG.custom
              const TypeIcon = typeConf.icon
              const isOverdue = !r.completed_date && r.due_date < today
              const isDueToday = r.due_date === today
              const isDueSoon = !r.completed_date && !isOverdue && !isDueToday && r.due_date <= new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
              const sexColor = dog?.sex === 'male' ? BRAND.male : BRAND.female

              return (
                <li
                  key={r.id}
                  className={`flex flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-soft sm:flex-nowrap sm:px-5 ${
                    r.completed_date ? 'opacity-60' : ''
                  }`}
                >
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: typeConf.color }}
                  >
                    <TypeIcon className="h-4 w-4 text-white" />
                  </div>

                  <div className="flex min-w-0 flex-shrink-0 items-center gap-2 sm:min-w-[150px]">
                    <div
                      className="h-7 w-7 flex-shrink-0 overflow-hidden rounded-full border-2 bg-surface-card"
                      style={{ borderColor: sexColor }}
                    >
                      {dog?.thumbnail_url ? <Img w={200} src={dog.thumbnail_url} alt="" className="h-full w-full object-cover" /> : null}
                    </div>
                    <span className="truncate text-[13px] font-medium text-ink">{dog?.name || '?'}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium text-ink">{r.title}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-[11.5px] text-muted">
                      <span
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                        style={{ backgroundColor: typeConf.color + '18', color: typeConf.color }}
                      >
                        {t(typeConf.label)}
                      </span>
                      {r.auto_generated && <span className="text-[#8b5cf6]">{t('Auto')}</span>}
                      {r.recurrence_days && <span>↻ {t('cada')} {r.recurrence_days}d</span>}
                      {r.notes && <span className="truncate">{r.notes}</span>}
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <p className={`text-[13px] font-medium tabular-nums ${
                      r.completed_date
                        ? 'text-[color:var(--success)]'
                        : isOverdue
                          ? 'text-[color:var(--error)]'
                          : isDueToday
                            ? 'text-ink'
                            : isDueSoon
                              ? 'text-[color:var(--warning)]'
                              : 'text-body'
                    }`}>
                      {r.completed_date
                        ? new Date(r.completed_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
                        : new Date(r.due_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })
                      }
                    </p>
                    <p className="text-[10.5px] text-muted">
                      {r.completed_date ? t('Completado') : isOverdue ? t('Vencido') : isDueToday ? t('Hoy') : isDueSoon ? t('Próximo') : ''}
                    </p>
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-1">
                    {!r.completed_date && (
                      <button
                        onClick={() => markCompleted(r.id)}
                        title={t('Marcar como completado')}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[color:var(--success)]/10 text-[color:var(--success)] transition-colors hover:bg-[color:var(--success)]/15"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => { setEditingReminder(r); setShowForm(true) }}
                      title={t('Editar')}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-hairline bg-canvas text-muted transition-colors hover:bg-surface-card hover:text-ink"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => deleteReminder(r.id)}
                      title={t('Eliminar')}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-hairline bg-canvas text-muted transition-colors hover:bg-surface-soft hover:text-[color:var(--error)]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
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
  const t = useT()
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
          value ? 'bg-surface-card text-ink border-hairline' : 'bg-surface-card text-body border-hairline hover:bg-surface-card'
        }`}>
        <Dog className="w-3.5 h-3.5" />
        {selectedDog ? selectedDog.name : (placeholder || t('Todos los perros'))}
        {value && (
          <span onClick={e => { e.stopPropagation(); onChange(''); setOpen(false) }} className="ml-1 hover:text-ink transition">
            <X className="w-3 h-3" />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-72 bg-surface-card border border-hairline rounded-lg shadow-xl z-30 flex flex-col">
          <div className="p-2 border-b border-hairline">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
              <input ref={inputRef} value={search} onChange={e => setSearch(e.target.value)}
                placeholder={t('Buscar perro...')} className="w-full bg-canvas border border-hairline rounded pl-8 pr-3 py-1.5 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none" />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto">
            <button onClick={() => { onChange(''); setOpen(false) }}
              className={`w-full text-left px-3 py-2 text-xs transition ${!value ? 'bg-surface-card text-ink' : 'text-body hover:bg-surface-card'}`}>
              {t('Todos los perros')}
            </button>
            {filtered.map(d => (
              <button key={d.id} onClick={() => { onChange(d.id); setOpen(false); setSearch('') }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition text-left ${
                  d.id === value ? 'bg-surface-card text-ink' : 'text-body hover:bg-surface-card'
                }`}>
                <div className="w-5 h-5 rounded-full overflow-hidden bg-surface-card flex-shrink-0 border" style={{ borderColor: d.sex === 'male' ? BRAND.male : BRAND.female }}>
                  {d.thumbnail_url ? <Img w={200} src={d.thumbnail_url} alt="" className="w-full h-full object-cover" /> : null}
                </div>
                <span className="truncate">{d.name}</span>
              </button>
            ))}
            {filtered.length === 0 && <p className="text-[10px] text-muted px-3 py-3 text-center">{t('Sin resultados')}</p>}
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
  const t = useT()
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
        <Sparkles className="w-3.5 h-3.5" /> {t('Auto-generar')}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-72 bg-surface-card border border-hairline rounded-lg shadow-xl z-30 flex flex-col">
          <p className="text-[10px] text-muted px-3 pt-2 pb-1">{t('Busca un perro para generar recordatorios automáticos según su edad')}</p>
          <div className="p-2 border-b border-hairline">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
              <input ref={inputRef} value={search} onChange={e => setSearch(e.target.value)}
                placeholder={t('Buscar perro...')} className="w-full bg-canvas border border-hairline rounded pl-8 pr-3 py-1.5 text-sm text-ink placeholder:text-muted focus:border-purple-500 focus:outline-none" />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.map(d => (
              <button key={d.id} onClick={() => { onGenerate(d.id); setOpen(false) }}
                disabled={generatingFor === d.id}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-body hover:bg-surface-card transition text-left disabled:opacity-50">
                <div className="w-5 h-5 rounded-full overflow-hidden bg-surface-card flex-shrink-0 border" style={{ borderColor: d.sex === 'male' ? BRAND.male : BRAND.female }}>
                  {d.thumbnail_url ? <Img w={200} src={d.thumbnail_url} alt="" className="w-full h-full object-cover" /> : null}
                </div>
                <span className="truncate flex-1">{d.name}</span>
                {generatingFor === d.id && <Loader2 className="w-3 h-3 animate-spin" />}
              </button>
            ))}
            {filtered.length === 0 && <p className="text-[10px] text-muted px-3 py-3 text-center">{dogs.length === 0 ? t('Tus perros necesitan fecha de nacimiento') : t('Sin resultados')}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
