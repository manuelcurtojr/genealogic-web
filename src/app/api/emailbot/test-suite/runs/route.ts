/**
 * POST /api/emailbot/test-suite/runs
 *
 * Body: { kennel_id }
 *
 * Crea un run y procesa las 16 conversaciones simuladas en bloque.
 * Tarda ~60-120s; la UI muestra spinner mientras espera.
 *
 * Devuelve { run_id } al terminar para redirect al detalle.
 *
 * Nota: usamos procesado síncrono porque Next 14 no tiene `after()` estable.
 * Si en algún momento migramos a Next 15 podemos volver al patrón
 * "respond immediately + after(processRun)" para UX más rápida.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import {
  createTestRun,
  processTestRunInBackground,
} from '@/lib/ai/emailbot-tester'
import { getModel, getDefaultModel } from '@/lib/ai/models'
import { isProviderAvailable } from '@/lib/ai/client'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 min para el background processing

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const { kennel_id } = body
  if (!kennel_id) return NextResponse.json({ error: 'kennel_id requerido' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data: kennel } = await admin
    .from('kennels')
    .select('id, owner_id, bot_model')
    .eq('id', kennel_id)
    .maybeSingle()
  if (!kennel) return NextResponse.json({ error: 'kennel_not_found' }, { status: 404 })
  if (kennel.owner_id !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  // Validar que hay provider disponible para el modelo elegido (o el default)
  const botModelId: string = kennel.bot_model || getDefaultModel().id
  const model = getModel(botModelId)
  if (!isProviderAvailable(model.provider) && !isProviderAvailable('anthropic')) {
    return NextResponse.json({
      error: 'No hay ningún provider de IA configurado en el servidor. Contacta con soporte.',
    }, { status: 500 })
  }

  // Validar que hay perfiles activos antes de crear el run (evita runs vacíos)
  const { count } = await admin
    .from('emailbot_test_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('kennel_id', kennel_id)
    .eq('is_active', true)
  if (!count || count === 0) {
    return NextResponse.json({
      error: 'No hay perfiles activos. Siembra los 16 perfiles default desde /emailbot/test-suite/profiles antes de lanzar.',
    }, { status: 400 })
  }

  // Crear el run inmediatamente (devuelve ID)
  let runId: string
  try {
    runId = await createTestRun({
      kennelId: kennel.id,
      triggeredBy: user.id,
      botModel: botModelId,
    })
  } catch (e) {
    return NextResponse.json({
      error: e instanceof Error ? e.message : 'create_run_failed',
    }, { status: 500 })
  }

  // Procesar síncrono — el cliente espera hasta que termine (~60-120s)
  // El propio runner actualiza la fila del run y crea las conversaciones
  // a medida que avanza. Si el cliente cancela el fetch, el background
  // sigue trabajando hasta maxDuration y deja todo guardado en DB.
  await processTestRunInBackground({ kennelId: kennel.id, runId })

  return NextResponse.json({
    ok: true,
    run_id: runId,
    profiles_to_run: count,
    bot_model: botModelId,
  })
}
