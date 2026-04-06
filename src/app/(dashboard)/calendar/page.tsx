'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, ChevronRight, Plus, Check } from 'lucide-react'
import EventForm from '@/components/calendar/event-form'

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

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [selectedDate, setSelectedDate] = useState('')

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserId(user.id)

    const start = new Date(year, month, 1).toISOString()
    const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString()

    const { data } = await supabase
      .from('events')
      .select('id, title, event_type, start_date, end_date, all_day, is_completed, color, notes')
      .gte('start_date', start)
      .lte('start_date', end)
      .order('start_date')

    setEvents(data || [])
    setLoading(false)
  }, [year, month])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  const toggleCompleted = async (event: CalendarEvent) => {
    const supabase = createClient()
    const newValue = !event.is_completed
    await supabase.from('events').update({ is_completed: newValue }).eq('id', event.id)
    setEvents(prev => prev.map(e => e.id === event.id ? { ...e, is_completed: newValue } : e))
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const today = new Date()

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter((e) => e.start_date?.startsWith(dateStr))
  }

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setSelectedDate(dateStr)
    setEditingEvent(null)
    setShowForm(true)
  }

  const handleEventClick = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation()
    setEditingEvent(event)
    setSelectedDate('')
    setShowForm(true)
  }

  const handleNewEvent = () => {
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    setSelectedDate(todayStr)
    setEditingEvent(null)
    setShowForm(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Calendario</h1>
        <button
          onClick={handleNewEvent}
          className="bg-[#D74709] hover:bg-[#c03d07] text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> Nuevo evento
        </button>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setCurrentDate(new Date(year, month - 1))} className="text-white/50 hover:text-white transition p-2">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold">{monthNames[month]} {year}</h2>
        <button onClick={() => setCurrentDate(new Date(year, month + 1))} className="text-white/50 hover:text-white transition p-2">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="grid grid-cols-7">
          {['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'].map((d) => (
            <div key={d} className="py-3 text-center text-xs font-semibold text-white/40 border-b border-white/10">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: (firstDay + 6) % 7 }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[90px] border-b border-r border-white/5" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
            const dayEvents = getEventsForDay(day)
            return (
              <div
                key={day}
                className="min-h-[90px] border-b border-r border-white/5 p-1.5 cursor-pointer hover:bg-white/[0.03] transition"
                onClick={() => handleDayClick(day)}
              >
                <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-medium ${
                  isToday ? 'bg-[#D74709] text-white' : 'text-white/60'
                }`}>
                  {day}
                </span>
                <div className="mt-1 space-y-0.5">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <div
                      key={ev.id}
                      onClick={(e) => handleEventClick(e, ev)}
                      className={`flex items-center gap-1 px-1 py-0.5 rounded text-[10px] bg-white/5 hover:bg-white/10 transition cursor-pointer group ${
                        ev.is_completed ? 'opacity-50' : ''
                      }`}
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleCompleted(ev) }}
                        className={`w-3 h-3 rounded-sm border flex-shrink-0 flex items-center justify-center transition ${
                          ev.is_completed
                            ? 'bg-green-500 border-green-500'
                            : 'border-white/20 hover:border-white/40'
                        }`}
                      >
                        {ev.is_completed && <Check className="w-2 h-2 text-white" />}
                      </button>
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: ev.color || '#D74709' }} />
                      <span className={`truncate text-white/70 ${ev.is_completed ? 'line-through' : ''}`}>
                        {ev.title}
                      </span>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[10px] text-white/30 pl-1">+{dayEvents.length - 3}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Event type legend */}
      <div className="flex items-center gap-4 mt-4 flex-wrap">
        {[
          { label: 'Cria', color: '#9b59b6' },
          { label: 'Parto', color: '#e84393' },
          { label: 'Veterinario', color: '#3498db' },
          { label: 'Exposicion', color: '#f39c12' },
          { label: 'Salud', color: '#27ae60' },
          { label: 'Otro', color: '#95a5a6' },
        ].map((t) => (
          <div key={t.label} className="flex items-center gap-1.5 text-xs text-white/40">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
            {t.label}
          </div>
        ))}
      </div>

      {/* Event form modal */}
      {showForm && (
        <EventForm
          open={showForm}
          onClose={() => { setShowForm(false); setEditingEvent(null) }}
          onSaved={fetchEvents}
          initialData={editingEvent}
          defaultDate={selectedDate}
          userId={userId}
        />
      )}
    </div>
  )
}
