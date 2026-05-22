/**
 * Lógica server-side compartida del Emailbot.
 *
 * Responsable de:
 *   - Construir el system prompt con la Biblioteca del kennel
 *   - Detectar el escenario del email entrante (lead nuevo / lista de espera / con reserva)
 *   - Llamar a Anthropic y generar el reply
 *   - Decidir si derivar a humano (flag de escalación)
 *
 * Usado por:
 *   - /api/emailbot/test     (playground del dashboard)
 *   - /api/emailbot/inbound  (webhook real de Resend Inbound)
 */
import Anthropic from '@anthropic-ai/sdk'

export interface KnowledgeEntry {
  category: string
  title: string
  content: string
}

export interface BotContext {
  kennelName: string
  kennelDescription?: string | null
  scenario: 'new_lead' | 'waitlist' | 'reservation'
  contactName?: string | null
  knowledge: KnowledgeEntry[]
}

export interface BotMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface BotResponse {
  reply: string
  shouldEscalate: boolean
  escalationReason?: string
  tokensUsed: number
}

const SCENARIO_CONTEXTS: Record<BotContext['scenario'], string> = {
  new_lead: 'La persona que escribe es un LEAD NUEVO: te contacta por primera vez interesado en cachorros. No tiene reserva ni está en lista. Tu objetivo es responder a su consulta con la información de la Biblioteca y, si procede, captar sus datos (nombre, preferencias) para añadirlo a la lista de espera.',
  waitlist: 'La persona ya ESTÁ EN LA LISTA DE ESPERA. Probablemente pregunta por próximas camadas, su posición, o quiere actualizar preferencias. Trátalo como un contacto recurrente: tono más familiar, sin repetir explicaciones básicas.',
  reservation: 'La persona YA TIENE RESERVA con cachorro asignado o en proceso. Sus preguntas suelen ser sobre entrega, documentación, primeros días, recomendaciones de cuidado. Respuesta concreta y orientada a la entrega.',
}

const CATEGORY_LABEL: Record<string, string> = {
  general: 'General', precio: 'Precio', salud: 'Salud', reserva: 'Reserva',
  entrega: 'Entrega', filosofia: 'Filosofía', faq: 'FAQ', condiciones: 'Condiciones',
}

export function buildSystemPrompt(ctx: BotContext): string {
  const knowledgeBlock = ctx.knowledge.length
    ? ctx.knowledge
        .map(e => `## ${CATEGORY_LABEL[e.category] || e.category} — ${e.title}\n${e.content}`)
        .join('\n\n')
    : '(Aún no hay entradas en la Biblioteca. Responde de forma genérica y honesta, indicando que algunos detalles los confirmará el criador.)'

  return `Eres el asistente de email del criadero "${ctx.kennelName}". Respondes en nombre del criador a familias que escriben por email interesadas en cachorros.

CONTEXTO DE LA CONVERSACIÓN
${SCENARIO_CONTEXTS[ctx.scenario]}
${ctx.contactName ? `\nLa persona se llama: ${ctx.contactName}` : ''}

TU ESTILO
- Tono: cercano, profesional, cálido. Como escribiría un criador serio que conoce su raza y sus perros.
- Brevedad: respuestas concisas, 3-6 frases típicamente. No suenas a chatbot ni a manual.
- No inventas datos que no estén en la BIBLIOTECA debajo. Si te preguntan algo que no sabes, dices que se lo confirmas al criador y volverás a contactar.
- Si la consulta es delicada (dudas legales, problemas, queja, requiere decisión humana, pregunta sobre algo no documentado), termina la respuesta con la línea exacta: [[ESCALAR_A_HUMANO: razón breve]]. El criador la verá y tomará el control.
- Firma con "${ctx.kennelName}" al final cuando sea apropiado.
- NUNCA inventes precios, fechas de camadas, números de teléfono, direcciones u otros datos que no estén en la Biblioteca.
${ctx.kennelDescription ? `\nSOBRE EL CRIADERO\n${ctx.kennelDescription}\n` : ''}

BIBLIOTECA DE CONOCIMIENTO DEL CRIADERO
${knowledgeBlock}

Responde directamente al mensaje del usuario en el contexto descrito. No prepares saludos extensos ni te identifiques como IA.`
}

/**
 * Llama a Claude con el contexto del kennel y devuelve la respuesta procesada.
 * Detecta marcador [[ESCALAR_A_HUMANO: …]] y lo extrae sin enviárselo al cliente.
 */
export async function generateReply(
  ctx: BotContext,
  messages: BotMessage[],
): Promise<BotResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY no configurada')

  const client = new Anthropic({ apiKey })
  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1024,
    system: buildSystemPrompt(ctx),
    messages: messages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    })),
  })

  const textBlock = response.content.find(b => b.type === 'text') as any
  let reply = textBlock?.text || ''

  // Extraer marcador de escalación
  const escalateMatch = reply.match(/\[\[ESCALAR_A_HUMANO:\s*([^\]]+)\]\]/i)
  let shouldEscalate = false
  let escalationReason: string | undefined
  if (escalateMatch) {
    shouldEscalate = true
    escalationReason = escalateMatch[1].trim()
    reply = reply.replace(/\[\[ESCALAR_A_HUMANO:[^\]]+\]\]/gi, '').trim()
  }

  const tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0)

  return { reply, shouldEscalate, escalationReason, tokensUsed }
}
