import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient, createKennelAdminClient } from '@/lib/supabase/server'
import type { ModerateTargetType, ModerateAction, HiddenReason } from '@/lib/moderation/types'

export const runtime = 'nodejs'

/**
 * POST /api/admin/moderate
 *
 * Soft-hide / unhide reversible para perros y criaderos. **No elimina nunca**
 * físicamente. La genealogía se preserva: los descendientes del perro oculto
 * siguen viendo la caja en el árbol con placeholder.
 *
 * Body:
 *   {
 *     targetType: 'dog' | 'kennel',
 *     targetId: uuid,
 *     action: 'hide' | 'unhide',
 *     reason?: HiddenReason,        // requerido si action='hide'
 *     notes?: string,                // opcional, notas internas
 *     reportId?: uuid,               // referencia al content_report que lo motiva
 *   }
 *
 * Auth: solo admin.
 */

const VALID_TARGETS: ModerateTargetType[] = ['dog', 'kennel']
const VALID_ACTIONS: ModerateAction[] = ['hide', 'unhide']
const VALID_REASONS: HiddenReason[] = [
  'rgpd_request', 'copyright', 'inaccurate', 'inappropriate',
  'impersonation', 'animal_welfare', 'duplicate',
  'owner_request', 'admin_decision', 'other',
]

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: NextRequest) {
  // ─── Auth ─────────────────────────────────────────────────────
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // ─── Body ─────────────────────────────────────────────────────
  let body: {
    targetType?: unknown
    targetId?: unknown
    action?: unknown
    reason?: unknown
    notes?: unknown
    reportId?: unknown
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const targetType = body.targetType as ModerateTargetType
  const targetId = typeof body.targetId === 'string' ? body.targetId : ''
  const action = body.action as ModerateAction

  if (!VALID_TARGETS.includes(targetType)) {
    return NextResponse.json({ error: 'Invalid targetType' }, { status: 400 })
  }
  if (!UUID_RE.test(targetId)) {
    return NextResponse.json({ error: 'Invalid targetId' }, { status: 400 })
  }
  if (!VALID_ACTIONS.includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const table = targetType === 'dog' ? 'dogs' : 'kennels'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any

  // ─── HIDE ─────────────────────────────────────────────────────
  if (action === 'hide') {
    const reason = body.reason as HiddenReason
    if (!VALID_REASONS.includes(reason)) {
      return NextResponse.json({ error: 'reason requerido para hide' }, { status: 400 })
    }
    const notes = typeof body.notes === 'string'
      ? body.notes.trim().slice(0, 5000) || null
      : null
    const reportId = typeof body.reportId === 'string' && UUID_RE.test(body.reportId)
      ? body.reportId
      : null

    const { data: updated, error } = await admin
      .from(table)
      .update({
        hidden_at: new Date().toISOString(),
        hidden_reason: reason,
        hidden_by: user.id,
        hidden_notes: notes,
        hidden_report_id: reportId,
      })
      .eq('id', targetId)
      .select('id, hidden_at, hidden_reason')
      .single()

    if (error || !updated) {
      console.error('[/api/admin/moderate hide] error:', error)
      return NextResponse.json({ error: 'Failed to hide' }, { status: 500 })
    }

    await logAudit(admin, user.id, 'hide', targetType, targetId, { reason, reportId })

    return NextResponse.json({ ok: true, action: 'hidden', target: updated })
  }

  // ─── UNHIDE ───────────────────────────────────────────────────
  // Restaura el contenido. Se conservan las columnas hidden_* sin valor para
  // saber qué pasó (pero el CHECK constraint exige que si hidden_at es NULL
  // todos los demás también lo sean, así que las limpiamos).
  const { data: updated, error } = await admin
    .from(table)
    .update({
      hidden_at: null,
      hidden_reason: null,
      hidden_by: null,
      hidden_notes: null,
      hidden_report_id: null,
    })
    .eq('id', targetId)
    .select('id')
    .single()

  if (error || !updated) {
    console.error('[/api/admin/moderate unhide] error:', error)
    return NextResponse.json({ error: 'Failed to unhide' }, { status: 500 })
  }

  await logAudit(admin, user.id, 'unhide', targetType, targetId, {})

  return NextResponse.json({ ok: true, action: 'unhidden', target: updated })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function logAudit(admin: any, adminId: string, action: string, targetType: string, targetId: string, metadata: Record<string, unknown>) {
  try {
    await admin.from('admin_audit_log').insert({
      admin_user_id: adminId,
      action: `${targetType}_${action}`,
      target_type: targetType,
      target_id: targetId,
      metadata,
    })
  } catch {
    /* tabla puede no existir aún — best effort */
  }
}
