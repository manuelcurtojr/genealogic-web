import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 30

/**
 * POST /api/emailbot/test
 * Playground del Emailbot. Llama a Anthropic con:
 *   - System prompt construido desde la Biblioteca activa del kennel + escenario
 *   - Historial de mensajes
 * Devuelve { reply: string }
 *
 * NOTA: La key de Anthropic se mantiene server-side. No se expone al cliente.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { kennel_id, scenario, messages } = body

  if (!kennel_id || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'kennel_id y messages son obligatorios' }, { status: 400 })
  }

  // Verificar ownership del kennel
  const { data: kennel } = await supabase
    .from('kennels')
    .select('id, name, description, owner_id')
    .eq('id', kennel_id)
    .single()
  if (!kennel || kennel.owner_id !== user.id) {
    return NextResponse.json({ error: 'Kennel no encontrado o no es tuyo' }, { status: 403 })
  }

  // Cargar entradas activas de la Biblioteca
  const { data: entries } = await supabase
    .from('knowledge_entries')
    .select('category, title, content')
    .eq('kennel_id', kennel_id)
    .eq('is_active', true)
    .order('category')
    .order('position')

  const knowledgeBlock = (entries || [])
    .map(e => `## ${categoryLabel(e.category)} — ${e.title}\n${e.content}`)
    .join('\n\n')

  const scenarioContext = SCENARIO_CONTEXTS[scenario] || SCENARIO_CONTEXTS.new_lead

  const systemPrompt = `Eres el asistente de email del criadero "${kennel.name}". Respondes en nombre del criador a familias que escriben por email interesadas en cachorros.

CONTEXTO DE LA CONVERSACIÓN
${scenarioContext}

TU ESTILO
- Tono: cercano, profesional, cálido. Como escribiría un criador serio que conoce a su raza y a sus perros.
- Brevedad: respuestas concisas, 3-6 frases típicamente. No suenas a chatbot ni a manual.
- No inventas datos que no estén en la BIBLIOTECA debajo. Si te preguntan algo que no sabes, dices que se lo confirmas al criador y volverás a contactar.
- Si la consulta no la puedes resolver bien (precio sin saber camada, dudas legales, problemas), sugiere derivar al criador con una frase tipo "se lo paso a [criador] y te respondemos enseguida".
- Firma con "${kennel.name}" al final cuando sea apropiado.
- NUNCA inventes precios, fechas de camadas, números de teléfono, direcciones u otros datos que no estén en la Biblioteca.
${kennel.description ? `\nSOBRE EL CRIADERO\n${kennel.description}\n` : ''}

BIBLIOTECA DE CONOCIMIENTO DEL CRIADERO
${knowledgeBlock || '(Aún no hay entradas en la Biblioteca. Responde de forma genérica y honesta, indicando que algunos detalles los confirmará el criador.)'}

Responde directamente al mensaje del usuario en el contexto descrito. No prepares saludos extensos ni te identifiques como IA.`

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    // Intentar leer de platform_settings como fallback (mismo patrón que import-pedigree)
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY no configurada en el servidor' }, { status: 500 })
  }

  try {
    const client = new Anthropic({ apiKey })
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    })

    const textBlock = response.content.find(b => b.type === 'text') as any
    const reply = textBlock?.text || '(sin respuesta)'

    return NextResponse.json({
      reply,
      usage: response.usage,
      knowledge_used: entries?.length || 0,
    })
  } catch (err: any) {
    console.error('Emailbot test error:', err)
    return NextResponse.json({ error: err.message || 'Error en Anthropic' }, { status: 500 })
  }
}

const SCENARIO_CONTEXTS: Record<string, string> = {
  new_lead: 'La persona que escribe es un LEAD NUEVO: te contacta por primera vez interesado en cachorros. No tiene reserva ni está en lista. Tu objetivo es responder a su consulta con la información de la Biblioteca y, si procede, captar sus datos (nombre, preferencias) para añadirlo a la lista de espera.',
  waitlist: 'La persona ya ESTÁ EN LA LISTA DE ESPERA. Probablemente pregunta por próximas camadas, su posición, o quiere actualizar preferencias. Trátalo como un contacto recurrente: tono más familiar, sin repetir explicaciones básicas.',
  reservation: 'La persona YA TIENE RESERVA con cachorro asignado o en proceso. Sus preguntas suelen ser sobre entrega, documentación, primeros días, recomendaciones de cuidado. Respuesta concreta y orientada a la entrega.',
}

function categoryLabel(cat: string): string {
  const m: Record<string, string> = {
    general: 'General', precio: 'Precio', salud: 'Salud',
    reserva: 'Reserva', entrega: 'Entrega', filosofia: 'Filosofía',
    faq: 'FAQ', condiciones: 'Condiciones',
  }
  return m[cat] || cat
}
