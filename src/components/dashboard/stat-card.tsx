import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: number | string
  accentColor: string
  sub?: string
  href?: string
}

/**
 * KPI card — diseño Cal.com unificado con Pawdoq Breeders:
 * border + canvas + icon arriba con label en gris + número grande tabular.
 * Sin barras laterales coloreadas, sin fondos pastel: cromia solo en el icon.
 */
export default function StatCard({ icon: Icon, label, value, accentColor, sub, href }: StatCardProps) {
  const content = (
    <>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" style={{ color: accentColor }} />
        <span className="text-[13px] font-medium text-muted">{label}</span>
      </div>
      <p className="mt-3 text-[28px] font-semibold tabular-nums tracking-[-0.04em] text-ink leading-none">
        {value}
      </p>
      {sub && <p className="mt-2 text-[12.5px] text-muted">{sub}</p>}
    </>
  )

  const className = 'block rounded-xl border border-hairline bg-canvas p-5 transition-colors hover:bg-surface-soft'

  if (href) {
    return (
      <a href={href} className={className}>
        {content}
      </a>
    )
  }
  return <div className={className}>{content}</div>
}
