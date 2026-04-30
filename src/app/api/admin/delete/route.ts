import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  // Verify caller is admin
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Not admin' }, { status: 403 })

  const { table, id } = await request.json()
  if (!table || !id) return NextResponse.json({ error: 'table and id required' }, { status: 400 })

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
    default: {
      // Generic delete
      const { error } = await adminSupabase.from(table).delete().eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
