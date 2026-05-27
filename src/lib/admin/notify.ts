/**
 * notifySuperAdmin — helper unificado para notificar al super admin
 * (vía email Resend directo) cuando ocurren eventos críticos: nuevos
 * tickets/claims, signups, pagos, errores de cron, etc.
 *
 * Antes solo el widget de feedback usaba esto, vía SUPER_ADMIN_EMAIL
 * hardcoded en admin-requests/actions.ts. Centralizamos aquí para que
 * cualquier server action pueda llamarlo sin duplicar lógica.
 *
 * Best-effort: si Resend no está configurado o falla, se logguea y NO
 * lanza. Los eventos críticos no deben romper el flujo del caller.
 *
 * El destino sale de:
 *   1. `platform_settings.super_admin_email` (configurable desde admin UI)
 *   2. env `SUPER_ADMIN_EMAIL`
 *   3. fallback hardcoded `gestion@manuelcurto.com`
 */
import { Resend } from 'resend'
import { createKennelAdminClient } from '@/lib/supabase/server'

const FALLBACK_ADMIN_EMAIL = 'gestion@manuelcurto.com'

let _resend: Resend | null = null
function getResend(): Resend | null {
  if (_resend) return _resend
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  _resend = new Resend(key)
  return _resend
}

/** Resuelve el email del super admin con fallbacks. Cachea por instancia. */
let cachedAdminEmail: string | null = null
async function resolveAdminEmail(): Promise<string> {
  if (cachedAdminEmail) return cachedAdminEmail
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createKennelAdminClient() as any
    const { data } = await admin
      .from('platform_settings')
      .select('value')
      .eq('key', 'super_admin_email')
      .maybeSingle()
    if (data?.value) {
      cachedAdminEmail = data.value as string
      return cachedAdminEmail
    }
  } catch { /* swallow */ }
  cachedAdminEmail = process.env.SUPER_ADMIN_EMAIL || FALLBACK_ADMIN_EMAIL
  return cachedAdminEmail
}

export type AdminAlertKind =
  | 'support_request'      // ticket nuevo
  | 'claim_dog'            // claim de perro
  | 'claim_kennel'         // claim de criadero
  | 'feedback'             // widget feedback
  | 'signup'               // user nuevo
  | 'plan_upgrade'         // paso a Kennel / Kennel Pro
  | 'plan_downgrade'       // bajó plan
  | 'payment_received'     // pago entrante
  | 'cron_failure'         // un cron petó
  | 'webhook_failure'      // webhook rechazado
  | 'system_alert'         // genérico

interface NotifyOpts {
  kind: AdminAlertKind
  subject: string
  body: string             // texto plano, con saltos de línea \n
  /** Marca este evento como dedupable (si llega 2x lo mismo, solo manda 1).
   *  Útil para signups: dedupe por user_id. Para tickets/claims: por request_id. */
  dedupeKey?: string
  /** Link directo al admin para resolver — se renderiza como CTA. */
  ctaUrl?: string
  ctaLabel?: string
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://genealogic.io'

const KIND_EMOJI: Record<AdminAlertKind, string> = {
  support_request: '🎫',
  claim_dog: '🐕',
  claim_kennel: '🏠',
  feedback: '💬',
  signup: '👤',
  plan_upgrade: '💰',
  plan_downgrade: '📉',
  payment_received: '💸',
  cron_failure: '🔴',
  webhook_failure: '⚠️',
  system_alert: '📢',
}

/** Envía una alerta al super admin. Best-effort: nunca throws. */
export async function notifySuperAdmin(opts: NotifyOpts): Promise<{ ok: boolean; skipped?: string }> {
  try {
    const r = getResend()
    if (!r) {
      // Sin Resend configurado, no spameamos logs — silencioso.
      return { ok: false, skipped: 'no_resend' }
    }

    const to = await resolveAdminEmail()
    const emoji = KIND_EMOJI[opts.kind] || '📢'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createKennelAdminClient() as any

    // Dedupe contra email_log si nos pasaron dedupeKey
    if (opts.dedupeKey) {
      const { data: existing } = await admin
        .from('email_log')
        .select('id')
        .eq('dedupe_key', opts.dedupeKey)
        .maybeSingle()
      if (existing) return { ok: true, skipped: 'duplicate' }
    }

    const ctaHtml = opts.ctaUrl && opts.ctaLabel
      ? `<p style="margin:24px 0"><a href="${opts.ctaUrl}" style="display:inline-block;background:#111;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">${opts.ctaLabel}</a></p>`
      : ''

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#111">
        <p style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 8px">Genealogic · Alerta admin</p>
        <h1 style="font-size:20px;margin:0 0 16px;color:#111">${emoji} ${opts.subject}</h1>
        <div style="white-space:pre-wrap;line-height:1.55;font-size:14px;color:#333">${escapeHtml(opts.body)}</div>
        ${ctaHtml}
        <hr style="border:0;border-top:1px solid #eee;margin:24px 0">
        <p style="font-size:11px;color:#888;margin:0">
          Alerta automática de Genealogic. <a href="${SITE_URL}/admin" style="color:#666">Ir al panel</a>
        </p>
      </div>
    `

    const result = await r.emails.send({
      from: 'Genealogic Admin <admin@genealogic.io>',
      to,
      subject: `${emoji} ${opts.subject}`,
      html,
      text: `${opts.body}\n\n${opts.ctaUrl ? opts.ctaUrl : ''}`,
    })

    // Log para tener trazabilidad
    await admin.from('email_log').insert({
      to_email: to,
      template: `admin_alert_${opts.kind}`,
      subject: opts.subject,
      dedupe_key: opts.dedupeKey || null,
      status: result.error ? 'failed' : 'sent',
      provider_id: result.data?.id || null,
      error: result.error?.message || null,
    })

    return { ok: !result.error }
  } catch (e) {
    console.error('[notifySuperAdmin]', e)
    return { ok: false }
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
