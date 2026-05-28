/**
 * API Key authentication for Genealogic public API (v1).
 *
 * ACCESO: SOLO Kennel Enterprise (149€/mes). Cualquier otro plan
 * (free / kennel = Kennel Pro 29€) recibe 403 con mensaje claro.
 *
 * El rol técnico en BBDD `kennel_pro` representa al plan comercial
 * Kennel Enterprise (ver memory/genealogic_pricing_model.md).
 */
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { isKennelPro } from '@/lib/permissions'

const KEY_PREFIX = 'gnl_'

export function generateApiKey(): { key: string; hash: string; last4: string } {
  // 32 random bytes -> base64url -> 43 chars
  const random = crypto.randomBytes(32).toString('base64url')
  const key = `${KEY_PREFIX}${random}`
  const hash = crypto.createHash('sha256').update(key).digest('hex')
  const last4 = key.slice(-4)
  return { key, hash, last4 }
}

export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

export interface AuthenticatedRequest {
  kennelId: string
  ownerId: string
  keyId: string
}

/**
 * Standard CORS headers for the public API. Definidos arriba para que
 * estén disponibles dentro de authenticateRequest() también.
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
}

/**
 * Validate the Authorization: Bearer <api_key> header.
 * Returns the authenticated kennel info or a NextResponse error.
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<{ ok: true; auth: AuthenticatedRequest } | { ok: false; response: NextResponse }> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Missing or invalid Authorization header. Expected: Bearer <api_key>' },
        { status: 401 }
      ),
    }
  }

  const apiKey = authHeader.slice(7).trim()
  if (!apiKey.startsWith(KEY_PREFIX)) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Invalid API key format' }, { status: 401 }),
    }
  }

  const keyHash = hashApiKey(apiKey)

  // Use service role to bypass RLS for the key lookup
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: keyRow, error } = await admin
    .from('kennel_api_keys')
    .select('id, kennel_id, revoked_at, kennel:kennels(owner_id)')
    .eq('key_hash', keyHash)
    .single()

  if (error || !keyRow) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Invalid API key' }, { status: 401 }),
    }
  }

  if (keyRow.revoked_at) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'API key has been revoked' }, { status: 401 }),
    }
  }

  // Comprobación de plan Enterprise: el rol `kennel_pro` en BBDD =
  // Kennel Enterprise (149€) en el modelo comercial. Cualquier otro
  // plan no tiene acceso a la API.
  const ownerId = (keyRow.kennel as { owner_id?: string } | null)?.owner_id || ''
  if (!ownerId) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Kennel owner not found' }, { status: 401 }),
    }
  }

  const { data: ownerProfile } = await admin
    .from('profiles')
    .select('plan')
    .eq('id', ownerId)
    .maybeSingle()

  if (!isKennelPro(ownerProfile?.plan)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: 'API access requires Kennel Enterprise plan',
          plan_required: 'kennel_enterprise',
          upgrade_url: 'https://www.genealogic.io/pricing',
        },
        { status: 403, headers: corsHeaders },
      ),
    }
  }

  // Update last_used_at (fire and forget)
  admin.from('kennel_api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', keyRow.id).then(() => {})

  return {
    ok: true,
    auth: {
      kennelId: keyRow.kennel_id,
      ownerId,
      keyId: keyRow.id,
    },
  }
}

/**
 * Service-role Supabase client for API endpoints (bypasses RLS).
 * Endpoints filter by kennelId/ownerId from the authenticated request.
 */
export function getApiClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: corsHeaders })
}
