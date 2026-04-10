import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabase } from '@supabase/supabase-js'

export const runtime = 'edge'

// Read API keys from DB using service role (bypasses RLS)
async function getApiKey(key: string): Promise<string | null> {
  try {
    const supabase = createSupabase(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const { data } = await supabase.from('platform_settings').select('value').eq('key', key).single()
    if (data?.value) return data.value
  } catch {}
  return process.env[key] || null
}

const EXTRACTION_PROMPT = `You are a dog pedigree data extractor. Extract the complete pedigree information from this content.

Return a JSON object with this EXACT structure:
{
  "main_dog": {
    "name": "string",
    "sex": "Male" or "Female",
    "registration": "string or null",
    "breed": "string or null",
    "color": "string or null",
    "birth_date": "YYYY-MM-DD or YYYY or null",
    "health": "string (HD, ED results) or null",
    "breeder": "string or null",
    "owner": "string or null",
    "photo_url": "string or null",
    "father_name": "exact name or null",
    "mother_name": "exact name or null"
  },
  "ancestors": [
    {
      "name": "string",
      "sex": "Male" or "Female",
      "registration": "string or null",
      "breed": "string or null",
      "color": "string or null",
      "birth_date": "YYYY-MM-DD or YYYY or null",
      "health": "string or null",
      "photo_url": "string or null",
      "father_name": "string or null",
      "mother_name": "string or null",
      "generation": number (1=parents, 2=grandparents, 3=great-grandparents, etc)
    }
  ]
}

Rules:
- Extract ALL dogs in the pedigree (main dog + ALL ancestors up to whatever generation is available)
- Names must be EXACT as shown (preserve capitalization, accents, special chars)
- father_name and mother_name must match the exact name of another dog in the tree
- Sex: determine from context (sire/father = Male, dam/mother = Female)
- If data is not available, use null
- Return ONLY the JSON, no markdown, no explanation`

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const chunks: string[] = []
  const CHUNK = 8192
  for (let i = 0; i < bytes.length; i += CHUNK) {
    chunks.push(String.fromCharCode(...bytes.subarray(i, i + CHUNK)))
  }
  return btoa(chunks.join(''))
}

function cleanHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .slice(0, 80000)
}

function parseAIResponse(responseText: string) {
  if (!responseText) return null
  let jsonStr = responseText
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) jsonStr = jsonMatch[1]
  const objMatch = jsonStr.match(/\{[\s\S]*\}/)
  if (objMatch) jsonStr = objMatch[0]
  return JSON.parse(jsonStr)
}

async function callClaude(apiKey: string, messages: any[]) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages,
    }),
  })

  if (!res.ok) {
    let detail = ''
    try { const b = await res.json(); detail = b?.error?.message || '' } catch {}
    throw new Error(`Error de IA (${res.status}): ${detail || 'Intenta de nuevo'}`)
  }

  const data = await res.json()
  const text = data.content?.[0]?.text || ''
  if (!text) throw new Error('La IA no devolvió respuesta. Intenta de nuevo.')

  try {
    return parseAIResponse(text)
  } catch {
    throw new Error('No se pudo interpretar la respuesta de la IA. Intenta con otra URL o sube un screenshot.')
  }
}

