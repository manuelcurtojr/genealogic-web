'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Inbox, Mail, Loader2, ArrowLeft, Copy, Check, Pencil, Send, Tag } from 'lucide-react'
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
}

interface Message {
  id: string
  conversation_id: string
  sender_id: string | null
  content: string
  type: string
  metadata: any
  created_at: string
}

const supabase = createClient()

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
  const [showDetail, setShowDetail] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Init: load user + conversations once
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      supabase.from('conversations')
        .select('*')
        .or(`owner_id.eq.${user.id},participant_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false })
        .limit(100)
        .then(({ data }) => { setConversations(data || []); setLoading(false) })
    })
  }, [])

  // Poll for new messages every 3 seconds when a conversation is selected
  useEffect(() => {
    if (!selectedId || !userId) return
    const interval = setInterval(async () => {
      const { data } = await supabase.from('messages')
        .select('*')
        .eq('conversation_id', selectedId)
        .order('created_at', { ascending: true })
        .limit(200)
      if (data) {
        setMessages(prev => {
          // Only update if there are new messages
          if (data.length !== prev.length || (data.length > 0 && data[data.length - 1].id !== prev[prev.length - 1]?.id)) {
            setTimeout(scrollToBottom, 50)
            return data
          }
          return prev
        })
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [selectedId, userId])

  // Poll conversation list every 10 seconds for new conversations / unread counts
  useEffect(() => {
    if (!userId) return
    const interval = setInterval(async () => {
      const { data } = await supabase.from('conversations')
        .select('*')
        .or(`owner_id.eq.${userId},participant_id.eq.${userId}`)
        .order('last_message_at', { ascending: false })
        .limit(100)
      if (data) setConversations(data)
    }, 10000)
    return () => clearInterval(interval)
  }, [userId])

  const loadMessages = useCallback(async (convId: string) => {
    const { data } = await supabase.from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .limit(200)
    setMessages(data || [])
    setTimeout(scrollToBottom, 50)

    // Mark as read
    const conv = conversations.find(c => c.id === convId)
    if (conv) {
      const isOwner = conv.owner_id === userId
      if (isOwner && conv.unread_owner > 0) {
        supabase.from('conversations').update({ unread_owner: 0 } as any).eq('id', convId)
        setConversations(prev => prev.map(c => c.id === convId ? { ...c, unread_owner: 0 } : c))
      } else if (!isOwner && conv.unread_participant > 0) {
        supabase.from('conversations').update({ unread_participant: 0 } as any).eq('id', convId)
        setConversations(prev => prev.map(c => c.id === convId ? { ...c, unread_participant: 0 } : c))
      }
    }

    // Load contact
    if (conv?.contact_id) {
      const { data: contact } = await supabase.from('contacts').select('*').eq('id', conv.contact_id).single()
      setContactData(contact)
    } else {
      setContactData(null)
    }
  }, [conversations, userId])

  function selectConversation(id: string) {
    setSelectedId(id)
    setShowDetail(true)
    loadMessages(id)
  }

  async function sendMsg() {
    if (!newMessage.trim() || !selectedId || sending) return
    const content = newMessage.trim()
    setSending(true)
    setNewMessage('')

    // Optimistic
    const tempMsg: Message = {
      id: 'temp-' + Date.now(), conversation_id: selectedId, sender_id: userId,
      content, type: 'text', metadata: null, created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, tempMsg])
    scrollToBottom()

    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: selectedId, content }),
    })
    const data = await res.json()
    if (data.id) {
      setMessages(prev => prev.map(m => m.id === tempMsg.id ? { ...tempMsg, id: data.id } : m))
      setConversations(prev => prev.map(c => c.id === selectedId
        ? { ...c, last_message_preview: content.substring(0, 100), last_message_at: tempMsg.created_at }
        : c
      ))
    }
    setSending(false)
    inputRef.current?.focus()
  }

  function scrollToBottom() { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }
  function copyText(text: string, f: string) { navigator.clipboard.writeText(text); setCopied(f); setTimeout(() => setCopied(null), 2000) }
  function waUrl(phone: string, name: string) { const n = phone.replace(/[^0-9+]/g, ''); const num = n.startsWith('+') ? n.slice(1) : n.startsWith('34') ? n : '34'+n; return `https://wa.me/${num}?text=${encodeURIComponent(`Hola ${name}, `)}` }
  function timeAgo(d: string) { const diff = Date.now()-new Date(d).getTime(); const m=Math.floor(diff/60000); if(m<1)return'Ahora'; if(m<60)return`${m}m`; const h=Math.floor(m/60); if(h<24)return`${h}h`; const days=Math.floor(h/24); if(days===1)return'Ayer'; if(days<7)return`${days}d`; return new Date(d).toLocaleDateString('es-ES',{day:'2-digit',month:'short'}) }

  const selected = conversations.find(c => c.id === selectedId)
  const totalUnread = conversations.reduce((s, c) => s + (c.owner_id === userId ? c.unread_owner : c.unread_participant), 0)

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-white/20" /></div>

  const chatName = selected ? (contactData?.name || selected.participant_name || selected.participant_email || 'Sin nombre') : ''
  const chatEmail = selected ? (contactData?.email || selected.participant_email) : ''
  const chatPhone = contactData?.phone || ''
  const chatLocation = [contactData?.city, contactData?.country].filter(Boolean).join(', ')
  const chatIsOwner = selected ? selected.owner_id === userId : false

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        {showDetail && selectedId ? (
          <button onClick={() => { setShowDetail(false); setSelectedId(null) }} className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition lg:hidden">
            <ArrowLeft className="w-4 h-4" /> Bandeja
          </button>
        ) : null}
        <div className={`flex items-center gap-2 ${showDetail && selectedId ? 'hidden lg:flex' : ''}`}>
          <h1 className="text-xl font-bold">Bandeja</h1>
          {totalUnread > 0 && <span className="bg-[#D74709] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{totalUnread}</span>}
        </div>
      </div>

      {/* Desktop: two panes | Mobile: list OR chat */}
      <div className="border-t border-white/10 -mx-4 lg:-mx-[30px] overflow-hidden" style={{ height: 'calc(100vh - 160px)', maxHeight: 'calc(100vh - 160px)' }}>
        <div className="flex h-full overflow-hidden">

          {/* ─── Left: Conversation List ─── */}
          <div className={`w-full lg:w-[340px] lg:min-w-[280px] border-r border-white/10 overflow-y-auto ${showDetail && selectedId ? 'hidden lg:block' : ''}`}>
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-white/30 px-4">
                <Inbox className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">No tienes conversaciones</p>
              </div>
            ) : conversations.map(conv => {
              const isOwner = conv.owner_id === userId
              const name = isOwner ? (conv.participant_name || conv.participant_email || 'Sin nombre') : 'Criador'
              const unread = isOwner ? conv.unread_owner : conv.unread_participant
              const isSel = conv.id === selectedId
              return (
                <button key={conv.id} onClick={() => selectConversation(conv.id)}
                  className={`w-full text-left px-4 py-3 border-b border-white/5 transition ${isSel ? 'bg-[#D74709]/10 border-l-2 border-l-[#D74709]' : 'hover:bg-white/[0.03] border-l-2 border-l-transparent'}`}>
                  <div className="flex items-start gap-2.5">
                    <div className="mt-1.5 flex-shrink-0">{unread > 0 ? <div className="w-2 h-2 rounded-full bg-[#D74709]" /> : <div className="w-2" />}</div>
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

          {/* ─── Right: Chat ─── */}
          <div className={`w-full lg:flex-1 overflow-hidden ${!showDetail || !selectedId ? 'hidden lg:flex' : 'flex'} flex-col`} style={{ maxHeight: '100%' }}>
            {!selected ? (
              <div className="flex-1 flex flex-col items-center justify-center text-white/20">
                <Inbox className="w-16 h-16 mb-3 opacity-20" /><p className="text-sm">Selecciona una conversación</p>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="border-b border-white/10 px-4 py-2.5 flex items-center gap-3 flex-shrink-0">
                  <div className="w-9 h-9 rounded-full bg-[#D74709]/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-[#D74709]">{chatName[0]?.toUpperCase() || '?'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{chatName}</p>
                    <p className="text-[11px] text-white/30 truncate">{[chatEmail, chatLocation].filter(Boolean).join(' · ')}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {contactData && chatIsOwner && (
                      <button onClick={() => { setEditingContact(contactData); setContactFormOpen(true) }} className="p-2 rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition"><Pencil className="w-3.5 h-3.5" /></button>
                    )}
                    {chatPhone && <a href={waUrl(chatPhone, chatName)} target="_blank" rel="noopener" className="p-2 rounded-lg hover:bg-green-500/10 text-white/30 hover:text-green-400 transition"><WhatsAppIcon className="w-3.5 h-3.5" /></a>}
                    {chatEmail && <a href={`mailto:${chatEmail}`} className="p-2 rounded-lg hover:bg-blue-500/10 text-white/30 hover:text-blue-400 transition"><Mail className="w-3.5 h-3.5" /></a>}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-2.5">
                  {messages.map(msg => {
                    const isMine = msg.sender_id === userId
                    if (msg.type === 'submission') {
                      const meta = msg.metadata || {}
                      return (
                        <div key={msg.id} className="bg-white/[0.03] border border-white/10 rounded-xl p-3 max-w-sm">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Tag className="w-3 h-3 text-[#D74709]/50" />
                            <span className="text-[10px] font-semibold text-[#D74709] uppercase tracking-wider">Solicitud</span>
                          </div>
                          {meta.breed_interest_names && (
                            <div className="flex flex-wrap gap-1 mb-1.5">
                              {meta.breed_interest_names.split(',').map((b: string, i: number) => (
                                <span key={i} className="bg-[#D74709]/10 text-[#D74709] text-[10px] px-2 py-0.5 rounded-full">{b.trim()}</span>
                              ))}
                            </div>
                          )}
                          {msg.content && <p className="text-xs text-white/60">{msg.content}</p>}
                          <p className="text-[10px] text-white/20 mt-1.5">{new Date(msg.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      )
                    }
                    return (
                      <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${isMine ? 'bg-[#D74709] text-white rounded-br-sm' : 'bg-white/[0.06] text-white/80 rounded-bl-sm'}`}>
                          <p className="text-[13px] leading-relaxed">{msg.content}</p>
                          <p className={`text-[10px] mt-0.5 ${isMine ? 'text-white/50' : 'text-white/20'}`}>
                            {new Date(msg.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-white/10 px-3 py-2.5 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <input ref={inputRef} value={newMessage} onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMsg()}
                      placeholder="Escribe un mensaje..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition" />
                    <button onClick={sendMsg} disabled={sending || !newMessage.trim()}
                      className="p-2.5 bg-[#D74709] hover:bg-[#c03d07] rounded-full text-white transition disabled:opacity-30 flex-shrink-0">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </div>

      <ContactForm open={contactFormOpen} onClose={() => setContactFormOpen(false)} initialData={editingContact} onSaved={() => {}} userId={userId} />
    </div>
  )
}
