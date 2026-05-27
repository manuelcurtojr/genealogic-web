/**
 * Rate limit en memoria por proceso/worker.
 *
 * Útil como primera defensa contra abuso casual o bots básicos en endpoints
 * públicos (`/api/contact-kennel`, `/api/proxy-fetch`, `/api/feedback/ask-ai`).
 * En Vercel serverless cada instancia tiene su propio Map — un atacante
 * suficientemente paciente puede sortearlo lanzando peticiones a varias
 * instancias en paralelo. Para protección real, migrar a Upstash Redis o
 * KV con `@vercel/kv`. Mientras tanto, esto frena el 99% de abuso.
 *
 * Uso:
 *   const ok = checkRateLimit(`contact-kennel:${ip}`, { tokens: 5, windowMs: 60_000 })
 *   if (!ok) return new NextResponse('Too Many Requests', { status: 429 })
 *
 * Algoritmo: ventana fija con reset al expirar. Simple, sin sliding window
 * ni token bucket — suficiente para los casos de uso.
 */

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

// Limpieza pasiva: cada 1000 entradas inspecciona y elimina expiradas.
// Sin setInterval porque en serverless no se garantiza ejecución.
let inserts = 0
const GC_EVERY = 1000

function gc(now: number) {
  for (const [k, b] of buckets) {
    if (b.resetAt < now) buckets.delete(k)
  }
}

export interface RateLimitOptions {
  /** Número máximo de peticiones permitidas en la ventana. */
  tokens: number
  /** Ventana en milisegundos. */
  windowMs: number
}

export interface RateLimitResult {
  ok: boolean
  remaining: number
  resetAt: number
}

export function checkRateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
  const now = Date.now()
  inserts++
  if (inserts % GC_EVERY === 0) gc(now)

  const existing = buckets.get(key)
  if (!existing || existing.resetAt < now) {
    const resetAt = now + opts.windowMs
    buckets.set(key, { count: 1, resetAt })
    return { ok: true, remaining: opts.tokens - 1, resetAt }
  }

  if (existing.count >= opts.tokens) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt }
  }

  existing.count++
  return { ok: true, remaining: opts.tokens - existing.count, resetAt: existing.resetAt }
}

/** Extrae la mejor aproximación a IP del request de Next.js. */
export function getClientIp(headers: Headers): string {
  const xff = headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]!.trim()
  const real = headers.get('x-real-ip')
  if (real) return real
  return 'unknown'
}

/** Cabeceras estándar de rate limit para incluir en respuestas. */
export function rateLimitHeaders(r: RateLimitResult, limit: number): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(r.remaining),
    'X-RateLimit-Reset': String(Math.ceil(r.resetAt / 1000)),
    ...(r.ok ? {} : { 'Retry-After': String(Math.max(1, Math.ceil((r.resetAt - Date.now()) / 1000))) }),
  }
}
