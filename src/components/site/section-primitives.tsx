/**
 * Primitivas reutilizables para todas las secciones del web builder.
 * Garantizan que cada sección comparta el mismo lenguaje visual:
 * número de sección + línea de acento + eyebrow + título display.
 *
 * Funciona en cualquier tema porque solo usa CSS vars (--theme-accent,
 * --font-display, etc.) inyectadas por ThemeInjector.
 */
import { getCurrentKennel } from '@/lib/kennel-context'
import { createKennelAdminClient } from '@/lib/supabase/server'

type Align = 'left' | 'center'

export function SectionHeader({
  number,
  eyebrow,
  title,
  subtitle,
  align = 'center',
}: {
  number?: string
  eyebrow?: string
  title?: string
  subtitle?: string
  align?: Align
}) {
  const alignWrap = align === 'center' ? 'text-center mx-auto' : 'text-left'
  const alignSubtitle = align === 'center' ? 'mx-auto' : ''
  const alignLabel = align === 'center' ? 'justify-center' : 'justify-start'
  return (
    <div className={`${alignWrap} max-w-3xl mb-14 lg:mb-20`}>
      {(number || eyebrow) && (
        <div className={`flex items-center gap-3 mb-5 ${alignLabel}`}>
          {number && (
            <span className="text-theme-accent font-mono text-[11px] tracking-[0.2em]">
              {number.padStart(2, '0')}
            </span>
          )}
          <span className="inline-block h-px w-8 bg-theme-accent opacity-60" />
          {eyebrow && (
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
              {eyebrow}
            </span>
          )}
        </div>
      )}
      {title && (
        <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-ink leading-[0.95] tracking-[-0.025em]">
          {title}
        </h2>
      )}
      {subtitle && (
        <p className={`mt-5 text-base md:text-lg text-body leading-relaxed max-w-xl ${alignSubtitle}`}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

/**
 * Banda tricolor decorativa, equivalente a la M-stripe de BMW M (o un solo
 * color en Lamborghini). Server component que lee el tema del kennel actual.
 * Úsalo entre secciones para crear ritmo visual.
 */
export async function SectionDivider({ opacity = 0.5 }: { opacity?: number }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const kennel = await getCurrentKennel()
  const { data } = await admin.from('kennels').select('theme_id').eq('id', kennel.id).maybeSingle()
  const themeId: string | undefined = data?.theme_id ?? undefined

  // Definimos las stripes inline (mismo set que en src/lib/kennel/themes.ts)
  const stripes: Record<string, string[]> = {
    'bmw-m': ['#2E9BD6', '#1C3D6E', '#E22718'],
    lamborghini: ['#F0B416'],
  }
  const colors = themeId && stripes[themeId] ? stripes[themeId] : []
  if (colors.length === 0) {
    // En tema clásico mostramos una línea hairline simple para separar
    return <div aria-hidden="true" className="h-px w-full bg-hairline opacity-80" />
  }
  return (
    <div aria-hidden="true" className="flex h-[2px] w-full" style={{ opacity }}>
      {colors.map((c, i) => (
        <div key={i} className="flex-1" style={{ backgroundColor: c }} />
      ))}
    </div>
  )
}
