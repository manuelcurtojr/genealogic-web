import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIp, rateLimitHeaders } from '@/lib/rate-limit'
import { promises as dnsPromises } from 'node:dns'

// nodejs runtime: necesitamos crypto y mejor control de fetch que en edge.
export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Proxy fetch para el importador de pedigrees.
 *
 * Antes: allowlist cerrada de 10 dominios — solo funcionaba con
 * presadb/ingrus/etc. Cualquier club FCI, criador individual o sitio
 * en otro idioma daba 403.
 *
 * Ahora: lista DENY (SSRF protection) en vez de lista ALLOW.
 * Bloquea solo:
 *  - Protocolos no http/https (file://, gopher://, etc.)
 *  - Hostnames de IPs privadas / loopback / link-local
 *  - Hostnames sin TLD válido
 *  - Puertos no estándar
 * Lo demás pasa.
 *
 * Estrategia de scraping en 3 pasos:
 *  1. Direct fetch con 2 user-agents (Chrome real + Googlebot)
 *  2. ScrapingBee SIN render JS (proxy residencial, rápido)
 *  3. ScrapingBee CON render JS (más caro, ~5s, para SPAs)
 *
 * Devuelve el HTML del primer paso que dé contenido razonable
 * (>3000 chars, sin cf-challenge, sin 403).
 */
export async function GET(request: NextRequest) {
  // ─── Auth (mínimo: estar logueado) ──────────────────────────────
  // Este endpoint consume cuota propia (ScrapingBee) y IPs de Vercel,
  // así que no puede ser anónimo. Solo usuarios logueados pueden
  // usarlo. El cron de importación masiva usa el endpoint distinto
  // /api/cron/* con su propio secret.
  const supabaseServer = await createServerClient()
  const { data: { user } } = await supabaseServer.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  // ─── Rate limit por usuario (10 req/min) ────────────────────────
  // El importador legítimo hace 1-3 fetches por pedigree manual; 10/min
  // es holgado. Bots o uso abusivo se cortan aquí.
  const ip = getClientIp(request.headers)
  const rl = checkRateLimit(`proxy-fetch:${user.id}:${ip}`, { tokens: 10, windowMs: 60_000 })
  if (!rl.ok) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: rateLimitHeaders(rl, 10),
    })
  }

  const url = request.nextUrl.searchParams.get('url')
  if (!url) return new NextResponse('URL required', { status: 400 })

  // ─── SSRF protection ────────────────────────────────────────────
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    return new NextResponse('Invalid URL', { status: 400 })
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return new NextResponse('Protocol not allowed', { status: 403 })
  }

  const host = parsedUrl.hostname.toLowerCase()

  // Bloquear IPs literales (privadas, loopback, link-local)
  if (isPrivateOrLoopbackHost(host)) {
    return new NextResponse('Host not allowed', { status: 403 })
  }

  // Bloquear nombres sospechosos sin TLD
  if (!host.includes('.') || host === 'localhost') {
    return new NextResponse('Host not allowed', { status: 403 })
  }

  // Bloquear puertos no estándar (evita escaneo interno)
  if (parsedUrl.port && parsedUrl.port !== '80' && parsedUrl.port !== '443') {
    return new NextResponse('Port not allowed', { status: 403 })
  }

  // ─── Denylist por política expresa del sitio ────────────────────
  // ingrus.net publica un Content-Signal explícito (robots.txt) prohibiendo
  // acceso automatizado por bots de IA (ClaudeBot, GPTBot, etc.). Respetamos
  // esa voluntad declarada. Usuarios que tengan derecho a importar datos de
  // su perro pueden hacerlo vía screenshot/PDF en la UI del importador.
  if (host === 'ingrus.net' || host.endsWith('.ingrus.net')) {
    return new NextResponse(
      'This source is not supported. ingrus.net does not authorize automated access by AI bots. Please use a screenshot or PDF upload instead.',
      { status: 451 }, // 451 Unavailable For Legal Reasons
    )
  }

  // ─── DNS resolution defense (DNS rebind / public hostname → private IP) ──
  // El guard de hostname literal arriba no detecta dominios con A records
  // apuntando a 169.254.169.254 (AWS metadata) o 10.x.x.x interno. Resolvemos
  // el hostname y rechazamos si CUALQUIER IP resuelta cae en rangos privados.
  try {
    const addresses = await dnsPromises.lookup(host, { all: true })
    for (const addr of addresses) {
      if (addr.family === 4 && isPrivateOrLoopbackHost(addr.address)) {
        return new NextResponse('Host resolves to private IP', { status: 403 })
      }
      if (addr.family === 6) {
        // Rechazamos IPv6 por simplicidad — la mayoría de sitios target
        // usan IPv4 y permitir IPv6 amplía la superficie de SSRF.
        return new NextResponse('IPv6 not allowed', { status: 403 })
      }
    }
  } catch {
    return new NextResponse('Host not resolvable', { status: 403 })
  }

  // ─── Step 1: direct fetch ───────────────────────────────────────
  const UAS = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Googlebot/2.1 (+http://www.google.com/bot.html)',
  ]

  for (const ua of UAS) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': ua,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,es;q=0.8,fr;q=0.7,it;q=0.6,de;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
        },
        signal: AbortSignal.timeout(8000),
        redirect: 'follow',
      })
      if (res.ok) {
        // Fuerza UTF-8 reinterpretation para evitar mojibake en sitios polacos/rusos
        const buf = await res.arrayBuffer()
        const html = new TextDecoder('utf-8', { fatal: false }).decode(buf)
        if (isGoodHtml(html)) {
          return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
        }
      }
    } catch {
      // Sigue al siguiente UA / siguiente estrategia
    }
  }

  // ─── Steps 2 & 3: ScrapingBee (con y sin JS render) ─────────────
  let sbKey: string | undefined
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const { data } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'SCRAPINGBEE_API_KEY')
      .single()
    sbKey = data?.value as string | undefined
  } catch {}

  if (sbKey) {
    // Step 2: sin render JS (rápido, ~1s, premium proxy)
    try {
      const sbUrl =
        `https://app.scrapingbee.com/api/v1/` +
        `?api_key=${sbKey}` +
        `&url=${encodeURIComponent(url)}` +
        `&render_js=false` +
        `&premium_proxy=true` +
        `&country_code=es`
      const res = await fetch(sbUrl, { signal: AbortSignal.timeout(20000) })
      if (res.ok) {
        const html = await res.text()
        if (isGoodHtml(html)) {
          return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
        }
      }
    } catch {}

    // Step 3: con render JS (~5s, para SPAs como ingrus modern view)
    try {
      const sbUrl =
        `https://app.scrapingbee.com/api/v1/` +
        `?api_key=${sbKey}` +
        `&url=${encodeURIComponent(url)}` +
        `&render_js=true` +
        `&premium_proxy=true` +
        `&wait=2000` +
        `&country_code=es`
      const res = await fetch(sbUrl, { signal: AbortSignal.timeout(30000) })
      if (res.ok) {
        const html = await res.text()
        if (isGoodHtml(html)) {
          return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
        }
      }
    } catch {}
  }

  return new NextResponse('Could not fetch page after 3 strategies', { status: 502 })
}

