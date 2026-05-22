import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_TYPES = ['home', 'about', 'dogs', 'litters', 'contact', 'faq', 'blog', 'custom']

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const updates: any = {}
  if ('title' in body) updates.title = body.title?.trim()
  if ('slug' in body) updates.slug = body.slug?.trim()
  if ('page_type' in body) {
    if (!ALLOWED_TYPES.includes(body.page_type)) return NextResponse.json({ error: 'page_type inválido' }, { status: 400 })
    updates.page_type = body.page_type
  }
  if ('content_md' in body) updates.content_md = body.content_md
  if ('cover_image_url' in body) updates.cover_image_url = body.cover_image_url
  if ('is_published' in body) updates.is_published = !!body.is_published
  if ('show_in_nav' in body) updates.show_in_nav = !!body.show_in_nav
  if ('position' in body) updates.position = body.position
  if ('meta_description' in body) updates.meta_description = body.meta_description

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('kennel_pages').update(updates).eq('id', id).select().single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Slug duplicado en este kennel' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ page: data })
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase.from('kennel_pages').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
