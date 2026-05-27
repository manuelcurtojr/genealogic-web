/**
 * Helper para registrar acciones del super admin en `admin_audit_log`.
 *
 * Cualquier server action o API route admin DEBE llamar a `logAdminAction()`
 * tras ejecutar una mutación. Imprescindible para forensics + due diligence
 * de venta (sabes quién impersonó, borró, cambió rol, modificó settings, etc.).
 *
 * Best-effort: si la inserción falla, NO rompe el flujo del caller. Solo
 * logueamos a console.error para no perder señal en producción.
 */
import { createKennelAdminClient } from '@/lib/supabase/server'

export type AdminAction =
  | 'impersonate'
  | 'delete_user'
  | 'delete_dog'
  | 'delete_kennel'
  | 'role_change'
  | 'status_change'
  | 'password_reset'
  | 'password_set'
  | 'claim_approve'
  | 'claim_reject'
  | 'claim_resolve'
  | 'settings_change'
  | 'transfer_dog'
  | 'transfer_kennel'
  | 'edit_profile'
  | 'edit_kennel'
  | 'edit_dog'

interface LogOpts {
  adminId: string
  action: AdminAction
  /** Tabla afectada (ej. 'profiles', 'dogs', 'admin_requests') */
  targetTable?: string
  /** ID de la row afectada (UUID o cualquier identificador) */
  targetId?: string
  /** Payload con context: before/after, motivo, etc. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: Record<string, any>
  /** IP del request (extraída del header x-forwarded-for) */
  ip?: string | null
  /** User-Agent del request */
  userAgent?: string | null
}

export async function logAdminAction(opts: LogOpts): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createKennelAdminClient() as any
    await admin.from('admin_audit_log').insert({
      admin_id: opts.adminId,
      action: opts.action,
      target_table: opts.targetTable || null,
      target_id: opts.targetId || null,
      payload: opts.payload || {},
      ip: opts.ip || null,
      user_agent: opts.userAgent ? opts.userAgent.slice(0, 500) : null,
    })
  } catch (e) {
    console.error('[admin audit] failed to log', opts.action, e)
  }
}
