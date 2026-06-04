/**
 * Sección "Servicios" — grid de servicios ofrecidos. Light theme.
 */
import Link from 'next/link'
import { Img } from '@/components/ui/img'

export function ServicesGridSection({
  title, subtitle, eyebrow, services = [], columns = 3,
}: {
  title?: string
  subtitle?: string
  eyebrow?: string
  services?: { title: string; body?: string; icon?: string; href?: string; image_url?: string }[]
  columns?: 2 | 3 | 4
}) {
  const colsClass = columns === 2 ? 'sm:grid-cols-2' : columns === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3'
  return (
    <section className="py-16 lg:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {(title || subtitle || eyebrow) && (
          <div className="mb-10 text-center">
            {eyebrow && (
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted mb-2">{eyebrow}</p>
            )}
            {title && <h2 className="text-2xl md:text-3xl font-bold text-ink tracking-tight">{title}</h2>}
            {subtitle && <p className="text-body mt-3 max-w-2xl mx-auto">{subtitle}</p>}
          </div>
        )}
        <div className={`grid grid-cols-1 ${colsClass} gap-5`}>
          {services.map((s, i) => {
            const Inner = (
              <div className="h-full rounded-2xl border border-hairline bg-canvas p-6 hover:border-ink/30 hover:shadow-sm transition">
                {s.image_url && (
                  <Img w={480} src={s.image_url} alt={s.title} className="w-full aspect-[16/9] object-cover rounded-lg mb-4" />
                )}
                {s.icon && !s.image_url && <div className="text-2xl mb-3">{s.icon}</div>}
                <h3 className="text-lg font-bold text-ink mb-2">{s.title}</h3>
                {s.body && <p className="text-sm text-body leading-relaxed">{s.body}</p>}
              </div>
            )
            return s.href ? <Link key={i} href={s.href}>{Inner}</Link> : <div key={i}>{Inner}</div>
          })}
        </div>
      </div>
    </section>
  )
}
