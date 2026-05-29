/**
 * GET /api/cron/auto-deceased
 *
 * Cron diario que marca como fallecidos los perros con más de 20 años cuya
 * fecha de fallecimiento aún está vacía. Llama a la función SECURITY DEFINER
 * `auto_mark_elderly_deceased()` (idempotente) creada en la migración
 * 20260703_dog_limits_and_deceased.sql.
 *
 * Esto libera el límite del plan (los fallecidos no cuentan) y mantiene el
 * directorio limpio de perros que, por edad, ya no pueden estar vivos. El
 * usuario siempre puede contradecirlo desde la ficha (o escribir a soporte).
 *
 * Autorización: requiere CRON_SECRET (Vercel Cron lo añade auto).
 */
import { NextResponse } from 'next/server'
import { createKennelAdminClient } from '@/lib/supabase/server'
import { isAuthorizedCron, cronUnauthorized } from '@/lib/cron/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) return cronUnauthorized()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data, error } = await admin.rpc('auto_mark_elderly_deceased')

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, marked: data ?? 0 })
}
