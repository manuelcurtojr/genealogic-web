/**
 * Server actions del sistema de Admin Requests.
 *
 * Tres flujos:
 *   1) USER → crea support / claim, sube evidencias, responde mensajes,
 *      puede cancelar mientras esté pending.
 *   2) ADMIN → asigna, cambia status/priority, responde, aprueba, rechaza.
 *   3) FILE upload → al bucket privado `claim-evidence`.
 *
 * Toda la auth pasa por el cookie supabase del request; los validates
 * extra (admin role) los hace tanto la RLS como esta capa.
 */
'use server'

import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendTransactionalEmail } from '@/lib/email/send'
import { notifySuperAdmin } from '@/lib/admin/notify'
import { logAdminAction } from '@/lib/admin/audit-log'
import type {
  AdminRequestType,
  AdminRequestStatus,
  AdminRequestPriority,
  AdminRequestSource,
  EvidenceFile,
  FeedbackScope,
} from './types'
import { FEEDBACK_SCOPE_LABELS } from './types'

// Si está seteada, se manda email directo al super admin con cada feedback
// (además de quedar en /admin/solicitudes). Útil para reaccionar rápido
// en los primeros meses post-launch.
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'gestion@manuelcurto.com'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://genealogic.io'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('unauthorized')
  return { supabase, user }
}

async function requireAdmin() {
  const { supabase, user } = await requireUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') throw new Error('forbidden')
  return { supabase, user }
}

function sanitizeFilename(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 120)
}

// ─────────────────────────────────────────────────────────────────────────────
// USER: crear soporte
// ─────────────────────────────────────────────────────────────────────────────

export async function createSupportRequestAction(input: {
  subject: string
  message: string
  source?: AdminRequestSource
  sourceUrl?: string
  sourceMetadata?: Record<string, unknown>
}): Promise<{ id: string }> {
  const { supabase, user } = await requireUser()
  const subject = input.subject?.trim()
  const message = input.message?.trim()
  if (!subject || subject.length < 3) throw new Error('subject_too_short')
  if (!message || message.length < 10) throw new Error('message_too_short')

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, display_name')
    .eq('id', user.id)
    .single()

  const { data, error } = await supabase
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
      source: input.source || 'soporte_form',
      source_url: input.sourceUrl || null,
      source_metadata: input.sourceMetadata || {},
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/soporte')
  revalidatePath('/admin/solicitudes')

  // Notificación al super admin (best-effort, no rompe si falla).
  // Dedupe por request_id para que no se mande 2x si la action se reintenta.
  notifySuperAdmin({
    kind: 'support_request',
    subject: `Soporte: ${subject}`,
    body: `De: ${profile?.display_name || profile?.email || 'usuario'} (${profile?.email || 'sin email'})\n\n${message}`,
    dedupeKey: `admin_alert:support:${data.id}`,
    ctaUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://genealogic.io'}/admin/solicitudes/${data.id}`,
    ctaLabel: 'Ver ticket',
  }).catch(() => {})

  return { id: data.id }
}

// ─────────────────────────────────────────────────────────────────────────────
// USER: crear feedback rápido desde el widget "¿Algo ha salido mal?"
// ─────────────────────────────────────────────────────────────────────────────
//
// Diferente del support form:
//  - Subject se autocompleta a partir del scope (no se le pide al user)
//  - Captura automáticamente página, URL, viewport, user_agent
//  - Si el user habló con la IA antes, guardamos el transcript en metadata
//  - Manda email directo al super admin para reacción rápida (opt-in via env)
//
// Pensado para fricción mínima: el user solo escribe el problema.

