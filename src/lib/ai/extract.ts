/**
 * Extractor de "biblioteca" desde texto bruto.
 *
 * Usa la IA para transformar texto sin estructura (web scrape, PDF, DOC)
 * en un array de KnowledgeEntry listas para insertar en knowledge_entries.
 *
 * El prompt obliga al modelo a:
 *  - Identificar bloques temáticos (precio, salud, condiciones, FAQ…)
 *  - Categorizarlos en el catálogo cerrado (mismo que ya usa el bot)
 *  - Titulo breve + content < 500 palabras por entrada
 *  - Responder SIEMPRE en JSON parseable (sin texto extra)
 */
import 'server-only'
import { chat } from './client'
import { getDefaultModel } from './models'
import type { ChatResult } from './client'

export type ExtractedEntry = {
  category: 'general' | 'precio' | 'salud' | 'reserva' | 'entrega' | 'filosofia' | 'faq' | 'condiciones'
  title: string
  content: string
}

export type ExtractResult = {
  entries: ExtractedEntry[]
  usage: ChatResult
}

const SYSTEM_PROMPT = `Eres un asistente que ayuda a criadores de perros a estructurar su información para un emailbot. Recibes texto en bruto (web, PDF, documento) y debes extraer entradas temáticas para la "Biblioteca" del bot.

REGLAS:
1. Categoriza cada bloque en una de estas categorías exactas:
   - general: filosofía, presentación, historia
   - precio: precios, formas de pago, descuentos
   - salud: garantías sanitarias, vacunas, controles veterinarios
   - reserva: cómo reservar, lista de espera, señales
   - entrega: cómo se entrega el cachorro, edad, transporte
   - filosofia: cómo crías, principios, alimentación
   - faq: preguntas frecuentes que no encajan en otras
   - condiciones: contrato, términos, devoluciones, jurisdicción

2. Cada entrada:
   - title: 3-8 palabras, descriptivo (ej: "Precio cachorro estándar", "Garantía sanitaria 15 días")
   - content: 50-500 palabras, texto claro y útil para que el bot responda emails. NO copies html, NO incluyas menús/footers/cookies.

3. Si el texto no contiene información útil para criador (cookies, menús, navegación), devuelve array vacío.

4. Responde SIEMPRE con JSON puro válido, SIN texto antes ni después, SIN markdown code fences. Formato exacto:
[
  {"category": "precio", "title": "...", "content": "..."},
  ...
]

Si no encuentras nada útil, devuelve: []`

export async function extractKnowledgeFromText(args: {
  text: string
  sourceHint?: string  // ej: "scrape de iremacurto.com/condiciones"
  modelId?: string
}): Promise<ExtractResult> {
  const text = args.text.trim()
  if (!text) return { entries: [], usage: zeroUsage() }

  // Truncamos a ~80k chars para no pasarnos de context (suficiente para
  // PDFs de 30 páginas; URLs de web suelen ser <20k tras limpiar).
  const truncated = text.length > 80_000 ? text.slice(0, 80_000) + '\n\n[…texto truncado…]' : text

  const userMsg = args.sourceHint
    ? `Fuente: ${args.sourceHint}\n\n=== TEXTO ===\n${truncated}`
    : truncated

  const usage = await chat({
    modelId: args.modelId || getDefaultModel().id,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMsg }],
    maxTokens: 4096,
    temperature: 0.3, // bajo para favorecer JSON estricto
  })

  // Parsear JSON. Defensivo: si el modelo metió markdown fences o texto extra
  const entries = parseEntriesLoose(usage.text)
  return { entries, usage }
}

function parseEntriesLoose(raw: string): ExtractedEntry[] {
  let s = raw.trim()
  // Quitar code fences si los hay
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
  // Buscar el primer '[' y el último ']' para extraer el array si hay basura
  const first = s.indexOf('[')
  const last = s.lastIndexOf(']')
  if (first === -1 || last === -1 || last < first) return []
  s = s.slice(first, last + 1)
  try {
    const parsed = JSON.parse(s)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((e: unknown): e is ExtractedEntry => {
        if (!e || typeof e !== 'object') return false
        const obj = e as Record<string, unknown>
        return typeof obj.category === 'string' && typeof obj.title === 'string' && typeof obj.content === 'string'
      })
      .map((e) => ({
        category: normalizeCategory(e.category),
        title: e.title.slice(0, 120),
        content: e.content.slice(0, 4000),
      }))
  } catch {
    return []
  }
}

function normalizeCategory(c: string): ExtractedEntry['category'] {
  const valid: ExtractedEntry['category'][] = [
    'general', 'precio', 'salud', 'reserva', 'entrega', 'filosofia', 'faq', 'condiciones',
  ]
  const lower = c.toLowerCase() as ExtractedEntry['category']
  return valid.includes(lower) ? lower : 'general'
}

function zeroUsage(): ChatResult {
  return {
    text: '', inputTokens: 0, outputTokens: 0, totalTokens: 0, costUsd: 0,
    provider: 'anthropic', model: 'none', resolvedModelId: 'none',
  }
}
