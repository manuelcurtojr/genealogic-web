/**
 * Authentication for the Pawdoq super-admin endpoints.
 *
 * The public per-kennel API (lib/api-auth.ts) uses Bearer keys stored in
 * `kennel_api_keys`, which only let a kennel read its own data. That's
 * fine for tenants of Pawdoq Breeders, but Pawdoq's own super-admin
 * needs to see ALL kennels to surface them as B2B leads.
 *
 * For that we expose a separate admin namespace under `/api/v1/admin/*`,
 * authenticated by a single shared secret stored in
 * `PAWDOQ_ADMIN_API_KEY` (env var, set in Vercel for genealogic-web).
 *
 * The secret never reaches the browser — it's only used server-to-server
 * from the Pawdoq super-admin. If it leaks rotate the env var.
 *
 * Header expected: `Authorization: Bearer <PAWDOQ_ADMIN_API_KEY>`
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_HEADER_PREFIX = 'Bearer '

export function authenticatePawdoqAdmin(
  request: NextRequest
): { ok: true } | { ok: false; response: NextResponse } {
  const expected = process.env.PAWDOQ_ADMIN_API_KEY
  if (!expected) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'PAWDOQ_ADMIN_API_KEY is not configured on the server' },
        { status: 503 }
      ),
    }
  }

  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith(ADMIN_HEADER_PREFIX)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Missing or invalid Authorization header. Expected: Bearer <admin_key>' },
        { status: 401 }
      ),
    }
  }

  const provided = authHeader.slice(ADMIN_HEADER_PREFIX.length).trim()
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Invalid admin key' }, { status: 401 }),
    }
  }

  return { ok: true }
}

/**
 * Constant-time string comparison to prevent timing attacks. Both inputs
 * must already be the same length (we check that explicitly above to
 * avoid leaking via the early return).
 */
function timingSafeEqual(a: string, b: string): boolean {
  let mismatch = 0
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}

export function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export const adminCorsHeaders = {
  // Solo Pawdoq llamará a estos endpoints. CORS permisivo no compromete
  // seguridad porque el secret va en Authorization, no en cookies, y la
  // header Authorization no se envía en requests cross-origin sin CORS
  // explícito de credenciales.
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
}

export function adminJsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: adminCorsHeaders })
}
