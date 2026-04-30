import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const [profileRes, dogsRes, littersRes, vetRes, awardsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('dogs').select('*').eq('owner_id', user.id),
      supabase.from('litters').select('*').eq('owner_id', user.id),
      supabase.from('vet_records').select('*').eq('owner_id', user.id),
      supabase.from('awards').select('*').eq('owner_id', user.id),
    ])

    const exportData = {
      exported_at: new Date().toISOString(),
      user_id: user.id,
      email: user.email,
      profile: profileRes.data,
      dogs: dogsRes.data || [],
      litters: littersRes.data || [],
      vet_records: vetRes.data || [],
      awards: awardsRes.data || [],
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="genealogic-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
