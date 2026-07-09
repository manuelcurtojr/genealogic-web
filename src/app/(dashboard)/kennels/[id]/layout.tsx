/**
 * Layout de /kennels/[id] — perfil público básico del criadero.
 *
 * Siempre sirve el perfil básico (home autogenerada + perros + contacto),
 * sin chrome propio del kennel. El marketing-header de Genealogic o el
 * sidebar (según logueado o no) vienen del layout superior (dashboard).
 */
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { isUUID } from '@/lib/slug'

export default async function KennelLayout({
  children, params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const field = isUUID(id) ? 'id' : 'slug'

  const { data: kennel } = await supabase
    .from('kennels')
    .select('id')
    .eq(field, id)
    .single()

  if (!kennel) return notFound()

  // ¿Hay sidebar? Solo logueado el perfil se monta dentro del DashboardShell
  // (sidebar a la izquierda). Sin login va en el layout público (centrado).
  const { data: { user } } = await supabase.auth.getUser()
  const loggedIn = !!user

  // Stage = contenedor del perfil del criadero (ver notas históricas: cancela
  // el padding del shell logueado para que el perfil se vea igual que público).
  if (loggedIn) {
    return (
      <div className="-mx-4 lg:-mx-[46px] overflow-x-clip">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-[30px]">{children}</div>
      </div>
    )
  }
  return <>{children}</>
}
