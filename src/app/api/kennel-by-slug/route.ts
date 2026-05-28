import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/kennel-by-slug?slug=...
 * (o sin params si la request viene desde un custom domain — el endpoint
 * usa el header `host` para resolver el kennel por custom_domain).
 *
 * Resuelve un kennel por slug O por custom domain (público, sin auth).
 * Devuelve el id, slug, name y contact_form_config — los datos que el
 * formulario de contacto embebido necesita.
 */
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug')
  // Si no se pasa slug, resolvemos por host (custom domain). Útil para
  // formularios que se cargan en iremacurto.com sin saber el slug.
  const host = request.headers.get('host')?.toLowerCase() || ''

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  // Devolvemos también contact_form_config para que el formulario embebido
  // en /c/[slug]/contacto sepa qué campos renderear (purpose, color, etc.)
  // según lo que el criador configuró en su dashboard. Antes faltaba este
  // dato y el form tenía hardcoded name/email/phone/message → si la config
  // tenía campos required (ej. purpose) → 400 silencioso, 0 leads.
  let query = admin
    .from('kennels')
    .select('id, slug, name, contact_form_config')
    .limit(1)

  if (slug) {
    query = query.eq('slug', slug)
  } else {
    // Custom domain lookup. Solo aplica si host no es un dominio Genealogic.
    const isGenealogicHost =
      host.endsWith('genealogic.io') ||
      host.endsWith('vercel.app') ||
      host.startsWith('localhost') ||
      host.startsWith('127.0.0.1')
    if (isGenealogicHost || !host) {
      return NextResponse.json({ error: 'slug required' }, { status: 400 })
    }
    query = query.eq('custom_domain', host).eq('custom_domain_verified', true)
  }

  const { data } = await query.maybeSingle()
  if (!data) return NextResponse.json({ kennel: null }, { status: 404 })
  return NextResponse.json({ kennel: data })
}
