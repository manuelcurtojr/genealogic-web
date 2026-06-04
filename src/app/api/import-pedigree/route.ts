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
// Rate limit por ventana deslizante: un import legítimo encadena varias llamadas
// (detección de orientación + extracción + self-verify + reintentos), así que un
// cooldown de "1 cada 5s" se bloqueaba a sí mismo. Permitimos un BURST acotado.
const callsByUser = new Map<string, number[]>()
const RL_WINDOW_MS = 12_000
// Un import denso puede encadenar: detección + extracción + reintentos internos
// (truncado/JSON) + reintento-orientación + self-verify. Margen para no auto-429.
const RL_MAX = 12

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    // Rate limit: ventana deslizante (permite el burst de un import legítimo).
    const now = Date.now()
    // Barrido oportunista: evita que el Map crezca sin límite en instancias longevas.
    if (callsByUser.size > 500) {
      for (const [uid, arr] of callsByUser) {
        if (!arr.some((ts) => now - ts < RL_WINDOW_MS)) callsByUser.delete(uid)
      }
    }
    const recent = (callsByUser.get(user.id) ?? []).filter((ts) => now - ts < RL_WINDOW_MS)
    if (recent.length >= RL_MAX) {
      return NextResponse.json({ error: 'Rate limit: espera unos segundos' }, { status: 429 })
    }
    recent.push(now)
    callsByUser.set(user.id, recent)

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
