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
 *   NEXT_PUBLIC_SITE_URL    (https://www.genealogic.io)
 */
import 'server-only'
import { Resend } from 'resend'
import { render } from '@react-email/render'
import { createKennelAdminClient } from '@/lib/supabase/server'
import { getTranslator } from '@/lib/i18n'
import { normalizeLocale, DEFAULT_LOCALE, type Locale } from '@/lib/locale'

// Templates
import WelcomeBreederEmail, { type WelcomeBreederProps } from '@/emails/welcome-breeder'
import WelcomeOwnerEmail, { type WelcomeOwnerProps } from '@/emails/welcome-owner'
import ReservationNewEmail, { type ReservationNewProps } from '@/emails/reservation-new'
import InquiryReceivedEmail, { type InquiryReceivedProps } from '@/emails/inquiry-received'
import MessageNewEmail, { type MessageNewProps } from '@/emails/message-new'
import ClaimApprovedEmail, { type ClaimApprovedProps } from '@/emails/claim-approved'
import ClaimRejectedEmail, { type ClaimRejectedProps } from '@/emails/claim-rejected'
import SupportRepliedEmail, { type SupportRepliedProps } from '@/emails/support-replied'
import SubscriptionActivatedEmail, { type SubscriptionActivatedProps } from '@/emails/subscription-activated'
import SubscriptionCancelledEmail, { type SubscriptionCancelledProps } from '@/emails/subscription-cancelled'
import PaymentFailedEmail, { type PaymentFailedProps } from '@/emails/payment-failed'
import VetReminderEmail, { type VetReminderProps } from '@/emails/vet-reminder'
import LitterNewEmail, { type LitterNewProps } from '@/emails/litter-new'
import ContractSignedEmail, { type ContractSignedProps } from '@/emails/contract-signed'
import ContractSentEmail, { type ContractSentProps } from '@/emails/contract-sent'
import PasswordResetEmail, { type PasswordResetProps } from '@/emails/password-reset'
import PaymentReceivedEmail, { type PaymentReceivedProps } from '@/emails/payment-received'
import WeeklyDigestBreederEmail, { type WeeklyDigestBreederProps } from '@/emails/weekly-digest-breeder'
import WeeklyDigestOwnerEmail, { type WeeklyDigestOwnerProps } from '@/emails/weekly-digest-owner'
import ReEngagementEmail, { type ReEngagementProps } from '@/emails/re-engagement'
import TrialEndingSoonEmail, { type TrialEndingSoonProps } from '@/emails/trial-ending-soon'
import ReproNextHeatEmail, { type ReproNextHeatProps } from '@/emails/repro-next-heat'
import ReproConfirmPregnancyEmail, { type ReproConfirmPregnancyProps } from '@/emails/repro-confirm-pregnancy'
import ReproBirthSoonEmail, { type ReproBirthSoonProps } from '@/emails/repro-birth-soon'
import OwnerCheckinEmail, { type OwnerCheckinProps } from '@/emails/owner-checkin'
import OwnerActivationEmail, { type OwnerActivationProps } from '@/emails/owner-activation'

const FROM_TRANSACTIONAL = 'Genealogic <hola@genealogic.io>'
const REPLY_TO = 'hola@genealogic.io'
// Reply-to para emails "founder" — las respuestas van directas a Manuel.
const REPLY_TO_FOUNDER = 'manuel@genealogic.io'

// Mapa template → { props, subject, category, render fn }
export type EmailTemplate =
  | { template: 'welcome_breeder';        props: WelcomeBreederProps }
  | { template: 'welcome_owner';          props: WelcomeOwnerProps }
  | { template: 'reservation_new';        props: ReservationNewProps }
  | { template: 'inquiry_received';       props: InquiryReceivedProps }
  | { template: 'message_new';            props: MessageNewProps }
  | { template: 'claim_approved';         props: ClaimApprovedProps }
  | { template: 'claim_rejected';         props: ClaimRejectedProps }
  | { template: 'support_replied';        props: SupportRepliedProps }
  | { template: 'subscription_activated'; props: SubscriptionActivatedProps }
  | { template: 'subscription_cancelled'; props: SubscriptionCancelledProps }
  | { template: 'payment_failed';         props: PaymentFailedProps }
  | { template: 'vet_reminder';           props: VetReminderProps }
  | { template: 'litter_new';             props: LitterNewProps }
  | { template: 'contract_signed';        props: ContractSignedProps }
  | { template: 'contract_sent';          props: ContractSentProps }
  | { template: 'password_reset';         props: PasswordResetProps }
  | { template: 'payment_received';       props: PaymentReceivedProps }
  | { template: 'weekly_digest_breeder';  props: WeeklyDigestBreederProps }
  | { template: 'weekly_digest_owner';    props: WeeklyDigestOwnerProps }
  | { template: 're_engagement';          props: ReEngagementProps }
  | { template: 'trial_ending_soon';      props: TrialEndingSoonProps }
  | { template: 'repro_next_heat';        props: ReproNextHeatProps }
  | { template: 'repro_confirm_pregnancy'; props: ReproConfirmPregnancyProps }
  | { template: 'repro_birth_soon';       props: ReproBirthSoonProps }
  | { template: 'owner_checkin';          props: OwnerCheckinProps }
  | { template: 'owner_activation';       props: OwnerActivationProps }

/** Categoría → si el user puede hacer opt-out. */
type Category = 'auth' | 'reservations' | 'messages' | 'vet_reminders' | 'weekly_digest' | 'marketing' | 'critical'

// El translator se pasa a subject() para localizar el asunto según el locale
// resuelto por usuario. Las plantillas aún sin traducir simplemente ignoran `t`.
type Translator = (key: string) => string

const TEMPLATE_META: Record<EmailTemplate['template'], {
  category: Category
  subject: (props: any, t: Translator) => string // eslint-disable-line @typescript-eslint/no-explicit-any
  /** Override del reply-to por defecto (REPLY_TO). Para emails founder. */
  replyTo?: string
}> = {
  welcome_breeder: {
    category: 'critical', // welcome no se puede desactivar (es una sola vez)
    subject: (_p, t) => `👋 ${t('Bienvenido a Genealogic')}`,
  },
  welcome_owner: {
    category: 'critical',
    subject: (_p, t) => `👋 ${t('Bienvenido a Genealogic')}`,
  },
  reservation_new: {
    category: 'reservations',
    // NOTA: el nombre de la plantilla sigue siendo `reservation_new` por
    // compat con email_log + dedupe_keys históricas, pero el copy ya dice
    // "solicitud" en vez de "reserva" — lo que entra por el form es una
    // solicitud (lead), no una reserva (esa es una etapa del embudo).
    subject: (p: ReservationNewProps, t) =>
      `${t('Nueva solicitud de')} ${p.clientName} ${t('para')} ${p.kennelName}`,
  },
  inquiry_received: {
    // 'critical' = siempre se manda. Es la confirmación inmediata de una
    // acción que el propio solicitante acaba de hacer, no marketing.
    category: 'critical',
    subject: (p: InquiryReceivedProps, t) =>
      `${t('Hemos enviado tu solicitud a')} ${p.kennelName}`,
  },
  message_new: {
    category: 'messages',
    subject: (p: MessageNewProps, t) => `${p.senderName} ${t('te ha escrito en Genealogic')}`,
  },
  claim_approved: {
    category: 'critical',
    subject: (p: ClaimApprovedProps, t) => `✓ ${t('Tu reclamación de')} ${p.targetName} ${t('ha sido aprobada')}`,
  },
  claim_rejected: {
    category: 'critical',
    subject: (p: ClaimRejectedProps, t) => `${t('Sobre tu reclamación de')} ${p.targetName}`,
  },
  support_replied: {
    category: 'critical',
    subject: (p: SupportRepliedProps) => `Re: ${p.requestSubject}`,
  },
  subscription_activated: {
    category: 'critical',
    subject: (p: SubscriptionActivatedProps, t) => {
      const isPro = p.plan === 'kennel_pro' || p.plan === 'premium'
      const label = isPro ? 'Kennel Pro' : 'Kennel'
      // Si el email se manda durante el trial, lo decimos en el subject.
      return p.trialEndsAt
        ? `✓ ${t('Prueba de Genealogic')} ${label} ${t('activada')}`
        : `✓ Genealogic ${label} ${t('activado')}`
    },
  },
  trial_ending_soon: {
    category: 'critical',
    subject: (p: TrialEndingSoonProps, t) => {
      const isPro = p.plan === 'kennel_pro' || p.plan === 'premium'
      const label = isPro ? 'Kennel Pro' : 'Kennel'
      return `${t('Tu prueba de Genealogic')} ${label} ${t('termina pronto')}`
    },
  },
  subscription_cancelled: {
    category: 'critical',
    subject: (_p, t) => t('Tu suscripción de Genealogic ha terminado'),
  },
  payment_failed: {
    category: 'critical',
    subject: (_p, t) => t('No hemos podido cobrar tu suscripción'),
  },
  vet_reminder: {
    category: 'vet_reminders',
    subject: (p: VetReminderProps, t) => {
      const when = p.bucket === 'today' ? t('Hoy') : p.bucket === 'tomorrow' ? t('Mañana') : t('En 7 días')
      return `${when}: ${p.reminderTitle} ${t('para')} ${p.dogName}`
    },
  },
  litter_new: {
    category: 'reservations',
    subject: (p: LitterNewProps, t) =>
      p.status === 'born' || p.status === 'delivered'
        ? `${t('Han nacido los cachorros en')} ${p.kennelName}`
        : `${t('Nueva camada en')} ${p.kennelName}${p.breedName ? ` (${p.breedName})` : ''}`,
  },
  contract_signed: {
    category: 'critical',
    subject: (p: ContractSignedProps, t) =>
      p.recipientRole === 'breeder'
        ? `${p.otherPartyName} ${t('ha firmado el contrato')}`
        : `${t('Contrato firmado con')} ${p.kennelName}`,
  },
  contract_sent: {
    category: 'critical',
    subject: (p: ContractSentProps, t) => `${p.kennelName}: ${t('contrato para firmar')}`,
  },
  password_reset: {
    category: 'auth', // 'auth' nunca respeta opt-out: siempre se manda
    subject: (_p, t) => t('Restablece tu contraseña de Genealogic'),
  },
  payment_received: {
    category: 'critical',
    subject: (p: PaymentReceivedProps, t) =>
      `${p.kennelName} ${t('ha confirmado tu pago')}`,
  },
  weekly_digest_breeder: {
    category: 'weekly_digest',
    subject: (p: WeeklyDigestBreederProps, t) =>
      `${t('Tu semana en')} ${p.kennelName}`,
  },
  weekly_digest_owner: {
    category: 'weekly_digest',
    subject: (_p, t) => t('Tu resumen semanal en Genealogic'),
  },
  re_engagement: {
    category: 'marketing',
    subject: (p: ReEngagementProps, t) =>
      p.daysAway >= 30
        ? t('¿Seguimos contando contigo?')
        : t('Te echamos de menos en Genealogic'),
  },
  // Avisos reproductivos — comparten el opt-out de recordatorios vet.
  repro_next_heat: {
    category: 'vet_reminders',
    subject: (p: ReproNextHeatProps, t) => `${t('Próximo celo de')} ${p.dogName} (~${p.heatDate})`,
  },
  repro_confirm_pregnancy: {
    category: 'vet_reminders',
    subject: (p: ReproConfirmPregnancyProps, t) => `${p.dogName} ${t('está preñada? Confírmalo')}`,
  },
  repro_birth_soon: {
    category: 'vet_reminders',
    subject: (p: ReproBirthSoonProps, t) =>
      p.daysUntil <= 0 ? `${p.dogName} ${t('sale de cuentas hoy')}` : `${t('Parto de')} ${p.dogName} ${t('dentro de')} ${p.daysUntil} ${t('días')}`,
  },
  owner_checkin: {
    // 'marketing' → respeta opt-out (no insistimos a quien no quiere emails).
    category: 'marketing',
    subject: (_p, t) => t('¿Qué tal tus primeros días en Genealogic?'),
    replyTo: REPLY_TO_FOUNDER, // las respuestas van directas a Manuel
  },
  owner_activation: {
    // 'marketing' → respeta opt-out. Founder voice, reply-to directo a Manuel.
    category: 'marketing',
    subject: (p: OwnerActivationProps, t) => {
      const name = p.displayName?.split(' ')[0]
      return name ? `${t('Bienvenido a Genealogic')}, ${name} 🐾` : `${t('Bienvenido a Genealogic')} 🐾`
    },
    replyTo: REPLY_TO_FOUNDER,
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

/**
 * Renderiza la plantilla a HTML inyectando `locale` como prop.
 *
 * El locale se mete en los props de cada plantilla. Las plantillas ya
 * traducidas lo leen (prop `locale?: string` + getTranslator); las que aún
 * no lo están simplemente lo ignoran. Usamos un cast a `any` al construir los
 * props porque `locale` no figura todavía en los tipos *Props de las
 * plantillas sin traducir, y un literal con campo extra dispararía el chequeo
 * de excess-property de TS. El runtime ignora props desconocidos sin problema.
 */
function renderTemplate(t: EmailTemplate, locale: Locale): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = { ...(t.props as any), locale }
  switch (t.template) {
    case 'welcome_breeder':        return render(WelcomeBreederEmail(p))
    case 'welcome_owner':          return render(WelcomeOwnerEmail(p))
    case 'reservation_new':        return render(ReservationNewEmail(p))
    case 'inquiry_received':       return render(InquiryReceivedEmail(p))
    case 'message_new':            return render(MessageNewEmail(p))
    case 'claim_approved':         return render(ClaimApprovedEmail(p))
    case 'claim_rejected':         return render(ClaimRejectedEmail(p))
    case 'support_replied':        return render(SupportRepliedEmail(p))
    case 'subscription_activated': return render(SubscriptionActivatedEmail(p))
    case 'subscription_cancelled': return render(SubscriptionCancelledEmail(p))
    case 'payment_failed':         return render(PaymentFailedEmail(p))
    case 'vet_reminder':           return render(VetReminderEmail(p))
    case 'litter_new':             return render(LitterNewEmail(p))
    case 'contract_signed':        return render(ContractSignedEmail(p))
    case 'contract_sent':          return render(ContractSentEmail(p))
    case 'password_reset':         return render(PasswordResetEmail(p))
    case 'payment_received':       return render(PaymentReceivedEmail(p))
    case 'weekly_digest_breeder':  return render(WeeklyDigestBreederEmail(p))
    case 'weekly_digest_owner':    return render(WeeklyDigestOwnerEmail(p))
    case 're_engagement':          return render(ReEngagementEmail(p))
    case 'trial_ending_soon':      return render(TrialEndingSoonEmail(p))
    case 'repro_next_heat':        return render(ReproNextHeatEmail(p))
    case 'repro_confirm_pregnancy': return render(ReproConfirmPregnancyEmail(p))
    case 'repro_birth_soon':       return render(ReproBirthSoonEmail(p))
    case 'owner_checkin':          return render(OwnerCheckinEmail(p))
    case 'owner_activation':       return render(OwnerActivationEmail(p))
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
  opts: { userId?: string; dedupeKey?: string; locale?: string; replyTo?: string } = {},
): Promise<{ ok: boolean; skipped?: 'preference' | 'duplicate' | 'no_key'; error?: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const meta = TEMPLATE_META[email.template]

  // ── Resolución de idioma (por usuario) ──────────────────────────────────
  // 1) locale explícito en opts (si el caller ya lo tiene resuelto)
  // 2) profiles.language del userId
  // 3) DEFAULT_LOCALE ('es')
  // Una consulta de idioma fallida NUNCA debe impedir el envío: caemos al
  // idioma por defecto.
  let locale: Locale = normalizeLocale(opts.locale) ?? DEFAULT_LOCALE
  if (!normalizeLocale(opts.locale) && opts.userId) {
    try {
      const { data: prof } = await admin
        .from('profiles')
        .select('language')
        .eq('id', opts.userId)
        .maybeSingle()
      locale = normalizeLocale(prof?.language) ?? DEFAULT_LOCALE
    } catch {
      locale = DEFAULT_LOCALE
    }
  }
  const t = getTranslator(locale)

  const subject = meta.subject(email.props, t)

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
    const html = await renderTemplate(email, locale)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res: any = await r.emails.send({
      from: FROM_TRANSACTIONAL,
      to,
      subject,
      html,
      // Prioridad de reply-to: opts.replyTo (per-call) > meta.replyTo (per-template) > REPLY_TO (genérico).
      // Per-call lo usamos en inquiry_received para que la respuesta del
      // solicitante vaya directa al email del criador.
      replyTo: opts.replyTo || meta.replyTo || REPLY_TO,
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
