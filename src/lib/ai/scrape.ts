/**
 * Scraper minimalista de páginas web para alimentar la biblioteca del emailbot.
 *
 * - fetch del HTML con User-Agent identificable (Genealogic-Bot)
 * - cheerio para parsear y eliminar ruido (nav, footer, script, style, etc.)
 * - extrae texto principal del <body>
 * - colapsa whitespace
 *
 * NO usa headless browser: páginas con JS-only contenido no se renderizan.
 * Suficiente para 95% de webs de criadores (sitios estáticos / Wordpress).
 */
import 'server-only'
import * as cheerio from 'cheerio'

const USER_AGENT = 'Mozilla/5.0 (compatible; GenealogicBot/1.0; +https://genealogic.io/bot)'
const MAX_HTML_BYTES = 5_000_000  // 5MB de margen

export type ScrapeResult = {
  url: string
  finalUrl: string         // tras redirects
  title: string | null
  text: string
  bytes: number
}

export async function scrapeUrl(rawUrl: string): Promise<ScrapeResult> {
  const url = normalizeUrl(rawUrl)
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, 'Accept': 'text/html,application/xhtml+xml' },
    redirect: 'follow',
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} al cargar ${url}`)
  }
  const ct = res.headers.get('content-type') || ''
  if (!ct.includes('text/html') && !ct.includes('xml')) {
    throw new Error(`La URL no devuelve HTML (Content-Type: ${ct})`)
  }
  const buf = await res.arrayBuffer()
  if (buf.byteLength > MAX_HTML_BYTES) {
    throw new Error(`HTML demasiado grande (${(buf.byteLength / 1024).toFixed(0)} KB > 5 MB)`)
  }
  const html = new TextDecoder().decode(buf)
  const { title, text } = extractMainContent(html)
  return {
    url: rawUrl,
    finalUrl: res.url,
    title,
    text,
    bytes: buf.byteLength,
  }
}

function normalizeUrl(input: string): string {
  let u = input.trim()
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`
  // Validar — throw si no es URL
  new URL(u)
  return u
}

function extractMainContent(html: string): { title: string | null; text: string } {
  const $ = cheerio.load(html)

  // Quitar ruido común
  $('script, style, noscript, iframe, svg, video, audio').remove()
  $('nav, header, footer, aside').remove()
  $('[role="navigation"], [role="banner"], [role="contentinfo"]').remove()
  $('.cookie, .cookies, .gdpr, .consent, .modal, .popup, .newsletter').remove()
  $('#cookie, #cookies, #gdpr, #consent').remove()

  const title = $('title').first().text().trim() || $('h1').first().text().trim() || null

  // Intentar identificar contenido principal (main, article, .content)
  const candidates = [
    'main', 'article', '[role="main"]', '#main', '#content',
    '.main', '.content', '.entry-content', '.post-content', '.page-content',
  ]
  let mainText = ''
  for (const sel of candidates) {
    const el = $(sel).first()
    if (el.length && el.text().trim().length > mainText.length) {
      mainText = collapseWhitespace(el.text())
    }
  }
  // Fallback: body entero
  if (mainText.length < 200) {
    mainText = collapseWhitespace($('body').text())
  }

  return { title, text: mainText }
}

function collapseWhitespace(s: string): string {
  return s
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
