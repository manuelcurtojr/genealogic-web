import Link from 'next/link'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { getKennelBySlug } from '@/lib/kennel-site'
import { getEnabledPages, DEFAULT_NAV_LABELS, pageHrefForHost } from '@/lib/kennel/pages'
import { createClient } from '@/lib/supabase/server'
import OwnerFloatingNav from '@/components/kennel/owner-floating-nav'
import { getTheme, applyOverrides } from '@/lib/kennel/themes'
import { ThemeInjector, AccentStripe } from '@/components/site/theme-injector'
import { FloatingContactButtonFooter } from '@/components/site/floating-contact-button'
import { MobileNav } from '@/components/site/mobile-nav'
import { getKennelReproductiveBreedNames } from '@/lib/kennel/breeds'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

// Sin cache estática: el nav refleja al instante los cambios de páginas
// (activar/desactivar) hechos en /web. Combina bien con revalidatePath()
// que disparan las server actions.
export const dynamic = 'force-dynamic'

export default async function KennelSiteLayout({
  children, params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const kennel = await getKennelBySlug(slug)
  if (!kennel) notFound()
  const t = getTranslator(await getLocale())

  // Si el visitante logueado es el owner del kennel, mostrar mini-nav flotante
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === kennel.owner_id

  // Razas de los reproductores para el selector "Raza de interés" del modal
  // de contacto (FloatingContactButtonFooter, mobile).
  const reproBreedNames = await getKennelReproductiveBreedNames(supabase, kennel.id)

  // Detecta el host actual para construir URLs correctas. En custom domain
  // los hrefs deben ser cortos (/perros) — si usásemos /c/<slug>/perros el
  // middleware haría rewrite doble y todo daría 404.
  const hdrs = await headers()
  const host = hdrs.get('host')?.toLowerCase() || null
  const homeHref = pageHrefForHost({
    kennelSlug: kennel.slug, pageSlug: 'home', host, customDomain: kennel.custom_domain,
  })

  const pages = await getEnabledPages(kennel.id)
  const navItems = pages
    .filter(p => p.slug !== 'home')
    .map(p => ({
      href: pageHrefForHost({
        kennelSlug: kennel.slug, pageSlug: p.slug, host, customDomain: kennel.custom_domain,
      }),
      label: p.nav_label || DEFAULT_NAV_LABELS[p.slug] || p.slug,
    }))

  // Tema visual de la web custom (clásico, BMW M, etc.) + overrides puntuales
  const theme = applyOverrides(getTheme(kennel.theme_id), kennel.theme_overrides)

  return (
    <div data-kennel-theme={theme.id} className="min-h-screen bg-canvas text-ink flex flex-col">
      <ThemeInjector theme={theme} />
      <AccentStripe theme={theme} />
      {/* OwnerFloatingNav siempre se monta — internamente decide si mostrarse
          según la sesión (cookie del host actual) o el flag ?owner=1 en URL
          que viene del dashboard de Genealogic. Esto permite que el menú
          aparezca también en custom domains (iremacurto.com) donde no
          tenemos la cookie de Supabase. */}
      <OwnerFloatingNav serverIsOwner={isOwner} kennelSlug={kennel.slug} />
      <header className="border-b border-hairline sticky top-0 bg-canvas/90 backdrop-blur-md z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-[64px] lg:h-[72px] flex items-center gap-3">
          <Link href={homeHref} className="flex items-center gap-2.5 min-w-0 group">
            {kennel.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={kennel.logo_url} alt={kennel.name} className="w-9 h-9 rounded-full object-cover border border-hairline group-hover:border-theme-accent transition-colors" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-ink text-on-primary flex items-center justify-center text-sm font-bold group-hover:bg-theme-accent transition-colors">
                {kennel.name[0]?.toUpperCase()}
              </div>
            )}
            <span
              className="text-[15px] font-bold text-ink truncate tracking-tight"
              style={{ fontFamily: 'var(--font-display, inherit)', textTransform: 'inherit' }}
            >
              {kennel.name}
            </span>
          </Link>
          {/* Nav desktop (visible md+) */}
          <nav className="ml-auto hidden md:flex items-center gap-0">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[11px] lg:text-[12px] font-semibold uppercase tracking-[0.12em] text-body hover:text-theme-accent px-3 lg:px-4 py-2 transition-colors whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          {/* Burger mobile (visible <md) */}
          <div className="ml-auto md:hidden">
            <MobileNav items={navItems} kennelName={kennel.name} />
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* Footer + stripe tricolor superior como cierre visual */}
      <AccentStripe theme={theme} />
      <footer className="bg-surface-soft py-14 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex items-start justify-between gap-8 flex-wrap">
            <div>
              <p
                className="text-2xl font-bold text-ink tracking-tight"
                style={{ fontFamily: 'var(--font-display, inherit)' }}
              >
                {kennel.name}
              </p>
              {(kennel.city || kennel.country) && (
                <p className="mt-2 text-sm text-body">
                  {[kennel.city, kennel.country].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
            <nav className="flex flex-wrap gap-x-6 gap-y-2 max-w-xl justify-end">
              {navItems.map(item => (
                <Link
                  key={`f-${item.href}`}
                  href={item.href}
                  className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted hover:text-theme-accent transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          {/* Botones de acción del footer — visibles en MOBILE (donde los
              badges sticky están ocultos por petición del criador) y también
              en desktop como mirror. */}
          <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 md:hidden">
            <FloatingContactButtonFooter
              kennelId={kennel.id}
              kennelName={kennel.name}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              config={(kennel as any).contact_form_config || null}
              reproBreedNames={reproBreedNames}
            />
            <a
              href={`https://genealogic.io/kennels/${kennel.slug}`}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center justify-center gap-1.5 border border-hairline px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-body hover:border-theme-accent hover:text-theme-accent transition-colors"
              style={{ borderRadius: 'var(--button-radius, 8px)' }}
            >
              <span aria-hidden="true">🐾</span>
              {t('Ver en Genealogic')}
            </a>
          </div>

          <div className="mt-10 pt-6 border-t border-hairline flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[11px] text-muted">
            <p>© {new Date().getFullYear()} {kennel.name}. {t('Todos los derechos reservados.')}</p>
            <p>
              {t('Sitio creado con')}{' '}
              <Link href="https://genealogic.io" className="font-semibold text-body hover:text-theme-accent transition-colors uppercase tracking-[0.12em]">
                Genealogic
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
