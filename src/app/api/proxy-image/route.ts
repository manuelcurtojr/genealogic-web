import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

// Proxy image — fetches from presadb via Edge (different IPs than serverless)
// Returns image as base64 JSON so the browser can read it despite CORS
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  const format = request.nextUrl.searchParams.get('format') || 'binary'
  if (!url) return new NextResponse('URL required', { status: 400 })

  try {
    const parsed = new URL(url)
    if (!parsed.hostname.includes('presadb.com')) return new NextResponse('Domain not allowed', { status: 403 })
  } catch { return new NextResponse('Invalid URL', { status: 400 }) }

  // Try multiple User-Agents
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Googlebot-Image/1.0',
  ]

  for (const ua of userAgents) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': ua, 'Accept': 'image/*' },
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) continue
      const ct = res.headers.get('content-type') || 'image/jpeg'
      if (!ct.startsWith('image/')) continue

      const buffer = await res.arrayBuffer()
      if (buffer.byteLength < 1000) continue // too small, probably error page

      if (format === 'base64') {
        // Return as JSON with base64 — bypasses CORS for client-side reading
        const bytes = new Uint8Array(buffer)
        const chunks: string[] = []
        const CHUNK = 8192
        for (let i = 0; i < bytes.length; i += CHUNK) {
          chunks.push(String.fromCharCode(...bytes.subarray(i, i + CHUNK)))
        }
        const base64 = btoa(chunks.join(''))
        return NextResponse.json({ base64, contentType: ct, size: buffer.byteLength })
      }

      return new NextResponse(buffer, { headers: { 'Content-Type': ct, 'Cache-Control': 'public, max-age=86400' } })
    } catch {}
  }

  return new NextResponse('Failed to fetch image', { status: 502 })
}
