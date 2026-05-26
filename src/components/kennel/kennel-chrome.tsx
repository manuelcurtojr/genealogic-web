/**
 * KennelChrome — header + footer propios del criadero para la web Pro.
 *
 * Se monta encima del contenido de cada página `/kennels/[slug]/*` cuando el
 * dueño del kennel es Kennel Pro o enterprise.
 *
 * Aplica el patrón D2 de capas de chrome:
 *  - Si el visitante está en genealogic.io (logueado o no), el marketing/
 *    sidebar de Genealogic envuelve esto desde fuera (layout superior).
 *    Aquí solo añadimos UNA TIRA FINA con el logo + nombre + menú del kennel.
 *  - Si el visitante está en el custom domain (host != genealogic.io), este
 *    chrome es el ÚNICO chrome (header completo, no tira fina) y NO hay
 *    marketing-header de Genealogic alrededor.
 *
 * El layout padre (src/app/(dashboard)/kennels/[slug]/layout.tsx) decide
 * qué `variant` pasarle:
 *  - 'compact' (logueado o no logueado en genealogic.io): tira slim
 *  - 'standalone' (custom domain): chrome de web completa
 */
import Link from 'next/link'
import { Globe } from 'lucide-react'
import { pastelByName } from '@/lib/avatars'
import type { ExtraPageId } from '@/lib/kennel/pro-web'
import { PAGE_NAV_LABEL } from '@/lib/kennel/pro-web'

type NavItem = { id: 'home' | 'perros' | ExtraPageId | 'contacto'; href: string; label: string }

interface Props {
  kennelName: string
  kennelSlug: string
  logoUrl: string | null
  /** Items del menú PÚBLICO (ya filtrados por enabled + tiene contenido) */
  navItems: NavItem[]
  /** ID de la página activa (para subrayar el item del menú) */
  activePageId: 'home' | 'perros' | ExtraPageId | 'contacto'
  /** 'compact' = tira slim sobre marketing-header de Genealogic.
   *  'standalone' = chrome completo (custom domain, sin marketing alrededor). */
  variant: 'compact' | 'standalone'
  /** En modo standalone (custom domain) ponemos un link sutil "Powered by Genealogic" */
  showGenealogicLink?: boolean
}

export default function KennelChrome({
  kennelName, kennelSlug, logoUrl, navItems, activePageId,
  variant, showGenealogicLink = false,
}: Props) {
  // En compact los hrefs son absolutos a /kennels/<slug>/...
  // En standalone (custom domain), el middleware reescribe a /c/[slug]/...
  // pero como aquí estamos sirviendo /kennels/[slug]/* las URLs publicadas
  // deben ser igualmente /<path> y el middleware se encarga del rewrite
  // inverso. Para simplicidad y robustez usamos siempre /kennels/<slug>/<page>
  // — si el host es custom domain el middleware ya lo enmascara al usuario.
  const hrefFor = (id: NavItem['id']) =>
    id === 'home' ? `/kennels/${kennelSlug}` : `/kennels/${kennelSlug}/${id}`

  if (variant === 'compact') {
    return (
      <div
        className="border-b border-hairline bg-canvas/95 backdrop-blur-md"
        data-kennel-chrome="compact"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 h-12 flex items-center gap-3">
          {/* Identidad sutil */}
          <Link href={`/kennels/${kennelSlug}`} className="flex items-center gap-2 min-w-0 group">
            {logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={logoUrl} alt={kennelName} className="h-6 w-6 rounded-full object-cover border border-hairline flex-shrink-0" />
            ) : (
              <div
                className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                style={{ backgroundColor: pastelByName(kennelName) }}
              >
                {kennelName[0]?.toUpperCase()}
              </div>
            )}
            <span className="text-[12.5px] font-semibold text-ink truncate group-hover:text-[#FE6620] transition-colors">
              {kennelName}
            </span>
          </Link>

          {/* Nav — scrollable en mobile, inline en desktop */}
          <nav className="ml-auto flex items-center gap-0 overflow-x-auto scrollbar-hide -mr-2 sm:mr-0">
            {navItems.map(item => {
              const isActive = item.id === activePageId
              return (
                <Link
                  key={item.id}
                  href={hrefFor(item.id)}
                  className={`text-[11.5px] font-semibold px-2.5 sm:px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                    isActive
                      ? 'text-ink bg-surface-card'
                      : 'text-muted hover:text-ink hover:bg-surface-soft'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    )
  }

  // ── Variant 'standalone' (custom domain) ──────────────────────────────
  return (
    <>
      <header
        className="border-b border-hairline bg-canvas/90 backdrop-blur-md sticky top-0 z-40"
        data-kennel-chrome="standalone"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 h-16 sm:h-[72px] flex items-center gap-3">
          <Link href={`/kennels/${kennelSlug}`} className="flex items-center gap-2.5 min-w-0 group">
            {logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={logoUrl}
                alt={kennelName}
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover border border-hairline flex-shrink-0 group-hover:border-[#FE6620] transition-colors"
              />
            ) : (
              <div
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ backgroundColor: pastelByName(kennelName) }}
              >
                {kennelName[0]?.toUpperCase()}
              </div>
            )}
            <span className="text-[15px] sm:text-[16px] font-bold text-ink truncate tracking-tight">
              {kennelName}
            </span>
          </Link>

          <nav className="ml-auto hidden md:flex items-center gap-0">
            {navItems.map(item => {
              const isActive = item.id === activePageId
              return (
                <Link
                  key={item.id}
                  href={hrefFor(item.id)}
                  className={`text-[12px] font-semibold uppercase tracking-[0.1em] px-3 py-2 transition-colors whitespace-nowrap ${
                    isActive ? 'text-ink' : 'text-body hover:text-[#FE6620]'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Mobile: scroll horizontal de tabs */}
          <nav className="ml-auto md:hidden flex items-center gap-0 overflow-x-auto scrollbar-hide -mr-2">
            {navItems.map(item => {
              const isActive = item.id === activePageId
              return (
                <Link
                  key={item.id}
                  href={hrefFor(item.id)}
                  className={`text-[11.5px] font-semibold px-2.5 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                    isActive
                      ? 'text-ink bg-surface-card'
                      : 'text-muted hover:text-ink hover:bg-surface-soft'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      {/* El footer del standalone se monta DESDE el layout (no aquí) para
          que el contenido del page lo precede correctamente. */}
    </>
  )
}

/* Footer reusable para chrome standalone (custom domain) */
export function KennelChromeFooter({
  kennelName, kennelSlug, showGenealogicLink = true,
}: { kennelName: string; kennelSlug: string; showGenealogicLink?: boolean }) {
  return (
    <footer className="bg-surface-soft py-12 sm:py-16 mt-12 sm:mt-16 border-t border-hairline">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="flex items-start justify-between gap-8 flex-wrap">
          <div>
            <p className="text-xl sm:text-2xl font-bold text-ink tracking-tight">{kennelName}</p>
            <p className="mt-2 text-[12.5px] text-muted">
              © {new Date().getFullYear()} {kennelName}. Todos los derechos reservados.
            </p>
          </div>
          {showGenealogicLink && (
            <p className="text-[11px] text-muted inline-flex items-center gap-1.5">
              <Globe className="h-3 w-3" />
              Web creada con{' '}
              <Link
                href={`https://genealogic.io/kennels/${kennelSlug}`}
                className="font-semibold text-body hover:text-[#FE6620] transition-colors uppercase tracking-[0.1em]"
              >
                Genealogic
              </Link>
            </p>
          )}
        </div>
      </div>
    </footer>
  )
}
