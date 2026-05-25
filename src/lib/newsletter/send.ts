/**
 * Envío real de campañas vía Resend.
 *
 *   - sendCampaignTest(campaignId, toEmail) → manda 1 email "[PRUEBA]" al admin
 *   - sendCampaignNow(campaignId) → manda a toda la audiencia (batches de 20)
 *
 * Idempotente: la tabla newsletter_sends tiene UNIQUE (campaign_id,
 * subscriber_id), así si el job se reintenta no se duplican envíos.
 *
 * ENV vars necesarias:
 *   RESEND_API_KEY            (server-only)
 *   NEXT_PUBLIC_SITE_URL      (https://genealogic.io)
 *
 * From: `newsletter@genealogic.io` (separado del transaccional para
 * mejorar entregabilidad y permitir bloquear marketing sin perder avisos).
 *
 * Reply-to: por defecto el del kennel (kennel.email) o reply_to override.
 */
import 'server-only'
import { Resend } from 'resend'
import { createKennelAdminClient } from '@/lib/supabase/server'
import { resolveAudience } from './audiences'
import { renderNewsletter } from './render'

const BATCH_SIZE = 20
const DELAY_BETWEEN_BATCHES_MS = 1000
const FROM_EMAIL = 'Genealogic Newsletter <newsletter@genealogic.io>'

let _resend: Resend | null = null
function resend(): Resend {
  if (_resend) return _resend
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY no configurada')
  _resend = new Resend(key)
  return _resend
}

function firstName(fullName: string | null | undefined): string | null {
  if (!fullName) return null
  const trimmed = fullName.trim()
  if (!trimmed) return null
  return trimmed.split(/\s+/)[0]
}

function unsubscribeUrl(token: string, campaignId: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://genealogic.io'
  return `${base}/newsletter/unsubscribe?token=${encodeURIComponent(token)}&campaign=${encodeURIComponent(campaignId)}`
}

// ─── ENVÍO DE PRUEBA (1 email) ───────────────────────────────────────────────

export async function sendCampaignTest(args: {
  campaignId: string
  toEmail: string
}): Promise<{ ok: true } | { error: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data: c } = await admin
    .from('newsletter_campaigns').select('*').eq('id', args.campaignId).maybeSingle()
  if (!c) return { error: 'Campaña no encontrada' }
  const { data: k } = await admin
    .from('kennels').select('name, slug, logo_url, custom_domain').eq('id', c.kennel_id).maybeSingle()
  if (!k) return { error: 'Kennel no encontrado' }

  const { html, text } = renderNewsletter({
    firstName: 'Prueba',
    subject: c.subject,
    preheader: c.preheader,
    bodyMarkdown: c.body_markdown,
    heroImageUrl: c.hero_image_url,
    ctaLabel: c.cta_label,
    ctaUrl: c.cta_url,
    unsubscribeUrl: 'https://genealogic.io/newsletter/unsubscribe?token=TEST&campaign=TEST',
    kennelName: k.name,
    kennelLogoUrl: k.logo_url,
    kennelSiteUrl: k.custom_domain
      ? `https://${k.custom_domain}`
      : k.slug ? `https://genealogic.io/c/${k.slug}` : null,
  })

  try {
    const replyTo = c.reply_to || undefined
    const res = await resend().emails.send({
      from: FROM_EMAIL,
      to: args.toEmail,
      subject: `[PRUEBA] ${c.subject}`,
      html, text,
      replyTo,
      tags: [{ name: 'newsletter', value: 'test' }, { name: 'campaign', value: args.campaignId.slice(0, 8) }],
    })
    if (res.error) return { error: res.error.message || 'Error Resend' }
    return { ok: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Error enviando email' }
  }
}

// ─── ENVÍO REAL (a toda la audiencia) ────────────────────────────────────────

