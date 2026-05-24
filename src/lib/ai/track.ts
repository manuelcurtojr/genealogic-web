/**
 * Logging de uso de IA en `ai_usage_logs`.
 *
 * Cada llamada exitosa o fallida a una IA debe registrarse aquí para:
 *  - Mostrar uso al criador (badge "47/500 respuestas este mes")
 *  - Facturar overage en planes con cuota
 *  - Detectar abuso o picos anómalos
 *  - Soporte ("¿por qué no funcionó esta respuesta?")
 *
 * Las inserciones son fire-and-forget: si falla el log NO debe romper
 * la respuesta principal de la IA. Por eso try/catch + console.error.
 */
import 'server-only'
import { createKennelAdminClient } from '@/lib/supabase/server'
import type { ChatResult } from './client'

export type LogScope =
  | 'emailbot_reply'
  | 'emailbot_test'
  | 'knowledge_import_url'
  | 'knowledge_import_file'
  | 'other'

export type LogArgs = {
  scope: LogScope
  kennelId: string | null
  userId?: string | null
  result?: ChatResult
  /** Si error_message está, status pasa a 'error' automático */
  errorMessage?: string
  threadId?: string | null
  knowledgeEntryId?: string | null
  requestMeta?: Record<string, unknown>
}

/** Inserta un row en ai_usage_logs. Nunca lanza — fail-silently. */
export async function logAIUsage(args: LogArgs): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createKennelAdminClient() as any
    await admin.from('ai_usage_logs').insert({
      kennel_id: args.kennelId,
      user_id: args.userId ?? null,
      scope: args.scope,
      provider: args.result?.provider || 'anthropic',
      model: args.result?.model || 'unknown',
      input_tokens: args.result?.inputTokens || 0,
      output_tokens: args.result?.outputTokens || 0,
      estimated_cost_usd: args.result?.costUsd || 0,
      thread_id: args.threadId ?? null,
      knowledge_entry_id: args.knowledgeEntryId ?? null,
      request_meta: args.requestMeta ?? null,
      status: args.errorMessage ? 'error' : 'success',
      error_message: args.errorMessage ?? null,
    })
  } catch (e) {
    console.error('[ai/track] failed to log usage:', e)
  }
}

/** Uso del mes actual para un kennel (lectura desde la view). */
export async function getCurrentMonthUsage(kennelId: string): Promise<{
  bot_replies_count: number
  tokens_total: number
  cost_usd_total: number
}> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data } = await admin
    .from('kennel_bot_usage_current_month')
    .select('*')
    .eq('kennel_id', kennelId)
    .maybeSingle()
  return data || { bot_replies_count: 0, tokens_total: 0, cost_usd_total: 0 }
}
