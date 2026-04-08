'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, ChevronRight, Plus, Check, Clock, MapPin } from 'lucide-react'
import EventForm from '@/components/calendar/event-form'
import VetReminderForm from '@/components/vet/vet-reminder-form'

interface CalendarEvent {
  id: string
  title: string
  event_type: string
  start_date: string
  end_date: string | null
  all_day: boolean
  is_completed: boolean
  color: string | null
  notes: string | null
}

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const DAY_INITIALS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [defaultDate, setDefaultDate] = useState('')
  const [vetFormOpen, setVetFormOpen] = useState(false)
  const [vetReminderId, setVetReminderId] = useState('')

  // Swipe
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  const today = new Date()
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const formatDateStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const isToday = (d: Date) => d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
  const isSameDay = (a: Date, b: Date) => a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
  const isSelected = (d: Date) => isSameDay(d, selectedDate)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserId(user.id)

    const start = new Date(year, month - 1, 1).toISOString()
    const end = new Date(year, month + 2, 0, 23, 59, 59).toISOString()

    const [eventsRes, vetRes] = await Promise.all([
      supabase
        .from('events')
        .select('id, title, event_type, start_date, end_date, all_day, is_completed, color, notes')
        .gte('start_date', start)
        .lte('start_date', end)
        .order('start_date'),
      supabase
        .from('vet_reminders')
        .select('id, title, type, due_date, completed_date, dog:dogs(name)')
        .eq('owner_id', user!.id)
        .is('completed_date', null)
        .gte('due_date', start.split('T')[0])
        .lte('due_date', end.split('T')[0])
        .order('due_date'),
    ])

    const vetAsEvents: CalendarEvent[] = (vetRes.data || []).map((r: any) => ({
      id: `vet-${r.id}`,
      title: `🩺 ${r.title}${r.dog?.name ? ` — ${r.dog.name}` : ''}`,
      event_type: 'vet',
      start_date: `${r.due_date}T09:00:00`,
      end_date: null,
      all_day: true,
      is_completed: false,
      color: r.type === 'vaccine' ? '#10B981' : r.type === 'deworming' ? '#F59E0B' : '#3498db',
      notes: null,
    }))

    setEvents([...(eventsRes.data || []), ...vetAsEvents])
    setLoading(false)
  }, [year, month])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  const toggleCompleted = async (event: CalendarEvent) => {
    if (event.id.startsWith('vet-')) return
    const supabase = createClient()
    const newValue = !event.is_completed
    await supabase.from('events').update({ is_completed: newValue }).eq('id', event.id)
    setEvents(prev => prev.map(e => e.id === event.id ? { ...e, is_completed: newValue } : e))
  }

  // Navigation
  const goToMonth = (dir: number) => setCurrentDate(new Date(year, month + dir))
  const goToday = () => { setCurrentDate(new Date()); setSelectedDate(new Date()) }

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX }
  const handleTouchMove = (e: React.TouchEvent) => { touchEndX.current = e.touches[0].clientX }
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current
    if (Math.abs(diff) > 50) {
      goToMonth(diff > 0 ? 1 : -1)
    }
  }

  // Calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPad = (firstDay.getDay() + 6) % 7
    const days: (Date | null)[] = []
    for (let i = 0; i < startPad; i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d))
    // Pad end to complete last row
    while (days.length % 7 !== 0) days.push(null)
    return days
  }, [year, month])

  // Events for a specific date
  const getEventsForDate = (d: Date) => events.filter(e => e.start_date?.startsWith(formatDateStr(d)))

  // Dates that have events (for dots)
  const eventDates = useMemo(() => {
    const set = new Set<string>()
    events.forEach(e => { if (e.start_date) set.add(e.start_date.slice(0, 10)) })
    return set
  }, [events])

  // Selected day events
  const selectedEvents = useMemo(() => {
    return getEventsForDate(selectedDate).sort((a, b) => {
      if (a.all_day && !b.all_day) return -1
      if (!a.all_day && b.all_day) return 1
      return a.start_date.localeCompare(b.start_date)
    })
  }, [selectedDate, events])

  const handleDayClick = (d: Date) => {
    setSelectedDate(d)
  }

  const handleEventClick = (event: CalendarEvent) => {
    if (event.id.startsWith('vet-')) {
      setVetReminderId(event.id.replace('vet-', ''))
      setVetFormOpen(true)
      return
    }
    setEditingEvent(event)
    setDefaultDate('')
    setShowForm(true)
  }

  const handleNewEvent = () => {
    setDefaultDate(formatDateStr(selectedDate))
    setEditingEvent(null)
    setShowForm(true)
  }

  const selectedDateLabel = useMemo(() => {
    const d = selectedDate
    if (isToday(d)) return 'Hoy'
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    return `${days[d.getDay()]}, ${d.getDate()} de ${MONTH_NAMES[d.getMonth()]}`
  }, [selectedDate])

  return (
    <div>
      {/* Month header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          <button onClick={() => goToMonth(-1)} className="text-white/50 hover:text-white transition p-2"><ChevronLeft className="w-5 h-5" /></button>
          <h2 className="text-lg font-bold min-w-[180px] text-center">{MONTH_NAMES[month]} {year}</h2>
          <button onClick={() => goToMonth(1)} className="text-white/50 hover:text-white transition p-2"><ChevronRight className="w-5 h-5" /></button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={goToday} className="text-xs text-white/50 hover:text-white bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 transition">Hoy</button>
          <button onClick={handleNewEvent} className="bg-[#D74709] hover:bg-[#c03d07] text-white p-2 rounded-full transition">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Compact calendar grid */}
      <div
        className="mb-4"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Day initials */}
        <div className="grid grid-cols-7 mb-2">
          {DAY_INITIALS.map(d => (
            <div key={d} className="text-center text-[11px] font-semibold text-white/40">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-y-1">
          {calendarDays.map((day, i) => {
            if (!day) return <div key={`pad-${i}`} />
            const hasEvents = eventDates.has(formatDateStr(day))
            const todayDay = isToday(day)
            const selected = isSelected(day)
            const isCurrentMonth = day.getMonth() === month

            return (
              <button
                key={i}
                onClick={() => handleDayClick(day)}
                className="flex flex-col items-center py-1 transition"
              >
                <span className={`
                  w-9 h-9 flex items-center justify-center rounded-full text-sm font-medium transition
                  ${selected ? 'bg-[#D74709] text-white' : todayDay ? 'text-[#D74709] font-bold' : isCurrentMonth ? 'text-white/80' : 'text-white/20'}
                  ${!selected ? 'hover:bg-white/10' : ''}
                `}>
                  {day.getDate()}
                </span>
                {/* Event indicator dot */}
                <div className="h-1.5 flex items-center justify-center mt-0.5">
                  {hasEvents && !selected && (
                    <div className="w-1 h-1 rounded-full bg-[#D74709]" />
                  )}
                  {hasEvents && selected && (
                    <div className="w-1 h-1 rounded-full bg-white" />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/10 mb-4" />

      {/* Selected day events */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white/70">{selectedDateLabel}</h3>
          {selectedEvents.length > 0 && (
            <span className="text-xs text-white/30">{selectedEvents.length} evento{selectedEvents.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8 text-white/30 text-sm">Cargando eventos...</div>
        ) : selectedEvents.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-white/30 text-sm mb-3">Sin eventos</p>
            <button onClick={handleNewEvent} className="text-[#D74709] text-sm font-medium hover:underline">
              + Añadir evento
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedEvents.map(ev => (
              <div
                key={ev.id}
                onClick={() => handleEventClick(ev)}
                className={`flex items-start gap-3 p-3 rounded-xl transition cursor-pointer ${ev.is_completed ? 'opacity-50' : ''} bg-white/[0.04] border border-white/10 hover:border-white/20`}
              >
                {/* Color bar */}
                <div className="w-1 self-stretch rounded-full flex-shrink-0 mt-0.5" style={{ background: ev.color || '#D74709' }} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${ev.is_completed ? 'line-through text-white/40' : ''}`}>{ev.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {ev.all_day ? (
                      <span className="text-[11px] text-white/40">Todo el día</span>
                    ) : (
                      <span className="text-[11px] text-white/40 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(ev.start_date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        {ev.end_date && ` - ${new Date(ev.end_date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Completion checkbox */}
                {!ev.id.startsWith('vet-') && (
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleCompleted(ev) }}
                    className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center transition mt-0.5 ${ev.is_completed ? 'bg-green-500' : 'border-2 border-white/20 hover:border-white/40'}`}
                  >
                    {ev.is_completed && <Check className="w-3 h-3 text-white" />}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-6 flex-wrap">
        {[
          { label: 'Cría', color: '#9b59b6' },
          { label: 'Parto', color: '#e84393' },
          { label: 'Vet', color: '#3498db' },
          { label: 'Expo', color: '#f39c12' },
          { label: 'Salud', color: '#27ae60' },
          { label: 'Otro', color: '#95a5a6' },
        ].map(t => (
          <div key={t.label} className="flex items-center gap-1.5 text-[11px] text-white/40">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
            {t.label}
          </div>
        ))}
      </div>

      {showForm && (
        <EventForm
          open={showForm}
          onClose={() => { setShowForm(false); setEditingEvent(null) }}
          onSaved={fetchEvents}
          initialData={editingEvent}
          defaultDate={defaultDate}
          userId={userId}
        />
      )}

      <VetReminderForm
        open={vetFormOpen}
        onClose={() => { setVetFormOpen(false); setVetReminderId('') }}
        onSaved={fetchEvents}
        reminderId={vetReminderId}
      />
    </div>
  )
}
