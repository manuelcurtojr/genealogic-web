'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Send, RotateCcw, BookOpen, Beaker, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  kennelId: string
  kennelName: string
  knowledgeCount: number
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SCENARIOS = [
  { key: 'new_lead', label: 'Nuevo lead', help: 'Persona que escribe por primera vez interesada en cachorros' },
  { key: 'waitlist', label: 'En lista de espera', help: 'Ya está en tu lista de espera, pregunta cuándo hay camada' },
  { key: 'reservation', label: 'Con reserva', help: 'Ya tiene cachorro asignado, pregunta sobre entrega o documentos' },
]

const EXAMPLES: Record<string, string[]> = {
  new_lead: [
    'Hola, estoy interesado en uno de vuestros cachorros. ¿Cuándo tendréis próxima camada?',
    '¿Cuánto cuesta un cachorro? ¿Cómo funciona la reserva?',
    '¿Hacéis envíos fuera de España?',
  ],
  waitlist: [
    'Hola, llevo unos meses en la lista de espera. ¿Hay alguna novedad?',
    '¿Cuándo creéis que nacerá la próxima camada?',
    '¿Puedo cambiar mi preferencia de sexo de macho a hembra?',
  ],
  reservation: [
    '¿Qué documentación recibiré con el cachorro?',
    '¿Cuándo puedo ir a conocer a mi cachorro?',
    '¿Qué pienso recomendáis para las primeras semanas?',
  ],
}

export default function ChatPlayground({ kennelId, kennelName, knowledgeCount }: Props) {
  const [scenario, setScenario] = useState('new_lead')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return
    setError(null)

    const userMsg: Message = { role: 'user', content: text.trim() }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/emailbot/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kennel_id: kennelId, scenario, messages: next }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error en el bot')
      setMessages([...next, { role: 'assistant', content: data.reply }])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setMessages([])
    setError(null)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-h-[800px]">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight flex items-center gap-2">
            <Beaker className="w-6 h-6 text-muted" />
            Test del Emailbot
          </h1>
          <p className="text-sm text-muted mt-0.5">
            Simula consultas reales para ver cómo respondería tu bot con la Biblioteca actual.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/conocimiento"
            className="text-xs font-medium text-body hover:text-ink inline-flex items-center gap-1.5 border border-hairline rounded-lg px-3 py-1.5 transition hover:bg-surface-soft"
          >
            <BookOpen className="w-3.5 h-3.5" />
            {knowledgeCount} en Biblioteca
          </Link>
          {messages.length > 0 && (
            <button
              onClick={reset}
              className="text-xs font-medium text-body hover:text-ink inline-flex items-center gap-1.5 border border-hairline rounded-lg px-3 py-1.5 transition hover:bg-surface-soft"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Knowledge warning */}
      {knowledgeCount === 0 && (
        <div className="flex items-start gap-2.5 bg-surface-card border border-hairline rounded-xl p-3 mb-4">
          <AlertCircle className="w-4 h-4 text-muted flex-shrink-0 mt-0.5" />
          <div className="text-sm text-body flex-1">
            La <Link href="/conocimiento" className="font-semibold text-ink underline">Biblioteca</Link> está vacía. El bot responderá de forma genérica hasta que añadas precio, política de reserva, etc.
          </div>
        </div>
      )}

      {/* Scenario picker */}
      <div className="flex items-center gap-2 mb-4">
        {SCENARIOS.map(s => (
          <button
            key={s.key}
            onClick={() => setScenario(s.key)}
            title={s.help}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition ${
              scenario === s.key
                ? 'bg-ink text-on-primary'
                : 'border border-hairline text-body hover:text-ink hover:bg-surface-soft'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Chat area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto rounded-xl border border-hairline bg-canvas p-4 mb-3 min-h-[300px]"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <p className="text-sm text-muted mb-4">Escribe una consulta o prueba un ejemplo:</p>
            <div className="space-y-2 max-w-md w-full">
              {(EXAMPLES[scenario] || []).map((ex, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(ex)}
                  className="w-full text-left text-sm text-body bg-surface-card hover:bg-surface-soft border border-hairline rounded-lg px-3 py-2 transition"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3 max-w-3xl mx-auto">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-ink text-on-primary rounded-br-md'
                      : 'bg-surface-card text-ink rounded-bl-md border border-hairline'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-surface-card border border-hairline rounded-2xl rounded-bl-md px-4 py-2.5">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={e => { e.preventDefault(); sendMessage(input) }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={loading}
          placeholder="Escribe una consulta como si fueras una familia interesada…"
          className="flex-1 px-4 py-2.5 text-sm border border-hairline rounded-lg bg-canvas text-ink placeholder:text-muted focus:outline-none focus:border-ink transition disabled:opacity-50"
        />
        <Button variant="primary" size="md" type="submit" disabled={!input.trim() || loading}>
          <Send className="w-4 h-4" />
          Enviar
        </Button>
      </form>
    </div>
  )
}
