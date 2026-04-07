'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, ChevronRight, Plus, Check, Calendar as CalendarIcon } from 'lucide-react'
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

type ViewMode = 'month' | 'week' | 'day'

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const DAY_NAMES = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']
const DAY_NAMES_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<ViewMode>('month')
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [selectedDate, setSelectedDate] = useState('')

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const today = new Date()

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserId(user.id)

    // Fetch a wider range for week/day views
    const start = new Date(year, month - 1, 1).toISOString()
    const end = new Date(year, month + 2, 0, 23, 59, 59).toISOString()

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

  // Navigation
  const navigate = (dir: number) => {
    if (view === 'month') setCurrentDate(new Date(year, month + dir))
    else if (view === 'week') setCurrentDate(new Date(currentDate.getTime() + dir * 7 * 86400000))
    else setCurrentDate(new Date(currentDate.getTime() + dir * 86400000))
  }

  const goToday = () => setCurrentDate(new Date())

  // Week helpers
  const weekStart = useMemo(() => {
    const d = new Date(currentDate)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }, [currentDate])

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [weekStart])

  // Header title
  const headerTitle = useMemo(() => {
    if (view === 'month') return `${MONTH_NAMES[month]} ${year}`
    if (view === 'week') {
      const end = new Date(weekStart)
      end.setDate(end.getDate() + 6)
      const fmt = (d: Date) => `${d.getDate()} ${MONTH_NAMES[d.getMonth()].slice(0, 3)}`
      return `${fmt(weekStart)} - ${fmt(end)} ${end.getFullYear()}`
    }
    return `${DAY_NAMES_FULL[(currentDate.getDay() + 6) % 7]}, ${currentDate.getDate()} ${MONTH_NAMES[currentDate.getMonth()]} ${year}`
  }, [view, month, year, weekStart, currentDate])

  const getEventsForDate = (dateStr: string) => events.filter(e => e.start_date?.startsWith(dateStr))
  const formatDateStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const isToday = (d: Date) => d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()

  const handleDayClick = (dateStr: string) => { setSelectedDate(dateStr); setEditingEvent(null); setShowForm(true) }
  const handleEventClick = (e: React.MouseEvent, event: CalendarEvent) => { e.stopPropagation(); setEditingEvent(event); setSelectedDate(''); setShowForm(true) }
  const handleNewEvent = () => { setSelectedDate(formatDateStr(today)); setEditingEvent(null); setShowForm(true) }

  // Event dot component
  const EventDot = ({ ev, compact }: { ev: CalendarEvent; compact?: boolean }) => (
    <div
      onClick={(e) => handleEventClick(e, ev)}
      className={`flex items-center gap-1 px-1 py-0.5 rounded text-[10px] bg-white/5 hover:bg-white/10 transition cursor-pointer ${ev.is_completed ? 'opacity-50' : ''}`}
    >
      <button
        onClick={(e) => { e.stopPropagation(); toggleCompleted(ev) }}
        className={`w-3 h-3 rounded-sm border flex-shrink-0 flex items-center justify-center transition ${ev.is_completed ? 'bg-green-500 border-green-500' : 'border-white/20 hover:border-white/40'}`}
      >
        {ev.is_completed && <Check className="w-2 h-2 text-white" />}
      </button>
      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: ev.color || '#D74709' }} />
      <span className={`truncate text-white/70 ${ev.is_completed ? 'line-through' : ''}`}>
        {!compact && !ev.all_day && ev.start_date && <span className="text-white/30 mr-1">{new Date(ev.start_date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>}
        {ev.title}
      </span>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Calendario</h1>
        <button onClick={handleNewEvent} className="bg-[#D74709] hover:bg-[#c03d07] text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition">
          <Plus className="w-4 h-4" /> Nuevo evento
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="text-white/50 hover:text-white transition p-2"><ChevronLeft className="w-5 h-5" /></button>
          <h2 className="text-lg font-semibold min-w-[240px] text-center">{headerTitle}</h2>
          <button onClick={() => navigate(1)} className="text-white/50 hover:text-white transition p-2"><ChevronRight className="w-5 h-5" /></button>
          <button onClick={goToday} className="text-xs text-white/40 hover:text-white bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 ml-2 transition">Hoy</button>
        </div>
        <div className="flex bg-white/5 border border-white/10 rounded-lg overflow-hidden">
          {(['month', 'week', 'day'] as ViewMode[]).map(v => (
            <button key={v} onClick={() => setView(v)} className={`px-4 py-1.5 text-xs font-medium transition ${view === v ? 'bg-[#D74709] text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
              {v === 'month' ? 'Mes' : v === 'week' ? 'Semana' : 'Dia'}
            </button>
          ))}
        </div>
      </div>

      {/* === MONTH VIEW === */}
      {view === 'month' && (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="grid grid-cols-7">
            {DAY_NAMES.map(d => <div key={d} className="py-3 text-center text-xs font-semibold text-white/40 border-b border-white/10">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: (new Date(year, month, 1).getDay() + 6) % 7 }).map((_, i) => (
              <div key={`e-${i}`} className="min-h-[90px] border-b border-r border-white/5" />
            ))}
            {Array.from({ length: new Date(year, month + 1, 0).getDate() }).map((_, i) => {
              const day = i + 1
              const dateStr = formatDateStr(new Date(year, month, day))
              const dayEvents = getEventsForDate(dateStr)
              return (
                <div key={day} className="min-h-[90px] border-b border-r border-white/5 p-1.5 cursor-pointer hover:bg-white/[0.03] transition" onClick={() => handleDayClick(dateStr)}>
                  <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-medium ${isToday(new Date(year, month, day)) ? 'bg-[#D74709] text-white' : 'text-white/60'}`}>{day}</span>
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 3).map(ev => <EventDot key={ev.id} ev={ev} compact />)}
                    {dayEvents.length > 3 && <span className="text-[10px] text-white/30 pl-1">+{dayEvents.length - 3}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* === WEEK VIEW === */}
      {view === 'week' && (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)]">
            <div className="border-b border-r border-white/10 py-3" />
            {weekDays.map((d, i) => (
              <div key={i} className={`py-3 text-center border-b border-white/10 ${isToday(d) ? 'bg-[#D74709]/10' : ''}`}>
                <p className="text-[10px] text-white/40 uppercase">{DAY_NAMES[i]}</p>
                <p className={`text-sm font-bold ${isToday(d) ? 'text-[#D74709]' : 'text-white/70'}`}>{d.getDate()}</p>
              </div>
            ))}
          </div>
          {/* Time slots */}
          <div className="max-h-[60vh] overflow-y-auto">
            {HOURS.map(h => (
              <div key={h} className="grid grid-cols-[60px_repeat(7,1fr)] min-h-[48px]">
                <div className="border-r border-b border-white/5 pr-2 pt-1 text-right">
                  <span className="text-[10px] text-white/25">{String(h).padStart(2, '0')}:00</span>
                </div>
                {weekDays.map((d, di) => {
                  const dateStr = formatDateStr(d)
                  const hourEvents = events.filter(e => {
                    if (!e.start_date?.startsWith(dateStr)) return false
                    const eHour = new Date(e.start_date).getHours()
                    return e.all_day ? h === 0 : eHour === h
                  })
                  return (
                    <div
                      key={di}
                      className={`border-b border-r border-white/5 p-0.5 cursor-pointer hover:bg-white/[0.03] transition ${isToday(d) ? 'bg-[#D74709]/[0.02]' : ''}`}
                      onClick={() => handleDayClick(dateStr)}
                    >
                      {hourEvents.map(ev => (
                        <div
                          key={ev.id}
                          onClick={e => handleEventClick(e, ev)}
                          className="text-[10px] px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
                          style={{ background: (ev.color || '#D74709') + '25', color: ev.color || '#D74709', borderLeft: `2px solid ${ev.color || '#D74709'}` }}
                        >
                          {ev.title}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === DAY VIEW === */}
      {view === 'day' && (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="max-h-[70vh] overflow-y-auto">
            {/* All-day events */}
            {(() => {
              const dateStr = formatDateStr(currentDate)
              const allDayEvs = events.filter(e => e.start_date?.startsWith(dateStr) && e.all_day)
              if (allDayEvs.length === 0) return null
              return (
                <div className="px-4 py-2 border-b border-white/10 bg-white/[0.02]">
                  <p className="text-[10px] text-white/30 mb-1">TODO EL DIA</p>
                  <div className="space-y-1">
                    {allDayEvs.map(ev => <EventDot key={ev.id} ev={ev} />)}
                  </div>
                </div>
              )
            })()}

            {/* Hourly slots */}
            {HOURS.map(h => {
              const dateStr = formatDateStr(currentDate)
              const hourEvents = events.filter(e => {
                if (!e.start_date?.startsWith(dateStr) || e.all_day) return false
                return new Date(e.start_date).getHours() === h
              })
              return (
                <div key={h} className="flex min-h-[56px] border-b border-white/5">
                  <div className="w-16 flex-shrink-0 pr-3 pt-2 text-right border-r border-white/5">
                    <span className="text-xs text-white/25">{String(h).padStart(2, '0')}:00</span>
                  </div>
                  <div
                    className="flex-1 p-1 cursor-pointer hover:bg-white/[0.03] transition"
                    onClick={() => handleDayClick(dateStr)}
                  >
                    {hourEvents.map(ev => (
                      <div
                        key={ev.id}
                        onClick={e => handleEventClick(e, ev)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg mb-1 cursor-pointer hover:opacity-80 transition"
                        style={{ background: (ev.color || '#D74709') + '15', borderLeft: `3px solid ${ev.color || '#D74709'}` }}
                      >
                        <div>
                          <p className="text-sm font-medium">{ev.title}</p>
                          <p className="text-[11px] text-white/40">
                            {new Date(ev.start_date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                            {ev.end_date && ` - ${new Date(ev.end_date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 flex-wrap">
        {[
          { label: 'Cria', color: '#9b59b6' },
          { label: 'Parto', color: '#e84393' },
          { label: 'Veterinario', color: '#3498db' },
          { label: 'Exposicion', color: '#f39c12' },
          { label: 'Salud', color: '#27ae60' },
          { label: 'Otro', color: '#95a5a6' },
        ].map(t => (
          <div key={t.label} className="flex items-center gap-1.5 text-xs text-white/40">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} /> {t.label}
          </div>
        ))}
      </div>

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
