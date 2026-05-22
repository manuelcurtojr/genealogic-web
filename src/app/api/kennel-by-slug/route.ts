import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/kennel-by-slug?slug=...
 * Resuelve un kennel por slug (público, sin auth). Solo devuelve el id y datos
 * mínimos para que el formulario de contacto del web builder pueda enviar
 * leads al kennel correcto sin exponer nada sensible.
 */
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data } = await admin
    .from('kennels').select('id, slug, name').eq('slug', slug).maybeSingle()
  if (!data) return NextResponse.json({ kennel: null }, { status: 404 })
  return NextResponse.json({ kennel: data })
}
