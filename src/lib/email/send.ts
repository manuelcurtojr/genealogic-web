/**
 * sendTransactionalEmail — función unificada para mandar cualquier email
 * transaccional de Genealogic.
 *
 * Características:
 *  - Renderiza React Email components a HTML
 *  - Respeta email_preferences (opt-out por categoría)
 *  - Deduplica via email_log.dedupe_key (no manda 2 veces lo mismo)
 *  - Loggea TODO en email_log (sent/failed/skipped)
 *  - Maneja errores silenciosamente — un email fallido NUNCA debe romper
 *    el flow principal del que se llama (ej: crear reserva)
 *
 * ENV vars:
 *   RESEND_API_KEY          (server-only)
 *   NEXT_PUBLIC_SITE_URL    (https://genealogic.io)
 */
import 'server-only'
import { Resend } from 'resend'
import { render } from '@react-email/render'
import { createKennelAdminClient } from '@/lib/supabase/server'

// Templates
import WelcomeBreederEmail, { type WelcomeBreederProps } from '@/emails/welcome-breeder'
import WelcomeOwnerEmail, { type WelcomeOwnerProps } from '@/emails/welcome-owner'
import ReservationNewEmail, { type ReservationNewProps } from '@/emails/reservation-new'
import MessageNewEmail, { type MessageNewProps } from '@/emails/message-new'
import ClaimApprovedEmail, { type ClaimApprovedProps } from '@/emails/claim-approved'
import ClaimRejectedEmail, { type ClaimRejectedProps } from '@/emails/claim-rejected'
import SupportRepliedEmail, { type SupportRepliedProps } from '@/emails/support-replied'

const FROM_TRANSACTIONAL = 'Genealogic <hola@genealogic.io>'
const REPLY_TO = 'hola@genealogic.io'

// Mapa template → { props, subject, category, render fn }
export type EmailTemplate =
  | { template: 'welcome_breeder';  props: WelcomeBreederProps }
  | { template: 'welcome_owner';    props: WelcomeOwnerProps }
  | { template: 'reservation_new';  props: ReservationNewProps }
  | { template: 'message_new';      props: MessageNewProps }
  | { template: 'claim_approved';   props: ClaimApprovedProps }
  | { template: 'claim_rejected';   props: ClaimRejectedProps }
  | { template: 'support_replied';  props: SupportRepliedProps }

/** Categoría → si el user puede hacer opt-out. */
type Category = 'auth' | 'reservations' | 'messages' | 'vet_reminders' | 'weekly_digest' | 'marketing' | 'critical'

const TEMPLATE_META: Record<EmailTemplate['template'], {
  category: Category
  subject: (props: any) => string // eslint-disable-line @typescript-eslint/no-explicit-any
}> = {
  welcome_breeder: {
    category: 'critical', // welcome no se puede desactivar (es una sola vez)
    subject: () => '👋 Bienvenido a Genealogic',
  },
  welcome_owner: {
    category: 'critical',
    subject: () => '👋 Bienvenido a Genealogic',
  },
  reservation_new: {
    category: 'reservations',
    subject: (p: ReservationNewProps) => `Nueva reserva de ${p.clientName} para ${p.kennelName}`,
  },
  message_new: {
    category: 'messages',
    subject: (p: MessageNewProps) => `${p.senderName} te ha escrito en Genealogic`,
  },
  claim_approved: {
    category: 'critical',
    subject: (p: ClaimApprovedProps) => `✓ Tu reclamación de ${p.targetName} ha sido aprobada`,
  },
  claim_rejected: {
    category: 'critical',
    subject: (p: ClaimRejectedProps) => `Sobre tu reclamación de ${p.targetName}`,
  },
  support_replied: {
    category: 'critical',
    subject: (p: SupportRepliedProps) => `Re: ${p.requestSubject}`,
  },
}

let _resend: Resend | null = null
function resend(): Resend | null {
  if (_resend) return _resend
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  _resend = new Resend(key)
  return _resend
}

