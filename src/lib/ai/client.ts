/**
 * Cliente para llamadas a IA (Anthropic).
 *
 * Una sola función `chat()` que recibe:
 *   - modelId del catálogo
 *   - system prompt
 *   - mensajes user/assistant
 *
 * y devuelve:
 *   - texto de respuesta
 *   - tokens consumidos (input + output)
 *   - coste estimado en USD
 *   - provider/model usados (para logging)
 *
 * El usage tracking (insertar en `ai_usage_logs`) se hace en `track.ts`
 * por separado; este módulo se mantiene puro (solo I/O al provider).
 *
 * ENV vars necesarias:
 *   ANTHROPIC_API_KEY
 *
 * Nota 2026-07: retirados los providers OpenAI y Google junto al emailbot
 * (eran para elegir modelo del bot). Si un modelId apunta a un provider
 * distinto de Anthropic, se hace fallback a Claude Sonnet.
 */
import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { getModel, estimateCost, type AIModelMeta } from './models'

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type ChatResult = {
  text: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  costUsd: number
  provider: string
  model: string
  /** El modelo realmente usado (puede diferir del solicitado si hubo fallback) */
  resolvedModelId: string
}

export type ChatArgs = {
  modelId: string
  system: string
  messages: ChatMessage[]
  maxTokens?: number
  temperature?: number
}

// ─── Clients singletons (lazy) ──────────────────────────────────────────────
let _anthropic: Anthropic | null = null

function anthropic(): Anthropic {
  if (_anthropic) return _anthropic
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY no configurada')
  _anthropic = new Anthropic({ apiKey: key })
  return _anthropic
}

/**
 * Devuelve true si el provider del modelo tiene API key configurada.
 * Útil para validar UI (no ofrecer modelos sin key).
 */
export function isProviderAvailable(provider: string): boolean {
  return provider === 'anthropic' && !!process.env.ANTHROPIC_API_KEY
}

/** Resuelve el modelo a usar — con fallback si el provider no está configurado. */
function resolveModel(modelId: string): AIModelMeta {
  const m = getModel(modelId)
  if (isProviderAvailable(m.provider)) return m
  // Fallback al default (Claude Sonnet) si está disponible
  const fallback = getModel('claude-sonnet-4-5')
  if (isProviderAvailable(fallback.provider)) {
    console.warn(`[ai] modelo ${modelId} no disponible (sin API key de ${m.provider}), fallback a ${fallback.id}`)
    return fallback
  }
  throw new Error(`No hay ningún provider de IA configurado en el servidor`)
}

// ─── Llamada principal ───────────────────────────────────────────────────────
export async function chat(args: ChatArgs): Promise<ChatResult> {
  const model = resolveModel(args.modelId)
  const maxTokens = args.maxTokens ?? 1024
  const temperature = args.temperature ?? 0.7

  return chatAnthropic(model, args.system, args.messages, maxTokens, temperature)
}

async function chatAnthropic(
  model: AIModelMeta, system: string, messages: ChatMessage[],
  maxTokens: number, temperature: number,
): Promise<ChatResult> {
  const res = await anthropic().messages.create({
    model: model.apiModel,
    max_tokens: maxTokens,
    temperature,
    system,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  })
  const block = res.content.find((b) => b.type === 'text') as { text: string } | undefined
  const text = block?.text || ''
  const inputTokens = res.usage?.input_tokens || 0
  const outputTokens = res.usage?.output_tokens || 0
  return {
    text,
    inputTokens, outputTokens,
    totalTokens: inputTokens + outputTokens,
    costUsd: estimateCost(model.id, inputTokens, outputTokens),
    provider: model.provider,
    model: model.apiModel,
    resolvedModelId: model.id,
  }
}
