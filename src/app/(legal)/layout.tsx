import DashboardShell from '@/components/layout/dashboard-shell'
import MarketingHeader from '@/components/marketing/marketing-header'
import MarketingFooter from '@/components/marketing/marketing-footer'
import LegalSidebar from '@/components/legal/legal-sidebar'
import LegalHero from '@/components/legal/legal-hero'
import LegalFooterNav from '@/components/legal/legal-footer-nav'
import { loadShellContext } from '@/lib/auth/load-shell-context'
import { getLocale } from '@/lib/locale'

/**
 * Layout único para todas las páginas legales.
 *
 * Estructura:
 *   ┌─── MarketingHeader ──────────────────────────────────┐
 *   │                                                       │
 *   │   ┌── Hero (breadcrumb + título dinámico) ────────┐   │
 *   │   └────────────────────────────────────────────────┘   │
 *   │                                                       │
 *   │   ┌── Sidebar ───┐  ┌── Card contenido ──────────┐   │
 *   │   │              │  │                            │   │
 *   │   │  · Aviso     │  │  <h1>…</h1>                │   │
 *   │   │  · Términos  │  │  …                         │   │
 *   │   │  · Privacy   │  │                            │   │
 *   │   │  · Cookies   │  │                            │   │
 *   │   │  · IP        │  │                            │   │
 *   │   │              │  │                            │   │
 *   │   └──────────────┘  └────────────────────────────┘   │
 *   │                                                       │
 *   └─── MarketingFooter ──────────────────────────────────┘
 *
 * Para añadir una nueva política:
 *  1. Crear src/app/(legal)/{slug}/page.tsx con default export
 *  2. Añadir entrada en LEGAL_PAGES (src/components/legal/legal-sidebar.tsx)
 */
export default async function LegalLayout({ children }: { children: React.ReactNode }) {
  // Contenido común: hero + sidebar legal + card con el children.
  const legalBody = (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 sm:py-12">
      <LegalHero />

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr] lg:gap-10">
        <aside className="lg:py-2">
          <LegalSidebar />
        </aside>

        <article className="min-w-0">
          <div className="rounded-2xl border border-hairline bg-canvas px-6 py-8 sm:px-10 sm:py-10 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="prose prose-sm max-w-none prose-headings:text-ink prose-headings:tracking-[-0.025em] prose-p:text-body prose-p:leading-[1.7] prose-li:text-body prose-strong:text-ink prose-a:text-ink prose-a:underline prose-a:underline-offset-4 prose-h1:hidden prose-h2:mt-10 prose-h2:mb-3 prose-h2:text-[20px] prose-h2:font-semibold prose-h2:tracking-[-0.02em] prose-h2:pb-2 prose-h2:border-b prose-h2:border-hairline-soft prose-h3:mt-7 prose-h3:mb-2 prose-h3:text-[15px] prose-h3:font-semibold prose-table:text-[13px] prose-table:my-4 prose-th:bg-surface-soft prose-th:text-ink prose-th:font-semibold prose-th:px-3 prose-th:py-2 prose-th:text-left prose-td:px-3 prose-td:py-2 prose-td:border-t prose-td:border-hairline-soft prose-hr:border-hairline">
              {children}
            </div>
          </div>
          <LegalFooterNav />
        </article>
      </div>
    </div>
  )

  // Si el user está logueado, envolvemos en DashboardShell para mantener
  // el chrome logueado en TODAS las páginas (sin saltos a marketing).
  const ctx = await loadShellContext()
  if (ctx) {
    return (
      <DashboardShell
        user={ctx.user}
        kennel={ctx.kennel}
        plan={ctx.plan}
        planIsFounder={ctx.planIsFounder}
        userId={ctx.userId}
        isClient={ctx.isClient}
      >
        {legalBody}
      </DashboardShell>
    )
  }

  const locale = await getLocale()
  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <MarketingHeader locale={locale} />
      <main className="flex-1">{legalBody}</main>
      <MarketingFooter locale={locale} />
    </div>
  )
}
