/**
 * Layout para rutas públicas (blog, pricing, api-docs).
 * Monta el PublicHeader arriba con la hamburguesa, wordmark, nav inline y CTAs.
 *
 * Las páginas /blog, /pricing, /api-docs antes heredaban solo el root layout
 * y no tenían cabecera ninguna — ahora todas comparten el mismo header
 * público, igual que las páginas de detalle de perro/criadero ven cuando
 * el visitante no está logueado.
 */
import PublicHeader from '@/components/layout/public-header'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas text-[var(--foreground)]">
      <PublicHeader />
      <main>{children}</main>
    </div>
  )
}
