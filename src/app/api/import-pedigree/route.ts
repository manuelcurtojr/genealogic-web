import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabase } from '@supabase/supabase-js'

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
  // Fallback to env
  return process.env[key] || null
}

let ANTHROPIC_KEY: string | null = null
let APIFLASH_KEY: string | null = null

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

export const maxDuration = 60 // Allow up to 60s for AI extraction

export async function POST(request: NextRequest) {
  try {
    // Load API keys from DB or env
    ANTHROPIC_KEY = await getApiKey('ANTHROPIC_API_KEY')
    APIFLASH_KEY = await getApiKey('APIFLASH_KEY')

    if (!ANTHROPIC_KEY) return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 })

    const body = await request.json()
    const { url, imageBase64, htmlContent: preloadedHtml, sourceUrl } = body

    // If image provided directly (manual screenshot upload), skip fetch
    if (imageBase64) {
      const messages = [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } },
          { type: 'text', text: EXTRACTION_PROMPT },
        ],
      }]
      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 8000, messages }),
        signal: AbortSignal.timeout(55000),
      })
      if (!claudeRes.ok) {
        let errDetail = ''
        try { const errBody = await claudeRes.json(); errDetail = errBody?.error?.message || '' } catch {}
        return NextResponse.json({ error: `Error de IA (${claudeRes.status}): ${errDetail || 'Intenta de nuevo'}` }, { status: 500 })
      }
      const claudeData = await claudeRes.json()
      const responseText = claudeData.content?.[0]?.text || ''
      let jsonStr = responseText
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonMatch) jsonStr = jsonMatch[1]
      const objMatch = jsonStr.match(/\{[\s\S]*\}/)
      if (objMatch) jsonStr = objMatch[0]
      let parsedData
      try { parsedData = JSON.parse(jsonStr) } catch { return NextResponse.json({ error: 'No se pudo interpretar la respuesta de la IA.' }, { status: 422 }) }
      return NextResponse.json({ success: true, data: parsedData, source: 'image_upload' })
    }

    if (!url && !preloadedHtml) return NextResponse.json({ error: 'URL is required' }, { status: 400 })

    // Step 1: Try to get HTML
    let htmlContent: string | null = null
    let needsScreenshot = false

    // If HTML was pre-fetched by the client, use it directly
    if (preloadedHtml && preloadedHtml.length > 2000) {
      const cleaned = preloadedHtml
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
        .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
        .slice(0, 80000)
      htmlContent = cleaned
    }

    const fetchUrl = url || sourceUrl
    if (!htmlContent && !fetchUrl) return NextResponse.json({ error: 'No content to analyze' }, { status: 400 })

    // Fetch HTML — try ScrapingBee first (if configured), then direct fetch
    if (!htmlContent && fetchUrl) {
      const cleanHtml = (html: string) => html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
        .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
        .slice(0, 80000)

      // Try ScrapingBee first (residential proxy, bypasses IP blocks)
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

      // Fallback: direct fetch
      if (!htmlContent) {
        try {
          const res = await fetch(fetchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
            signal: AbortSignal.timeout(5000), redirect: 'follow',
          })
          const html = await res.text()
          if (res.ok && html.length > 3000 && !html.includes('cf-challenge') && !html.includes('403 Forbidden')) htmlContent = cleanHtml(html)
        } catch {}
      }

      if (!htmlContent) needsScreenshot = true
    }

    // Step 2: Screenshot fallback
    let screenshotBase64: string | null = null
    if (needsScreenshot && APIFLASH_KEY) {
      try {
        const screenshotUrl = `https://api.apiflash.com/v1/urltoimage?access_key=${APIFLASH_KEY}&url=${encodeURIComponent(fetchUrl)}&format=jpeg&quality=80&width=1920&height=1080&full_page=true&fresh=true&wait_until=network_idle&delay=3&response_type=image`
        const ssRes = await fetch(screenshotUrl, { signal: AbortSignal.timeout(30000) })
        if (ssRes.ok) {
          const buffer = await ssRes.arrayBuffer()
          screenshotBase64 = Buffer.from(buffer).toString('base64')
        }
      } catch { /* screenshot failed, try with whatever we have */ }
    }

    if (!htmlContent && !screenshotBase64) {
      return NextResponse.json({ error: 'No se pudo acceder a la página. Intenta con otra URL.' }, { status: 400 })
    }

    // If we have HTML, prefer it over screenshot (HTML extraction is more reliable)
    if (htmlContent && htmlContent.length > 5000) {
      screenshotBase64 = null // Don't use screenshot if we have good HTML
    }

    // Step 3: Call Claude API
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
      // Extract image URLs from HTML
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

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        messages,
      }),
      signal: AbortSignal.timeout(60000),
    })

    if (!claudeRes.ok) {
      let errDetail = ''
      try { const errBody = await claudeRes.json(); errDetail = errBody?.error?.message || '' } catch {}
      return NextResponse.json({ error: `Error de IA (${claudeRes.status}): ${errDetail || 'Intenta de nuevo'}` }, { status: 500 })
    }

    const claudeData = await claudeRes.json()
    const responseText = claudeData.content?.[0]?.text || ''

    if (!responseText) {
      return NextResponse.json({ error: 'La IA no devolvió respuesta. Intenta de nuevo.' }, { status: 500 })
    }

    // Parse JSON from response (may be wrapped in markdown code blocks)
    let jsonStr = responseText
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) jsonStr = jsonMatch[1]

    // Also try to find raw JSON object
    const objMatch = jsonStr.match(/\{[\s\S]*\}/)
    if (objMatch) jsonStr = objMatch[0]

    let pedigreeData
    try {
      pedigreeData = JSON.parse(jsonStr)
    } catch {
      return NextResponse.json({ error: 'No se pudo interpretar la respuesta de la IA. Intenta con otra URL o sube un screenshot.' }, { status: 422 })
    }

    return NextResponse.json({ success: true, data: pedigreeData, source: screenshotBase64 ? 'screenshot' : 'html' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al procesar la importacion' }, { status: 500 })
  }
}
