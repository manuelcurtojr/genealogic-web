import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

// Proxy fetch — tries direct fetch, then ScrapingBee if configured
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) return new NextResponse('URL required', { status: 400 })

  const allowedDomains = [
    'presadb.com', 'ingrus.net', 'pedigreedatabase.com', 'k9data.com',
    'pedigree.com', 'pawvillage.com', 'breedarchive.com', 'hunddata.com',
    'working-dog.com', 'el-perro.com',
  ]

  try {
    const urlObj = new URL(url)
    if (!allowedDomains.some(d => urlObj.hostname.includes(d))) return new NextResponse('Domain not allowed', { status: 403 })
  } catch { return new NextResponse('Invalid URL', { status: 400 }) }

  // Strategy 1: Direct fetch with different UAs
  for (const ua of ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 'Googlebot/2.1 (+http://www.google.com/bot.html)']) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': ua, 'Accept': 'text/html', 'Accept-Language': 'en-US,en;q=0.5' },
        signal: AbortSignal.timeout(8000), redirect: 'follow',
      })
      if (res.ok) {
        const html = await res.text()
        if (html.length > 3000 && !html.includes('cf-challenge') && !html.includes('403 Forbidden'))
          return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
      }
    } catch {}
  }

  // Strategy 2: ScrapingBee (residential proxy, if configured)
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data } = await supabase.from('platform_settings').select('value').eq('key', 'SCRAPINGBEE_API_KEY').single()
    if (data?.value) {
      const sbUrl = `https://app.scrapingbee.com/api/v1/?api_key=${data.value}&url=${encodeURIComponent(url)}&render_js=false&premium_proxy=true`
      const res = await fetch(sbUrl, { signal: AbortSignal.timeout(20000) })
      if (res.ok) {
        const html = await res.text()
        if (html.length > 3000) return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
      }
    }
  } catch {}

  return new NextResponse('Could not fetch page', { status: 502 })
}
