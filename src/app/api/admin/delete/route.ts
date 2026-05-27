import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { checkRateLimit, getClientIp, rateLimitHeaders } from '@/lib/rate-limit'
import { logAdminAction, type AdminAction } from '@/lib/admin/audit-log'
import { notifySuperAdmin } from '@/lib/admin/notify'

export async function POST(request: NextRequest) {
  // Verify caller is admin
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Not admin' }, { status: 403 })

  // Rate limit: max 30 deletes por admin por hora. Borrar es destructivo
  // y NO debería ser bulk. Un admin comprometido frenado aquí.
  const ip = getClientIp(request.headers)
  const rl = checkRateLimit(`admin-delete:${user.id}`, { tokens: 30, windowMs: 60 * 60_000 })
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: rateLimitHeaders(rl, 30) },
    )
  }

  const { table, id } = await request.json()
  if (!table || !id) return NextResponse.json({ error: 'table and id required' }, { status: 400 })

  // Allowlist explícito: solo estas tablas se pueden borrar vía admin endpoint.
  // Antes había un `default` permisivo que delegaba a cualquier tabla del schema,
  // lo cual permitía a un admin (o token admin filtrado) borrar de platform_settings,
  // migrations, etc.
  const ALLOWED_TABLES = ['dogs', 'kennels', 'litters', 'profiles'] as const
  if (!ALLOWED_TABLES.includes(table as typeof ALLOWED_TABLES[number])) {
    return NextResponse.json({ error: `Unsupported table: ${table}` }, { status: 400 })
  }

  // Validar UUID
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (typeof id !== 'string' || !UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  // Use service role for unrestricted delete
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Handle cascading deletes for certain tables
  switch (table) {
    case 'dogs': {
      // Remove parent references first
      await adminSupabase.from('dogs').update({ father_id: null }).eq('father_id', id)
      await adminSupabase.from('dogs').update({ mother_id: null }).eq('mother_id', id)
      // Delete photos, vet records, awards
      await Promise.all([
        adminSupabase.from('dog_photos').delete().eq('dog_id', id),
        adminSupabase.from('vet_records').delete().eq('dog_id', id),
        adminSupabase.from('vet_reminders').delete().eq('dog_id', id),
        adminSupabase.from('awards').delete().eq('dog_id', id),
      ])
      const { error } = await adminSupabase.from('dogs').delete().eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      break
    }
    case 'kennels': {
      // Unlink dogs from kennel
      await adminSupabase.from('dogs').update({ kennel_id: null }).eq('kennel_id', id)
      const { error } = await adminSupabase.from('kennels').delete().eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      break
    }
    case 'litters': {
      const { error } = await adminSupabase.from('litters').delete().eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      break
    }
    case 'profiles': {
      // Delete user account — use Supabase Admin API
      // First clean up user data
      await Promise.all([
        adminSupabase.from('notifications').delete().eq('user_id', id),
        adminSupabase.from('vet_reminders').delete().eq('owner_id', id),
      ])
      // Delete user from auth
      const { error } = await adminSupabase.auth.admin.deleteUser(id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      break
    }
  }

  // Audit log + alerta al super admin para acciones destructivas.
  const actionMap: Record<string, AdminAction> = {
    dogs: 'delete_dog',
    kennels: 'delete_kennel',
    litters: 'delete_dog',  // sin enum específico, lo agrupamos
    profiles: 'delete_user',
  }
  const userAgent = request.headers.get('user-agent')
  await logAdminAction({
    adminId: user.id,
    action: actionMap[table] || 'delete_user',
    targetTable: table,
    targetId: id,
    ip,
    userAgent,
  })
  notifySuperAdmin({
    kind: 'system_alert',
    subject: `Admin delete: ${table}`,
    body: `Admin ${user.email} borró ${table}/${id}.\nIP: ${ip}`,
    dedupeKey: `audit:delete:${table}:${id}:${Date.now()}`,
  }).catch(() => {})

  return NextResponse.json({ success: true })
}
