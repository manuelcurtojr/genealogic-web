import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { sendPushToUser } from '@/lib/push'

export async function POST(request: NextRequest) {
  try {
    // Auth: either service role key header OR authenticated user
    const serviceKey = request.headers.get('x-service-key')
    const isServiceCall = serviceKey === process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!isServiceCall) {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, title, body, data } = await request.json()

    if (!userId || !title || !body) {
      return NextResponse.json({ error: 'Missing userId, title, or body' }, { status: 400 })
    }

    const result = await sendPushToUser(userId, title, body, data)
    return NextResponse.json(result)
  } catch (err: any) {
    console.error('Push send error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
