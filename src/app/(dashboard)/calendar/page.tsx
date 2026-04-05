'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, ChevronRight, Plus, Check, Clock } from 'lucide-react'

interface CalendarEvent {
  id: string
  title: string
  event_type: string
  start_date: string
  all_day: boolean
  is_completed: boolean
  color: string | null
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [loading, setLoading] = useState(true)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true)
      const supabase = createClient()
      const start = new Date(year, month, 1).toISOString()
      const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString()

      const { data } = await supabase
        .from('events')
        .select('id, title, event_type, start_date, all_day, is_completed, color')
        .gte('start_date', start)
        .lte('start_date', end)
        .order('start_date')

      setEvents(data || [])
      setLoading(false)
    }
    fetchEvents()
  }, [year, month])

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const today = new Date()

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter((e) => e.start_date?.startsWith(dateStr))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Calendario</h1>
        <button className="bg-[#D74709] hover:bg-[#c03d07] text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition">
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
          {/* Empty cells for offset */}
          {Array.from({ length: (firstDay + 6) % 7 }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-white/5" />
          ))}
          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
            const dayEvents = getEventsForDay(day)
            return (
              <div key={day} className="min-h-[80px] border-b border-r border-white/5 p-1.5">
                <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-medium ${
                  isToday ? 'bg-[#D74709] text-white' : 'text-white/60'
                }`}>
                  {day}
                </span>
                <div className="mt-1 space-y-0.5">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <div key={ev.id} className="flex items-center gap-1 px-1 py-0.5 rounded text-[10px] bg-white/5 truncate">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: ev.color || '#D74709' }} />
                      <span className="truncate text-white/70">{ev.title}</span>
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
    </div>
  )
}
