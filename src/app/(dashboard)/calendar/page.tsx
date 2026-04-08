'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, ChevronRight, Plus, Check, Clock, X } from 'lucide-react'
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

type ViewMode = 'month' | 'week' | 'day'

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const DAY_NAMES = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']
const DAY_NAMES_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const DAY_NAMES_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [view, setView] = useState<ViewMode>('month')
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [formDefaultDate, setFormDefaultDate] = useState('')
  const [vetFormOpen, setVetFormOpen] = useState(false)
  const [vetReminderId, setVetReminderId] = useState('')

  // Mobile day panel
  const [dayPanelOpen, setDayPanelOpen] = useState(false)
  const [dayPanelDate, setDayPanelDate] = useState(new Date())

  // Swipe
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const swiping = useRef(false)

  const today = new Date()
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const formatDateStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const isToday = (d: Date) => d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
  const isSameDay = (a: Date, b: Date) => a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()

  // ─── Data fetching ───
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

  // ─── Navigation ───
  const navigate = (dir: number) => {
    if (view === 'month') setCurrentDate(new Date(year, month + dir))
    else if (view === 'week') setCurrentDate(new Date(currentDate.getTime() + dir * 7 * 86400000))
    else setCurrentDate(new Date(currentDate.getTime() + dir * 86400000))
  }
  const goToMonth = (dir: number) => setCurrentDate(new Date(year, month + dir))
  const goToday = () => { setCurrentDate(new Date()); setSelectedDate(new Date()) }

  // Swipe refs kept for potential future use but no swipe — month change via arrows only

  // ─── Week helpers (desktop) ───
  const weekStart = useMemo(() => {
    const d = new Date(currentDate)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }, [currentDate])

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i); return d
  }), [weekStart])

  const headerTitle = useMemo(() => {
    if (view === 'month') return `${MONTH_NAMES[month]} ${year}`
    if (view === 'week') {
      const end = new Date(weekStart); end.setDate(end.getDate() + 6)
      const fmt = (d: Date) => `${d.getDate()} ${MONTH_NAMES[d.getMonth()].slice(0, 3)}`
      return `${fmt(weekStart)} - ${fmt(end)} ${end.getFullYear()}`
    }
    return `${DAY_NAMES_FULL[(currentDate.getDay() + 6) % 7]}, ${currentDate.getDate()} ${MONTH_NAMES[currentDate.getMonth()]} ${year}`
  }, [view, month, year, weekStart, currentDate])

  // ─── Calendar grid (mobile) ───
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPad = (firstDay.getDay() + 6) % 7
    const days: (Date | null)[] = []
    for (let i = 0; i < startPad; i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d))
    while (days.length % 7 !== 0) days.push(null)
    return days
  }, [year, month])

  const eventDates = useMemo(() => {
    const set = new Set<string>()
    events.forEach(e => { if (e.start_date) set.add(e.start_date.slice(0, 10)) })
    return set
  }, [events])

  const getEventsForDate = (dateStr: string) => events.filter(e => e.start_date?.startsWith(dateStr))

  const dayPanelEvents = useMemo(() => {
    return getEventsForDate(formatDateStr(dayPanelDate)).sort((a, b) => {
      if (a.all_day && !b.all_day) return -1
      if (!a.all_day && b.all_day) return 1
      return a.start_date.localeCompare(b.start_date)
    })
  }, [dayPanelDate, events])

  // ─── Handlers ───
  const handleMobileDayClick = (d: Date) => {
    setSelectedDate(d)
    setDayPanelDate(d)
    setDayPanelOpen(true)
  }

  const handleDesktopDayClick = (dateStr: string) => {
    setFormDefaultDate(dateStr)
    setEditingEvent(null)
    setShowForm(true)
  }

  const handleEventClick = (event: CalendarEvent, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (event.id.startsWith('vet-')) {
      setVetReminderId(event.id.replace('vet-', ''))
      setVetFormOpen(true)
      return
    }
    setEditingEvent(event)
    setFormDefaultDate('')
    setShowForm(true)
    setDayPanelOpen(false)
  }

  const handleNewEvent = (date?: Date) => {
    setFormDefaultDate(formatDateStr(date || selectedDate))
    setEditingEvent(null)
    setShowForm(true)
    setDayPanelOpen(false)
  }

  // Desktop EventDot
  const EventDot = ({ ev, compact }: { ev: CalendarEvent; compact?: boolean }) => (
    <div
      onClick={(e) => handleEventClick(ev, e)}
      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs bg-white/5 hover:bg-white/10 transition cursor-pointer ${ev.is_completed ? 'opacity-50' : ''}`}
    >
      <button
        onClick={(e) => { e.stopPropagation(); toggleCompleted(ev) }}
        className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center transition ${ev.is_completed ? 'bg-green-500 border-green-500' : 'border border-white/20 hover:border-white/40'}`}
      >
        {ev.is_completed && <Check className="w-2.5 h-2.5 text-white" />}
      </button>
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ev.color || '#D74709' }} />
      <span className={`truncate text-white/70 ${ev.is_completed ? 'line-through' : ''}`}>
        {!compact && !ev.all_day && ev.start_date && <span className="text-white/30 mr-1">{new Date(ev.start_date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>}
        {ev.title}
      </span>
    </div>
  )

  const dayPanelLabel = useMemo(() => {
    const d = dayPanelDate
    if (isToday(d)) return 'Hoy'
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    return `${days[d.getDay()]}, ${d.getDate()} de ${MONTH_NAMES[d.getMonth()]}`
  }, [dayPanelDate])

  // ─── LEGEND ───
  const Legend = () => (
    <div className="flex items-center gap-2 lg:gap-4 mt-3 lg:mt-4 flex-wrap">
      {[
        { label: 'Cría', color: '#9b59b6' },
        { label: 'Parto', color: '#e84393' },
        { label: 'Vet', labelFull: 'Veterinario', color: '#3498db' },
        { label: 'Expo', labelFull: 'Exposición', color: '#f39c12' },
        { label: 'Salud', color: '#27ae60' },
        { label: 'Otro', color: '#95a5a6' },
      ].map(t => (
        <div key={t.label} className="flex items-center gap-1 lg:gap-1.5 text-[10px] lg:text-xs text-white/40">
          <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full" style={{ backgroundColor: t.color }} />
          <span className="hidden lg:inline">{'labelFull' in t ? t.labelFull : t.label}</span>
          <span className="lg:hidden">{t.label}</span>
        </div>
      ))}
    </div>
  )

  return (
    <div>
      {/* ═══════════════════════════════════════════ */}
      {/* ═══  MOBILE VIEW (< lg)  ═══════════════ */}
      {/* ═══════════════════════════════════════════ */}
      <div className="lg:hidden flex flex-col" style={{ minHeight: 'calc(100vh - 120px)' }}>
        {/* Month header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <button onClick={() => goToMonth(-1)} className="text-white/50 hover:text-white transition p-1.5"><ChevronLeft className="w-5 h-5" /></button>
            <h2 className="text-base font-bold min-w-[160px] text-center">{MONTH_NAMES[month]} {year}</h2>
            <button onClick={() => goToMonth(1)} className="text-white/50 hover:text-white transition p-1.5"><ChevronRight className="w-5 h-5" /></button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={goToday} className="text-[11px] text-white/50 hover:text-white bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 transition">Hoy</button>
            <button onClick={() => handleNewEvent()} className="bg-[#D74709] hover:bg-[#c03d07] text-white p-2 rounded-full transition">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Calendar grid — fills remaining space */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Day initials */}
          <div className="grid grid-cols-7">
            {DAY_NAMES_SHORT.map(d => (
              <div key={d} className="text-center text-[11px] font-semibold text-white/40 py-1">{d}</div>
            ))}
          </div>

          {/* Days — flex-1 so rows stretch to fill */}
          <div className="flex-1 grid grid-cols-7" style={{ gridTemplateRows: `repeat(${calendarDays.length / 7}, 1fr)` }}>
            {calendarDays.map((day, i) => {
              if (!day) return <div key={`pad-${i}`} />
              const hasEvents = eventDates.has(formatDateStr(day))
              const todayDay = isToday(day)
              const selected = isSameDay(day, selectedDate)

              return (
                <button
                  key={i}
                  onClick={() => handleMobileDayClick(day)}
                  className="flex flex-col items-center justify-center"
                >
                  <span className={`
                    w-10 h-10 flex items-center justify-center rounded-full text-[15px] font-medium transition
                    ${selected ? 'bg-[#D74709] text-white' : todayDay ? 'text-[#D74709] font-bold' : 'text-white/80'}
                  `}>
                    {day.getDate()}
                  </span>
                  <div className="h-1.5 mt-0.5">
                    {hasEvents && <div className={`w-1.5 h-1.5 rounded-full mx-auto ${selected ? 'bg-white' : 'bg-[#D74709]'}`} />}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Legend at the very bottom */}
          <Legend />
        </div>

        {/* ─── Mobile Day Panel (slide from right) ─── */}
        <div className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${dayPanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setDayPanelOpen(false)} />
        <div className={`fixed top-0 right-0 h-full w-full max-w-sm z-[70] bg-gray-900 border-l border-white/10 shadow-2xl transition-transform duration-300 flex flex-col ${dayPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
            <h3 className="text-base font-semibold">{dayPanelLabel}</h3>
            <div className="flex items-center gap-2">
              <button onClick={() => handleNewEvent(dayPanelDate)} className="bg-[#D74709] hover:bg-[#c03d07] text-white p-1.5 rounded-full transition">
                <Plus className="w-4 h-4" />
              </button>
              <button onClick={() => setDayPanelOpen(false)} className="text-white/40 hover:text-white transition p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Panel events */}
          <div className="flex-1 overflow-y-auto p-4">
            {dayPanelEvents.length === 0 ? (
              <p className="text-center text-white/30 text-sm py-8">Sin eventos este día</p>
            ) : (
              <div className="space-y-2">
                {dayPanelEvents.map(ev => (
                  <div
                    key={ev.id}
                    onClick={() => handleEventClick(ev)}
                    className={`flex items-start gap-3 p-3 rounded-xl transition cursor-pointer ${ev.is_completed ? 'opacity-50' : ''} bg-white/[0.04] border border-white/10 hover:border-white/20`}
                  >
                    <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: ev.color || '#D74709' }} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${ev.is_completed ? 'line-through text-white/40' : ''}`}>{ev.title}</p>
                      <span className="text-[11px] text-white/40 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {ev.all_day ? 'Todo el día' : (
                          <>
                            {new Date(ev.start_date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                            {ev.end_date && ` - ${new Date(ev.end_date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`}
                          </>
                        )}
                      </span>
                    </div>
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
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* ═══  DESKTOP VIEW (lg+)  ═══════════════ */}
      {/* ═══════════════════════════════════════════ */}
      <div className="hidden lg:block">
        {/* Controls */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="text-white/50 hover:text-white transition p-2"><ChevronLeft className="w-5 h-5" /></button>
            <h2 className="text-lg font-semibold min-w-[240px] text-center">{headerTitle}</h2>
            <button onClick={() => navigate(1)} className="text-white/50 hover:text-white transition p-2"><ChevronRight className="w-5 h-5" /></button>
            <button onClick={goToday} className="text-xs text-white/40 hover:text-white bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 ml-2 transition">Hoy</button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-white/5 border border-white/10 rounded-lg overflow-hidden">
              {(['month', 'week', 'day'] as ViewMode[]).map(v => (
                <button key={v} onClick={() => setView(v)} className={`px-4 py-1.5 text-xs font-medium transition ${view === v ? 'bg-[#D74709] text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
                  {v === 'month' ? 'Mes' : v === 'week' ? 'Semana' : 'Día'}
                </button>
              ))}
            </div>
            <button onClick={() => handleNewEvent()} className="bg-[#D74709] hover:bg-[#c03d07] text-white px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition">
              <Plus className="w-3.5 h-3.5" /> Evento
            </button>
          </div>
        </div>

        {/* MONTH VIEW */}
        {view === 'month' && (
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="grid grid-cols-7">
              {DAY_NAMES.map(d => (
                <div key={d} className="py-3 text-center text-xs font-semibold text-white/40 border-b border-white/10">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {Array.from({ length: (new Date(year, month, 1).getDay() + 6) % 7 }).map((_, i) => (
                <div key={`e-${i}`} className="min-h-[120px] border-b border-r border-white/5" />
              ))}
              {Array.from({ length: new Date(year, month + 1, 0).getDate() }).map((_, i) => {
                const day = i + 1
                const dateStr = formatDateStr(new Date(year, month, day))
                const dayEvents = getEventsForDate(dateStr)
                return (
                  <div key={day} className="min-h-[120px] border-b border-r border-white/5 p-1.5 cursor-pointer hover:bg-white/[0.03] transition" onClick={() => handleDesktopDayClick(dateStr)}>
                    <span className={`inline-flex w-7 h-7 items-center justify-center rounded-full text-xs font-semibold ${isToday(new Date(year, month, day)) ? 'bg-[#D74709] text-white' : 'text-white/60'}`}>{day}</span>
                    <div className="mt-1 space-y-1">
                      {dayEvents.slice(0, 4).map(ev => <EventDot key={ev.id} ev={ev} compact />)}
                      {dayEvents.length > 4 && <span className="text-[10px] text-white/30 pl-1">+{dayEvents.length - 4} más</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* WEEK VIEW */}
        {view === 'week' && (
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="grid grid-cols-[60px_repeat(7,1fr)]">
              <div className="border-b border-r border-white/10 py-3" />
              {weekDays.map((d, i) => (
                <div key={i} className={`py-3 text-center border-b border-white/10 cursor-pointer ${isToday(d) ? 'bg-[#D74709]/10' : ''}`} onClick={() => { setCurrentDate(d); setView('day') }}>
                  <p className="text-[10px] text-white/40 uppercase">{DAY_NAMES[i]}</p>
                  <p className={`text-sm font-bold ${isToday(d) ? 'text-[#D74709]' : 'text-white/70'}`}>{d.getDate()}</p>
                </div>
              ))}
            </div>
            <div className="max-h-[65vh] overflow-y-auto">
              {HOURS.map(h => (
                <div key={h} className="grid grid-cols-[60px_repeat(7,1fr)] min-h-[56px]">
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
                      <div key={di} className={`border-b border-r border-white/5 p-0.5 cursor-pointer hover:bg-white/[0.03] transition ${isToday(d) ? 'bg-[#D74709]/[0.02]' : ''}`} onClick={() => handleDesktopDayClick(dateStr)}>
                        {hourEvents.map(ev => (
                          <div key={ev.id} onClick={e => handleEventClick(ev, e)} className="text-xs px-1.5 py-1 rounded-md truncate cursor-pointer hover:opacity-80 mb-0.5"
                            style={{ background: (ev.color || '#D74709') + '25', color: ev.color || '#D74709', borderLeft: `3px solid ${ev.color || '#D74709'}` }}>
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

        {/* DAY VIEW */}
        {view === 'day' && (
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="max-h-[72vh] overflow-y-auto">
              {(() => {
                const dateStr = formatDateStr(currentDate)
                const allDayEvs = events.filter(e => e.start_date?.startsWith(dateStr) && e.all_day)
                if (allDayEvs.length === 0) return null
                return (
                  <div className="px-4 py-2 border-b border-white/10 bg-white/[0.02]">
                    <p className="text-[10px] text-white/30 mb-1">TODO EL DIA</p>
                    <div className="space-y-1">{allDayEvs.map(ev => <EventDot key={ev.id} ev={ev} />)}</div>
                  </div>
                )
              })()}
              {HOURS.map(h => {
                const dateStr = formatDateStr(currentDate)
                const hourEvents = events.filter(e => {
                  if (!e.start_date?.startsWith(dateStr) || e.all_day) return false
                  return new Date(e.start_date).getHours() === h
                })
                return (
                  <div key={h} className="flex min-h-[60px] border-b border-white/5">
                    <div className="w-16 flex-shrink-0 pr-3 pt-2 text-right border-r border-white/5">
                      <span className="text-xs text-white/25">{String(h).padStart(2, '0')}:00</span>
                    </div>
                    <div className="flex-1 p-1 cursor-pointer hover:bg-white/[0.03] transition" onClick={() => handleDesktopDayClick(dateStr)}>
                      {hourEvents.map(ev => (
                        <div key={ev.id} onClick={e => handleEventClick(ev, e)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg mb-1 cursor-pointer hover:opacity-80 transition"
                          style={{ background: (ev.color || '#D74709') + '15', borderLeft: `3px solid ${ev.color || '#D74709'}` }}>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{ev.title}</p>
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

        <Legend />
      </div>

      {/* ─── Shared forms ─── */}
      {showForm && (
        <EventForm
          open={showForm}
          onClose={() => { setShowForm(false); setEditingEvent(null) }}
          onSaved={fetchEvents}
          initialData={editingEvent}
          defaultDate={formDefaultDate}
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
