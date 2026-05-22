import Link from 'next/link'
import { getMyKennel } from '@/lib/kennel-site'
import { getEnabledPages, DEFAULT_NAV_LABELS } from '@/lib/kennel/pages'

/**
 * Layout dedicado del iframe del editor. Replica el chrome público pero
 * sin tracking, sin header global de Genealogic, sin redirects.
 */
export default async function PreviewLayout({ children }: { children: React.ReactNode }) {
  const kennel = await getMyKennel()
  const pages = await getEnabledPages(kennel.id)
  const navItems = pages
    .filter((p) => p.slug !== 'home')
    .map((p) => ({ slug: p.slug, label: p.nav_label ?? DEFAULT_NAV_LABELS[p.slug] ?? p.slug }))

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <header className="border-b border-hairline">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <div className="flex items-center gap-2 min-w-0">
            {kennel.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={kennel.logo_url} alt={kennel.name} className="w-7 h-7 rounded-full object-cover border border-hairline" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-ink text-on-primary flex items-center justify-center text-xs font-bold">
                {kennel.name[0]?.toUpperCase()}
              </div>
            )}
            <span className="text-sm font-bold text-ink truncate">{kennel.name}</span>
          </div>
          <nav className="ml-auto hidden md:flex items-center gap-3 overflow-x-auto">
            {navItems.map((it) => (
              <span key={it.slug} className="text-xs text-body whitespace-nowrap">{it.label}</span>
            ))}
          </nav>
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="border-t border-hairline py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center text-[11px] text-muted">
          {kennel.name}
          {(kennel.city || kennel.country) && ` · ${[kennel.city, kennel.country].filter(Boolean).join(', ')}`}
          <span className="block mt-1">Preview · Genealogic</span>
        </div>
      </footer>
    </div>
  )
}
