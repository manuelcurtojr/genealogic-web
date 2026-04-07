'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Clock, Check, AlertTriangle, Syringe, Bug, Stethoscope, Calendar, ArrowRight } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import Link from 'next/link'

interface Props {
  dogId: string
  isOwner: boolean
}

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  vaccine: { label: 'Vacuna', color: '#10B981', icon: Syringe },
  deworming: { label: 'Desparasitación', color: '#F59E0B', icon: Bug },
  checkup: { label: 'Revisión', color: '#3B82F6', icon: Stethoscope },
  custom: { label: 'Otro', color: '#8B5CF6', icon: Calendar },
}

export default function DogVetReminders({ dogId, isOwner }: Props) {
  const [reminders, setReminders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const supabase = createClient()
      const { data } = await supabase
        .from('vet_reminders')
        .select('id, title, type, due_date, completed_date, recurrence_days, auto_generated')
        .eq('dog_id', dogId)
        .order('due_date', { ascending: true })
      setReminders(data || [])
      setLoading(false)
    }
    fetch()
  }, [dogId])

  const markCompleted = async (id: string) => {
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]
    const reminder = reminders.find(r => r.id === id)

    await supabase.from('vet_reminders').update({ completed_date: today }).eq('id', id)

    // Auto-create next if recurrent
    if (reminder?.recurrence_days) {
      const nextDate = new Date(today)
      nextDate.setDate(nextDate.getDate() + reminder.recurrence_days)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('vet_reminders').insert({
          dog_id: dogId,
          template_id: reminder.template_id,
          owner_id: user.id,
          title: reminder.title,
          type: reminder.type,
          due_date: nextDate.toISOString().split('T')[0],
          auto_generated: true,
          recurrence_days: reminder.recurrence_days,
        })
      }
    }

    // Refresh
    const { data } = await supabase
      .from('vet_reminders')
      .select('id, title, type, due_date, completed_date, recurrence_days, auto_generated')
      .eq('dog_id', dogId)
      .order('due_date', { ascending: true })
    setReminders(data || [])
  }

  if (loading) return null

  const pending = reminders.filter(r => !r.completed_date)
  if (pending.length === 0 && !isOwner) return null

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> Recordatorios pendientes ({pending.length})
        </h3>
        {isOwner && (
          <Link href="/vet" className="text-[10px] text-[#D74709] hover:text-[#c03d07] transition flex items-center gap-0.5">
            Ver todos <ArrowRight className="w-2.5 h-2.5" />
          </Link>
        )}
      </div>

      {pending.length === 0 ? (
        <p className="text-xs text-white/20 py-3">Sin recordatorios pendientes</p>
      ) : (
        <div className="space-y-1.5">
          {pending.map(r => {
            const typeConf = TYPE_CONFIG[r.type] || TYPE_CONFIG.custom
            const TypeIcon = typeConf.icon
            const isOverdue = r.due_date < today
            const isDueToday = r.due_date === today

            return (
              <div key={r.id}
                className={`flex items-center gap-2.5 rounded-lg p-2.5 ${
                  isOverdue ? 'bg-red-500/5 border border-red-500/20' : 'bg-white/5 border border-white/10'
                }`}>
                <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: typeConf.color + '15' }}>
                  <TypeIcon className="w-3.5 h-3.5" style={{ color: typeConf.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{r.title}</p>
                  <p className={`text-[10px] ${isOverdue ? 'text-red-400' : isDueToday ? 'text-[#D74709]' : 'text-white/30'}`}>
                    {isOverdue ? 'Vencido · ' : isDueToday ? 'Hoy · ' : ''}
                    {new Date(r.due_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })}
                    {r.recurrence_days ? ` · ↻ ${r.recurrence_days}d` : ''}
                  </p>
                </div>
                {isOwner && (
                  <button onClick={() => markCompleted(r.id)}
                    className="w-7 h-7 rounded-md bg-green-500/10 flex items-center justify-center text-green-400 hover:bg-green-500/20 transition flex-shrink-0"
                    title="Completar">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
