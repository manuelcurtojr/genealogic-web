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
import { chat, type ChatMessage } from '@/lib/ai/client'
import { getDefaultModel } from '@/lib/ai/models'

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
  /** ID del modelo de IA elegido por el kennel (kennels.bot_model).
   *  Si no se pasa, se usa el default del catálogo. */
  modelId?: string
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
  /** Datos extra para logging en ai_usage_logs */
  usage: {
    inputTokens: number
    outputTokens: number
    costUsd: number
    provider: string
    model: string
    resolvedModelId: string
  }
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
 * Genera la respuesta del bot delegando en el cliente unificado multi-provider.
 *
 * El modelo se elige por kennel (ctx.modelId, viene de kennels.bot_model).
 * Si no se pasa, usa el default del catálogo.
 *
 * Detecta marcador [[ESCALAR_A_HUMANO: …]] y lo extrae sin enviárselo al cliente.
 */
export async function generateReply(
  ctx: BotContext,
  messages: BotMessage[],
): Promise<BotResponse> {
  const modelId = ctx.modelId || getDefaultModel().id

  const chatMessages: ChatMessage[] = messages.map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content,
  }))

  const result = await chat({
    modelId,
    system: buildSystemPrompt(ctx),
    messages: chatMessages,
    maxTokens: 1024,
  })

  // Extraer marcador de escalación
  let reply = result.text
  const escalateMatch = reply.match(/\[\[ESCALAR_A_HUMANO:\s*([^\]]+)\]\]/i)
  let shouldEscalate = false
  let escalationReason: string | undefined
  if (escalateMatch) {
    shouldEscalate = true
    escalationReason = escalateMatch[1].trim()
    reply = reply.replace(/\[\[ESCALAR_A_HUMANO:[^\]]+\]\]/gi, '').trim()
  }

  return {
    reply,
    shouldEscalate,
    escalationReason,
    tokensUsed: result.totalTokens,
    usage: {
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      costUsd: result.costUsd,
      provider: result.provider,
      model: result.model,
      resolvedModelId: result.resolvedModelId,
    },
  }
}