export async function POST(request: NextRequest) {
  try {
    const ANTHROPIC_KEY = await getApiKey('ANTHROPIC_API_KEY')
    if (!ANTHROPIC_KEY) return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 })

    const body = await request.json()
    const { url, imageBase64, htmlContent: preloadedHtml, sourceUrl } = body

    // === IMAGE UPLOAD ===
    if (imageBase64) {
      const messages = [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } },
          { type: 'text', text: EXTRACTION_PROMPT },
        ],
      }]
      const data = await callClaude(ANTHROPIC_KEY, messages)
      return NextResponse.json({ success: true, data, source: 'image_upload' })
    }

    if (!url && !preloadedHtml) return NextResponse.json({ error: 'URL is required' }, { status: 400 })

    // === STEP 1: Get HTML ===
    let htmlContent: string | null = null

    // Use pre-fetched HTML from client (fastest path)
    if (preloadedHtml && preloadedHtml.length > 2000) {
      htmlContent = cleanHtml(preloadedHtml)
    }

    const fetchUrl = url || sourceUrl

    // Server-side fetch fallback
    if (!htmlContent && fetchUrl) {
      // Try direct fetch first (fastest)
      try {
        const res = await fetch(fetchUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
          signal: AbortSignal.timeout(5000), redirect: 'follow',
        })
        const html = await res.text()
        if (res.ok && html.length > 3000 && !html.includes('cf-challenge') && !html.includes('403 Forbidden')) {
          htmlContent = cleanHtml(html)
        }
      } catch {}

      // ScrapingBee fallback (residential proxy)
      if (!htmlContent) {
        try {
          const sbSupabase = createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
          const { data: sbKey } = await sbSupabase.from('platform_settings').select('value').eq('key', 'SCRAPINGBEE_API_KEY').single()
          if (sbKey?.value) {
            const sbUrl = `https://app.scrapingbee.com/api/v1/?api_key=${sbKey.value}&url=${encodeURIComponent(fetchUrl)}&render_js=false`
            const sbRes = await fetch(sbUrl, { signal: AbortSignal.timeout(8000) })
            if (sbRes.ok) {
              const html = await sbRes.text()
              if (html.length > 3000 && !html.includes('403 Forbidden')) htmlContent = cleanHtml(html)
            }
          }
        } catch {}
      }
    }

    // === STEP 2: Screenshot fallback ===
    let screenshotBase64: string | null = null
    if (!htmlContent && fetchUrl) {
      const APIFLASH_KEY = await getApiKey('APIFLASH_KEY')
      if (APIFLASH_KEY) {
        try {
          const ssUrl = `https://api.apiflash.com/v1/urltoimage?access_key=${APIFLASH_KEY}&url=${encodeURIComponent(fetchUrl)}&format=jpeg&quality=80&width=1920&height=1080&full_page=true&fresh=true&wait_until=network_idle&delay=3&response_type=image`
          const ssRes = await fetch(ssUrl, { signal: AbortSignal.timeout(15000) })
          if (ssRes.ok) {
            screenshotBase64 = arrayBufferToBase64(await ssRes.arrayBuffer())
          }
        } catch {}
      }
    }

    if (!htmlContent && !screenshotBase64) {
      return NextResponse.json({ error: 'No se pudo acceder a la página. Intenta con otra URL o sube un screenshot.' }, { status: 400 })
    }

    // Prefer HTML over screenshot
    if (htmlContent && htmlContent.length > 5000) screenshotBase64 = null

    // === STEP 3: Call Claude ===
    const messages: any[] = []

    if (screenshotBase64) {
      messages.push({
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: screenshotBase64 } },
          { type: 'text', text: EXTRACTION_PROMPT },
        ],
      })
    } else {
      const imgUrls: string[] = []
      const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi
      let match
      while ((match = imgRegex.exec(htmlContent!)) !== null) {
        const src = match[1]
        if (src.startsWith('http') && !src.includes('logo') && !src.includes('icon') && !src.includes('banner')) {
          imgUrls.push(src)
        }
      }
      messages.push({
        role: 'user',
        content: `${EXTRACTION_PROMPT}\n\n--- PAGE HTML ---\n${htmlContent}\n\n--- IMAGE URLS FOUND ---\n${imgUrls.slice(0, 10).join('\n')}`,
      })
    }

    const data = await callClaude(ANTHROPIC_KEY, messages)
    return NextResponse.json({ success: true, data, source: screenshotBase64 ? 'screenshot' : 'html' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al procesar la importación' }, { status: 500 })
  }
}