/** Detecta IPs privadas, loopback, link-local, broadcast — SSRF guard. */
function isPrivateOrLoopbackHost(host: string): boolean {
  // IPv4 literal
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (ipv4) {
    const [a, b] = [parseInt(ipv4[1]), parseInt(ipv4[2])]
    // 10.0.0.0/8
    if (a === 10) return true
    // 172.16.0.0/12
    if (a === 172 && b >= 16 && b <= 31) return true
    // 192.168.0.0/16
    if (a === 192 && b === 168) return true
    // 127.0.0.0/8 — loopback
    if (a === 127) return true
    // 169.254.0.0/16 — link-local (AWS metadata 169.254.169.254 ¡crítico!)
    if (a === 169 && b === 254) return true
    // 0.0.0.0/8 — current network
    if (a === 0) return true
    // 100.64.0.0/10 — CGNAT
    if (a === 100 && b >= 64 && b <= 127) return true
    // 224.0.0.0/4 — multicast
    if (a >= 224) return true
    return false
  }
  // IPv6 simplificado: bloquear todo lo que parezca IPv6 con :: o que sea ::1
  if (host.includes(':')) return true
  return false
}

/** ¿El HTML es decente o es una página de error / challenge? */
function isGoodHtml(html: string): boolean {
  if (html.length < 3000) return false
  const lower = html.slice(0, 5000).toLowerCase()
  if (lower.includes('cf-challenge') || lower.includes('cf-browser-verification')) return false
  if (lower.includes('captcha') && lower.includes('verify you are human')) return false
  if (lower.includes('403 forbidden') && html.length < 8000) return false
  if (lower.includes('access denied') && html.length < 8000) return false
  return true
}
