/**
 * Renderer del HTML del newsletter.
 *
 * Template HTML inline (sin React Email — añadir esa dep es overkill para v1).
 * Diseño minimal: hero opcional, título, body markdown → HTML simple, CTA
 * opcional, footer con link de baja.
 *
 * Reutiliza el parser markdown que hicimos para contratos (`@/lib/contracts/markdown`)
 * porque cubre los mismos casos básicos (h1-3, bold, italic, listas, links).
 */
import { renderContractMarkdown, contractMarkdownToPlain } from '@/lib/contracts/markdown'

export type NewsletterRenderInput = {
  firstName?: string | null
  subject: string
  preheader?: string | null
  bodyMarkdown: string
  heroImageUrl?: string | null
  ctaLabel?: string | null
  ctaUrl?: string | null
  unsubscribeUrl: string
  kennelName: string
  kennelLogoUrl?: string | null
  /** URL base del kennel (ej: https://iremacurto.com o https://www.genealogic.io/c/<slug>) */
  kennelSiteUrl?: string | null
}

function esc(s: string | null | undefined): string {
  if (!s) return ''
  return s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

/** Devuelve { html, text } listos para Resend. */
export function renderNewsletter(input: NewsletterRenderInput): { html: string; text: string } {
  const greeting = input.firstName ? `Hola ${esc(input.firstName)},` : 'Hola,'
  const bodyHtml = renderContractMarkdown(input.bodyMarkdown || '')
  const bodyText = contractMarkdownToPlain(input.bodyMarkdown || '')

  const ctaBlock = input.ctaLabel && input.ctaUrl
    ? `<table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin: 24px auto 0;">
         <tr><td bgcolor="#0f0f0f" style="border-radius:8px;">
           <a href="${esc(input.ctaUrl)}" target="_blank" style="display:inline-block; padding:12px 28px; font-family:system-ui,sans-serif; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none;">
             ${esc(input.ctaLabel)}
           </a>
         </td></tr>
       </table>`
    : ''

  const hero = input.heroImageUrl
    ? `<tr><td style="padding:0;"><img src="${esc(input.heroImageUrl)}" width="600" alt="" style="display:block; width:100%; max-width:600px; height:auto; border:0;" /></td></tr>`
    : ''

  const logo = input.kennelLogoUrl
    ? `<img src="${esc(input.kennelLogoUrl)}" height="32" alt="${esc(input.kennelName)}" style="display:inline-block; height:32px; max-height:32px; vertical-align:middle;" />`
    : `<span style="font-family:system-ui,sans-serif; font-size:16px; font-weight:600; color:#0f0f0f;">${esc(input.kennelName)}</span>`

  const preheaderBlock = input.preheader
    ? `<div style="display:none; max-height:0; overflow:hidden;">${esc(input.preheader)}</div>`
    : ''

  const html = `<!doctype html>
<html lang="es"><head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light" />
  <title>${esc(input.subject)}</title>
  <style>
    body { margin:0; padding:0; background:#f5f5f5; font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; }
    .nl-container { max-width:600px; margin:0 auto; background:#ffffff; }
    .nl-body { padding:32px 32px 24px; color:#1a1a1a; font-size:15px; line-height:1.6; }
    .nl-body h1 { font-size:24px; margin:24px 0 12px; font-weight:700; }
    .nl-body h2 { font-size:18px; margin:20px 0 10px; font-weight:700; }
    .nl-body h3 { font-size:16px; margin:18px 0 8px; font-weight:600; }
    .nl-body p { margin:10px 0; }
    .nl-body ul, .nl-body ol { margin:12px 0 12px 22px; }
    .nl-body a { color:#0f0f0f; text-decoration:underline; }
    .nl-body hr { border:0; border-top:1px solid #e5e7eb; margin:24px 0; }
    .nl-footer { padding:24px 32px; border-top:1px solid #e5e7eb; color:#6b7280; font-size:12px; line-height:1.5; text-align:center; }
    .nl-footer a { color:#6b7280; text-decoration:underline; }
  </style>
</head>
<body>
  ${preheaderBlock}
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f5f5f5; padding:24px 16px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="nl-container" style="max-width:600px; width:100%; background:#ffffff; border-radius:8px; overflow:hidden;">
        <tr><td style="padding:24px 32px 8px; border-bottom:1px solid #e5e7eb;">${logo}</td></tr>
        ${hero}
        <tr><td class="nl-body">
          <p style="margin:0 0 16px;">${greeting}</p>
          ${bodyHtml}
          ${ctaBlock}
        </td></tr>
        <tr><td class="nl-footer">
          Recibes este email porque te suscribiste al newsletter de
          <strong>${esc(input.kennelName)}</strong>${input.kennelSiteUrl ? ` (<a href="${esc(input.kennelSiteUrl)}">${esc(stripUrl(input.kennelSiteUrl))}</a>)` : ''}.
          <br/>
          <a href="${esc(input.unsubscribeUrl)}">Darme de baja</a> · Genealogic
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`

  const text = [
    greeting,
    '',
    bodyText,
    input.ctaLabel && input.ctaUrl ? `\n→ ${input.ctaLabel}: ${input.ctaUrl}\n` : '',
    `\n— ${input.kennelName}`,
    `\nDarme de baja: ${input.unsubscribeUrl}`,
  ].filter(Boolean).join('\n')

  return { html, text }
}

function stripUrl(u: string): string {
  return u.replace(/^https?:\/\//, '').replace(/\/$/, '')
}
