/**
 * Server actions de Genos:
 *  - createConversationAction: crea conv vacía (típicamente al primer mensaje)
 *  - sendMessageAction: añade user msg → llama LLM → guarda assistant reply
 *  - listConversationsAction: lista las conversaciones del user
 *  - escalateToHumanAction: cierra el chat y crea un admin_request type=support
 *      con el transcript completo en source_metadata
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { chat } from '@/lib/ai/client'
import { GENOS_SYSTEM_PROMPT, GENOS_DEFAULT_MODEL } from './system-prompt'
import { revalidatePath } from 'next/cache'

type Msg = { role: 'user' | 'assistant'; content: string }

async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('unauthorized')
  return { supabase, user }
}

export async function createConversationAction(input: {
  firstMessage: string
  contextUrl?: string
}): Promise<{ conversationId: string; assistantMessage: string }> {
  const { supabase, user } = await requireUser()
  const firstMsg = input.firstMessage?.trim()
  if (!firstMsg) throw new Error('empty_message')

  // 1) Crear conversación con título del primer mensaje (truncado)
  const title = firstMsg.length > 60 ? firstMsg.slice(0, 60) + '…' : firstMsg
  const { data: conv, error: convErr } = await supabase
    .from('genos_conversations')
    .insert({
      user_id: user.id,
      title,
      context_url: input.contextUrl || null,
    })
    .select('id')
    .single()
  if (convErr) throw new Error(convErr.message)

  // 2) Insertar user message
  const { error: umErr } = await supabase
    .from('genos_messages')
    .insert({
      conversation_id: conv.id,
      role: 'user',
      content: firstMsg,
    })
  if (umErr) throw new Error(umErr.message)

  // 3) Llamar LLM
  const result = await chat({
    modelId: GENOS_DEFAULT_MODEL,
    system: GENOS_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: firstMsg }],
    maxTokens: 600,
    temperature: 0.4,
  })

  // 4) Guardar assistant reply
  await supabase
    .from('genos_messages')
    .insert({
      conversation_id: conv.id,
      role: 'assistant',
      content: result.text,
      tokens_in: result.inputTokens,
      tokens_out: result.outputTokens,
      model: result.resolvedModelId,
    })

  return {
    conversationId: conv.id,
    assistantMessage: result.text,
  }
}

export async function sendMessageAction(input: {
  conversationId: string
  userMessage: string
}): Promise<{ assistantMessage: string }> {
  const { supabase, user } = await requireUser()
  const userMsg = input.userMessage?.trim()
  if (!userMsg) throw new Error('empty_message')

  // Verificar que la conversación es del user
  const { data: conv } = await supabase
    .from('genos_conversations')
    .select('id, user_id, escalated_to_request_id')
    .eq('id', input.conversationId)
    .single()
  if (!conv || conv.user_id !== user.id) throw new Error('not_found')
  if (conv.escalated_to_request_id) throw new Error('already_escalated')

  // Cargar historial previo
  const { data: history } = await supabase
    .from('genos_messages')
    .select('role, content')
    .eq('conversation_id', input.conversationId)
    .order('created_at', { ascending: true })

  const prevMessages: Msg[] = (history || [])
    .filter((m: { role: string }) => m.role === 'user' || m.role === 'assistant')
    .map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

  // Limit historial a últimos 20 mensajes para contener costes
  const trimmed = prevMessages.slice(-20)

  // Insertar el nuevo user msg
  await supabase
    .from('genos_messages')
    .insert({
      conversation_id: input.conversationId,
      role: 'user',
      content: userMsg,
    })

  // Llamar LLM con historial + nuevo
  const result = await chat({
    modelId: GENOS_DEFAULT_MODEL,
    system: GENOS_SYSTEM_PROMPT,
    messages: [...trimmed, { role: 'user', content: userMsg }],
    maxTokens: 600,
    temperature: 0.4,
  })

  await supabase
    .from('genos_messages')
    .insert({
      conversation_id: input.conversationId,
      role: 'assistant',
      content: result.text,
      tokens_in: result.inputTokens,
      tokens_out: result.outputTokens,
      model: result.resolvedModelId,
    })

  return { assistantMessage: result.text }
}

export async function listConversationsAction(): Promise<Array<{
  id: string
  title: string | null
  updated_at: string
  escalated_to_request_id: string | null
}>> {
  const { supabase, user } = await requireUser()
  const { data } = await supabase
    .from('genos_conversations')
    .select('id, title, updated_at, escalated_to_request_id')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(20)
  return data || []
}

export async function getConversationMessagesAction(
  conversationId: string
): Promise<Array<{ id: string; role: string; content: string; created_at: string }>> {
  const { supabase, user } = await requireUser()
  // RLS ya filtra por user_id, pero doble-chequeo por defensa
  const { data: conv } = await supabase
    .from('genos_conversations')
    .select('id, user_id')
    .eq('id', conversationId)
    .single()
  if (!conv || conv.user_id !== user.id) throw new Error('not_found')

  const { data } = await supabase
    .from('genos_messages')
    .select('id, role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
  return data || []
}

/**
 * Escalación a humano: crea un admin_request type=support con el transcript
 * completo en source_metadata, marca la conversación como escalada y
 * devuelve el id de la solicitud creada.
 */
export async function escalateToHumanAction(input: {
  conversationId: string
  summary: string
}): Promise<{ requestId: string }> {
  const { supabase, user } = await requireUser()
  const summary = input.summary?.trim()
  if (!summary || summary.length < 5) throw new Error('summary_too_short')

  const { data: conv } = await supabase
    .from('genos_conversations')
    .select('id, user_id, title, context_url, escalated_to_request_id')
    .eq('id', input.conversationId)
    .single()
  if (!conv || conv.user_id !== user.id) throw new Error('not_found')
  if (conv.escalated_to_request_id) {
    return { requestId: conv.escalated_to_request_id }
  }

  const { data: msgs } = await supabase
    .from('genos_messages')
    .select('role, content, created_at')
    .eq('conversation_id', input.conversationId)
    .order('created_at', { ascending: true })

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, display_name')
    .eq('id', user.id)
    .single()

  const transcript = (msgs || []).map((m: { role: string; content: string; created_at: string }) =>
    `[${m.role}] ${m.content}`
  ).join('\n\n')

  const subject = `Soporte vía Genos: ${conv.title?.slice(0, 60) || 'conversación'}`
  const message =
    `Resumen del user al escalar:\n\n${summary}\n\n` +
    `─── Transcript completo de la conversación con Genos ───\n\n${transcript}`

  const { data: req, error: reqErr } = await supabase
    .from('admin_requests')
    .insert({
      type: 'support',
      status: 'pending',
      priority: 'normal',
      requester_user_id: user.id,
      requester_email: profile?.email || user.email || 'unknown',
      requester_name: profile?.display_name || null,
      subject,
      message,
      source: 'chatbot',
      source_url: conv.context_url || null,
      source_metadata: {
        genos_conversation_id: conv.id,
        message_count: msgs?.length || 0,
        escalation_summary: summary,
      },
    })
    .select('id')
    .single()
  if (reqErr) throw new Error(reqErr.message)

  // Marcar la conversación como escalada
  await supabase
    .from('genos_conversations')
    .update({ escalated_to_request_id: req.id })
    .eq('id', input.conversationId)

  revalidatePath('/mis-solicitudes')
  revalidatePath('/admin/solicitudes')
  return { requestId: req.id }
}
