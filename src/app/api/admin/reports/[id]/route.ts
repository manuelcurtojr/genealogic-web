import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient, createKennelAdminClient } from '@/lib/supabase/server'
import type { ReportStatus } from '@/lib/content-reports/types'

export const runtime = 'nodejs'

/**
 * PATCH /api/admin/reports/[id]
 *
 * Solo admin. Cambia status, resolution_action y resolution_notes de un reporte.
 * Si pasa a estado resuelto, marca resolved_at y resolved_by.
 *
 * Body:
 *   { status: ReportStatus, resolutionNotes?: string, resolutionAction?: string }
 */

const VALID_STATUSES: ReportStatus[] = [
  'open', 'reviewing', 'resolved_removed', 'resolved_kept', 'rejected', 'duplicate_report',
]

const RESOLVED_STATUSES: ReportStatus[] = [
  'resolved_removed', 'resolved_kept', 'rejected', 'duplicate_report',
]

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid report id' }, { status: 400 })
  }

  // ─── Auth: admin only ──────────────────────────────────────────
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

  // ─── Validar body ──────────────────────────────────────────────
  let body: {
    status?: unknown
    resolutionNotes?: unknown
    resolutionAction?: unknown
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const status = body.status as ReportStatus | undefined
  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const resolutionNotes =
    typeof body.resolutionNotes === 'string'
      ? body.resolutionNotes.trim().slice(0, 5000) || null
      : null

  const resolutionAction =
    typeof body.resolutionAction === 'string'
      ? body.resolutionAction.trim().slice(0, 200) || null
      : null

  const isResolved = RESOLVED_STATUSES.includes(status)

  // ─── Update ────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const update: Record<string, unknown> = {
    status,
    resolution_notes: resolutionNotes,
    resolution_action: resolutionAction,
  }
  if (isResolved) {
    update.resolved_at = new Date().toISOString()
    update.resolved_by = user.id
  } else {
    update.resolved_at = null
    update.resolved_by = null
  }

  const { data: updated, error } = await admin
    .from('content_reports')
    .update(update)
    .eq('id', id)
    .select('id, status, resolved_at')
    .single()

  if (error || !updated) {
    console.error('[/api/admin/reports/PATCH] error:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }

  // ─── Audit log (best effort) ───────────────────────────────────
  try {
    await admin.from('admin_audit_log').insert({
      admin_user_id: user.id,
      action: 'content_report_update',
      target_type: 'content_report',
      target_id: id,
      metadata: { status, resolutionAction, hasNotes: !!resolutionNotes },
    })
  } catch {
    /* tabla puede no existir; no romper */
  }

  return NextResponse.json({ ok: true, report: updated })
}
