import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'

/**
 * /c/[slug] — entry point del sitio público del criador.
 * Redirige a la página tipo "home" si existe, o a la primera publicada,
 * o si no hay ninguna, al perfil estándar de Genealogic /kennels/[slug].
 */
export default async function KennelEntry({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: kennel } = await supabase
    .from('kennels').select('id, slug').eq('slug', slug).single()
  if (!kennel) notFound()

  // Buscar home publicada
  const { data: home } = await supabase
    .from('kennel_pages')
    .select('slug')
    .eq('kennel_id', kennel.id)
    .eq('is_published', true)
    .eq('page_type', 'home')
    .limit(1)
    .maybeSingle()

  if (home) redirect(`/c/${slug}/${home.slug}`)

  // Fallback: primera publicada por posición
  const { data: first } = await supabase
    .from('kennel_pages')
    .select('slug')
    .eq('kennel_id', kennel.id)
    .eq('is_published', true)
    .order('position').limit(1).maybeSingle()

  if (first) redirect(`/c/${slug}/${first.slug}`)

  // Sin páginas publicadas — al perfil estándar
  redirect(`/kennels/${slug}`)
}
