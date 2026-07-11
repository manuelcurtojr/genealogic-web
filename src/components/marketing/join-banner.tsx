/**
 * Banner de captación para visitantes ANÓNIMOS en fichas públicas con dueño
 * (donde no aplica el ClaimBanner). Es el punto de venta real: el 86% del
 * tráfico aterriza por SEO/Instagram directamente en fichas de perros y no
 * pasa nunca por /pricing ni /criadores (dato 2026-07: 89/103 vistas a /dogs,
 * 0 a páginas de venta). Complementa a admin-requests/claim-banner.tsx:
 *   - perro/criadero SIN owner  → ClaimBanner ("reclámalo")
 *   - perro/criadero CON owner + visitante anónimo → JoinBanner (este)
 *
 * Server-safe — sin hooks, mismo idioma visual que ClaimBanner.
 */
import Link from 'next/link'
import { PawPrint, ArrowRight } from 'lucide-react'

export default function JoinBanner({ type }: { type: 'dog' | 'kennel' }) {
  const isKennel = type === 'kennel'
  const href = isKennel ? '/criadores' : '/register?intent=owner'
  const title = isKennel
    ? '¿Tienes un criadero? Crea tu perfil gratis.'
    : '¿Tu perro también tiene historia? Crea su ficha gratis.'
  const subtitle = isKennel
    ? 'Tus reproductores y camadas con su genealogía, indexados en Google. Sin tarjeta.'
    : 'Genealogía, cartilla veterinaria con recordatorios y fotos ilimitadas. Sin tarjeta.'
  const cta = isKennel ? 'Crear mi criadero' : 'Crear ficha gratis'

  return (
    <div className="rounded-xl border border-hairline bg-gradient-to-r from-orange-50/70 via-canvas to-canvas px-4 py-3.5 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-[#FE6620]/10 flex items-center justify-center flex-shrink-0">
        <PawPrint className="w-4 h-4 text-[#FE6620]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="text-[11px] text-muted truncate">{subtitle}</p>
      </div>
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[#FE6620] text-white px-3 py-2 text-xs font-bold hover:opacity-90 flex-shrink-0"
      >
        {cta}
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
}
