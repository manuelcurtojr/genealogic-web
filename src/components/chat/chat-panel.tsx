'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Send, Loader2, Sparkles, Trash2 } from 'lucide-react'

// Lightweight Markdown renderer for chat messages
function ChatMarkdown({ text }: { text: string }) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Headers
    const h3 = line.match(/^### (.+)/)
    const h2 = line.match(/^## (.+)/)
    const h1 = line.match(/^# (.+)/)
    if (h1) { elements.push(<p key={i} className="font-bold text-white mt-3 mb-1">{renderInline(h1[1])}</p>); continue }
    if (h2) { elements.push(<p key={i} className="font-bold text-white mt-2.5 mb-1 text-[13px]">{renderInline(h2[1])}</p>); continue }
    if (h3) { elements.push(<p key={i} className="font-semibold text-white/90 mt-2 mb-0.5">{renderInline(h3[1])}</p>); continue }

    // List items
    const li = line.match(/^[-•] (.+)/)
    const numLi = line.match(/^\d+\. (.+)/)
    if (li) { elements.push(<div key={i} className="flex gap-1.5 ml-1 mt-0.5"><span className="text-[#D74709] shrink-0">•</span><span>{renderInline(li[1])}</span></div>); continue }
    if (numLi) {
      const num = line.match(/^(\d+)\./)?.[1]
      elements.push(<div key={i} className="flex gap-1.5 ml-1 mt-0.5"><span className="text-[#D74709] shrink-0 font-semibold text-xs min-w-[16px]">{num}.</span><span>{renderInline(numLi[1])}</span></div>)
      continue
    }

    // Empty line
    if (!line.trim()) { elements.push(<div key={i} className="h-2" />); continue }

    // Regular paragraph
    elements.push(<p key={i} className="mt-0.5">{renderInline(line)}</p>)
  }

  return <>{elements}</>
}

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  // Process: **bold**, [link text](url), `code`
  const regex = /(\*\*(.+?)\*\*)|(\[(.+?)\]\((.+?)\))|(`(.+?)`)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index))
    if (match[2]) parts.push(<strong key={match.index} className="font-semibold text-white">{match[2]}</strong>)
    else if (match[4] && match[5]) parts.push(<a key={match.index} href={match[5]} className="text-[#D74709] underline underline-offset-2 hover:text-[#ff6b2b] transition">{match[4]}</a>)
    else if (match[7]) parts.push(<code key={match.index} className="bg-white/10 text-[#ff6b2b] px-1 py-0.5 rounded text-[12px]">{match[7]}</code>)
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatPanelProps {
  open: boolean
  onClose: () => void
  userId: string
  userName: string
  avatarUrl: string | null
}

export default function ChatPanel({ open, onClose, userId, userName, avatarUrl }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Load history
  useEffect(() => {
    if (!open || historyLoaded) return
    const supabase = createClient()
    supabase
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(50)
      .then(({ data }) => {
        if (data?.length) setMessages(data as Message[])
        setHistoryLoaded(true)
      })
  }, [open, userId, historyLoaded])

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming])

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300)
  }, [open])

  // Escape key
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, onClose])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setLoading(true)
    setStreaming(true)

    const userMsg: Message = { role: 'user', content: text }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)

    // Add empty assistant message for streaming
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-20),
        }),
      })

      if (!res.ok) throw new Error('Error en la respuesta')

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No stream')

      const decoder = new TextDecoder()
      let assistantText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)
            if (parsed.error) {
              assistantText += `\n\nError: ${parsed.error}`
            } else if (parsed.text) {
              assistantText += parsed.text
            }
          } catch {}
        }

        // Update last message with accumulated text
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: assistantText }
          return updated
        })
      }
    } catch (err: any) {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: 'Lo siento, ha ocurrido un error. Inténtalo de nuevo.' }
        return updated
      })
    } finally {
      setLoading(false)
      setStreaming(false)
    }
  }, [input, loading, messages])

  const clearHistory = async () => {
    const supabase = createClient()
    await supabase.from('chat_messages').delete().eq('user_id', userId)
    setMessages([])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />

      {/* Panel */}
      <div className={`fixed top-0 right-0 h-full w-full sm:max-w-md z-[70] bg-gray-900 border-l border-white/10 shadow-2xl transition-transform duration-300 flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D74709] to-[#ff6b2b] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold">Genos</p>
              <p className="text-[10px] text-white/30">Asistente de Genealogic</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button onClick={clearHistory} className="p-2 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/5 transition" title="Borrar historial">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D74709]/20 to-[#ff6b2b]/10 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-[#D74709]" />
              </div>
              <p className="text-sm font-semibold mb-1">Hola, soy Genos</p>
              <p className="text-xs text-white/40 mb-6">Tu asistente personal de Genealogic. Pregúntame lo que necesites.</p>
              <div className="space-y-2 w-full">
                {[
                  '¿Qué puedo hacer en Genealogic?',
                  '¿Cómo añado un cachorro?',
                  '¿Cuántos perros tengo?',
                ].map(q => (
                  <button key={q} onClick={() => { setInput(q) }}
                    className="w-full text-left bg-white/[0.03] border border-white/5 rounded-lg px-3 py-2.5 text-xs text-white/50 hover:bg-white/[0.06] hover:border-white/10 transition">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#D74709] to-[#ff6b2b] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#D74709] text-white rounded-br-md whitespace-pre-wrap'
                  : 'bg-white/5 text-white/80 rounded-bl-md'
              }`}>
                {msg.content ? (
                  msg.role === 'assistant' ? <ChatMarkdown text={msg.content} /> : msg.content
                ) : (streaming && i === messages.length - 1 ? (
                  <span className="flex items-center gap-1.5 text-white/30">
                    <Loader2 className="w-3 h-3 animate-spin" /> Pensando...
                  </span>
                ) : '')}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5 overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold text-white/50">{userName?.[0]?.toUpperCase() || 'U'}</span>
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-white/10 flex-shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu pregunta..."
              rows={1}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition resize-none max-h-24"
              style={{ minHeight: '42px' }}
            />
            <button onClick={sendMessage} disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl bg-[#D74709] hover:bg-[#c03d07] disabled:opacity-30 disabled:hover:bg-[#D74709] text-white flex items-center justify-center transition flex-shrink-0">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[9px] text-white/15 text-center mt-2">Powered by Claude</p>
        </div>
      </div>
    </>
  )
}
