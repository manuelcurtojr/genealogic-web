/**
 * Contenido principal de /features, en dos bloques ORDENADOS:
 *
 *   1. "Disponible ahora" — lo ya lanzado, con el tratamiento rico de siempre:
 *      header de categoría (anchor #cat-<slug>) + major features alternadas
 *      (mockup grande + título problema-céntrico + descripción + bullets) +
 *      grid de featurettes. El lanzamiento es GRATIS: aquí NO se pinta el badge
 *      "Kennel Pro" ni "Próximamente" (todo está vivo).
 *
 *   2. "Próximamente" (anchor #proximamente) — lo construido-pero-no-lanzado,
 *      como tarjetas COMPACTAS agrupadas por categoría: icono + título + una
 *      línea + chip "Próximamente". Es un roadmap, no una segunda página de
 *      venta — sin mockups.
 *
 * Cada feature mayor del bloque 1 es anchor (#<slug>) para deep-linking desde
 * el sidebar y desde landings externas.
 */
import { Check } from 'lucide-react'
import { availableCategories, comingCategories, COMING_SECTION_ID } from './data'
import Mockup from './mockups'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

/** Primera frase de un texto largo, recortada para las tarjetas compactas. */
function firstSentence(text: string): string {
  const match = text.match(/^[^.!?]*[.!?]/)
  return (match ? match[0] : text).trim()
}

