/**
 * Cliente unificado para llamadas a IAs (Anthropic / OpenAI / Google).
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
 * ENV vars necesarias por provider:
 *   ANTHROPIC_API_KEY        (ya configurada)
 *   OPENAI_API_KEY           (nueva)
 *   GOOGLE_GENERATIVE_AI_KEY (nueva)
 *
 * Si falta la key del provider seleccionado, intenta fallback al default
 * (Anthropic). Si tampoco hay Anthropic, throw.
 */
import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
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
let _openai: OpenAI | null = null
let _google: GoogleGenerativeAI | null = null

function anthropic(): Anthropic {
  if (_anthropic) return _anthropic
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY no configurada')
  _anthropic = new Anthropic({ apiKey: key })
  return _anthropic
}

function openai(): OpenAI {
  if (_openai) return _openai
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('OPENAI_API_KEY no configurada')
  _openai = new OpenAI({ apiKey: key })
  return _openai
}

function google(): GoogleGenerativeAI {
  if (_google) return _google
  const key = process.env.GOOGLE_GENERATIVE_AI_KEY
  if (!key) throw new Error('GOOGLE_GENERATIVE_AI_KEY no configurada')
  _google = new GoogleGenerativeAI(key)
  return _google
}

/**
 * Devuelve true si el provider del modelo tiene API key configurada.
 * Útil para validar UI (no ofrecer modelos sin key).
 */
export function isProviderAvailable(provider: string): boolean {
  switch (provider) {
    case 'anthropic': return !!process.env.ANTHROPIC_API_KEY
    case 'openai':    return !!process.env.OPENAI_API_KEY
    case 'google':    return !!process.env.GOOGLE_GENERATIVE_AI_KEY
    default:          return false
  }
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

  switch (model.provider) {
    case 'anthropic':
      return chatAnthropic(model, args.system, args.messages, maxTokens, temperature)
    case 'openai':
      return chatOpenAI(model, args.system, args.messages, maxTokens, temperature)
    case 'google':
      return chatGoogle(model, args.system, args.messages, maxTokens, temperature)
  }
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

async function chatOpenAI(
  model: AIModelMeta, system: string, messages: ChatMessage[],
  maxTokens: number, temperature: number,
): Promise<ChatResult> {
  const res = await openai().chat.completions.create({
    model: model.apiModel,
    max_tokens: maxTokens,
    temperature,
    messages: [
      { role: 'system', content: system },
      ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ],
  })
  const text = res.choices[0]?.message?.content || ''
  const inputTokens = res.usage?.prompt_tokens || 0
  const outputTokens = res.usage?.completion_tokens || 0
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

async function chatGoogle(
  model: AIModelMeta, system: string, messages: ChatMessage[],
  maxTokens: number, temperature: number,
): Promise<ChatResult> {
  // Google no tiene "system" como rol separado en su API; lo prependemos
  // al primer user message. Para histórico largo lo mete como systemInstruction
  // (disponible en modelos 1.5+).
  const gen = google().getGenerativeModel({
    model: model.apiModel,
    systemInstruction: system,
    generationConfig: { temperature, maxOutputTokens: maxTokens },
  })
  // Convertir messages al formato Google (history + último mensaje)
  if (messages.length === 0) {
    return zeroResult(model)
  }
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))
  const chat = gen.startChat({ history })
  const lastMessage = messages[messages.length - 1]
  const res = await chat.sendMessage(lastMessage.content)
  const text = res.response.text() || ''
  // Google no devuelve token counts en sendMessage; aproximamos
  const usage = res.response.usageMetadata
  const inputTokens = usage?.promptTokenCount || estimateTokens(system + JSON.stringify(messages))
  const outputTokens = usage?.candidatesTokenCount || estimateTokens(text)
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

function zeroResult(model: AIModelMeta): ChatResult {
  return {
    text: '', inputTokens: 0, outputTokens: 0, totalTokens: 0, costUsd: 0,
    provider: model.provider, model: model.apiModel, resolvedModelId: model.id,
  }
}

/** Aproximación rough: 4 chars ≈ 1 token. Solo para fallback de Google. */
function estimateTokens(s: string): number {
  return Math.ceil(s.length / 4)
}
