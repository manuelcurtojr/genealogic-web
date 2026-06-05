import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateReply, type BotContext } from '@/lib/emailbot'
import { logAIUsage } from '@/lib/ai/track'
import { checkBotReplyQuota, quotaReasonMessage } from '@/lib/ai/quotas'
import { userHasAddon } from '@/lib/kennel/addons-server'

export const maxDuration = 30

/**
 * POST /api/emailbot/test
 * Playground del Emailbot — solo afecta a la UI, no manda emails reales.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!(await userHasAddon(user.id, 'emailbot'))) {
    return NextResponse.json({ error: 'Esta función requiere la extensión Emailbot' }, { status: 403 })
  }

  const body = await request.json()
  const { kennel_id, scenario, messages } = body
  if (!kennel_id || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'kennel_id y messages obligatorios' }, { status: 400 })
  }

  const { data: kennel } = await supabase
    .from('kennels')
    .select('id, name, description, owner_id, bot_model')
    .eq('id', kennel_id)
    .single()
  if (!kennel || kennel.owner_id !== user.id) {
    return NextResponse.json({ error: 'Kennel no encontrado o no es tuyo' }, { status: 403 })
  }

  // Plan check — el playground NO consume cuota, pero si el plan no incluye
  // bot (free) bloqueamos para evitar onboarding confuso. quota_exceeded NO
  // bloquea el playground (queremos que pueda seguir afinando aunque haya
  // gastado sus respuestas reales del mes).
  const quota = await checkBotReplyQuota({ kennelId: kennel.id, ownerId: user.id })
  if (quota.reason === 'plan_no_bot') {
    return NextResponse.json({
      error: quotaReasonMessage(quota),
      quota_blocked: true,
      plan: quota.plan,
    }, { status: 402 })
  }

  const { data: entries } = await supabase
    .from('knowledge_entries')
    .select('category, title, content')
    .eq('kennel_id', kennel_id)
    .eq('is_active', true)
    .order('category')
    .order('position')

  const ctx: BotContext = {
    kennelName: kennel.name,
    kennelDescription: kennel.description,
    scenario: (['new_lead', 'waitlist', 'reservation'].includes(scenario) ? scenario : 'new_lead') as any,
    knowledge: entries || [],
    modelId: (kennel as any).bot_model || undefined,
  }

  try {
    const result = await generateReply(ctx, messages)
    await logAIUsage({
      scope: 'emailbot_test',
      kennelId: kennel.id,
      userId: user.id,
      result: {
        text: result.reply, totalTokens: result.tokensUsed,
        inputTokens: result.usage.inputTokens, outputTokens: result.usage.outputTokens,
        costUsd: result.usage.costUsd, provider: result.usage.provider,
        model: result.usage.model, resolvedModelId: result.usage.resolvedModelId,
      },
      requestMeta: { scenario, messages_count: messages.length, knowledge_count: entries?.length || 0 },
    })
    return NextResponse.json({
      reply: result.reply,
      escalated: result.shouldEscalate,
      escalation_reason: result.escalationReason,
      tokens_used: result.tokensUsed,
      cost_usd: result.usage.costUsd,
      model_used: result.usage.resolvedModelId,
      knowledge_used: entries?.length || 0,
    })
  } catch (err: any) {
    console.error('Emailbot test error:', err)
    await logAIUsage({
      scope: 'emailbot_test',
      kennelId: kennel.id,
      userId: user.id,
      errorMessage: err.message || 'unknown',
    })
    return NextResponse.json({ error: err.message || 'Error en IA' }, { status: 500 })
  }
}
