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

    // Fetch deal, stage, contact, and activities separately to avoid join issues
    const { data: deal } = await supabase
      .from('deals')
      .select('title, stage_id, contact_id, pipeline_id')
      .eq('id', dealId)
      .single()

    if (!deal) return Response.json({ error: 'Deal not found' }, { status: 404 })

    const [stageRes, contactRes, activitiesRes, conversationRes] = await Promise.all([
      deal.stage_id
        ? supabase.from('pipeline_stages').select('name').eq('id', deal.stage_id).single()
        : Promise.resolve({ data: null }),
      deal.contact_id
        ? supabase.from('contacts').select('name, email, phone, city, country').eq('id', deal.contact_id).single()
        : Promise.resolve({ data: null }),
      supabase.from('deal_activities').select('type, content, is_completed, created_at').eq('deal_id', dealId).order('created_at'),
      deal.contact_id
        ? supabase.from('conversations').select('id, last_message_preview').eq('contact_id', deal.contact_id).limit(1).single()
        : Promise.resolve({ data: null }),
    ])

    const stage = stageRes.data
    const contact = contactRes.data
    const activities = activitiesRes.data || []
    const conversation = conversationRes.data

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
    if (conversation?.last_message_preview) {
      lines.push(`\nÚltimo mensaje en Bandeja: "${conversation.last_message_preview}"`)
    }

    // Get API key
    const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: apiKeyData } = await admin.from('platform_settings').select('value').eq('key', 'ANTHROPIC_API_KEY').single()
    if (!apiKeyData?.value) return Response.json({ error: 'API key not configured' }, { status: 500 })

    const anthropic = new Anthropic({ apiKey: apiKeyData.value })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: lines.join('\n') }],
      system: `Eres Genos, el asistente IA de Genealogic — plataforma de gestión para criadores y propietarios de perros de raza. Resume este negocio del CRM en 2-3 frases cortas en español. Incluye: quién es el contacto, qué busca (raza, cachorro, servicio de monta, etc.), en qué etapa del pipeline está, y qué acciones se han tomado. Si hay tareas pendientes, menciónalas brevemente. Sé conciso y directo. No uses encabezados ni listas, solo un párrafo corto.`,
    })

    const summary = response.content[0].type === 'text' ? response.content[0].text : ''
    return Response.json({ summary })
  } catch (err: any) {
    console.error('Deal summary error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
