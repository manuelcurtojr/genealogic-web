import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabase } from '@supabase/supabase-js'

export const runtime = 'edge'

// Authenticated endpoint that returns the Anthropic API key for client-side extraction
// This avoids Vercel serverless/edge timeout issues by moving the slow Claude call to the browser
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    // Get API key from platform_settings
    const admin = createSupabase(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const { data } = await admin.from('platform_settings').select('value').eq('key', 'ANTHROPIC_API_KEY').single()
    if (!data?.value) {
      const envKey = process.env.ANTHROPIC_API_KEY
      if (!envKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
      return NextResponse.json({ key: envKey })
    }
    return NextResponse.json({ key: data.value })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
