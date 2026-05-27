import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient, createKennelAdminClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIp, rateLimitHeaders } from '@/lib/rate-limit'
import { Resend } from 'resend'

export const runtime = 'nodejs'
export const maxDuration = 20

/**
 * POST /api/reports
 *
 * Recibe un reporte de contenido (notice-and-action) y lo guarda en
 * content_reports + notifica al equipo legal por email.
 *
 * Acepta reportes:
 *  - De usuarios logueados (vía cookie de sesión)
 *  - Anónimos (titulares de derechos sin cuenta) — requieren email
 *
 * Cumple con:
 *  - Art. 16-17 LSSI-CE: procedimiento de retirada
 *  - Art. 14 DSA: mecanismo de notificación y actuación
 *  - Art. 17 LPI: protocolo DMCA-style para copyright
 *  - Art. 17 RGPD: derecho de supresión
 *
 * Rate-limit: 5 reportes / 10 min por IP (anti-spam).
 */

const VALID_TARGET_TYPES = new Set([
  'dog', 'photo', 'kennel', 'user', 'comment', 'message', 'litter', 'other',
])
const VALID_REASONS = new Set([
  'copyright', 'personal_data', 'inaccurate', 'inappropriate',
  'impersonation', 'animal_welfare', 'duplicate', 'other',
])

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface ReportPayload {
  targetType?: unknown
  targetId?: unknown
  targetUrl?: unknown
  reason?: unknown
  description?: unknown
  reporterEmail?: unknown
  reporterName?: unknown
  isRightsHolder?: unknown
  rightsHolderDeclaration?: unknown
  contactInfo?: unknown
}

function clampStr(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  if (!s) return null
  return s.length > max ? s.slice(0, max) : s
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers)
  const rl = checkRateLimit(`report:${ip}`, { tokens: 5, windowMs: 10 * 60_000 })
  if (!rl.ok) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: rateLimitHeaders(rl, 5),
    })
  }

  let body: ReportPayload
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // ── Validación de campos obligatorios ──────────────────────────
  const targetType = typeof body.targetType === 'string' ? body.targetType : ''
  const targetId = clampStr(body.targetId, 200)
  const targetUrl = clampStr(body.targetUrl, 2000)
  const reason = typeof body.reason === 'string' ? body.reason : ''
  const description = clampStr(body.description, 5000)

  if (!VALID_TARGET_TYPES.has(targetType)) {
    return NextResponse.json({ error: 'Invalid target type' }, { status: 400 })
  }
  if (!targetId) {
    return NextResponse.json({ error: 'targetId required' }, { status: 400 })
  }
  if (!VALID_REASONS.has(reason)) {
    return NextResponse.json({ error: 'Invalid reason' }, { status: 400 })
  }
  if (!description || description.length < 10) {
    return NextResponse.json({ error: 'Description must be at least 10 characters' }, { status: 400 })
  }

  // ── Identificar reportante (logueado o anónimo) ────────────────
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const reporterEmail = clampStr(body.reporterEmail, 320)
  const reporterName = clampStr(body.reporterName, 200)
  const contactInfo = clampStr(body.contactInfo, 500)
  const isRightsHolder = body.isRightsHolder === true
  const rightsHolderDeclaration = body.rightsHolderDeclaration === true

  // Email obligatorio si no hay user. Si lo hay, usamos el del user como fallback.
  const finalEmail = user?.email || reporterEmail
  if (!finalEmail) {
    return NextResponse.json(
      { error: 'Email required for anonymous reports' },
      { status: 400 },
    )
  }
  if (reporterEmail && !EMAIL_RE.test(reporterEmail)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
  }

  // Si reclama copyright como titular, debe firmar la declaración
  if (reason === 'copyright' && isRightsHolder && !rightsHolderDeclaration) {
    return NextResponse.json(
      { error: 'Rights holder declaration must be accepted' },
      { status: 400 },
    )
  }

  // ── Insert en BBDD (usamos admin client para bypass RLS — INSERT abierto
  // pero queremos garantizar que se guarda incluso sin sesión) ────
  const admin = createKennelAdminClient()
  const userAgent = request.headers.get('user-agent') || null

  const { data: inserted, error: insertErr } = await admin
    .from('content_reports')
    .insert({
      reporter_user_id: user?.id || null,
      reporter_email: reporterEmail || user?.email || null,
      reporter_name: reporterName,
      reporter_ip: ip,
      reporter_user_agent: userAgent,
      target_type: targetType,
      target_id: targetId,
      target_url: targetUrl,
      reason,
      description,
      is_rights_holder: isRightsHolder,
      rights_holder_declaration: rightsHolderDeclaration,
      contact_info: contactInfo,
      status: 'open',
    })
    .select('id, created_at')
    .single()

  if (insertErr || !inserted) {
    console.error('[/api/reports] insert error:', insertErr)
    return NextResponse.json({ error: 'Failed to save report' }, { status: 500 })
  }

  // ── Notificar al equipo legal por email (best-effort) ──────────
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    try {
      const resend = new Resend(resendKey)
      const reasonLabel = REASON_LABELS[reason] || reason
      const subject = `[Genealogic] Nuevo reporte (${reasonLabel}) — ${targetType}`
      const html = buildAdminNotifyHtml({
        reportId: inserted.id,
        reason: reasonLabel,
        targetType,
        targetId,
        targetUrl,
        description,
        reporterEmail: reporterEmail || user?.email || 'anonymous',
        reporterName,
        userId: user?.id || null,
        isRightsHolder,
        contactInfo,
        ip,
      })
      await resend.emails.send({
        from: 'Genealogic Reports <hola@genealogic.io>',
        to: 'hola@genealogic.io',
        replyTo: reporterEmail || user?.email || 'hola@genealogic.io',
        subject,
        html,
      })
    } catch (err) {
      // No bloqueamos al reportante si el email falla — el registro ya está en BBDD
      console.error('[/api/reports] email notify failed:', err)
    }
  }

  return NextResponse.json({
    ok: true,
    reportId: inserted.id,
    message: 'Tu reporte ha sido registrado. Lo revisaremos en un plazo máximo de 72 horas.',
  })
}

