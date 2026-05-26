/**
 * POST /api/feedback/ask-ai
 *
 * Endpoint usado por el widget "¿Algo ha salido mal?". El user puede
 * intentar primero hablar con la IA — si la IA resuelve la duda
 * (ej: "ese campo es opcional, déjalo vacío"), ahorramos un ticket.
 * Si no resuelve, el user manda el feedback al super admin.
 *
 * Diferencia con Genos:
 *  - No persiste la conversación en DB (es efímera, solo se guarda si al
 *    final el user manda el ticket: lo guardamos en source_metadata.ai_conversation)
 *  - El system prompt es específico de la zona donde está el user
 *    (importer, dog form, etc.) — más útil y menos vago que Genos genérico
 *  - Tono más directo: "esto no funciona" → respuesta concreta
 *
 * Body:
 *   { scope: FeedbackScope, pageLabel: string, messages: [{role, content}] }
 * Respuesta:
 *   { reply: string }  // el último mensaje del assistant
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chat } from '@/lib/ai/client'
import { GENOS_DEFAULT_MODEL } from '@/lib/genos/system-prompt'
import type { FeedbackScope } from '@/lib/admin-requests/types'
import { FEEDBACK_SCOPE_LABELS } from '@/lib/admin-requests/types'

export const runtime = 'nodejs'

/**
 * System prompts específicos por zona. Cada uno orienta a la IA a las
 * causas más comunes de fricción/error en esa parte del producto.
 * Si la zona no aparece aquí, cae al genérico.
 */
const SCOPE_HINTS: Partial<Record<FeedbackScope, string>> = {
  importer: `El user está usando el IMPORTADOR DE PEDIGREES. Causas frecuentes de fricción:
- URL no soportada → solo aceptamos Pawdoq, working-dog, breedarchive y unos pocos más; si la URL es otra, sugiérele subir un PDF en su lugar.
- Imagen/PDF borroso → la IA necesita texto legible; sugiere mejor calidad o reescanear.
- "No detecta el perro" → probablemente el sitio cambió HTML; pídele que escale el ticket para que lo arreglemos.
- Genealogía incompleta → el sitio original solo tenía X generaciones; no es bug.
- Tarda mucho → el primer import grande puede tardar 20-30s.`,

  dog_form: `El user está en el FORMULARIO DE PERRO (crear/editar). Causas frecuentes:
- Microchip ya existe → otro perro lo tiene; sugiere comprobar si es duplicado o reclamarlo.
- Padre/madre no encontrados → debe crearlos primero o importar el pedigree desde URL.
- Foto no sube → probablemente >10MB o formato raro. Sugiere JPG/PNG <10MB.
- Color no aparece → la lista de colores depende de la raza seleccionada; si la raza es nueva, escalamos.
- Slug duplicado → otro perro del mismo criadero tiene el mismo nombre.`,

  litter_form: `El user está en el FORMULARIO DE CAMADAS. Causas frecuentes:
- Padre/madre no aparecen → ambos deben estar en su criadero. La madre no aparece si no es hembra; el padre, si no es macho.
- Fecha de nacimiento futura → el estado debe ser "planificada" o "mated"; "born" requiere fecha pasada.
- No le deja añadir cachorros → la camada debe estar en estado "born" o posterior.`,

  transfer: `El user está TRANSFIRIENDO la propiedad de un perro. Causas frecuentes:
- El destinatario no tiene cuenta → recibirá una invitación por email para crearla y aceptar.
- "No tengo permiso" → solo el dueño actual puede iniciar la transferencia.
- Transferencia pendiente bloqueada → la otra parte debe aceptar/rechazar antes de iniciar otra.`,

  reservation_form: `El user está creando o gestionando una RESERVA. Causas frecuentes:
- Camada no aparece → debe estar en estado "born" o "delivered" con cachorros disponibles.
- Contrato no se genera → falta info del criadero (afijo, dirección fiscal).
- Cliente sin email → la reserva se crea igual pero no podemos mandar notificaciones.`,

  kennel_form: `El user está en el FORMULARIO DEL CRIADERO. Causas frecuentes:
- Afijo (slug) duplicado → ya existe otro criadero con ese nombre.
- País requerido para mostrar bandera.
- Logo no sube → probablemente >5MB o formato no soportado (usa JPG/PNG/WebP).`,

  web_builder: `El user está editando su WEB PÚBLICA (Kennel Pro · Early Access).
- Esta feature está en Early Access, solo Irema Curtó tiene acceso por ahora.
- Cambios tardan ~1 min en propagarse al dominio.
- Dominio propio: necesita configurar 2 DNS records en su proveedor.`,

  emailbot: `El user está configurando el EMAILBOT (Kennel Pro · Early Access).
- El bot necesita biblioteca de conocimiento cargada para responder bien.
- "No responde un email" → puede que el filtro lo haya marcado como no-prioritario; revisa /emailbot/hilos.
- Cuota agotada → es Free, sin emailbot, o ya gastó las del mes.`,

  billing: `El user está en FACTURACIÓN o CHECKOUT. Causas frecuentes:
- "Error iniciando pago" → suele ser env var de Stripe ausente; el user no puede arreglarlo, escala.
- Trial: 15 días gratis con tarjeta. Primer cargo al día 15 automático.
- Cancelar: portal de Stripe desde /cuenta/facturacion.
- Factura no llega → revisar email registrado y carpeta spam.`,
}

