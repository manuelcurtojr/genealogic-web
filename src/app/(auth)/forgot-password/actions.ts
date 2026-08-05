'use server'
/**
 * Server action del "olvidé mi contraseña". Manda el email de recuperación con
 * nuestra plantilla Resend (remitente Genealogic) + enlace token_hash.
 * Siempre devuelve ok (anti-enumeración: no revelamos si el email existe).
 */
import { sendPasswordResetEmail } from '@/lib/auth/password-reset'
import { getLocale } from '@/lib/locale'
import { verifyTurnstile } from '@/lib/auth/turnstile-verify'

export async function sendPasswordResetAction(email: string, captchaToken?: string): Promise<{ ok: true }> {
  // Anti-bot: si el CAPTCHA está activo y el token no valida, no mandamos nada.
  // Devolvemos ok igual (anti-enumeración: no revelamos el motivo).
  if (!(await verifyTurnstile(captchaToken))) {
    return { ok: true }
  }
  try {
    await sendPasswordResetEmail(email, await getLocale())
  } catch {
    // Silencio total: nunca filtramos errores al cliente.
  }
  return { ok: true }
}