function renderTemplate(t: EmailTemplate): Promise<string> {
  switch (t.template) {
    case 'welcome_breeder':  return render(WelcomeBreederEmail(t.props))
    case 'welcome_owner':    return render(WelcomeOwnerEmail(t.props))
    case 'reservation_new':  return render(ReservationNewEmail(t.props))
    case 'message_new':      return render(MessageNewEmail(t.props))
    case 'claim_approved':   return render(ClaimApprovedEmail(t.props))
    case 'claim_rejected':   return render(ClaimRejectedEmail(t.props))
    case 'support_replied':  return render(SupportRepliedEmail(t.props))
  }
}

/**
 * Manda un email transaccional.
 *
 * @param to        email del destinatario
 * @param email     { template, props } tipado
 * @param opts      userId (para log + preferences), dedupeKey (para no
 *                  mandar 2 veces lo mismo)
 *
 * Devuelve { ok, skipped?, error? }. NUNCA throws — los emails fallidos
 * se loggean en email_log con status='failed' pero no rompen el caller.
 */
export async function sendTransactionalEmail(
  to: string,
  email: EmailTemplate,
  opts: { userId?: string; dedupeKey?: string } = {},
): Promise<{ ok: boolean; skipped?: 'preference' | 'duplicate' | 'no_key'; error?: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const meta = TEMPLATE_META[email.template]
  const subject = meta.subject(email.props)

  try {
    // 1) Dedupe: si ya existe un log con esa key, skip
    if (opts.dedupeKey) {
      const { data: existing } = await admin
        .from('email_log')
        .select('id')
        .eq('dedupe_key', opts.dedupeKey)
        .maybeSingle()
      if (existing) {
        return { ok: true, skipped: 'duplicate' }
      }
    }

    // 2) Preferences: si la categoría es opt-outable y el user desactivó, skip.
    //    Las categorías 'critical' y 'auth' nunca se chequean (siempre van).
    if (opts.userId && meta.category !== 'critical' && meta.category !== 'auth') {
      const { data: prefs } = await admin
        .from('email_preferences')
        .select('reservations, messages, vet_reminders, weekly_digest, marketing')
        .eq('user_id', opts.userId)
        .maybeSingle()
      if (prefs && prefs[meta.category] === false) {
        await admin.from('email_log').insert({
          user_id: opts.userId,
          to_email: to,
          template: email.template,
          subject,
          dedupe_key: opts.dedupeKey || null,
          status: 'skipped',
          error: 'user_opt_out',
        })
        return { ok: true, skipped: 'preference' }
      }
    }

    // 3) Si no hay RESEND_API_KEY, logueamos pero no enviamos
    const r = resend()
    if (!r) {
      await admin.from('email_log').insert({
        user_id: opts.userId || null,
        to_email: to,
        template: email.template,
        subject,
        dedupe_key: opts.dedupeKey || null,
        status: 'skipped',
        error: 'no_resend_key',
      })
      return { ok: false, skipped: 'no_key', error: 'RESEND_API_KEY no configurada' }
    }

    // 4) Render + send
    const html = await renderTemplate(email)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res: any = await r.emails.send({
      from: FROM_TRANSACTIONAL,
      to,
      subject,
      html,
      replyTo: REPLY_TO,
    })

    if (res?.error) {
      const errStr = typeof res.error === 'string' ? res.error : JSON.stringify(res.error)
      await admin.from('email_log').insert({
        user_id: opts.userId || null,
        to_email: to,
        template: email.template,
        subject,
        dedupe_key: opts.dedupeKey || null,
        status: 'failed',
        error: errStr,
      })
      return { ok: false, error: errStr }
    }

    await admin.from('email_log').insert({
      user_id: opts.userId || null,
      to_email: to,
      template: email.template,
      subject,
      dedupe_key: opts.dedupeKey || null,
      provider_id: res?.data?.id || null,
      status: 'sent',
    })

    return { ok: true }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'unknown error'
    // Best-effort log del error (puede fallar también — en cuyo caso silencio total)
    try {
      await admin.from('email_log').insert({
        user_id: opts.userId || null,
        to_email: to,
        template: email.template,
        subject,
        dedupe_key: opts.dedupeKey || null,
        status: 'failed',
        error: errorMsg,
      })
    } catch {
      /* swallow */
    }
    // NO throw — email fallido no debe romper el caller
    console.error(`[email] ${email.template} → ${to} FAILED:`, errorMsg)
    return { ok: false, error: errorMsg }
  }
}