export default async function FeaturesContent() {
  const t = getTranslator(await getLocale())
  return (
    <div className="space-y-24 sm:space-y-32 pb-24">
      {/* ═══ BLOQUE 1 · DISPONIBLE AHORA ═══════════════════════════════════
          Lo ya lanzado, gratis para todos. Tratamiento rico de siempre. */}
      <section>
        <header className="mb-12 sm:mb-16">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-600">
            {t('Disponible ahora')}
          </p>
          <h2 className="mt-2 text-[28px] sm:text-[36px] font-semibold tracking-[-0.035em] text-ink leading-[1.1] max-w-3xl">
            {t('Lo que tienes desde el día 1.')}
          </h2>
        </header>

        <div className="space-y-24 sm:space-y-32">
          {availableCategories.map((cat, catIndex) => (
            <section key={cat.slug}>
              {/* Header de la categoría */}
              <div
                id={`cat-${cat.slug}`}
                className="scroll-mt-24 mb-10 sm:mb-14"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#FE6620]">
                  {String(catIndex + 1).padStart(2, '0')} · {cat.label}
                </p>
                <h3 className="mt-2 text-[24px] sm:text-[30px] font-semibold tracking-[-0.03em] text-ink leading-[1.15] max-w-3xl">
                  {cat.tagline}
                </h3>
              </div>

              {/* Features mayores con mockup */}
              <div className="space-y-20 sm:space-y-28">
                {cat.features.map((feature, idx) => {
                  const reversed = idx % 2 === 1
                  const Icon = feature.icon
                  return (
                    <article
                      key={feature.slug}
                      id={feature.slug}
                      className="scroll-mt-24"
                    >
                      <div className={`grid grid-cols-1 lg:grid-cols-2 items-center gap-8 lg:gap-14 ${reversed ? 'lg:[direction:rtl]' : ''}`}>
                        {/* Mockup */}
                        <div className={`${reversed ? 'lg:[direction:ltr]' : ''}`}>
                          <Mockup slug={feature.mockup} />
                        </div>

                        {/* Texto */}
                        <div className={`${reversed ? 'lg:[direction:ltr]' : ''} max-w-prose`}>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-surface-card">
                              <Icon className="h-4 w-4 text-ink" />
                            </span>
                            {/* Lanzamiento gratis: sin badge "Kennel Pro" ni
                                "Próximamente" — todo aquí está disponible. */}
                          </div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                            {feature.problem}
                          </p>
                          <h4 className="mt-5 text-[22px] sm:text-[26px] font-semibold tracking-[-0.025em] text-ink leading-[1.2]">
                            {feature.title}
                          </h4>
                          <p className="mt-3 text-[14.5px] sm:text-[15px] text-body leading-[1.6]">
                            {feature.description}
                          </p>
                          <ul className="mt-5 space-y-2">
                            {feature.bullets.map((b, i) => (
                              <li key={i} className="flex items-start gap-2 text-[13.5px] text-body leading-snug">
                                <Check className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                                <span>{b}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>

              {/* Featurettes */}
              {cat.featurettes.length > 0 && (
                <div className="mt-16 sm:mt-20">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted mb-4">
                    {t('Y además')}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    {cat.featurettes.map((f, i) => {
                      const FIcon = f.icon
                      return (
                        <div
                          key={i}
                          className="rounded-xl border border-hairline bg-canvas p-4 hover:border-ink/20 transition"
                        >
                          <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-surface-card mb-3">
                            <FIcon className="h-4 w-4 text-ink" />
                          </div>
                          <p className="text-[13.5px] font-semibold text-ink leading-snug">{f.title}</p>
                          <p className="mt-1 text-[12.5px] text-body leading-snug">{f.description}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </section>
          ))}
        </div>
      </section>

      {/* ═══ BLOQUE 2 · PRÓXIMAMENTE ═══════════════════════════════════════
          Lo construido-pero-no-lanzado, como tarjetas compactas agrupadas por
          categoría. Roadmap, no segunda página de venta. */}
      {comingCategories.length > 0 && (
        <section id={COMING_SECTION_ID} className="scroll-mt-24 border-t border-hairline pt-16 sm:pt-20">
          <header className="mb-12 sm:mb-14">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
              {t('Próximamente')}
            </p>
            <h2 className="mt-2 text-[28px] sm:text-[36px] font-semibold tracking-[-0.035em] text-ink leading-[1.1] max-w-3xl">
              {t('Lo que vamos lanzando, de una en una.')}
            </h2>
            <p className="mt-4 text-[14.5px] sm:text-[15px] text-body leading-[1.6] max-w-2xl">
              {t('Construimos sobre la genealogía; cada herramienta se anuncia cuando está lista.')}
            </p>
          </header>

          <div className="space-y-10 sm:space-y-12">
            {comingCategories.map((cat) => (
              <div key={cat.slug}>
                {/* Etiqueta pequeña de la categoría */}
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted mb-4">
                  {cat.label}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {/* Major features: una línea (primera frase de la descripción) */}
                  {cat.features.map((feature) => {
                    const Icon = feature.icon
                    return (
                      <div
                        key={feature.slug}
                        className="rounded-xl border border-hairline bg-canvas p-4 flex flex-col"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <span className="flex items-center justify-center h-9 w-9 rounded-lg bg-surface-card">
                            <Icon className="h-4 w-4 text-ink" />
                          </span>
                          <span className="ml-auto inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-muted bg-surface-soft border border-hairline px-2 py-0.5 rounded-full">
                            {t('Próximamente')}
                          </span>
                        </div>
                        <p className="text-[13.5px] font-semibold text-ink leading-snug">{feature.title}</p>
                        <p className="mt-1 text-[12.5px] text-body leading-snug">{firstSentence(feature.description)}</p>
                      </div>
                    )
                  })}
                  {/* Featurettes: ya traen descripción corta */}
                  {cat.featurettes.map((f, i) => {
                    const FIcon = f.icon
                    return (
                      <div
                        key={`fe-${i}`}
                        className="rounded-xl border border-hairline bg-canvas p-4 flex flex-col"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <span className="flex items-center justify-center h-9 w-9 rounded-lg bg-surface-card">
                            <FIcon className="h-4 w-4 text-ink" />
                          </span>
                          <span className="ml-auto inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-muted bg-surface-soft border border-hairline px-2 py-0.5 rounded-full">
                            {t('Próximamente')}
                          </span>
                        </div>
                        <p className="text-[13.5px] font-semibold text-ink leading-snug">{f.title}</p>
                        <p className="mt-1 text-[12.5px] text-body leading-snug">{f.description}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
