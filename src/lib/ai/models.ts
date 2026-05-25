/**
 * Catálogo de modelos de IA disponibles en Genealogic.
 *
 * Cada modelo declara:
 *  - id estable (lo que se guarda en kennels.bot_model)
 *  - provider (anthropic/openai/google)
 *  - apiModel (id que pasamos al SDK del provider — puede cambiar con versiones)
 *  - pricing por 1M tokens (input/output) en USD
 *  - planTier mínimo que puede elegirlo
 *
 * Pricing actualizado: 2026-05. Verificar trimestralmente.
 *
 * IMPORTANTE: el cálculo de coste se hace con estos valores; si cambian
 * los precios del provider hay que actualizar AQUÍ (no en mil sitios).
 */

export type AIProvider = 'anthropic' | 'openai' | 'google'
export type PlanTier = 'free' | 'kennel' | 'kennel_pro' | 'starter' | 'pro' | 'premium'

export type AIModelMeta = {
  id: string
  provider: AIProvider
  apiModel: string
  label: string
  shortDescription: string
  /** Precio USD por 1M tokens de input */
  pricePer1MInput: number
  /** Precio USD por 1M tokens de output */
  pricePer1MOutput: number
  /** Tier mínimo requerido para usarlo */
  minPlan: PlanTier
  /** Si es el modelo recomendado para nuevos kennels */
  isDefault?: boolean
  /** Si es modelo "rápido y barato" (vs premium/lento) */
  speedTier: 'fast' | 'balanced' | 'premium'
}

export const AI_MODELS: AIModelMeta[] = [
  // ── Anthropic ──────────────────────────────────────────────────────
  {
    id: 'claude-sonnet-4-5',
    provider: 'anthropic',
    apiModel: 'claude-sonnet-4-5',
    label: 'Claude Sonnet 4.5',
    shortDescription: 'Equilibrado entre calidad y coste. Excelente para emails.',
    pricePer1MInput: 3,
    pricePer1MOutput: 15,
    minPlan: 'pro',
    isDefault: true,
    speedTier: 'balanced',
  },
  {
    id: 'claude-haiku-4-5',
    provider: 'anthropic',
    apiModel: 'claude-haiku-4-5',
    label: 'Claude Haiku 4.5',
    shortDescription: 'Rápido y económico. Bueno para FAQs y emails simples.',
    pricePer1MInput: 0.8,
    pricePer1MOutput: 4,
    minPlan: 'starter',
    speedTier: 'fast',
  },
  {
    id: 'claude-opus-4-5',
    provider: 'anthropic',
    apiModel: 'claude-opus-4-5',
    label: 'Claude Opus 4.5',
    shortDescription: 'Máxima calidad. Caro — úsalo solo para casos complejos.',
    pricePer1MInput: 15,
    pricePer1MOutput: 75,
    minPlan: 'premium',
    speedTier: 'premium',
  },

  // ── OpenAI ─────────────────────────────────────────────────────────
  {
    id: 'gpt-4o',
    provider: 'openai',
    apiModel: 'gpt-4o',
    label: 'GPT-4o',
    shortDescription: 'Modelo flagship de OpenAI. Calidad alta, coste medio.',
    pricePer1MInput: 2.5,
    pricePer1MOutput: 10,
    minPlan: 'pro',
    speedTier: 'balanced',
  },
  {
    id: 'gpt-4o-mini',
    provider: 'openai',
    apiModel: 'gpt-4o-mini',
    label: 'GPT-4o mini',
    shortDescription: 'El más barato. Suficiente para emails cortos.',
    pricePer1MInput: 0.15,
    pricePer1MOutput: 0.6,
    minPlan: 'starter',
    speedTier: 'fast',
  },

  // ── Google ─────────────────────────────────────────────────────────
  {
    id: 'gemini-1.5-pro',
    provider: 'google',
    apiModel: 'gemini-1.5-pro',
    label: 'Gemini 1.5 Pro',
    shortDescription: 'Buen contexto largo (1M tokens). Útil con biblioteca grande.',
    pricePer1MInput: 1.25,
    pricePer1MOutput: 5,
    minPlan: 'pro',
    speedTier: 'balanced',
  },
  {
    id: 'gemini-1.5-flash',
    provider: 'google',
    apiModel: 'gemini-1.5-flash',
    label: 'Gemini 1.5 Flash',
    shortDescription: 'Rapidísimo y casi gratis. Para alto volumen.',
    pricePer1MInput: 0.075,
    pricePer1MOutput: 0.3,
    minPlan: 'starter',
    speedTier: 'fast',
  },
]

const DEFAULT_MODEL_ID = AI_MODELS.find((m) => m.isDefault)?.id || AI_MODELS[0].id

export function getModel(id: string | null | undefined): AIModelMeta {
  if (!id) return getDefaultModel()
  return AI_MODELS.find((m) => m.id === id) || getDefaultModel()
}

export function getDefaultModel(): AIModelMeta {
  return AI_MODELS.find((m) => m.id === DEFAULT_MODEL_ID)!
}

/** Modelos que el user puede elegir según su plan. */
export function modelsForPlan(plan: PlanTier): AIModelMeta[] {
  const order: PlanTier[] = ['free', 'starter', 'pro', 'premium']
  const userLevel = order.indexOf(plan)
  return AI_MODELS.filter((m) => order.indexOf(m.minPlan) <= userLevel)
}

/** Coste estimado (USD) para una llamada. */
export function estimateCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const m = getModel(modelId)
  const inCost = (inputTokens / 1_000_000) * m.pricePer1MInput
  const outCost = (outputTokens / 1_000_000) * m.pricePer1MOutput
  return Number((inCost + outCost).toFixed(6))
}
