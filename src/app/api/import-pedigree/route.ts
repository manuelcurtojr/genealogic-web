import { NextRequest, NextResponse } from 'next/server'

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
const APIFLASH_KEY = process.env.APIFLASH_KEY

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

export async function POST(request: NextRequest) {
  try {
    if (!ANTHROPIC_KEY) return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 })

    const { url } = await request.json()
    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 })

    // Step 1: Try to fetch the HTML directly
    let htmlContent: string | null = null
    let needsScreenshot = false

    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(15000),
      })
      if (res.ok) {
        const html = await res.text()
        // Clean HTML - remove scripts, styles, keep text content
        const cleaned = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
          .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
          .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
          .slice(0, 60000) // Limit size
        htmlContent = cleaned
      } else if (res.status === 403 || res.status === 503) {
        needsScreenshot = true
      }
    } catch {
      needsScreenshot = true
    }

    // Step 2: Screenshot fallback
    let screenshotBase64: string | null = null
    if (needsScreenshot && APIFLASH_KEY) {
      try {
        const screenshotUrl = `https://api.apiflash.com/v1/urltoimage?access_key=${APIFLASH_KEY}&url=${encodeURIComponent(url)}&format=jpeg&quality=80&width=1920&height=1080&full_page=true&fresh=true&wait_until=network_idle&delay=3&response_type=image`
        const ssRes = await fetch(screenshotUrl, { signal: AbortSignal.timeout(30000) })
        if (ssRes.ok) {
          const buffer = await ssRes.arrayBuffer()
          screenshotBase64 = Buffer.from(buffer).toString('base64')
        }
      } catch { /* screenshot failed, try with whatever we have */ }
    }

    if (!htmlContent && !screenshotBase64) {
      return NextResponse.json({ error: 'No se pudo acceder a la pagina. Intenta con otra URL.' }, { status: 400 })
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
      const err = await claudeRes.text()
      return NextResponse.json({ error: `AI error: ${claudeRes.status}` }, { status: 500 })
    }

    const claudeData = await claudeRes.json()
    const responseText = claudeData.content?.[0]?.text || ''

    // Parse JSON from response (may be wrapped in markdown code blocks)
    let jsonStr = responseText
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) jsonStr = jsonMatch[1]

    // Also try to find raw JSON object
    const objMatch = jsonStr.match(/\{[\s\S]*\}/)
    if (objMatch) jsonStr = objMatch[0]

    const pedigreeData = JSON.parse(jsonStr)

    return NextResponse.json({ success: true, data: pedigreeData, source: screenshotBase64 ? 'screenshot' : 'html' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al procesar la importacion' }, { status: 500 })
  }
}
