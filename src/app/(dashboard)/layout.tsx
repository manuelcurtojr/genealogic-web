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
import DashboardShell from '@/components/layout/dashboard-shell'
import MarketingHeader from '@/components/marketing/marketing-header'
import MarketingFooter from '@/components/marketing/marketing-footer'
import { loadShellContext } from '@/lib/auth/load-shell-context'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await loadShellContext()

  if (!ctx) {
    return (
      <div className="min-h-screen bg-canvas text-[var(--foreground)] flex flex-col">
        <MarketingHeader />
        <main className="flex-1 px-4 sm:px-[30px] py-4 sm:py-6 max-w-7xl mx-auto w-full">
          {children}
        </main>
        <MarketingFooter />
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
