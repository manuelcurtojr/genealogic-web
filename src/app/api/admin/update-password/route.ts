import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 })

    const { userId, password } = await request.json()
    if (!userId || !password) return Response.json({ error: 'Missing data' }, { status: 400 })
    if (password.length < 8) return Response.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      return Response.json({ error: 'La contraseña debe incluir mayúsculas, minúsculas y números' }, { status: 400 })
    }

    const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { error } = await admin.auth.admin.updateUserById(userId, { password })

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ ok: true })
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