export async function createFeedbackAction(input: {
  scope: FeedbackScope
  message: string
  pageLabel: string          // ej. "Importador de pedigrees" — texto humano del contexto
  pageUrl: string            // location.pathname + search (cliente lo manda)
  viewport?: string          // "375x812" — útil para diferenciar mobile vs desktop
  userAgent?: string         // navigator.userAgent
  aiConversation?: Array<{ role: 'user' | 'assistant'; content: string }>
}): Promise<{ id: string }> {
  const { supabase, user } = await requireUser()
  const message = input.message?.trim()
  if (!message || message.length < 5) throw new Error('message_too_short')

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, display_name')
    .eq('id', user.id)
    .single()

  const scopeLabel = FEEDBACK_SCOPE_LABELS[input.scope] || 'Otro'
  // Subject autogenerado: hace que el admin de un vistazo sepa de dónde viene
  const subject = `[Feedback · ${scopeLabel}] ${message.slice(0, 80)}${message.length > 80 ? '…' : ''}`

  const sourceMetadata = {
    scope: input.scope,
    scope_label: scopeLabel,
    page_label: input.pageLabel,
    viewport: input.viewport || null,
    user_agent: input.userAgent || null,
    ai_conversation: input.aiConversation || null,
    captured_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('admin_requests')
    .insert({
      type: 'feedback',
      status: 'pending',
      // Feedback es "high" por defecto — queremos verlo rápido para iterar producto
      priority: 'high',
      requester_user_id: user.id,
      requester_email: profile?.email || user.email || 'unknown',
      requester_name: profile?.display_name || null,
      subject,
      message,
      source: 'feedback_widget' as AdminRequestSource,
      source_url: input.pageUrl,
      source_metadata: sourceMetadata,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  // Notificar al super admin por email (best-effort, no rompe si falla)
  if (SUPER_ADMIN_EMAIL) {
    try {
      const aiSummary = input.aiConversation && input.aiConversation.length > 0
        ? `\n\n--- Conversación previa con la IA ---\n${input.aiConversation
            .map(m => `${m.role === 'user' ? 'USER' : 'AI'}: ${m.content}`)
            .join('\n\n')}`
        : ''

      const plainBody = [
        `Nuevo feedback en Genealogic`,
        ``,
        `Zona: ${scopeLabel} (${input.scope})`,
        `Página: ${input.pageLabel}`,
        `URL: ${input.pageUrl}`,
        `Viewport: ${input.viewport || '—'}`,
        `Usuario: ${profile?.display_name || '—'} <${profile?.email || user.email}>`,
        `Ticket ID: ${data.id}`,
        ``,
        `--- Mensaje ---`,
        message,
        aiSummary,
        ``,
        `Ver en admin: ${SITE_URL}/admin/solicitudes/${data.id}`,
      ].join('\n')

      // Reusamos el sistema de email enviando directamente con Resend en plain
      // text (no merece la pena un template React para esto — es para nosotros).
      const apiKey = process.env.RESEND_API_KEY
      if (apiKey) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Genealogic Feedback <feedback@genealogic.io>',
            to: SUPER_ADMIN_EMAIL,
            reply_to: profile?.email || user.email || undefined,
            subject: `🐛 [${scopeLabel}] ${message.slice(0, 60)}${message.length > 60 ? '…' : ''}`,
            text: plainBody,
          }),
        })
      }
    } catch (err) {
      console.error('[feedback] super admin email failed', err)
    }
  }

  revalidatePath('/soporte')
  revalidatePath('/admin/solicitudes')
  return { id: data.id }
}

// ─────────────────────────────────────────────────────────────────────────────
// USER: crear claim de perro o criadero
// ─────────────────────────────────────────────────────────────────────────────

