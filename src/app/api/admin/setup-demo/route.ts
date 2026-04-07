import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Temporary admin endpoint to set up demo@manuelcurto.com as owner (no kennel)
// DELETE this file after use
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Only allow admin users
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Not admin' }, { status: 403 })

  // Find demo user
  const { data: demoProfile } = await supabase
    .from('profiles')
    .select('id, display_name, email, role')
    .eq('email', 'demo@manuelcurto.com')
    .single()

  if (!demoProfile) {
    return NextResponse.json({ error: 'demo@manuelcurto.com not found in profiles' }, { status: 404 })
  }

  // Check what kennel and dogs they have
  const { data: kennels } = await supabase.from('kennels').select('id, name').eq('owner_id', demoProfile.id)
  const { data: dogs } = await supabase.from('dogs').select('id, name').eq('owner_id', demoProfile.id)

  // To make demo an "owner" (not breeder), we remove their kennel association
  // But keep their dogs
  if (kennels && kennels.length > 0) {
    // Unlink dogs from kennel (keep them owned)
    for (const k of kennels) {
      await supabase.from('dogs').update({ kennel_id: null }).eq('kennel_id', k.id).eq('owner_id', demoProfile.id)
    }
    // Delete kennels
    for (const k of kennels) {
      await supabase.from('kennels').delete().eq('id', k.id)
    }
  }

  return NextResponse.json({
    success: true,
    demoUser: demoProfile,
    removedKennels: kennels?.length || 0,
    dogsKept: dogs?.length || 0,
  })
}
