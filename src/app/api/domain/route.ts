import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VERCEL_API = 'https://api.vercel.com'

async function vercelFetch(path: string, init: RequestInit = {}): Promise<any> {
  const token = process.env.VERCEL_API_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID
  const teamId = process.env.VERCEL_TEAM_ID  // opcional
  if (!token || !projectId) {
    throw new Error('VERCEL_API_TOKEN y VERCEL_PROJECT_ID son obligatorios')
  }
  const url = teamId
    ? `${VERCEL_API}${path}${path.includes('?') ? '&' : '?'}teamId=${teamId}`
    : `${VERCEL_API}${path}`
  const res = await fetch(url, {
    ...init,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
  const json = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, json }
}

function projectPath(): string {
  return `/v10/projects/${process.env.VERCEL_PROJECT_ID}`
}

/**
 * POST /api/domain
 * Body: { kennel_id, domain }
 * Añade el dominio al proyecto de Vercel y lo guarda en kennels.custom_domain.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { kennel_id, domain } = body
  const clean = String(domain || '').trim().toLowerCase()
  if (!kennel_id || !clean) {
    return NextResponse.json({ error: 'kennel_id y domain requeridos' }, { status: 400 })
  }

  const { data: kennel } = await supabase
    .from('kennels').select('id, owner_id, custom_domain').eq('id', kennel_id).single()
  if (!kennel || kennel.owner_id !== user.id) {
    return NextResponse.json({ error: 'Kennel no encontrado o no es tuyo' }, { status: 403 })
  }

  // Si ya tiene otro dominio, primero removerlo de Vercel
  if (kennel.custom_domain && kennel.custom_domain !== clean) {
    await vercelFetch(`${projectPath()}/domains/${kennel.custom_domain}`, { method: 'DELETE' })
  }

  // Añadir el dominio nuevo en Vercel
  try {
    const add = await vercelFetch(`${projectPath()}/domains`, {
      method: 'POST',
      body: JSON.stringify({ name: clean }),
    })
    if (!add.ok && add.status !== 409) {
      const msg = add.json?.error?.message || 'Error añadiendo dominio a Vercel'
      return NextResponse.json({ error: msg }, { status: 500 })
    }
  } catch (err: any) {
    // Si la env var no está configurada, igual guardamos en DB pero marcamos no verificado
    if (err.message?.includes('obligatorios')) {
      await supabase.from('kennels').update({
        custom_domain: clean,
        custom_domain_verified: false,
        custom_domain_added_at: new Date().toISOString(),
      }).eq('id', kennel_id)
      return NextResponse.json({
        verified: false,
        dns_pending: true,
        warning: 'Vercel API no configurada. Dominio guardado pero no añadido al proyecto. Define VERCEL_API_TOKEN y VERCEL_PROJECT_ID.',
      })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }

  // Verificar inmediatamente (puede no estar listo aún)
  let verified = false
  try {
    const v = await vercelFetch(`${projectPath()}/domains/${clean}/verify`, { method: 'POST' })
    verified = Boolean(v.ok && v.json?.verified)
  } catch { /* ignore */ }

  await supabase.from('kennels').update({
    custom_domain: clean,
    custom_domain_verified: verified,
    custom_domain_added_at: new Date().toISOString(),
  }).eq('id', kennel_id)

  return NextResponse.json({ verified, dns_pending: !verified })
}

/**
 * GET /api/domain?check=<domain>
 * Re-verifica el estado del dominio.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const domain = request.nextUrl.searchParams.get('check')
  if (!domain) return NextResponse.json({ error: 'check=<domain> requerido' }, { status: 400 })

  const { data: kennel } = await supabase
    .from('kennels').select('id').eq('owner_id', user.id).eq('custom_domain', domain).single()
  if (!kennel) return NextResponse.json({ error: 'Dominio no encontrado en tu kennel' }, { status: 404 })

  let verified = false
  try {
    const v = await vercelFetch(`${projectPath()}/domains/${domain}/verify`, { method: 'POST' })
    verified = Boolean(v.ok && v.json?.verified)
    if (!verified) {
      // Llamar también al endpoint de info por si está verificado pero el verify endpoint da false
      const info = await vercelFetch(`${projectPath()}/domains/${domain}`)
      verified = Boolean(info.ok && info.json?.verified)
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }

  await supabase.from('kennels')
    .update({ custom_domain_verified: verified })
    .eq('id', kennel.id)

  return NextResponse.json({ verified })
}

/**
 * DELETE /api/domain — quita el dominio del proyecto Vercel y del kennel.
 */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { kennel_id, domain } = body
  if (!kennel_id || !domain) return NextResponse.json({ error: 'kennel_id y domain requeridos' }, { status: 400 })

  const { data: kennel } = await supabase
    .from('kennels').select('id, owner_id, custom_domain').eq('id', kennel_id).single()
  if (!kennel || kennel.owner_id !== user.id || kennel.custom_domain !== domain) {
    return NextResponse.json({ error: 'Dominio no encontrado o no es tuyo' }, { status: 403 })
  }

  try {
    await vercelFetch(`${projectPath()}/domains/${domain}`, { method: 'DELETE' })
  } catch { /* env vars no configuradas — ok, igual desconectamos en DB */ }

  await supabase.from('kennels').update({
    custom_domain: null,
    custom_domain_verified: false,
    custom_domain_added_at: null,
  }).eq('id', kennel_id)

  return NextResponse.json({ success: true })
}
