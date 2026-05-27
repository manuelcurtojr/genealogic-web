import { describe, it, expect } from 'vitest'
import { checkRateLimit, getClientIp, rateLimitHeaders } from '../../src/lib/rate-limit'

describe('checkRateLimit', () => {
  it('permite hasta `tokens` peticiones en la ventana', () => {
    const key = `test-allow-${Date.now()}`
    const opts = { tokens: 3, windowMs: 1000 }
    expect(checkRateLimit(key, opts).ok).toBe(true)
    expect(checkRateLimit(key, opts).ok).toBe(true)
    expect(checkRateLimit(key, opts).ok).toBe(true)
    expect(checkRateLimit(key, opts).ok).toBe(false)
  })

  it('reporta remaining decreciente', () => {
    const key = `test-remaining-${Date.now()}`
    const opts = { tokens: 5, windowMs: 1000 }
    const r1 = checkRateLimit(key, opts)
    const r2 = checkRateLimit(key, opts)
    expect(r1.remaining).toBe(4)
    expect(r2.remaining).toBe(3)
  })

  it('resetea cuando expira la ventana', async () => {
    const key = `test-reset-${Date.now()}`
    const opts = { tokens: 1, windowMs: 50 }
    expect(checkRateLimit(key, opts).ok).toBe(true)
    expect(checkRateLimit(key, opts).ok).toBe(false)
    await new Promise(res => setTimeout(res, 60))
    expect(checkRateLimit(key, opts).ok).toBe(true)
  })

  it('keys distintas son independientes', () => {
    const k1 = `test-iso-a-${Date.now()}`
    const k2 = `test-iso-b-${Date.now()}`
    const opts = { tokens: 1, windowMs: 1000 }
    expect(checkRateLimit(k1, opts).ok).toBe(true)
    expect(checkRateLimit(k1, opts).ok).toBe(false)
    expect(checkRateLimit(k2, opts).ok).toBe(true)
  })
})

describe('getClientIp', () => {
  it('extrae primera IP de x-forwarded-for', () => {
    const h = new Headers({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' })
    expect(getClientIp(h)).toBe('1.2.3.4')
  })

  it('fallback a x-real-ip', () => {
    const h = new Headers({ 'x-real-ip': '9.9.9.9' })
    expect(getClientIp(h)).toBe('9.9.9.9')
  })

  it('"unknown" sin headers', () => {
    expect(getClientIp(new Headers())).toBe('unknown')
  })
})

describe('rateLimitHeaders', () => {
  it('incluye Retry-After cuando se ha bloqueado', () => {
    const r = { ok: false, remaining: 0, resetAt: Date.now() + 10_000 }
    const h = rateLimitHeaders(r, 5)
    expect(h['Retry-After']).toBeDefined()
    expect(h['X-RateLimit-Remaining']).toBe('0')
  })

  it('omite Retry-After cuando ha pasado', () => {
    const r = { ok: true, remaining: 3, resetAt: Date.now() + 10_000 }
    const h = rateLimitHeaders(r, 5)
    expect(h['Retry-After']).toBeUndefined()
    expect(h['X-RateLimit-Remaining']).toBe('3')
  })
})
