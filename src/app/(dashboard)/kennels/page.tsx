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
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

export const dynamic = 'force-dynamic'
export const revalidate = 60

const FIRST_PAGE_SIZE = 30

export default async function KennelsPage() {
  const t = getTranslator(await getLocale())
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
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">{t('Descubrimiento')}</p>
        <h1 className="mt-1.5 text-[32px] sm:text-[40px] font-semibold leading-[1.1] tracking-[-0.04em] text-ink">
          {t('Directorio de criaderos')}
        </h1>
        <p className="mt-2 text-[14px] text-body">
          {total.toLocaleString('es-ES')} {t(total === 1 ? 'criadero registrado en' : 'criaderos registrados en')} Genealogic.
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
