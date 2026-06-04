'use server'
/**
 * Server action del "olvidé mi contraseña". Manda el email de recuperación con
 * nuestra plantilla Resend (remitente Genealogic) + enlace token_hash.
 * Siempre devuelve ok (anti-enumeración: no revelamos si el email existe).
 */
import { sendPasswordResetEmail } from '@/lib/auth/password-reset'
import { getLocale } from '@/lib/locale'

export async function sendPasswordResetAction(email: string): Promise<{ ok: true }> {
  try {
    await sendPasswordResetEmail(email, await getLocale())
  } catch {
    // Silencio total: nunca filtramos errores al cliente.
  }
  return { ok: true }
}
