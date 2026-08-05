import 'server-only'

/**
 * Valida un token de Cloudflare Turnstile contra siteverify (server-side).
 *
 * Se usa en el flujo de reset de contraseña, que NO pasa por Supabase Auth
 * (es un email propio vía Resend), así que el CAPTCHA nativo de Supabase no lo
 * cubre — hay que verificarlo aquí a mano.
 *
 * DEPLOY SEGURO: si TURNSTILE_SECRET_KEY no está configurada devuelve true (no
 * bloquea). Con la clave puesta, exige un token válido.
 */
export async function verifyTurnstile(token: string | null | undefined): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true // sin configurar → no bloquea (deploy seguro)
  if (!token) return false
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
    })
    const data = (await res.json()) as { success?: boolean }
    return data.success === true
  } catch {
    return false
  }
}
