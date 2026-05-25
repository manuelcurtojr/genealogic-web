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
import type {
  AdminRequestType,
  AdminRequestStatus,
  AdminRequestPriority,
  AdminRequestSource,
  EvidenceFile,
} from './types'

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
  revalidatePath('/mis-solicitudes')
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

  revalidatePath('/mis-solicitudes')
  revalidatePath('/admin/solicitudes')
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

  revalidatePath(`/mis-solicitudes/${input.requestId}`)
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
  revalidatePath('/mis-solicitudes')
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

  void user // silence
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
  revalidatePath(`/mis-solicitudes/${input.requestId}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: aprobar claim → función SQL transaccional
// ─────────────────────────────────────────────────────────────────────────────

export async function adminApproveClaimAction(input: {
  requestId: string
  resolutionNote?: string
}): Promise<void> {
  const { supabase } = await requireAdmin()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).rpc('approve_claim_request', {
    p_request_id: input.requestId,
    p_resolution_note: input.resolutionNote || null,
  })
  if (error) throw new Error(error.message)

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
  revalidatePath('/mis-solicitudes')
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
  revalidatePath('/mis-solicitudes')
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: signed URL para ver una evidencia
// ─────────────────────────────────────────────────────────────────────────────

export async function getEvidenceSignedUrlAction(path: string): Promise<string> {
  // Ambos: admin o el propio user pueden ver sus evidencias
  await requireUser()
  const admin = createKennelAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any).storage
    .from('claim-evidence')
    .createSignedUrl(path, 60 * 10) // 10 min
  if (error) throw new Error(error.message)
  return data.signedUrl
}