export async function createClaimRequestAction(input: {
  type: 'claim_dog' | 'claim_kennel'
  targetId: string
  message: string
  evidence: EvidenceFile[]
}): Promise<{ id: string }> {
  const { supabase, user } = await requireUser()
  const message = input.message?.trim()
  if (!message || message.length < 20) throw new Error('message_too_short')
  if (!input.evidence || input.evidence.length === 0) throw new Error('evidence_required')

  // Verificar que el target existe y está sin owner
  if (input.type === 'claim_dog') {
    const { data: dog } = await supabase
      .from('dogs')
      .select('id, name, owner_id')
      .eq('id', input.targetId)
      .single()
    if (!dog) throw new Error('dog_not_found')
    if (dog.owner_id) throw new Error('dog_already_claimed')
  } else {
    const { data: kennel } = await supabase
      .from('kennels')
      .select('id, name, owner_id')
      .eq('id', input.targetId)
      .single()
    if (!kennel) throw new Error('kennel_not_found')
    if (kennel.owner_id) throw new Error('kennel_already_claimed')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, display_name')
    .eq('id', user.id)
    .single()

  const subject = input.type === 'claim_dog'
    ? `Reclamación de perro`
    : `Reclamación de criadero`

  const payload = {
    type: input.type,
    status: 'pending' as const,
    priority: 'normal' as const,
    requester_user_id: user.id,
    requester_email: profile?.email || user.email || 'unknown',
    requester_name: profile?.display_name || null,
    subject,
    message,
    evidence: input.evidence,
    source: input.type === 'claim_dog' ? 'dog_page' : 'kennel_page' as AdminRequestSource,
    ...(input.type === 'claim_dog'
      ? { target_dog_id: input.targetId }
      : { target_kennel_id: input.targetId }),
  }

  const { data, error } = await supabase
    .from('admin_requests')
    .insert(payload)
    .select('id')
    .single()

  if (error) {
    // 23505 = unique violation → ya tiene un claim abierto
    if (error.code === '23505') throw new Error('claim_already_pending')
    throw new Error(error.message)
  }

  revalidatePath('/soporte')
  revalidatePath('/admin/solicitudes')

  // Alerta al super admin — los claims son críticos (transfieren ownership).
  notifySuperAdmin({
    kind: input.type === 'claim_dog' ? 'claim_dog' : 'claim_kennel',
    subject: input.type === 'claim_dog'
      ? `Nuevo claim de perro`
      : `Nuevo claim de criadero`,
    body: `De: ${profile?.display_name || profile?.email || 'usuario'} (${profile?.email})\n\n${message}\n\nEvidencias adjuntas: ${input.evidence.length}`,
    dedupeKey: `admin_alert:claim:${data.id}`,
    ctaUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://genealogic.io'}/admin/solicitudes/${data.id}`,
    ctaLabel: 'Revisar claim',
  }).catch(() => {})

  return { id: data.id }
}

// ─────────────────────────────────────────────────────────────────────────────
// USER: subir un fichero de evidencia (devuelve path)
// ─────────────────────────────────────────────────────────────────────────────

export async function uploadEvidenceAction(formData: FormData): Promise<EvidenceFile> {
  const { user } = await requireUser()
  const file = formData.get('file')
  const tempId = (formData.get('tempId') as string) || 'draft'
  if (!(file instanceof File)) throw new Error('no_file')

  const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
  if (!ALLOWED.includes(file.type)) throw new Error('invalid_mime')
  if (file.size > 10 * 1024 * 1024) throw new Error('file_too_large')

  // Subimos con admin client para evitar problemas de RLS de storage
  // pero el path siempre va prefijado con el userId real → trazable.
  const admin = createKennelAdminClient() as unknown as ReturnType<typeof createKennelAdminClient>
  const safe = sanitizeFilename(file.name)
  const stamp = Date.now()
  const path = `${user.id}/${tempId}/${stamp}_${safe}`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const arrayBuf = await file.arrayBuffer()
  const bytes = new Uint8Array(arrayBuf)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any).storage
    .from('claim-evidence')
    .upload(path, bytes, { contentType: file.type, upsert: false })
  if (error) throw new Error(error.message)

  return {
    path,
    filename: file.name,
    size: file.size,
    mime: file.type,
    uploaded_at: new Date().toISOString(),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// USER: añadir mensaje a su request
// ─────────────────────────────────────────────────────────────────────────────

export async function replyToRequestAction(input: {
  requestId: string
  body: string
}): Promise<void> {
  const { supabase, user } = await requireUser()
  const body = input.body?.trim()
  if (!body) throw new Error('empty_body')

  const { error } = await supabase
    .from('admin_request_messages')
    .insert({
      request_id: input.requestId,
      author_user_id: user.id,
      author_is_admin: false,
      body,
    })
  if (error) throw new Error(error.message)

  // Re-abre a 'pending' si estaba awaiting_user
  await supabase
    .from('admin_requests')
    .update({ status: 'pending' })
    .eq('id', input.requestId)
    .eq('requester_user_id', user.id)
    .eq('status', 'awaiting_user')

  revalidatePath(`/soporte/${input.requestId}`)
  revalidatePath('/admin/solicitudes')
}

// ─────────────────────────────────────────────────────────────────────────────
// USER: cancelar su request
// ─────────────────────────────────────────────────────────────────────────────

export async function cancelRequestAction(requestId: string): Promise<void> {
  const { supabase, user } = await requireUser()
  const { error } = await supabase
    .from('admin_requests')
    .update({ status: 'cancelled' })
    .eq('id', requestId)
    .eq('requester_user_id', user.id)
  if (error) throw new Error(error.message)
  revalidatePath('/soporte')
  revalidatePath('/admin/solicitudes')
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: cambiar status / priority / assigned / notas
// ─────────────────────────────────────────────────────────────────────────────

export async function adminUpdateRequestAction(input: {
  requestId: string
  status?: AdminRequestStatus
  priority?: AdminRequestPriority
  assignedAdminId?: string | null
  adminNotes?: string
}): Promise<void> {
  const { supabase, user } = await requireAdmin()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const patch: Record<string, any> = {}
  if (input.status) patch.status = input.status
  if (input.priority) patch.priority = input.priority
  if (input.assignedAdminId !== undefined) patch.assigned_admin_id = input.assignedAdminId
  if (input.adminNotes !== undefined) patch.admin_notes = input.adminNotes

  const { error } = await supabase
    .from('admin_requests')
    .update(patch)
    .eq('id', input.requestId)
  if (error) throw new Error(error.message)

  // Audit log: solo registra cambios estructurales (status/priority/asignación),
  // las admin_notes son texto libre y no aportan valor en el feed.
  if (input.status || input.priority || input.assignedAdminId !== undefined) {
    void logAdminAction({
      adminId: user.id,
      action: 'claim_resolve',
      targetTable: 'admin_requests',
      targetId: input.requestId,
      payload: {
        status: input.status,
        priority: input.priority,
        assigned_admin_id: input.assignedAdminId,
      },
    })
  }

  revalidatePath(`/admin/solicitudes/${input.requestId}`)
  revalidatePath('/admin/solicitudes')
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: responder en el thread
// ─────────────────────────────────────────────────────────────────────────────

export async function adminReplyToRequestAction(input: {
  requestId: string
  body: string
  setAwaitingUser?: boolean
}): Promise<void> {
  const { supabase, user } = await requireAdmin()
  const body = input.body?.trim()
  if (!body) throw new Error('empty_body')

  const { data: insertedMsg, error } = await supabase
    .from('admin_request_messages')
    .insert({
      request_id: input.requestId,
      author_user_id: user.id,
      author_is_admin: true,
      body,
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)

  if (input.setAwaitingUser) {
    await supabase
      .from('admin_requests')
      .update({ status: 'awaiting_user' })
      .eq('id', input.requestId)
  }

  // Email al user con la respuesta del admin (best-effort)
  try {
    const { data: req } = await supabase
      .from('admin_requests')
      .select('subject, requester_email, requester_name, requester_user_id')
      .eq('id', input.requestId)
      .single()
    if (req?.requester_email) {
      await sendTransactionalEmail(
        req.requester_email,
        {
          template: 'support_replied',
          props: {
            recipientName: req.requester_name || null,
            requestSubject: req.subject,
            adminMessagePreview: body,
            requestId: input.requestId,
          },
        },
        {
          userId: req.requester_user_id || undefined,
          // Dedupe por id del mensaje insertado — cada reply un email único
          dedupeKey: `support_reply:${insertedMsg?.id}`,
        },
      )
    }
  } catch { /* swallow */ }

  revalidatePath(`/admin/solicitudes/${input.requestId}`)
  revalidatePath(`/soporte/${input.requestId}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: aprobar claim → función SQL transaccional
// ─────────────────────────────────────────────────────────────────────────────

export async function adminApproveClaimAction(input: {
  requestId: string
  resolutionNote?: string
}): Promise<void> {
  const { supabase, user } = await requireAdmin()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).rpc('approve_claim_request', {
    p_request_id: input.requestId,
    p_resolution_note: input.resolutionNote || null,
  })
  if (error) throw new Error(error.message)

  // Audit log: aprobar un claim transfiere ownership (acción crítica).
  void logAdminAction({
    adminId: user.id,
    action: 'claim_approve',
    targetTable: 'admin_requests',
    targetId: input.requestId,
    payload: { resolution_note: input.resolutionNote || null },
  })

  // Email al user notificándole la aprobación (best-effort)
  try {
    const { data: req } = await supabase
      .from('admin_requests')
      .select(`
        type, subject, requester_email, requester_name, requester_user_id, resolution_note,
        target_dog:dogs!admin_requests_target_dog_id_fkey(name, slug, id),
        target_kennel:kennels!admin_requests_target_kennel_id_fkey(name, slug, id)
      `)
      .eq('id', input.requestId)
      .single()

    if (req?.requester_email && (req.type === 'claim_dog' || req.type === 'claim_kennel')) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dog: any = req.target_dog
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const kennel: any = req.target_kennel
      const targetType = req.type === 'claim_dog' ? 'dog' : 'kennel'
      const target = targetType === 'dog' ? dog : kennel
      if (target) {
        const targetUrl = `${SITE_URL}/${targetType === 'dog' ? 'dogs' : 'kennels'}/${target.slug || target.id}`
        await sendTransactionalEmail(
          req.requester_email,
          {
            template: 'claim_approved',
            props: {
              recipientName: req.requester_name || null,
              targetType: targetType as 'dog' | 'kennel',
              targetName: target.name,
              targetUrl,
              resolutionNote: req.resolution_note || input.resolutionNote || null,
            },
          },
          {
            userId: req.requester_user_id || undefined,
            dedupeKey: `claim_approved:${input.requestId}`,
          },
        )
      }
    }
  } catch { /* swallow */ }

  revalidatePath(`/admin/solicitudes/${input.requestId}`)
  revalidatePath('/admin/solicitudes')
  revalidatePath('/soporte')
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: rechazar request
// ─────────────────────────────────────────────────────────────────────────────

export async function adminRejectRequestAction(input: {
  requestId: string
  resolutionNote: string
}): Promise<void> {
  const { supabase, user } = await requireAdmin()
  if (!input.resolutionNote?.trim()) throw new Error('resolution_required')

  const { error } = await supabase
    .from('admin_requests')
    .update({
      status: 'rejected',
      resolved_at: new Date().toISOString(),
      resolved_by_admin_id: user.id,
      resolution_note: input.resolutionNote.trim(),
    })
    .eq('id', input.requestId)
  if (error) throw new Error(error.message)

  void logAdminAction({
    adminId: user.id,
    action: 'claim_reject',
    targetTable: 'admin_requests',
    targetId: input.requestId,
    payload: { resolution_note: input.resolutionNote.trim() },
  })

  // Email al user notificándole el rechazo (best-effort). Solo para claims —
  // los support tickets rechazados ya se comunican via support_replied.
  try {
    const { data: req } = await supabase
      .from('admin_requests')
      .select(`
        type, subject, requester_email, requester_name, requester_user_id,
        target_dog:dogs!admin_requests_target_dog_id_fkey(name),
        target_kennel:kennels!admin_requests_target_kennel_id_fkey(name)
      `)
      .eq('id', input.requestId)
      .single()

    if (req?.requester_email && (req.type === 'claim_dog' || req.type === 'claim_kennel')) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dog: any = req.target_dog
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const kennel: any = req.target_kennel
      const targetType = req.type === 'claim_dog' ? 'dog' : 'kennel'
      const targetName = (targetType === 'dog' ? dog?.name : kennel?.name) || '—'
      await sendTransactionalEmail(
        req.requester_email,
        {
          template: 'claim_rejected',
          props: {
            recipientName: req.requester_name || null,
            targetType: targetType as 'dog' | 'kennel',
            targetName,
            resolutionNote: input.resolutionNote.trim(),
            requestId: input.requestId,
          },
        },
        {
          userId: req.requester_user_id || undefined,
          dedupeKey: `claim_rejected:${input.requestId}`,
        },
      )
    }
  } catch { /* swallow */ }

  revalidatePath(`/admin/solicitudes/${input.requestId}`)
  revalidatePath('/admin/solicitudes')
  revalidatePath('/soporte')
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: signed URL para ver una evidencia
// ─────────────────────────────────────────────────────────────────────────────

export async function getEvidenceSignedUrlAction(path: string): Promise<string> {
  // Acceso a evidencias: solo admin O el propio dueño del path (que vive
  // bajo su user_id en el bucket: `<user_id>/<requestId>/<file>`).
  // Antes esta función solo verificaba auth y firmaba CUALQUIER path,
  // permitiendo a un usuario logueado leer DNI/contratos/pedigrees de
  // otros usuarios si adivinaba el path. Fix: validar ownership.
  const { supabase, user } = await requireUser()
  if (typeof path !== 'string' || !path) throw new Error('invalid_path')

  // Anti path traversal y normalización mínima (no toleramos '..' ni
  // protocolos URL embebidos).
  if (path.includes('..') || /^[a-z]+:/i.test(path)) {
    throw new Error('forbidden')
  }

  // El owner del path es el primer segmento (user_id UUID).
  const firstSegment = path.split('/')[0] || ''
  const isOwner = firstSegment === user.id

  let isUserAdmin = false
  if (!isOwner) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    isUserAdmin = profile?.role === 'admin'
  }

  if (!isOwner && !isUserAdmin) throw new Error('forbidden')

  const admin = createKennelAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any).storage
    .from('claim-evidence')
    .createSignedUrl(path, 60 * 10) // 10 min
  if (error) throw new Error(error.message)
  return data.signedUrl
}
