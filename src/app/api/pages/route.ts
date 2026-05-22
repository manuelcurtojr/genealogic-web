import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_TYPES = ['home', 'about', 'dogs', 'litters', 'contact', 'faq', 'blog', 'custom']

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { kennel_id, slug, title, page_type, content_md, cover_image_url, is_published, show_in_nav } = body

  if (!kennel_id || !slug?.trim() || !title?.trim()) {
    return NextResponse.json({ error: 'kennel_id, slug y title requeridos' }, { status: 400 })
  }
  if (page_type && !ALLOWED_TYPES.includes(page_type)) {
    return NextResponse.json({ error: 'page_type inválido' }, { status: 400 })
  }

  const { data: maxRow } = await supabase
    .from('kennel_pages').select('position').eq('kennel_id', kennel_id)
    .order('position', { ascending: false }).limit(1)
  const nextPos = (maxRow?.[0]?.position || 0) + 1

  const { data, error } = await supabase
    .from('kennel_pages')
    .insert({
      kennel_id, slug: slug.trim(), title: title.trim(),
      page_type: page_type || 'custom',
      content_md: content_md || null,
      cover_image_url: cover_image_url || null,
      is_published: !!is_published,
      show_in_nav: show_in_nav !== false,
      position: nextPos,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Ya existe una página con ese slug en este kennel' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ page: data })
}
