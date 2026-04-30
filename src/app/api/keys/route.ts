import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateApiKey } from '@/lib/api-auth'

/**
 * Internal route (NOT under /api/v1) — used by the kennel owner UI to manage their own API keys.
 * Auth: requires logged-in user who owns the kennel.
 */

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const kennelId = url.searchParams.get('kennel_id')
  if (!kennelId) return NextResponse.json({ error: 'kennel_id required' }, { status: 400 })

  // Verify ownership
  const { data: kennel } = await supabase.from('kennels').select('id').eq('id', kennelId).eq('owner_id', user.id).single()
  if (!kennel) return NextResponse.json({ error: 'Kennel not found or not yours' }, { status: 403 })

  const { data, error } = await supabase
    .from('kennel_api_keys')
    .select('id, name, key_last4, scopes, created_at, last_used_at, revoked_at')
    .eq('kennel_id', kennelId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data || [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { kennel_id, name } = await request.json()
  if (!kennel_id || !name) return NextResponse.json({ error: 'kennel_id and name required' }, { status: 400 })

  // Verify ownership
  const { data: kennel } = await supabase.from('kennels').select('id').eq('id', kennel_id).eq('owner_id', user.id).single()
  if (!kennel) return NextResponse.json({ error: 'Kennel not found or not yours' }, { status: 403 })

  const { key, hash, last4 } = generateApiKey()

  const { data, error } = await supabase
    .from('kennel_api_keys')
    .insert({
      kennel_id,
      name: name.trim(),
      key_hash: hash,
      key_last4: last4,
      created_by: user.id,
    })
    .select('id, name, key_last4, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Return the key ONCE — frontend must store/show it now
  return NextResponse.json({ ...data, key })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  // Verify ownership via the kennel
  const { data: keyRow } = await supabase
    .from('kennel_api_keys')
    .select('id, kennel:kennels!inner(owner_id)')
    .eq('id', id)
    .single()

  if (!keyRow || (keyRow.kennel as any)?.owner_id !== user.id) {
    return NextResponse.json({ error: 'Key not found or not yours' }, { status: 403 })
  }

  // Soft-revoke (keeps audit trail)
  const { error } = await supabase
    .from('kennel_api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
