/**
 * Layout para rutas públicas dentro del grupo (public):
 *   /blog, /pricing, /api-docs, /criadores, /propietarios
 *
 * La home `/` no está en este grupo (Next.js no permite que un grupo
 * capture la raíz si hay un page.tsx en `app/`), así que la home importa
 * MarketingHeader directamente.
 */
import MarketingHeader from '@/components/marketing/marketing-header'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas text-[var(--foreground)]">
      <MarketingHeader />
      <main>{children}</main>
    </div>
  )
}
