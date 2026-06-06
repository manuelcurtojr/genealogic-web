/**
 * Layout para rutas públicas dentro del grupo (public):
 *   /blog, /pricing, /api-docs, /criadores, /propietarios, /razas, /soporte
 *
 * Si el usuario está LOGUEADO, renderea el chrome completo (sidebar +
 * header logueado). Si NO, renderea el marketing header como antes.
 * Esto permite al usuario navegar al blog o /razas SIN perder el
 * sidebar — UX más fluida, no se siente "fuera de la app".
 *
 * La home `/` no está en este grupo (Next.js no permite que un grupo
 * capture la raíz si hay un page.tsx en `app/`), así que la home
 * gestiona su propio header. Como `app/page.tsx` redirige a /dashboard
 * cuando hay user, el problema solo existía en las páginas de este grupo.
 */
import DashboardShell from '@/components/layout/dashboard-shell'
import MarketingHeader from '@/components/marketing/marketing-header'
import MarketingFooter from '@/components/marketing/marketing-footer'
import { loadShellContext } from '@/lib/auth/load-shell-context'
import { getLocale } from '@/lib/locale'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
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
        {children}
      </DashboardShell>
    )
  }

  const locale = await getLocale()
  return (
    <div className="min-h-screen bg-canvas text-[var(--foreground)] flex flex-col">
      <MarketingHeader locale={locale} />
      <main className="flex-1">{children}</main>
      <MarketingFooter locale={locale} enableTranslate />
    </div>
  )
}