const REASON_LABELS: Record<string, string> = {
  copyright: 'Infracción de copyright',
  personal_data: 'Datos personales (RGPD)',
  inaccurate: 'Información incorrecta',
  inappropriate: 'Contenido inapropiado',
  impersonation: 'Suplantación de identidad',
  animal_welfare: 'Bienestar animal',
  duplicate: 'Duplicado',
  other: 'Otro',
}

function buildAdminNotifyHtml(d: {
  reportId: string
  reason: string
  targetType: string
  targetId: string
  targetUrl: string | null
  description: string
  reporterEmail: string
  reporterName: string | null
  userId: string | null
  isRightsHolder: boolean
  contactInfo: string | null
  ip: string
}): string {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const targetLink = d.targetUrl
    ? `<a href="${esc(d.targetUrl)}" target="_blank">${esc(d.targetUrl)}</a>`
    : `<code>${esc(d.targetId)}</code>`

  return `
<!doctype html>
<html lang="es"><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#111;line-height:1.5;max-width:640px;margin:0 auto;padding:24px;">
<h2 style="margin:0 0 16px;font-size:20px;">Nuevo reporte de contenido</h2>
<table style="width:100%;border-collapse:collapse;">
  <tr><td style="padding:6px 0;color:#666;width:160px;">ID del reporte</td><td><code>${esc(d.reportId)}</code></td></tr>
  <tr><td style="padding:6px 0;color:#666;">Motivo</td><td><strong>${esc(d.reason)}</strong></td></tr>
  <tr><td style="padding:6px 0;color:#666;">Tipo de contenido</td><td>${esc(d.targetType)}</td></tr>
  <tr><td style="padding:6px 0;color:#666;">Contenido reportado</td><td>${targetLink}</td></tr>
  <tr><td style="padding:6px 0;color:#666;">Reportante</td><td>${esc(d.reporterEmail)}${d.reporterName ? ` (${esc(d.reporterName)})` : ''}</td></tr>
  ${d.userId ? `<tr><td style="padding:6px 0;color:#666;">User ID</td><td><code>${esc(d.userId)}</code></td></tr>` : '<tr><td style="padding:6px 0;color:#666;">Usuario</td><td>Anónimo (sin login)</td></tr>'}
  ${d.isRightsHolder ? `<tr><td style="padding:6px 0;color:#666;">Titular de derechos</td><td>✅ Declara serlo</td></tr>` : ''}
  ${d.contactInfo ? `<tr><td style="padding:6px 0;color:#666;">Contacto adicional</td><td>${esc(d.contactInfo)}</td></tr>` : ''}
  <tr><td style="padding:6px 0;color:#666;">IP</td><td><code>${esc(d.ip)}</code></td></tr>
</table>
<div style="margin-top:20px;padding:16px;background:#f6f6f6;border-radius:8px;">
  <strong style="display:block;margin-bottom:8px;">Descripción</strong>
  <div style="white-space:pre-wrap;color:#333;">${esc(d.description)}</div>
</div>
<p style="margin-top:24px;color:#999;font-size:12px;">
  Genealogic — Manuel Curtó SL · Plazo legal de respuesta: 72h<br>
  Revisar en <a href="https://genealogic.io/admin/reports">/admin/reports</a>
</p>
</body></html>`.trim()
}
