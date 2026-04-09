'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Inbox, Mail, Phone, Loader2, ArrowLeft, Copy, Check, User, Pencil, ExternalLink, Send, Tag, Calendar } from 'lucide-react'
import WhatsAppIcon from '@/components/ui/whatsapp-icon'
import ContactForm from '@/components/crm/contact-form'

interface Conversation {
  id: string
  owner_id: string
  participant_id: string | null
  participant_email: string | null
  participant_name: string | null
  contact_id: string | null
  last_message_at: string
  last_message_preview: string | null
  unread_owner: number
  unread_participant: number
  created_at: string
}

interface Message {
  id: string
  conversation_id: string
  sender_id: string | null
  content: string
  type: string
  metadata: any
  is_read: boolean
  created_at: string
}

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [userId, setUserId] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [contactFormOpen, setContactFormOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<any>(null)
  const [contactData, setContactData] = useState<any>(null)
  const [isMobile, setIsMobile] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsMobile(window.innerWidth < 1024)
    loadConversations()
  }, [])

  // Supabase Realtime for new messages
  useEffect(() => {
    if (!selectedId) return
    const supabase = createClient()
    const channel = supabase
      .channel(`messages-${selectedId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${selectedId}`,
      }, (payload) => {
        const newMsg = payload.new as Message
        if (newMsg.sender_id !== userId) {
          setMessages(prev => [...prev, newMsg])
          scrollToBottom()
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selectedId, userId])

  async function loadConversations() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data } = await supabase
      .from('conversations')
      .select('*')
      .or(`owner_id.eq.${user.id},participant_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false })
      .limit(100)

    setConversations(data || [])
    setLoading(false)
  }

  async function loadMessages(convId: string) {
    const supabase = createClient()
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .limit(200)

    setMessages(data || [])
    setTimeout(scrollToBottom, 100)

    // Mark as read
    const conv = conversations.find(c => c.id === convId)
    if (conv) {
      const isOwner = conv.owner_id === userId
      if (isOwner && conv.unread_owner > 0) {
        await supabase.from('conversations').update({ unread_owner: 0 } as any).eq('id', convId)
        setConversations(prev => prev.map(c => c.id === convId ? { ...c, unread_owner: 0 } : c))
      } else if (!isOwner && conv.unread_participant > 0) {
        await supabase.from('conversations').update({ unread_participant: 0 } as any).eq('id', convId)
        setConversations(prev => prev.map(c => c.id === convId ? { ...c, unread_participant: 0 } : c))
      }
    }

    // Load contact data
    if (conv?.contact_id) {
      const { data: contact } = await supabase.from('contacts').select('*').eq('id', conv.contact_id).single()
      setContactData(contact)
    } else {
      setContactData(null)
    }
  }

  function selectConversation(id: string) {
    setSelectedId(id)
    loadMessages(id)
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selectedId || sending) return
    setSending(true)

    const optimisticMsg: Message = {
      id: 'temp-' + Date.now(),
      conversation_id: selectedId,
      sender_id: userId,
      content: newMessage.trim(),
      type: 'text',
      metadata: null,
      is_read: false,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimisticMsg])
    setNewMessage('')
    scrollToBottom()

    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: selectedId, content: optimisticMsg.content }),
    })
    const data = await res.json()

    if (data.id) {
      setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? { ...optimisticMsg, id: data.id } : m))
      // Update conversation preview
      setConversations(prev => prev.map(c => c.id === selectedId
        ? { ...c, last_message_preview: optimisticMsg.content.substring(0, 100), last_message_at: optimisticMsg.created_at }
        : c
      ))
    }
    setSending(false)
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  function getWhatsAppUrl(phone: string, name: string) {
    const clean = phone.replace(/[^0-9+]/g, '')
    const num = clean.startsWith('+') ? clean.slice(1) : clean.startsWith('34') ? clean : '34' + clean
    return `https://wa.me/${num}?text=${encodeURIComponent(`Hola ${name}, `)}`
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Ahora'
    if (mins < 60) return `${mins}m`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    if (days === 1) return 'Ayer'
    if (days < 7) return `${days}d`
    return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
  }

  const selected = conversations.find(c => c.id === selectedId)
  const totalUnread = conversations.reduce((sum, c) => {
    const isOwner = c.owner_id === userId
    return sum + (isOwner ? c.unread_owner : c.unread_participant)
  }, 0)

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-white/20" /></div>

  // ─── MOBILE DETAIL VIEW ───
  if (isMobile && selected) {
    return (
      <div className="flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
        <button onClick={() => setSelectedId(null)} className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white mb-3 transition">
          <ArrowLeft className="w-4 h-4" /> Bandeja
        </button>
        <ChatHeader conv={selected} contact={contactData} userId={userId} copied={copied} onCopy={copyToClipboard} getWhatsAppUrl={getWhatsAppUrl} onEditContact={() => { setEditingContact(contactData); setContactFormOpen(true) }} />
        <MessageList messages={messages} userId={userId} messagesEndRef={messagesEndRef} />
        <ChatInput value={newMessage} onChange={setNewMessage} onSend={sendMessage} sending={sending} />
        <ContactForm open={contactFormOpen} onClose={() => setContactFormOpen(false)} initialData={editingContact} onSaved={loadConversations} userId={userId} />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Bandeja</h1>
          {totalUnread > 0 && <span className="bg-[#D74709] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{totalUnread}</span>}
        </div>
      </div>

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-white/30">
          <Inbox className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">No tienes conversaciones</p>
          <p className="text-xs text-white/20 mt-1">Las solicitudes de tu formulario aparecerán aquí</p>
        </div>
      ) : (
        <div className="flex border-t border-white/10 -mx-4 lg:-mx-[30px]" style={{ height: 'calc(100vh - 160px)' }}>
          {/* Left: conversation list */}
          <div className="w-full lg:w-[380px] lg:min-w-[320px] border-r border-white/10 overflow-y-auto">
            {conversations.map(conv => {
              const isOwner = conv.owner_id === userId
              const name = isOwner ? (conv.participant_name || conv.participant_email || 'Sin nombre') : 'Criador'
              const unread = isOwner ? conv.unread_owner : conv.unread_participant
              const isSelected = conv.id === selectedId

              return (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  className={`w-full text-left px-4 py-3 border-b border-white/5 transition ${
                    isSelected ? 'bg-[#D74709]/10 border-l-2 border-l-[#D74709]' : 'hover:bg-white/[0.03] border-l-2 border-l-transparent'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-1.5 flex-shrink-0">
                      {unread > 0 ? <div className="w-2 h-2 rounded-full bg-[#D74709]" /> : <div className="w-2 h-2" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm truncate ${unread > 0 ? 'font-semibold text-white' : 'text-white/60'}`}>{name}</p>
                        <span className="text-[10px] text-white/25 flex-shrink-0">{timeAgo(conv.last_message_at)}</span>
                      </div>
                      {conv.last_message_preview && <p className="text-xs text-white/30 truncate mt-0.5">{conv.last_message_preview}</p>}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Right: chat */}
          <div className="hidden lg:flex flex-1 flex-col">
            {selected ? (
              <>
                <ChatHeader conv={selected} contact={contactData} userId={userId} copied={copied} onCopy={copyToClipboard} getWhatsAppUrl={getWhatsAppUrl} onEditContact={() => { setEditingContact(contactData); setContactFormOpen(true) }} />
                <MessageList messages={messages} userId={userId} messagesEndRef={messagesEndRef} />
                <ChatInput value={newMessage} onChange={setNewMessage} onSend={sendMessage} sending={sending} />
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-white/20">
                <Inbox className="w-16 h-16 mb-3 opacity-20" />
                <p className="text-sm">Selecciona una conversación</p>
              </div>
            )}
          </div>
        </div>
      )}

      <ContactForm open={contactFormOpen} onClose={() => setContactFormOpen(false)} initialData={editingContact} onSaved={loadConversations} userId={userId} />
    </div>
  )
}

// ─── Chat Header ───
function ChatHeader({ conv, contact, userId, copied, onCopy, getWhatsAppUrl, onEditContact }: any) {
  const isOwner = conv.owner_id === userId
  const name = contact?.name || conv.participant_name || conv.participant_email || 'Sin nombre'
  const email = contact?.email || conv.participant_email
  const phone = contact?.phone
  const location = [contact?.city, contact?.country].filter(Boolean).join(', ')

  return (
    <div className="border-b border-white/10 px-4 py-3 flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#D74709]/15 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-[#D74709]">{name[0]?.toUpperCase() || '?'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{name}</p>
          <div className="flex items-center gap-2 text-[11px] text-white/30">
            {email && <span>{email}</span>}
            {location && <span>· {location}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {contact && isOwner && (
            <button onClick={onEditContact} className="p-2 rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition" title="Editar contacto">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {phone && (
            <a href={getWhatsAppUrl(phone, name)} target="_blank" rel="noopener" className="p-2 rounded-lg hover:bg-green-500/10 text-white/30 hover:text-green-400 transition" title="WhatsApp">
              <WhatsAppIcon className="w-3.5 h-3.5" />
            </a>
          )}
          {email && (
            <a href={`mailto:${email}`} className="p-2 rounded-lg hover:bg-blue-500/10 text-white/30 hover:text-blue-400 transition" title="Email">
              <Mail className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Message List ───
function MessageList({ messages, userId, messagesEndRef }: { messages: Message[]; userId: string; messagesEndRef: any }) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      {messages.map(msg => {
        const isMine = msg.sender_id === userId
        const isSubmission = msg.type === 'submission'

        if (isSubmission) {
          const meta = msg.metadata || {}
          return (
            <div key={msg.id} className="bg-white/[0.03] border border-white/10 rounded-xl p-4 max-w-lg">
              <div className="flex items-center gap-1.5 mb-2">
                <Tag className="w-3.5 h-3.5 text-[#D74709]/50" />
                <span className="text-[10px] font-semibold text-[#D74709] uppercase tracking-wider">Solicitud del formulario</span>
              </div>
              {meta.breed_interest_names && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {meta.breed_interest_names.split(',').map((b: string, i: number) => (
                    <span key={i} className="bg-[#D74709]/10 text-[#D74709] text-[10px] font-medium px-2 py-0.5 rounded-full">{b.trim()}</span>
                  ))}
                </div>
              )}
              {msg.content && <p className="text-sm text-white/60">{msg.content}</p>}
              <p className="text-[10px] text-white/20 mt-2">
                {new Date(msg.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )
        }

        return (
          <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
              isMine
                ? 'bg-[#D74709] text-white rounded-br-md'
                : 'bg-white/[0.06] text-white/80 rounded-bl-md'
            }`}>
              <p className="text-sm">{msg.content}</p>
              <p className={`text-[10px] mt-1 ${isMine ? 'text-white/50' : 'text-white/20'}`}>
                {new Date(msg.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        )
      })}
      <div ref={messagesEndRef} />
    </div>
  )
}

// ─── Chat Input ───
function ChatInput({ value, onChange, onSend, sending }: { value: string; onChange: (v: string) => void; onSend: () => void; sending: boolean }) {
  return (
    <div className="border-t border-white/10 px-4 py-3 flex-shrink-0">
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && onSend()}
          placeholder="Escribe un mensaje..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition"
        />
        <button
          onClick={onSend}
          disabled={sending || !value.trim()}
          className="p-2.5 bg-[#D74709] hover:bg-[#c03d07] rounded-xl text-white transition disabled:opacity-30"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
