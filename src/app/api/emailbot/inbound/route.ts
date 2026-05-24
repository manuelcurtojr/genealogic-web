import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateReply, type BotContext, type BotMessage } from '@/lib/emailbot'
import { logAIUsage } from '@/lib/ai/track'

export const maxDuration = 60

/**
 * POST /api/emailbot/inbound
 *
 * Webhook que recibe emails entrantes desde Resend Inbound (o similar) o desde
 * un parser tipo CloudMailin/Mailgun routes. La autenticación es por un secreto
 * compartido (header X-Inbound-Secret) que el provider envía en cada hit.
 *
 * Setup necesario (Phase B — depende del usuario):
 *   1. Configurar dominio inbound en Resend (ej. inbound.genealogic.io)
 *   2. Añadir MX records: 10 inbound-smtp.eu-west-1.amazonaws.com (o el endpoint de Resend)
 *   3. Crear una webhook que apunte a https://genealogic.io/api/emailbot/inbound
 *   4. Definir env var EMAILBOT_INBOUND_SECRET con un token aleatorio
 *   5. En emailbot_config.inbound_address de cada kennel guardar la dirección
 *      única que recibirá emails para ese kennel
 *      (p.ej. iremacurto@inbound.genealogic.io)
 *
 * Payload esperado (formato compatible con varios providers):
 *   {
 *     "to": "iremacurto@inbound.genealogic.io",
 *     "from": "familia@gmail.com",
 *     "from_name": "María García",
 *     "subject": "Pregunta sobre cachorros",
 *     "text": "...cuerpo del email en texto plano...",
 *     "html": "<p>...</p>",
 *     "message_id": "<unique-id@provider>"
 *   }
 */
