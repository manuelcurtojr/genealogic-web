import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateReply, type BotContext } from '@/lib/emailbot'

export const maxDuration = 30

/**
 * POST /api/emailbot/test
 * Playground del Emailbot — solo afecta a la UI, no manda emails reales.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { kennel_id, scenario, messages } = body
  if (!kennel_id || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'kennel_id y messages obligatorios' }, { status: 400 })
  }

  const { data: kennel } = await supabase
    .from('kennels')
    .select('id, name, description, owner_id')
    .eq('id', kennel_id)
    .single()
  if (!kennel || kennel.owner_id !== user.id) {
    return NextResponse.json({ error: 'Kennel no encontrado o no es tuyo' }, { status: 403 })
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
  }

  try {
    const result = await generateReply(ctx, messages)
    return NextResponse.json({
      reply: result.reply,
      escalated: result.shouldEscalate,
      escalation_reason: result.escalationReason,
      tokens_used: result.tokensUsed,
      knowledge_used: entries?.length || 0,
    })
  } catch (err: any) {
    console.error('Emailbot test error:', err)
    return NextResponse.json({ error: err.message || 'Error en Anthropic' }, { status: 500 })
  }
}
