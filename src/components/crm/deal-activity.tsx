'use client'

import { useState, useEffect } from 'react'
import { Plus, MessageSquare, CheckSquare, ArrowRight, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Activity {
  id: string
  type: string
  content: string | null
  is_completed: boolean
  created_at: string
}

interface DealActivityProps {
  dealId: string
  userId: string
}

export default function DealActivity({ dealId, userId }: DealActivityProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [sending, setSending] = useState(false)
  const [activeTab, setActiveTab] = useState<'note' | 'task'>('note')

  const supabase = createClient()

  async function fetchActivities() {
    const { data } = await supabase
      .from('deal_activities')
      .select('*')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false })
    setActivities(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchActivities() }, [dealId])

  async function addActivity() {
    if (!newNote.trim()) return
    setSending(true)
    await supabase.from('deal_activities').insert({
      deal_id: dealId,
      user_id: userId,
      type: activeTab,
      content: newNote.trim(),
      is_completed: false,
    })
    setNewNote('')
    setSending(false)
    fetchActivities()
  }

  async function toggleComplete(activity: Activity) {
    await supabase.from('deal_activities')
      .update({ is_completed: !activity.is_completed })
      .eq('id', activity.id)
    fetchActivities()
  }

  function getIcon(type: string) {
    if (type === 'task') return CheckSquare
    if (type === 'status_change') return ArrowRight
    return MessageSquare
  }

  function getTypeLabel(type: string) {
    if (type === 'task') return 'Tarea'
    if (type === 'status_change') return 'Cambio'
    return 'Nota'
  }

  return (
    <div>
      <h4 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-3">Actividad</h4>

      {/* Add note/task */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-4">
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setActiveTab('note')}
            className={`text-xs px-2.5 py-1 rounded-full transition ${
              activeTab === 'note' ? 'bg-[#D74709] text-white' : 'text-white/40 hover:text-white/60'
            }`}
          >
            Nota
          </button>
          <button
            onClick={() => setActiveTab('task')}
            className={`text-xs px-2.5 py-1 rounded-full transition ${
              activeTab === 'task' ? 'bg-[#D74709] text-white' : 'text-white/40 hover:text-white/60'
            }`}
          >
            Tarea
          </button>
        </div>
        <div className="flex gap-2">
          <input
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addActivity()}
            placeholder={activeTab === 'note' ? 'Agregar nota...' : 'Agregar tarea...'}
            className="flex-1 bg-transparent border-none text-sm text-white placeholder:text-white/30 focus:outline-none"
          />
          <button
            onClick={addActivity}
            disabled={sending || !newNote.trim()}
            className="p-1.5 text-[#D74709] hover:bg-[#D74709]/10 rounded transition disabled:opacity-30"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="text-center py-4 text-white/30 text-xs">Cargando...</div>
      ) : activities.length === 0 ? (
        <div className="text-center py-6 text-white/30 text-xs">Sin actividad registrada</div>
      ) : (
        <div className="space-y-2">
          {activities.map(act => {
            const Icon = getIcon(act.type)
            return (
              <div key={act.id} className="flex items-start gap-2.5 group">
                <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-3 h-3 text-white/40" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/30 uppercase">{getTypeLabel(act.type)}</span>
                    <span className="text-[10px] text-white/20">
                      {new Date(act.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className={`text-sm text-white/70 mt-0.5 ${act.is_completed ? 'line-through opacity-50' : ''}`}>
                    {act.content}
                  </p>
                </div>
                {act.type === 'task' && (
                  <button
                    onClick={() => toggleComplete(act)}
                    className={`w-4 h-4 rounded border flex-shrink-0 mt-1 transition ${
                      act.is_completed
                        ? 'bg-green-500 border-green-500'
                        : 'border-white/20 hover:border-white/40'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