export async function POST(request: NextRequest) {
  // ─── Auth ────────────────────────────────────────────────────────────────
  const secret = process.env.EMAILBOT_INBOUND_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'EMAILBOT_INBOUND_SECRET no configurado' }, { status: 503 })
  }
  const provided = request.headers.get('x-inbound-secret') || request.headers.get('authorization')?.replace(/^Bearer\s+/, '')
  if (provided !== secret) {
    return NextResponse.json({ error: 'Invalid inbound secret' }, { status: 401 })
  }

  // ─── Parse payload ───────────────────────────────────────────────────────
  let payload: any
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const toAddress = String(payload.to || payload.recipient || '').toLowerCase().trim()
  const fromAddress = String(payload.from || payload.sender || '').toLowerCase().trim()
  const fromName = payload.from_name || payload.sender_name || null
  const subject = payload.subject || null
  const bodyText = payload.text || payload.body_text || null
  const bodyHtml = payload.html || payload.body_html || null
  const externalMessageId = payload.message_id || payload.id || null

  if (!toAddress || !fromAddress || (!bodyText && !bodyHtml)) {
    return NextResponse.json({ error: 'Missing to/from/body' }, { status: 400 })
  }

  // ─── Resolver kennel por inbound_address ─────────────────────────────────
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: cfg } = await admin
    .from('emailbot_config')
    .select('kennel_id, is_enabled, reply_from_name, reply_from_email, signature, fallback_after_n_replies')
    .eq('inbound_address', toAddress)
    .single()

  if (!cfg) {
    return NextResponse.json({ error: 'No kennel matches this inbound address' }, { status: 404 })
  }
  if (!cfg.is_enabled) {
    // El bot está desactivado: guardamos el mensaje pero no respondemos
    await storeInboundOnly(admin, cfg.kennel_id, fromAddress, fromName, subject, bodyText, bodyHtml, externalMessageId)
    return NextResponse.json({ ok: true, status: 'bot_disabled' })
  }

  const { data: kennel } = await admin
    .from('kennels')
    .select('id, name, description, bot_model')
    .eq('id', cfg.kennel_id)
    .single()
  if (!kennel) {
    return NextResponse.json({ error: 'Kennel not found' }, { status: 404 })
  }

  // ─── Determinar escenario + datos del contacto ───────────────────────────
  let scenario: BotContext['scenario'] = 'new_lead'
  let ownerId: string | null = null
  let reservationId: string | null = null

  const { data: owner } = await admin
    .from('owners')
    .select('id, full_name')
    .eq('kennel_id', cfg.kennel_id)
    .eq('email', fromAddress)
    .maybeSingle()
  if (owner) ownerId = owner.id

  if (owner) {
    const { data: activeRes } = await admin
      .from('puppy_reservations')
      .select('id, status')
      .eq('kennel_id', cfg.kennel_id)
      .eq('owner_id', owner.id)
      .not('status', 'in', '("delivered","cancelled")')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (activeRes) {
      reservationId = activeRes.id
      scenario = ['interested', 'waitlisted'].includes(activeRes.status) ? 'waitlist' : 'reservation'
    }
  }

  // ─── Buscar hilo existente o crear nuevo ─────────────────────────────────
  let { data: thread } = await admin
    .from('emailbot_threads')
    .select('id, bot_replies_count, status')
    .eq('kennel_id', cfg.kennel_id)
    .eq('contact_email', fromAddress)
    .eq('status', 'active')
    .order('last_message_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!thread) {
    const ins = await admin
      .from('emailbot_threads')
      .insert({
        kennel_id: cfg.kennel_id,
        contact_email: fromAddress,
        contact_name: fromName || owner?.full_name || null,
        owner_id: ownerId, reservation_id: reservationId,
        subject: subject || '(sin asunto)',
        status: 'active', bot_replies_count: 0,
        last_message_at: new Date().toISOString(),
      })
      .select('id, bot_replies_count, status')
      .single()
    thread = ins.data || null
  }
  if (!thread) {
    return NextResponse.json({ error: 'No se pudo crear hilo' }, { status: 500 })
  }

  // ─── Guardar mensaje inbound ─────────────────────────────────────────────
  await admin.from('emailbot_messages').insert({
    thread_id: thread.id,
    direction: 'inbound',
    from_email: fromAddress,
    to_email: toAddress,
    subject, body_text: bodyText, body_html: bodyHtml,
    is_from_bot: false,
    external_message_id: externalMessageId,
  })

  // ─── Cargar últimos mensajes del hilo (contexto) ─────────────────────────
  const { data: history } = await admin
    .from('emailbot_messages')
    .select('direction, body_text, is_from_bot')
    .eq('thread_id', thread.id)
    .order('created_at', { ascending: true })
    .limit(20)

  const messages: BotMessage[] = (history || []).map(m => ({
    role: m.direction === 'inbound' ? 'user' : 'assistant',
    content: m.body_text || '',
  }))

  // ─── Cargar Biblioteca activa ────────────────────────────────────────────
  const { data: entries } = await admin
    .from('knowledge_entries')
    .select('category, title, content')
    .eq('kennel_id', cfg.kennel_id)
    .eq('is_active', true)
    .order('category').order('position')

  // ─── Decidir si escalar antes de llamar al bot ───────────────────────────
  const fallbackAfter = cfg.fallback_after_n_replies ?? 3
  if (thread.bot_replies_count >= fallbackAfter) {
    await admin
      .from('emailbot_threads')
      .update({ status: 'derived_to_human', last_message_at: new Date().toISOString() })
      .eq('id', thread.id)
    return NextResponse.json({ ok: true, status: 'escalated_max_replies' })
  }

  // ─── Generar respuesta ───────────────────────────────────────────────────
  let botResult
  try {
    botResult = await generateReply(
      {
        kennelName: kennel.name,
        kennelDescription: kennel.description,
        scenario,
        contactName: fromName || owner?.full_name || null,
        knowledge: entries || [],
        modelId: (kennel as any).bot_model || undefined,
      },
      messages,
    )
    await logAIUsage({
      scope: 'emailbot_reply',
      kennelId: kennel.id,
      result: {
        text: botResult.reply, totalTokens: botResult.tokensUsed,
        inputTokens: botResult.usage.inputTokens, outputTokens: botResult.usage.outputTokens,
        costUsd: botResult.usage.costUsd, provider: botResult.usage.provider,
        model: botResult.usage.model, resolvedModelId: botResult.usage.resolvedModelId,
      },
      threadId: thread.id,
      requestMeta: { scenario, messages_count: messages.length, knowledge_count: entries?.length || 0 },
    })
  } catch (err: any) {
    console.error('Emailbot inbound generate error:', err)
    await logAIUsage({
      scope: 'emailbot_reply',
      kennelId: kennel.id,
      threadId: thread.id,
      errorMessage: err.message || 'unknown',
    })
    return NextResponse.json({ error: err.message }, { status: 500 })
  }

  // ─── Si Claude pidió escalar, marcar y NO responder ──────────────────────
  if (botResult.shouldEscalate) {
    await admin.from('emailbot_threads').update({
      status: 'derived_to_human',
      last_message_at: new Date().toISOString(),
    }).eq('id', thread.id)
    await admin.from('emailbot_messages').insert({
      thread_id: thread.id, direction: 'outbound',
      from_email: 'system', to_email: fromAddress,
      subject: null, body_text: null, body_html: null,
      is_from_bot: true, was_flagged: true,
      flagged_reason: botResult.escalationReason || 'requested_escalation',
      tokens_used: botResult.tokensUsed,
    })
    return NextResponse.json({ ok: true, status: 'escalated', reason: botResult.escalationReason })
  }

  // ─── Enviar reply via Resend ─────────────────────────────────────────────
  const replyFromEmail = cfg.reply_from_email || `bot@genealogic.io`
  const replyFromName = cfg.reply_from_name || kennel.name
  const replySubject = subject?.toLowerCase().startsWith('re:') ? subject : `Re: ${subject || '(sin asunto)'}`
  const finalBody = cfg.signature ? `${botResult.reply}\n\n${cfg.signature}` : botResult.reply

  let sentMessageId: string | null = null
  let sendError: string | null = null
  if (process.env.RESEND_API_KEY) {
    try {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${replyFromName} <${replyFromEmail}>`,
          to: fromAddress,
          subject: replySubject,
          text: finalBody,
          // headers para hilo (RFC 2822)
          headers: externalMessageId ? { 'In-Reply-To': externalMessageId, 'References': externalMessageId } : undefined,
        }),
      })
      const json: any = await resendRes.json()
      if (!resendRes.ok) sendError = json.message || 'Resend error'
      else sentMessageId = json.id || null
    } catch (err: any) {
      sendError = err.message
    }
  } else {
    sendError = 'RESEND_API_KEY no configurada — reply generado pero NO enviado'
  }

  // ─── Guardar mensaje outbound + actualizar hilo ──────────────────────────
  await admin.from('emailbot_messages').insert({
    thread_id: thread.id, direction: 'outbound',
    from_email: replyFromEmail, to_email: fromAddress,
    subject: replySubject,
    body_text: finalBody, body_html: null,
    is_from_bot: true, was_flagged: !!sendError,
    flagged_reason: sendError, external_message_id: sentMessageId,
    tokens_used: botResult.tokensUsed,
  })

  await admin.from('emailbot_threads').update({
    bot_replies_count: thread.bot_replies_count + 1,
    last_message_at: new Date().toISOString(),
  }).eq('id', thread.id)

  await admin.from('emailbot_config').update({
    last_inbound_at: new Date().toISOString(),
  }).eq('kennel_id', cfg.kennel_id)

  return NextResponse.json({
    ok: true,
    status: sendError ? 'reply_generated_send_failed' : 'replied',
    error: sendError,
    thread_id: thread.id,
  })
}

async function storeInboundOnly(
  admin: any, kennelId: string, fromAddress: string, fromName: string | null,
  subject: string | null, bodyText: string | null, bodyHtml: string | null,
  externalMessageId: string | null,
) {
  const { data: thread } = await admin
    .from('emailbot_threads')
    .insert({
      kennel_id: kennelId,
      contact_email: fromAddress,
      contact_name: fromName,
      subject: subject || '(sin asunto)',
      status: 'derived_to_human',
      last_message_at: new Date().toISOString(),
    })
    .select('id')
    .single()
  if (thread?.id) {
    await admin.from('emailbot_messages').insert({
      thread_id: thread.id, direction: 'inbound',
      from_email: fromAddress, to_email: 'disabled',
      subject, body_text: bodyText, body_html: bodyHtml,
      is_from_bot: false,
      external_message_id: externalMessageId,
    })
  }
}
