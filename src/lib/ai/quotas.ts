/**
 * Cuotas mensuales del Emailbot por plan.
 *
 * Las cuotas se aplican solo a las respuestas reales del bot
 * (`scope = emailbot_reply`). El playground (`emailbot_test`) y los
 * imports (`knowledge_import_*`) NO consumen cuota — son setup, no
 * operación, y limitarlos perjudicaría el onboarding.
 *
 * Cuando se excede:
 *   - El bot deja de responder automáticamente
 *   - Los emails entrantes siguen guardándose en el hilo (no se pierden)
 *   - Se marcan como `derived_to_human` con razón "quota_exceeded"
 *   - El criador ve aviso en /emailbot + en /cuenta/facturacion
 *
 * Para subir: el criador upgradea de plan, o (futuro) habilita overage
 * con pago por uso.
 */
import 'server-only'
import { createKennelAdminClient } from '@/lib/supabase/server'
import type { PlanTier } from './models'

/** -1 = ilimitado. 0 = sin acceso al bot. */
export const BOT_REPLY_QUOTAS: Record<PlanTier, number> = {
  free:     0,    // Sin bot
  starter:  100,  // Hobbyist
  pro:      500,  // Profesional
  premium:  -1,   // Ilimitado
}

export type QuotaStatus = {
  /** ¿Puede seguir respondiendo el bot? */
  allowed: boolean
  /** Respuestas del bot usadas este mes (scope=emailbot_reply, status=success) */
  used: number
  /** Tope del plan (-1 = ilimitado) */
  limit: number
  /** -1 si ilimitado, sino max(0, limit - used) */
  remaining: number
  /** true si está dentro de un 10% del límite (UI warning) */
  isNearLimit: boolean
  /** Si allowed=false, razón legible */
  reason?: 'plan_no_bot' | 'quota_exceeded'
  /** Plan actual */
  plan: PlanTier
}

/**
 * Devuelve el estado de cuota del kennel para emailbot_reply este mes.
 * Lectura barata: usa la view kennel_bot_usage_current_month + profiles.plan.
 */
export async function checkBotReplyQuota(args: {
  kennelId: string
  /** Si lo pasas evitas un query. Si no, lo lookup-eamos. */
  plan?: PlanTier
  /** owner_id del kennel para resolver plan (si no se pasa plan) */
  ownerId?: string
}): Promise<QuotaStatus> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any

  // Plan: o lo pasaron o lo buscamos desde profiles via kennel.owner_id
  let plan: PlanTier = args.plan || 'free'
  if (!args.plan) {
    let ownerId = args.ownerId
    if (!ownerId) {
      const { data: k } = await admin
        .from('kennels')
        .select('owner_id')
        .eq('id', args.kennelId)
        .maybeSingle()
      ownerId = k?.owner_id
    }
    if (ownerId) {
      const { data: p } = await admin
        .from('profiles')
        .select('plan')
        .eq('id', ownerId)
        .maybeSingle()
      plan = (p?.plan as PlanTier) || 'free'
    }
  }

  const limit = BOT_REPLY_QUOTAS[plan]

  // Uso del mes desde la view (ya filtrada a status=success y emailbot_reply)
  const { data: usage } = await admin
    .from('kennel_bot_usage_current_month')
    .select('bot_replies_count')
    .eq('kennel_id', args.kennelId)
    .maybeSingle()
  const used = usage?.bot_replies_count || 0

  // Sin bot en el plan
  if (limit === 0) {
    return {
      allowed: false, used, limit: 0, remaining: 0,
      isNearLimit: false, reason: 'plan_no_bot', plan,
    }
  }

  // Ilimitado
  if (limit < 0) {
    return {
      allowed: true, used, limit: -1, remaining: -1,
      isNearLimit: false, plan,
    }
  }

  // Con tope
  const remaining = Math.max(0, limit - used)
  const allowed = remaining > 0
  const isNearLimit = remaining > 0 && remaining <= Math.ceil(limit * 0.1)
  return {
    allowed, used, limit, remaining, isNearLimit,
    reason: allowed ? undefined : 'quota_exceeded',
    plan,
  }
}

/** Mensaje humano para mostrar al criador cuando se excede. */
export function quotaReasonMessage(status: QuotaStatus): string {
  if (status.reason === 'plan_no_bot') {
    return `Tu plan ${status.plan} no incluye el emailbot. Sube a Starter o superior.`
  }
  if (status.reason === 'quota_exceeded') {
    return `Has agotado las ${status.limit} respuestas del bot incluidas en tu plan ${status.plan} este mes. Sube de plan o espera al próximo mes.`
  }
  return 'Cuota disponible'
}
