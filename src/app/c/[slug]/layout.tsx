import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getKennelBySlug } from '@/lib/kennel-site'
import { getEnabledPages, DEFAULT_NAV_LABELS, pageHref } from '@/lib/kennel/pages'

export default async function KennelSiteLayout({
  children, params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const kennel = await getKennelBySlug(slug)
  if (!kennel) notFound()

  const pages = await getEnabledPages(kennel.id)
  const navItems = pages
    .filter(p => p.slug !== 'home')
    .map(p => ({
      href: pageHref(kennel.slug, p.slug),
      label: p.nav_label || DEFAULT_NAV_LABELS[p.slug] || p.slug,
    }))

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <header className="border-b border-hairline sticky top-0 bg-canvas/95 backdrop-blur z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <Link href={`/c/${kennel.slug}`} className="flex items-center gap-2 min-w-0">
            {kennel.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={kennel.logo_url} alt={kennel.name} className="w-8 h-8 rounded-full object-cover border border-hairline" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-ink text-on-primary flex items-center justify-center text-xs font-bold">
                {kennel.name[0]?.toUpperCase()}
              </div>
            )}
            <span className="text-sm font-bold text-ink truncate">{kennel.name}</span>
          </Link>
          <nav className="ml-auto flex items-center gap-1 overflow-x-auto">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-body hover:text-ink px-3 py-1.5 rounded-lg hover:bg-surface-soft transition whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-hairline mt-12 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center text-xs text-muted">
          <p className="font-semibold text-ink mb-1">{kennel.name}</p>
          {(kennel.city || kennel.country) && (
            <p>{[kennel.city, kennel.country].filter(Boolean).join(', ')}</p>
          )}
          <p className="mt-3">
            Sitio creado con <Link href="https://genealogic.io" className="hover:text-ink underline">Genealogic</Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