const GENERIC_SCOPE_HINT = 'El user reporta un problema en esta zona. Pregunta qué está intentando hacer si no queda claro.'

function buildSystemPrompt(scope: FeedbackScope, pageLabel: string): string {
  const scopeLabel = FEEDBACK_SCOPE_LABELS[scope] || 'Otro'
  const hint = SCOPE_HINTS[scope] || GENERIC_SCOPE_HINT

  return `Eres un asistente de soporte de Genealogic, plataforma SaaS para criadores y propietarios de perros de raza.

# CONTEXTO
El usuario está en la zona: **${scopeLabel}** (${pageLabel}).
Acaba de pulsar el botón "¿Algo ha salido mal?" porque algo no le ha ido bien.

# PISTAS ESPECÍFICAS DE ESTA ZONA
${hint}

# REGLAS
- Tono directo, español, tutea. Sin emojis salvo que el user los use.
- Respuestas BREVES (máximo 4 frases). Vas al grano.
- Si crees que es un bug real o algo que NO puedes resolver, dilo claro:
  "Esto suena a bug nuestro. Mándalo como feedback usando el formulario de abajo y lo revisamos en menos de 24h."
- Si la pregunta es vaga, pide UN dato concreto (qué intentaba hacer, qué mensaje le sale).
- NO inventes features. NO prometas fechas. NO des consejos veterinarios.
- Si el user ya escribió 2-3 mensajes y la cosa no avanza: invítale a mandar el feedback directamente.`
}

export async function POST(request: NextRequest) {
  // Auth — solo usuarios logueados
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body: {
    scope?: FeedbackScope
    pageLabel?: string
    messages?: Array<{ role: 'user' | 'assistant'; content: string }>
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const scope = (body.scope || 'other') as FeedbackScope
  const pageLabel = body.pageLabel || 'Genealogic'
  const messages = Array.isArray(body.messages) ? body.messages : []

  if (messages.length === 0) {
    return NextResponse.json({ error: 'no_messages' }, { status: 400 })
  }

  // Truncamos el historial a las últimas 8 vueltas (4 user + 4 assistant)
  // para mantener latencia + coste bajos. El widget es para problemas
  // simples — si requiere más contexto, mejor que mande el ticket.
  const trimmed = messages.slice(-8)

  try {
    const result = await chat({
      modelId: GENOS_DEFAULT_MODEL,
      system: buildSystemPrompt(scope, pageLabel),
      messages: trimmed,
      maxTokens: 350,
      temperature: 0.3,
    })

    return NextResponse.json({ reply: result.text })
  } catch (err) {
    console.error('[feedback/ask-ai] LLM error', err)
    return NextResponse.json(
      {
        error: 'llm_failed',
        // Fallback friendly: si la IA peta, sugerimos directamente mandar el ticket
        reply: 'No he podido procesar tu pregunta ahora mismo. Escribe el problema en el campo de abajo y te respondo personalmente en menos de 24h.',
      },
      { status: 200 }, // 200 con reply de fallback en vez de 500
    )
  }
}
