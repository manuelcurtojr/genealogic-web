/**
 * Layout del editor de contenido del criadero (reseñas + formulario de
 * contacto + perfil público).
 *
 * Gate: Kennel Pro en adelante. Reseñas y formulario de contacto son
 * features PE en /pricing — el criador profesional necesita captar leads y
 * mostrar prueba social aunque la web completa (builder, dominio, blog) sea
 * de Enterprise. Si no tienen kennel → /kennel/new. Si no son de pago → /kennel.
 */
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { hasProFeatures, isEnterpriseUser, normalizePlan } from '@/lib/permissions'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import ContenidoSubNav from '@/components/kennel/contenido-subnav'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

export const dynamic = 'force-dynamic'

export default async function KennelContenidoLayout({ children }: { children: React.ReactNode }) {
  const t = getTranslator(await getLocale())
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: kennels } = await supabase
    .from('kennels')
    .select('id, slug, name')
    .eq('owner_id', user.id)
    .order('created_at')
    .limit(1)
  const kennel = kennels?.[0]
  if (!kennel) redirect('/kennel/new')

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()
  const canEdit = isEnterpriseUser(user.id) || hasProFeatures(normalizePlan(profile?.plan))
  if (!canEdit) redirect('/kennel')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <Link
            href="/kennel"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted hover:text-ink transition mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> {t('Mi criadero')}
          </Link>
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">{t('Edita tu web')}</p>
          <h1 className="mt-1 text-[24px] sm:text-[28px] font-semibold tracking-[-0.03em] text-ink">
            {t('Contenido de')} {kennel.name}
          </h1>
        </div>
        {kennel.slug && (
          <Link
            href={`/kennels/${kennel.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-canvas px-3 py-2 text-[12.5px] font-medium text-body hover:border-ink/30 hover:text-ink transition self-start sm:self-auto"
          >
            <ExternalLink className="h-3.5 w-3.5" /> {t('Ver mi web')}
          </Link>
        )}
      </div>

      <ContenidoSubNav />

      {/* Margen propio entre la subnav y el contenido para que las páginas
          editor respiren — el space-y-6 del layout no aplica aquí porque
          el subnav tiene -mb-px que come 1px y el ojo pide más aire. */}
      <div className="pt-4 sm:pt-6">
        {children}
      </div>
    </div>
  )
}
