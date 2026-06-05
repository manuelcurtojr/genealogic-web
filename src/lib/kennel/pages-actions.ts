/**
 * Server actions para activar/desactivar páginas extra de la web Pro.
 *
 * Las páginas base (Inicio, Nuestros perros, Contacto) NO viven aquí — son
 * siempre on, no son configurables. Estas acciones gestionan únicamente
 * Sobre nosotros, Galería, Instalaciones y Blog.
 *
 * Gate:
 *  - Solo el owner del kennel puede modificar sus toggles
 *  - Las páginas extra requieren plan Kennel Pro (o enterprise = Irema)
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { kennelHasAddon } from '@/lib/kennel/addons'
import { EXTRA_PAGES, type ExtraPageId } from './pro-web'

export async function toggleKennelPageAction(input: {
  kennelId: string
  page: ExtraPageId
  enabled: boolean
}): Promise<{ ok: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('unauthorized')

  const { data: kennel } = await supabase
    .from('kennels')
    .select('id, slug, owner_id, enabled_pages, addons')
    .eq('id', input.kennelId)
    .single()
  if (!kennel) throw new Error('kennel_not_found')
  if (kennel.owner_id !== user.id) throw new Error('forbidden')

  // Gate web add-on: si la página está siendo activada, el criadero debe tener
  // la extensión "web" (o ser founder). Si la está desactivando lo permitimos
  // sin gate (cualquier owner debería poder limpiar su propio estado).
  // Nota: el string 'requires_kennel_pro' se mantiene porque el cliente
  // (pages-toggles.tsx / about-editor.tsx / photos-manager.tsx) lo matchea.
  if (input.enabled) {
    if (!kennelHasAddon(kennel, 'web', user.id)) {
      throw new Error('requires_kennel_pro')
    }
  }

  // Verificamos que la clave esté en el catálogo canónico
  if (!EXTRA_PAGES.includes(input.page)) throw new Error('invalid_page')

  const current = (kennel.enabled_pages || {}) as Record<string, unknown>
  // Reconstruimos solo con claves canónicas — descartamos basura
  const next: Record<string, boolean> = {}
  for (const id of EXTRA_PAGES) {
    next[id] = id === input.page ? input.enabled : current[id] === true
  }

  const { error } = await supabase
    .from('kennels')
    .update({ enabled_pages: next })
    .eq('id', input.kennelId)
  if (error) throw new Error(error.message)

  revalidatePath('/kennel')
  if (kennel.slug) {
    revalidatePath(`/kennels/${kennel.slug}`)
    revalidatePath(`/kennels/${kennel.slug}/${input.page}`)
  }
  return { ok: true }
}
