import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { token, platform = 'ios' } = await request.json()
    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

    // Upsert to avoid duplicates
    const { error } = await supabase
      .from('device_tokens')
      .upsert(
        { user_id: user.id, token, platform },
        { onConflict: 'user_id,token' }
      )

    if (error) {
      console.error('Token register error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