export async function sendCampaignNow(args: {
  campaignId: string
}): Promise<{ sent: number; failed: number } | { error: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data: c } = await admin
    .from('newsletter_campaigns').select('*').eq('id', args.campaignId).maybeSingle()
  if (!c) return { error: 'Campaña no encontrada' }
  if (c.status === 'sent' || c.status === 'sending') {
    return { error: 'Esta campaña ya se está enviando o ya se envió' }
  }

  const { data: k } = await admin
    .from('kennels').select('name, slug, logo_url, custom_domain').eq('id', c.kennel_id).maybeSingle()
  if (!k) return { error: 'Kennel no encontrado' }

  const audience = await resolveAudience(c.kennel_id, c.audience_type)
  if (audience.length === 0) {
    await admin.from('newsletter_campaigns').update({
      status: 'failed',
      recipients_total: 0,
    }).eq('id', args.campaignId)
    return { error: 'La audiencia está vacía' }
  }

  await admin.from('newsletter_campaigns').update({
    status: 'sending',
    recipients_total: audience.length,
  }).eq('id', args.campaignId)

  // Pre-insert sends pending (UNIQUE previene duplicados en reintentos)
  const sendsPayload = audience.map((s) => ({
    campaign_id: args.campaignId,
    subscriber_id: s.id,
    email: s.email,
    status: 'pending',
  }))
  await admin.from('newsletter_sends').upsert(sendsPayload, {
    onConflict: 'campaign_id,subscriber_id',
    ignoreDuplicates: true,
  })

  const kennelSiteUrl = k.custom_domain
    ? `https://${k.custom_domain}`
    : k.slug ? `https://genealogic.io/c/${k.slug}` : null
  const replyTo = c.reply_to || undefined

  let sent = 0, failed = 0

  for (let i = 0; i < audience.length; i += BATCH_SIZE) {
    const batch = audience.slice(i, i + BATCH_SIZE)
    await Promise.all(batch.map(async (s) => {
      try {
        const unsub = unsubscribeUrl(s.unsubscribe_token, args.campaignId)
        const { html, text } = renderNewsletter({
          firstName: firstName(s.full_name),
          subject: c.subject,
          preheader: c.preheader,
          bodyMarkdown: c.body_markdown,
          heroImageUrl: c.hero_image_url,
          ctaLabel: c.cta_label,
          ctaUrl: c.cta_url,
          unsubscribeUrl: unsub,
          kennelName: k.name,
          kennelLogoUrl: k.logo_url,
          kennelSiteUrl,
        })
        const res = await resend().emails.send({
          from: FROM_EMAIL,
          to: s.email,
          subject: c.subject,
          html, text,
          replyTo,
          tags: [
            { name: 'newsletter', value: 'campaign' },
            { name: 'campaign', value: args.campaignId.slice(0, 8) },
          ],
          headers: {
            'List-Unsubscribe': `<${unsub}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        })
        if (res.error) {
          failed++
          await admin.from('newsletter_sends').update({
            status: 'failed',
            bounce_reason: res.error.message?.slice(0, 500),
          }).eq('campaign_id', args.campaignId).eq('subscriber_id', s.id)
        } else {
          sent++
          await admin.from('newsletter_sends').update({
            status: 'sent',
            resend_id: res.data?.id || null,
          }).eq('campaign_id', args.campaignId).eq('subscriber_id', s.id)
        }
      } catch (err) {
        failed++
        console.error('[newsletter] send error:', s.email, err)
        await admin.from('newsletter_sends').update({
          status: 'failed',
          bounce_reason: (err instanceof Error ? err.message : 'unknown').slice(0, 500),
        }).eq('campaign_id', args.campaignId).eq('subscriber_id', s.id)
      }
    }))
    if (i + BATCH_SIZE < audience.length) {
      await new Promise((r) => setTimeout(r, DELAY_BETWEEN_BATCHES_MS))
    }
  }

  await admin.from('newsletter_campaigns').update({
    status: failed === audience.length ? 'failed' : 'sent',
    sent_at: new Date().toISOString(),
    delivered_count: sent,
    failed_count: failed,
  }).eq('id', args.campaignId)

  return { sent, failed }
}

// ─── UNSUBSCRIBE PÚBLICO (sin auth, por token) ───────────────────────────────

export async function unsubscribeByToken(args: {
  token: string
  campaignId?: string | null
}): Promise<{ ok: true; email: string; kennelName: string } | { error: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data: sub } = await admin
    .from('newsletter_subscribers')
    .select('id, email, kennel_id, is_active')
    .eq('unsubscribe_token', args.token)
    .maybeSingle()
  if (!sub) return { error: 'Enlace inválido o ya utilizado' }

  await admin.from('newsletter_subscribers').update({
    is_active: false,
    unsubscribed_at: new Date().toISOString(),
    unsubscribe_reason: args.campaignId ? `campaign:${args.campaignId}` : 'manual',
  }).eq('id', sub.id)

  // Si vino de una campaña, marcar el send como unsubscribed y bump del contador
  if (args.campaignId) {
    await admin.from('newsletter_sends')
      .update({ status: 'unsubscribed' })
      .eq('campaign_id', args.campaignId)
      .eq('subscriber_id', sub.id)
    // Recalcular unsubscribed_count agregado
    const { count } = await admin
      .from('newsletter_sends')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', args.campaignId)
      .eq('status', 'unsubscribed')
    await admin.from('newsletter_campaigns')
      .update({ unsubscribed_count: count || 0 })
      .eq('id', args.campaignId)
  }

  const { data: k } = await admin
    .from('kennels').select('name').eq('id', sub.kennel_id).maybeSingle()
  return { ok: true, email: sub.email, kennelName: k?.name || 'el criadero' }
}

export function isResendConfigured(): boolean {
  return !!process.env.RESEND_API_KEY
}
