import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

// Proxy image downloads — bypasses CORS for presadb images
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) return new NextResponse('URL required', { status: 400 })

  // Only allow presadb domains
  try {
    const parsed = new URL(url)
    if (!parsed.hostname.includes('presadb.com')) return new NextResponse('Domain not allowed', { status: 403 })
  } catch { return new NextResponse('Invalid URL', { status: 400 }) }

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) return new NextResponse('Image not found', { status: res.status })

    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const buffer = await res.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch {
    return new NextResponse('Failed to fetch image', { status: 502 })
  }
}
