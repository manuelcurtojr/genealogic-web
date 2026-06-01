/**
 * Layout del grupo (dashboard). Si el usuario está logueado, renderea
 * el chrome completo (sidebar + header). Si NO está logueado, renderea
 * el marketing header — porque dentro del grupo (dashboard) viven páginas
 * que también son visibles para visitantes (perfil público de perro,
 * search, kennels, etc).
 *
 * Toda la lógica de carga del contexto (user + kennel + plan + roles)
 * vive en `lib/auth/load-shell-context.ts` para que (public)/layout.tsx
 * y (legal)/layout.tsx puedan reusarla y mostrar el MISMO shell logueado
 * en todas las páginas — UX más fluida sin saltos entre marketing y
 * dashboard.
 */
import { headers } from 'next/headers'
import DashboardShell from '@/components/layout/dashboard-shell'
import MarketingHeader from '@/components/marketing/marketing-header'
import MarketingFooter from '@/components/marketing/marketing-footer'
import { loadShellContext } from '@/lib/auth/load-shell-context'
import { isDynamicSiteHost } from '@/lib/kennel/custom-site'
import { getLocale } from '@/lib/locale'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Si la petición llega por el dominio propio de un criadero migrado a la
  // web dinámica (allowlist en custom-site.ts), NO montamos chrome de
  // Genealogic — ni marketing header/footer ni sidebar. El layout del kennel
  // (/kennels/[id]/layout.tsx) pone su propio header + footer standalone, así
  // que la web se ve 100% del criadero, sin rastro de Genealogic alrededor.
  // En genealogic.io este check es false → comportamiento de siempre.
  const host = (await headers()).get('host')
  if (isDynamicSiteHost(host)) {
    return <>{children}</>
  }

  const ctx = await loadShellContext()

  if (!ctx) {
    const locale = await getLocale()
    return (
      <div className="min-h-screen bg-canvas text-[var(--foreground)] flex flex-col">
        <MarketingHeader locale={locale} />
        <main className="flex-1 px-4 sm:px-[30px] py-4 sm:py-6 max-w-7xl mx-auto w-full">
          {children}
        </main>
        <MarketingFooter locale={locale} />
      </div>
    )
  }

  return (
    <DashboardShell
      user={ctx.user}
      kennel={ctx.kennel}
      plan={ctx.plan}
      planIsFounder={ctx.planIsFounder}
      userId={ctx.userId}
      isClient={ctx.isClient}
    >
      {children}
    </DashboardShell>
  )
}
