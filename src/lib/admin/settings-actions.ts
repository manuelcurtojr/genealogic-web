/**
 * Server actions admin para gestionar `platform_settings` con audit log.
 *
 * Antes el componente cliente hacía UPDATE/INSERT/DELETE directos. Funcionaba
 * pero no había trazabilidad: cambiar el email de soporte, una API key
 * embebida (Stripe webhook secret, ScrapingBee, etc.) o políticas críticas
 * NUNCA debería ocurrir sin dejar rastro.
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logAdminAction } from '@/lib/admin/audit-log'
import { notifySuperAdmin } from '@/lib/admin/notify'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('unauthorized')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') throw new Error('forbidden')
  return { supabase, user }
}

/** Keys consideradas SENSIBLES — además de auditar disparan alerta al super
 *  admin para que sepa que algo crítico cambió (incluso si lo hizo él mismo
 *  en otra pestaña, queda registro inmutable). */
const SENSITIVE_KEYS = new Set([
  'super_admin_email',
  'SCRAPINGBEE_API_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_WEBHOOK_SECRET_CONNECT',
  'RESEND_API_KEY',
])

function isSensitive(key: string): boolean {
  return SENSITIVE_KEYS.has(key)
    || /KEY|SECRET|TOKEN|PASSWORD/i.test(key)
}

/** Mantener el value "redacted" en el audit log si la key es sensible:
 *  no queremos volcar API keys en plain text en una tabla que algún día
 *  podría leer un humano. */
function redactValue(key: string, value: string): string {
  if (!isSensitive(key)) return value
  if (!value) return ''
  if (value.length <= 8) return '***'
  return `${value.slice(0, 4)}…${value.slice(-2)}`
}

export async function adminUpsertSettingAction(input: {
  key: string
  value: string
  description?: string | null
}): Promise<{ ok: true }> {
  const { supabase, user } = await requireAdmin()

  // Leemos valor previo para before/after en el audit
  const { data: prev } = await supabase
    .from('platform_settings')
    .select('id, value')
    .eq('key', input.key)
    .maybeSingle()

  if (prev?.id) {
    const { error } = await supabase
      .from('platform_settings')
      .update({
        value: input.value,
        updated_at: new Date().toISOString(),
        ...(input.description !== undefined ? { description: input.description } : {}),
      })
      .eq('id', prev.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('platform_settings')
      .insert({
        key: input.key,
        value: input.value,
        description: input.description || null,
      })
    if (error) throw new Error(error.message)
  }

  void logAdminAction({
    adminId: user.id,
    action: 'settings_change',
    targetTable: 'platform_settings',
    targetId: input.key,
    payload: {
      key: input.key,
      before: prev?.value ? redactValue(input.key, prev.value) : null,
      after: redactValue(input.key, input.value),
      sensitive: isSensitive(input.key),
    },
  })

  // Alerta al super admin si la setting es sensible.
  if (isSensitive(input.key)) {
    notifySuperAdmin({
      kind: 'system_alert',
      subject: `Setting sensible cambiada: ${input.key}`,
      body: `La setting ${input.key} ha sido modificada en /admin/settings.\n\nValor anterior: ${prev?.value ? redactValue(input.key, prev.value) : '(no existía)'}\nNuevo valor: ${redactValue(input.key, input.value)}\n\nSi no fuiste tú, revoca acceso admin y rota la key inmediatamente.`,
      dedupeKey: `settings:${input.key}:${Date.now()}`,
    }).catch(() => {})
  }

  revalidatePath('/admin/settings')
  return { ok: true }
}

export async function adminDeleteSettingAction(input: {
  key: string
}): Promise<{ ok: true }> {
  const { supabase, user } = await requireAdmin()

  const { data: prev } = await supabase
    .from('platform_settings')
    .select('id, value')
    .eq('key', input.key)
    .maybeSingle()
  if (!prev?.id) return { ok: true }

  const { error } = await supabase
    .from('platform_settings')
    .delete()
    .eq('id', prev.id)
  if (error) throw new Error(error.message)

  void logAdminAction({
    adminId: user.id,
    action: 'settings_change',
    targetTable: 'platform_settings',
    targetId: input.key,
    payload: {
      key: input.key,
      operation: 'delete',
      before: redactValue(input.key, prev.value),
    },
  })

  if (isSensitive(input.key)) {
    notifySuperAdmin({
      kind: 'system_alert',
      subject: `Setting sensible eliminada: ${input.key}`,
      body: `La setting ${input.key} ha sido eliminada en /admin/settings.\n\nSi no fuiste tú, revoca acceso admin.`,
      dedupeKey: `settings-del:${input.key}:${Date.now()}`,
    }).catch(() => {})
  }

  revalidatePath('/admin/settings')
  return { ok: true }
}
