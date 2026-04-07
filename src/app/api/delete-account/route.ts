import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    // Delete all user data in order (respecting foreign keys)
    await supabase.from('deal_activities').delete().eq('user_id', user.id)
    await supabase.from('dog_changes').delete().eq('user_id', user.id)
    await supabase.from('favorites').delete().eq('user_id', user.id)
    await supabase.from('notifications').delete().eq('user_id', user.id)
    await supabase.from('genes_transactions').delete().eq('user_id', user.id)
    await supabase.from('form_submissions').delete().in('kennel_id', (await supabase.from('kennels').select('id').eq('owner_id', user.id)).data?.map(k => k.id) || [])
    await supabase.from('kennel_forms').delete().eq('owner_id', user.id)
    await supabase.from('vet_records').delete().eq('owner_id', user.id)
    await supabase.from('awards').delete().eq('owner_id', user.id)
    await supabase.from('dog_photos').delete().in('dog_id', (await supabase.from('dogs').select('id').eq('owner_id', user.id)).data?.map(d => d.id) || [])
    await supabase.from('events').delete().eq('owner_id', user.id)
    await supabase.from('deals').delete().eq('owner_id', user.id)
    await supabase.from('contacts').delete().eq('owner_id', user.id)
    await supabase.from('pipeline_stages').delete().in('pipeline_id', (await supabase.from('pipelines').select('id').eq('owner_id', user.id)).data?.map(p => p.id) || [])
    await supabase.from('pipelines').delete().eq('owner_id', user.id)
    await supabase.from('litters').delete().eq('owner_id', user.id)
    await supabase.from('dogs').delete().eq('owner_id', user.id)
    await supabase.from('kennels').delete().eq('owner_id', user.id)
    await supabase.from('profiles').delete().eq('id', user.id)

    // Sign out
    await supabase.auth.signOut()

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
