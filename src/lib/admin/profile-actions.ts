/**
 * Server actions admin para mutar profiles con audit log automático.
 *
 * Antes el panel admin-user-panel y admin-users-client hacían
 * `supabase.from('profiles').update(...)` directo desde cliente. Funcionaba
 * (RLS de profiles permite a role=admin escribir), pero NO había trazabilidad.
 *
 * Estas server actions encapsulan: validar admin, leer estado anterior,
 * aplicar UPDATE, registrar en admin_audit_log con before/after en payload,
 * y opcionalmente notificar al super admin si el cambio es crítico.
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logAdminAction } from '@/lib/admin/audit-log'

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

/** Cambiar el rol de un usuario. Loggea before → after. */
export async function adminChangeUserRoleAction(input: {
  userId: string
  newRole: 'admin' | 'breeder' | 'owner'
}): Promise<{ ok: true }> {
  const { supabase, user } = await requireAdmin()
  // Leer rol previo para incluirlo en el payload del audit log
  const { data: prev } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', input.userId)
    .single()

  const { error } = await supabase
    .from('profiles')
    .update({ role: input.newRole })
    .eq('id', input.userId)
  if (error) throw new Error(error.message)

  void logAdminAction({
    adminId: user.id,
    action: 'role_change',
    targetTable: 'profiles',
    targetId: input.userId,
    payload: {
      target_email: prev?.email || null,
      before: prev?.role || null,
      after: input.newRole,
    },
  })

  revalidatePath('/admin/users')
  revalidatePath(`/admin/users/${input.userId}`)
  return { ok: true }
}

/** Cambiar el status (active/suspended/banned) de un usuario. */
export async function adminChangeUserStatusAction(input: {
  userId: string
  newStatus: 'active' | 'suspended' | 'banned'
}): Promise<{ ok: true }> {
  const { supabase, user } = await requireAdmin()
  const { data: prev } = await supabase
    .from('profiles')
    .select('status, email')
    .eq('id', input.userId)
    .single()

  const { error } = await supabase
    .from('profiles')
    .update({ status: input.newStatus })
    .eq('id', input.userId)
  if (error) throw new Error(error.message)

  void logAdminAction({
    adminId: user.id,
    action: 'status_change',
    targetTable: 'profiles',
    targetId: input.userId,
    payload: {
      target_email: prev?.email || null,
      before: prev?.status || null,
      after: input.newStatus,
    },
  })

  revalidatePath('/admin/users')
  revalidatePath(`/admin/users/${input.userId}`)
  return { ok: true }
}

/** Editar campos generales del profile desde el panel admin. Loggea solo
 *  los campos que cambiaron (no todo el payload) para que el feed quede
 *  legible. Cambios "estructurales" (role, status) se loggean aparte si
 *  vienen en este payload. */
export async function adminEditProfileAction(input: {
  userId: string
  patch: Record<string, unknown>
}): Promise<{ ok: true }> {
  const { supabase, user } = await requireAdmin()

  // Diff: leemos antes y después para registrar solo lo cambiado.
  const fieldsBefore = Object.keys(input.patch)
  const { data: prev } = await supabase
    .from('profiles')
    .select(fieldsBefore.join(','))
    .eq('id', input.userId)
    .single()

  const { error } = await supabase
    .from('profiles')
    .update(input.patch)
    .eq('id', input.userId)
  if (error) throw new Error(error.message)

  // Construir diff (solo campos que cambian)
  const changed: Record<string, { before: unknown; after: unknown }> = {}
  for (const k of fieldsBefore) {
    const before = (prev as Record<string, unknown> | null)?.[k]
    const after = input.patch[k]
    if (before !== after) changed[k] = { before, after }
  }

  // Cambios de role/status se loggean en su propia acción semántica;
  // todo lo demás como 'edit_profile' genérico.
  if (changed.role) {
    void logAdminAction({
      adminId: user.id,
      action: 'role_change',
      targetTable: 'profiles',
      targetId: input.userId,
      payload: changed.role,
    })
  }
  if (changed.status) {
    void logAdminAction({
      adminId: user.id,
      action: 'status_change',
      targetTable: 'profiles',
      targetId: input.userId,
      payload: changed.status,
    })
  }
  const otherChanges = Object.fromEntries(
    Object.entries(changed).filter(([k]) => k !== 'role' && k !== 'status'),
  )
  if (Object.keys(otherChanges).length > 0) {
    void logAdminAction({
      adminId: user.id,
      action: 'edit_profile',
      targetTable: 'profiles',
      targetId: input.userId,
      payload: { changed: Object.keys(otherChanges) },
    })
  }

  revalidatePath('/admin/users')
  revalidatePath(`/admin/users/${input.userId}`)
  return { ok: true }
}
