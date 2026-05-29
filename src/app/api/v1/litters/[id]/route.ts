import { NextRequest } from 'next/server'
import { authenticateRequest, getApiClient, jsonResponse, corsHeaders } from '@/lib/api-auth'

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ALLOWED_STATUSES = ['planned', 'mated', 'born', 'confirmed'] as const

/**
 * GET /api/v1/litters/:id
 * Returns a single litter belonging to this kennel.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(request)
  if (!auth.ok) return auth.response

  const { id } = await params
  if (!UUID_RE.test(id)) return jsonResponse({ error: 'Invalid id (must be UUID)' }, 400)

  const supabase = getApiClient()

  const { data: litter, error } = await supabase
    .from('litters')
    .select(`
      id, status, mating_date, birth_date, puppy_count, is_public,
      created_at, updated_at,
      breed:breeds(id, name),
      father:dogs!litters_father_id_fkey(id, name, slug, sex, thumbnail_url),
      mother:dogs!litters_mother_id_fkey(id, name, slug, sex, thumbnail_url)
    `)
    .eq('id', id)
    .eq('owner_id', auth.auth.ownerId)
    .single()

  if (error || !litter) return jsonResponse({ error: 'Litter not found' }, 404)
  return jsonResponse(litter)
}

/**
 * PATCH /api/v1/litters/:id
 * Updates lifecycle/quantitative fields on a litter. Used by the user's own
 * automations (Make, Zapier, scripts) to advance the breeding pipeline.
 *
 * Whitelist:
 *   - status        ('planned' | 'mated' | 'born' | 'confirmed')
 *   - mating_date   (ISO date string | null)
 *   - birth_date    (ISO date string | null)
 *   - puppy_count   (number | null)
 *   - is_public     (boolean)
 *
 * Scope: only litters owned by the API key's kennel owner.
 */
const LITTER_PATCH_FIELDS = ['status', 'mating_date', 'birth_date', 'puppy_count', 'is_public'] as const

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(request)
  if (!auth.ok) return auth.response

  const { id } = await params
  if (!UUID_RE.test(id)) return jsonResponse({ error: 'Invalid id (must be UUID)' }, 400)

  const supabase = getApiClient()

  // Parse body
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  // Whitelist
  const update: Record<string, unknown> = {}
  for (const f of LITTER_PATCH_FIELDS) {
    if (f in body) update[f] = body[f]
  }
  if (Object.keys(update).length === 0) {
    return jsonResponse(
      { error: 'No updatable fields in body', allowed: LITTER_PATCH_FIELDS },
      400,
    )
  }

  // Validate
  if ('status' in update && !ALLOWED_STATUSES.includes(update.status as any)) {
    return jsonResponse(
      { error: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}` },
      400,
    )
  }
  if (
    'puppy_count' in update &&
    update.puppy_count !== null &&
    (typeof update.puppy_count !== 'number' || update.puppy_count < 0)
  ) {
    return jsonResponse({ error: 'puppy_count must be a non-negative number or null' }, 400)
  }
  if ('is_public' in update && typeof update.is_public !== 'boolean') {
    return jsonResponse({ error: 'is_public must be boolean' }, 400)
  }

  // Ensure litter exists and belongs to this kennel owner
  const { data: existing, error: findErr } = await supabase
    .from('litters')
    .select('id')
    .eq('id', id)
    .eq('owner_id', auth.auth.ownerId)
    .single()

  if (findErr || !existing) return jsonResponse({ error: 'Litter not found' }, 404)

  const { data: updated, error: updateErr } = await supabase
    .from('litters')
    .update(update)
    .eq('id', id)
    .eq('owner_id', auth.auth.ownerId)
    .select(`
      id, status, mating_date, birth_date, puppy_count, is_public, updated_at
    `)
    .single()

  if (updateErr) return jsonResponse({ error: updateErr.message }, 500)
  return jsonResponse(updated)
}
