/**
 * /kennels — directorio público de criaderos.
 *
 * Carga la PRIMERA página en server (28 kennels) para SEO + tiempo de
 * pintado rápido. El cliente sigue cargando más con infinite scroll
 * vía /api/public/kennels?page=2,3,...
 *
 * Orden global: kennels CON logo primero (created_at desc), luego sin logo.
 */
import { createKennelAdminClient } from '@/lib/supabase/server'
import KennelsClient from '@/components/kennels/kennels-client'

export const dynamic = 'force-dynamic'
export const revalidate = 60

const FIRST_PAGE_SIZE = 30

export default async function KennelsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any

  const [withLogoCountRes, withoutLogoCountRes, withLogoRes] = await Promise.all([
    admin.from('kennels').select('id', { count: 'exact', head: true }).not('logo_url', 'is', null),
    admin.from('kennels').select('id', { count: 'exact', head: true }).is('logo_url', null),
    admin.from('kennels')
      .select('id, slug, name, logo_url, description, foundation_date, country, city')
      .not('logo_url', 'is', null)
      .order('created_at', { ascending: false })
      .range(0, FIRST_PAGE_SIZE - 1),
  ])

  const totalWithLogo = withLogoCountRes.count || 0
  const totalWithoutLogo = withoutLogoCountRes.count || 0
  const total = totalWithLogo + totalWithoutLogo

  // Si la primera página no llena el cupo y hay kennels sin logo, los
  // mezclamos para que el primer render se vea completo.
  const initialRows = withLogoRes.data || []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let extraNoLogo: any[] = []
  if (initialRows.length < FIRST_PAGE_SIZE && totalWithoutLogo > 0) {
    const need = FIRST_PAGE_SIZE - initialRows.length
    const { data } = await admin.from('kennels')
      .select('id, slug, name, logo_url, description, foundation_date, country, city')
      .is('logo_url', null)
      .order('created_at', { ascending: false })
      .range(0, need - 1)
    extraNoLogo = data || []
  }

  const initial = [...initialRows, ...extraNoLogo]
  const hasMore = initial.length < total

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink tracking-tight">Directorio de Criaderos</h1>
        <p className="mt-1 text-sm text-muted">
          {total.toLocaleString('es-ES')} criadero{total === 1 ? '' : 's'} registrado{total === 1 ? '' : 's'} en Genealogic
        </p>
      </div>
      <KennelsClient
        initialKennels={initial}
        initialTotal={total}
        initialHasMore={hasMore}
        initialPage={1}
        pageSize={FIRST_PAGE_SIZE}
      />
    </div>
  )
}
