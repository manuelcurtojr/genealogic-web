import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { dealId } = await request.json()
    if (!dealId) return Response.json({ error: 'Missing dealId' }, { status: 400 })

    // Fetch deal + activities + contact
    const [dealRes, activitiesRes] = await Promise.all([
      supabase.from('deals').select('title, stage:pipeline_stages(name), contact:contacts(name, email, phone, city, country)').eq('id', dealId).single(),
      supabase.from('deal_activities').select('type, content, is_completed, created_at').eq('deal_id', dealId).order('created_at'),
    ])

    const deal = dealRes.data
    if (!deal) return Response.json({ error: 'Deal not found' }, { status: 404 })

    const activities = activitiesRes.data || []
    const contact = deal.contact as any
    const stage = deal.stage as any

    // Build context
    const lines: string[] = []
    lines.push(`Negocio: ${deal.title}`)
    lines.push(`Etapa: ${stage?.name || 'Sin etapa'}`)
    if (contact) {
      lines.push(`Contacto: ${contact.name} (${[contact.email, contact.phone].filter(Boolean).join(', ')})`)
      if (contact.city || contact.country) lines.push(`Ubicacion: ${[contact.city, contact.country].filter(Boolean).join(', ')}`)
    }
    if (activities.length > 0) {
      lines.push(`\nActividades (${activities.length}):`)
      for (const act of activities) {
        const date = new Date(act.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
        const prefix = act.type === 'task' ? (act.is_completed ? '[x]' : '[ ]') : '-'
        lines.push(`${prefix} ${date}: ${act.content || '(sin contenido)'}`)
      }
    }

    // Get API key
    const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: apiKeyData } = await admin.from('platform_settings').select('value').eq('key', 'ANTHROPIC_API_KEY').single()
    if (!apiKeyData?.value) return Response.json({ error: 'API key not configured' }, { status: 500 })

    const anthropic = new Anthropic({ apiKey: apiKeyData.value })

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-20250414',
      max_tokens: 300,
      messages: [{ role: 'user', content: lines.join('\n') }],
      system: `Eres Genos, el asistente de Genealogic (plataforma de crianza canina). Resume este negocio del CRM en 2-3 frases cortas en espanol. Incluye: quien es el contacto, que busca, en que etapa esta, y que acciones se han tomado. Se conciso y directo. No uses encabezados ni listas, solo un parrafo corto.`,
    })

    const summary = response.content[0].type === 'text' ? response.content[0].text : ''
    return Response.json({ summary })
  } catch (err: any) {
    console.error('Deal summary error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
