import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getKennelBySlug } from '@/lib/kennel-site'
import { getEnabledPages, DEFAULT_NAV_LABELS, pageHref } from '@/lib/kennel/pages'
import { createClient } from '@/lib/supabase/server'
import OwnerFloatingNav from '@/components/kennel/owner-floating-nav'
import { getTheme, applyOverrides } from '@/lib/kennel/themes'
import { ThemeInjector, AccentStripe } from '@/components/site/theme-injector'

export default async function KennelSiteLayout({
  children, params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const kennel = await getKennelBySlug(slug)
  if (!kennel) notFound()

  // Si el visitante logueado es el owner del kennel, mostrar mini-nav flotante
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === kennel.owner_id

  const pages = await getEnabledPages(kennel.id)
  const navItems = pages
    .filter(p => p.slug !== 'home')
    .map(p => ({
      href: pageHref(kennel.slug, p.slug),
      label: p.nav_label || DEFAULT_NAV_LABELS[p.slug] || p.slug,
    }))

  // Tema visual de la web custom (clásico, BMW M, etc.) + overrides puntuales
  const theme = applyOverrides(getTheme(kennel.theme_id), kennel.theme_overrides)

  return (
    <div data-kennel-theme={theme.id} className="min-h-screen bg-canvas text-ink flex flex-col">
      <ThemeInjector theme={theme} />
      <AccentStripe theme={theme} />
      {isOwner && <OwnerFloatingNav />}
      <header className="border-b border-hairline sticky top-0 bg-canvas/90 backdrop-blur-md z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-[72px] flex items-center gap-4">
          <Link href={`/c/${kennel.slug}`} className="flex items-center gap-3 min-w-0 group">
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
          <nav className="ml-auto flex items-center gap-0 overflow-x-auto">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[12px] font-semibold uppercase tracking-[0.12em] text-body hover:text-theme-accent px-4 py-2 transition-colors whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </nav>
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
          <div className="mt-12 pt-6 border-t border-hairline flex items-center justify-between gap-4 flex-wrap text-[11px] text-muted">
            <p>© {new Date().getFullYear()} {kennel.name}. Todos los derechos reservados.</p>
            <p>
              Sitio creado con{' '}
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
