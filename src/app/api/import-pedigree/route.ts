import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

/**
 * POST /api/import-pedigree
 *
 * Proxy server-side a Anthropic Messages API. Antes este endpoint era GET y
 * devolvía la API key al cliente, lo cual la exponía a cualquier usuario
 * autenticado. Ahora la key se queda en el servidor.
 *
 * Body: { messages, max_tokens?, model? }
 * Rate limit: 1 llamada cada 5s por user (in-memory).
 */
const lastCallByUser = new Map<string, number>()
const COOLDOWN_MS = 5_000

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    // Rate limit
    const now = Date.now()
    const last = lastCallByUser.get(user.id) ?? 0
    if (now - last < COOLDOWN_MS) {
      return NextResponse.json(
        { error: `Rate limit: espera ${Math.ceil((COOLDOWN_MS - (now - last)) / 1000)}s` },
        { status: 429 },
      )
    }
    lastCallByUser.set(user.id, now)

    // Resolver API key: env var → fallback platform_settings
    let apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      const admin = createSupabase(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      )
      const { data } = await admin.from('platform_settings').select('value').eq('key', 'ANTHROPIC_API_KEY').single()
      apiKey = data?.value as string | undefined
    }
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY no configurada' }, { status: 503 })
    }

    const body = await request.json().catch(() => null)
    if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: 'messages requerido' }, { status: 400 })
    }

    const maxTokens = Math.min(Math.max(parseInt(String(body.max_tokens || 8000), 10) || 8000, 100), 16000)
    const model = String(body.model || 'claude-sonnet-4-5')
    // Extracción de datos: temperatura 0 para minimizar invención/variación.
    // (Sin esto, la misma foto ilegible producía un perro inventado distinto cada vez.)
    const temperature = typeof body.temperature === 'number' ? body.temperature : 0

    const client = new Anthropic({ apiKey })
    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      messages: body.messages,
    })

    return NextResponse.json({
      content: response.content,
      usage: response.usage,
      stop_reason: response.stop_reason,
    })
  } catch (err: any) {
    const status = err?.status === 529 ? 529 : err?.status === 429 ? 429 : 500
    return NextResponse.json({ error: err?.message || 'Error en Anthropic' }, { status })
  }
}
