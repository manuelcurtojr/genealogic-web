import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Proxy image downloads — uses ScrapingBee for residential IPs when direct fetch is blocked
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) return new NextResponse('URL required', { status: 400 })

  try {
    const parsed = new URL(url)
    if (!parsed.hostname.includes('presadb.com')) return new NextResponse('Domain not allowed', { status: 403 })
  } catch { return new NextResponse('Invalid URL', { status: 400 }) }

  // Try direct fetch first
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(8000),
    })
    if (res.ok) {
      const ct = res.headers.get('content-type') || 'image/jpeg'
      if (ct.startsWith('image/')) {
        const buffer = await res.arrayBuffer()
        return new NextResponse(buffer, { headers: { 'Content-Type': ct, 'Cache-Control': 'public, max-age=86400' } })
      }
    }
  } catch {}

  // Fallback: ScrapingBee with residential proxy
  try {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: sbKey } = await sb.from('platform_settings').select('value').eq('key', 'SCRAPINGBEE_API_KEY').single()
    if (sbKey?.value) {
      const sbUrl = `https://app.scrapingbee.com/api/v1/?api_key=${sbKey.value}&url=${encodeURIComponent(url)}&render_js=false&premium_proxy=true`
      const res = await fetch(sbUrl, { signal: AbortSignal.timeout(15000) })
      if (res.ok) {
        const buffer = await res.arrayBuffer()
        return new NextResponse(buffer, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400' } })
      }
    }
  } catch {}

  return new NextResponse('Failed to fetch image', { status: 502 })
}
