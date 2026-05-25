/**
 * GET /api/public/stats — counts públicos para la landing.
 *
 * Devuelve cantidad de criaderos y perros en el catálogo. Cacheado 30s
 * server-side para no impactar la DB con cada poll del frontend.
 *
 * Usa admin client para evitar truncamiento de count por RLS y poder
 * contar exact en tablas grandes (>1000 filas, donde el cliente anon
 * trunca).
 */
import { NextResponse } from 'next/server'
import { createKennelAdminClient } from '@/lib/supabase/server'

// Forzamos dynamic para que no intente prerender en build (necesita ENV vars).
export const dynamic = 'force-dynamic'
export const revalidate = 30

export async function GET() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any

  const [dogsRes, kennelsRes, breedsRes] = await Promise.all([
    admin.from('dogs').select('id', { count: 'exact', head: true }),
    admin.from('kennels').select('id', { count: 'exact', head: true }),
    admin.from('breeds').select('id', { count: 'exact', head: true }),
  ])

  return NextResponse.json({
    dogs: dogsRes.count || 0,
    kennels: kennelsRes.count || 0,
    breeds: breedsRes.count || 0,
    ts: Date.now(),
  }, {
    headers: {
      'Cache-Control': 'public, max-age=15, stale-while-revalidate=30',
    },
  })
}
