/**
 * Envío del email de recuperación de contraseña con NUESTRA infraestructura
 * (Resend + plantilla propia), en vez del email por defecto de Supabase Auth.
 *
 * Genera un enlace de recuperación con `admin.generateLink` (NO manda email él
 * solo) y construye un enlace con `token_hash` que apunta directamente a
 * /reset-password. Allí se verifica con `verifyOtp` en el cliente:
 *   - No depende del code_verifier de PKCE → funciona aunque el enlace se abra
 *     en otro dispositivo/navegador (causa habitual del "enlace caducado").
 *   - Los escáneres de enlaces de email que no ejecutan JS no consumen el token.
 *
 * Anti-enumeración: ante CUALQUIER error (incl. usuario inexistente) no manda
 * nada y no lanza. El caller siempre responde "te hemos enviado un email".
 */
import 'server-only'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { sendTransactionalEmail } from '@/lib/email/send'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.genealogic.io'

export async function sendPasswordResetEmail(email: string, locale?: string): Promise<void> {
  const clean = email.trim().toLowerCase()
  if (!clean) return

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Sin `redirectTo`: no lo necesitamos (construimos el enlace con el token_hash)
  // y así evitamos que generateLink falle si esa URL no está en la allowlist de
  // redirects de Supabase — eso provocaría un fallo silencioso (no se manda nada).
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email: clean,
  })

  const tokenHash = data?.properties?.hashed_token
  if (error || !tokenHash) {
    // Usuario inexistente u otro error → no filtramos nada al cliente. Logueamos
    // server-side los errores REALES (no el "user not found" esperado) para depurar.
    if (error && !/not.?found|user/i.test(error.message)) {
      console.error('[password-reset] generateLink failed:', error.message)
    }
    return
  }

  const resetUrl = `${SITE_URL}/reset-password?token_hash=${encodeURIComponent(tokenHash)}&type=recovery`

  await sendTransactionalEmail(
    clean,
    { template: 'password_reset', props: { resetUrl } },
    { userId: data.user?.id, locale },
  )
}
