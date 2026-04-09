'use client'

import { useState, useEffect } from 'react'
import { Plus, MessageSquare, CheckSquare, ArrowRight, Send, Mail, Phone, Copy, Check, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Activity {
  id: string
  type: string
  content: string | null
  is_completed: boolean
  created_at: string
}

interface Contact {
  id: string
  name: string
  email: string | null
  phone: string | null
  country: string | null
  city: string | null
}

interface DealActivityProps {
  dealId: string
  userId: string
  contactId?: string | null
}

export default function DealActivity({ dealId, userId, contactId }: DealActivityProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [contact, setContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [sending, setSending] = useState(false)
  const [activeTab, setActiveTab] = useState<'note' | 'task'>('note')
  const [copied, setCopied] = useState<string | null>(null)

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

  async function fetchContact() {
    if (!contactId) return
    const { data } = await supabase.from('contacts').select('id, name, email, phone, country, city').eq('id', contactId).single()
    if (data) setContact(data)
  }

  useEffect(() => { fetchActivities(); fetchContact() }, [dealId, contactId])

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

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
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

  // Clean phone number for WhatsApp link
  function getWhatsAppUrl(phone: string) {
    const clean = phone.replace(/[^0-9+]/g, '')
    const num = clean.startsWith('+') ? clean.slice(1) : clean.startsWith('34') ? clean : '34' + clean
    return `https://wa.me/${num}`
  }

  return (
    <div>
      {/* Contact card */}
      {contact && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-full bg-[#D74709]/15 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-[#D74709]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{contact.name}</p>
              {(contact.city || contact.country) && (
                <p className="text-[11px] text-white/30 truncate">{[contact.city, contact.country].filter(Boolean).join(', ')}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            {contact.email && (
              <div className="flex items-center gap-2 bg-white/[0.03] rounded-lg px-3 py-2">
                <Mail className="w-3.5 h-3.5 text-white/30 shrink-0" />
                <a href={`mailto:${contact.email}`} className="text-sm text-white/60 hover:text-[#D74709] transition truncate flex-1">{contact.email}</a>
                <button onClick={() => copyToClipboard(contact.email!, 'email')} className="p-1 rounded hover:bg-white/10 transition shrink-0">
                  {copied === 'email' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-white/20" />}
                </button>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-2 bg-white/[0.03] rounded-lg px-3 py-2">
                <Phone className="w-3.5 h-3.5 text-white/30 shrink-0" />
                <a href={getWhatsAppUrl(contact.phone)} target="_blank" rel="noopener" className="text-sm text-white/60 hover:text-green-400 transition truncate flex-1">
                  {contact.phone}
                </a>
                <button onClick={() => copyToClipboard(contact.phone!, 'phone')} className="p-1 rounded hover:bg-white/10 transition shrink-0">
                  {copied === 'phone' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-white/20" />}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
                  <p className={`text-sm text-white/70 mt-0.5 whitespace-pre-wrap ${act.is_completed ? 'line-through opacity-50' : ''}`}>
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
