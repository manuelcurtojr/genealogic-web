/**
 * Contenido principal de /features.
 *
 * Por cada categoría:
 *   1. Header de categoría (anchor #cat-<slug>) con tagline.
 *   2. Lista de major features alternadas (mockup izq → derecha → izq...)
 *      con mockup grande + título problema-céntrico + descripción +
 *      bullets + badge PRO opcional.
 *   3. Grid de featurettes (cards pequeñas) al final de la categoría.
 *
 * Cada feature mayor es anchor (#<slug>) para deep-linking desde el
 * sidebar y desde external landings.
 */
import { Check } from 'lucide-react'
import { CATEGORIES } from './data'
import Mockup from './mockups'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

export default async function FeaturesContent() {
  const t = getTranslator(await getLocale())
  return (
    <div className="space-y-24 sm:space-y-32 pb-24">
      {CATEGORIES.map((cat, catIndex) => (
        <section key={cat.slug}>
          {/* Header de la categoría */}
          <div
            id={`cat-${cat.slug}`}
            className="scroll-mt-24 mb-10 sm:mb-14"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#FE6620]">
              {String(catIndex + 1).padStart(2, '0')} · {cat.label}
            </p>
            <h2 className="mt-2 text-[28px] sm:text-[36px] font-semibold tracking-[-0.035em] text-ink leading-[1.1] max-w-3xl">
              {cat.tagline}
            </h2>
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
                        {feature.proOnly && (
                          <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-[#FE6620] bg-orange-50 px-2 py-0.5 rounded-full">
                            Kennel Pro
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-rose-700 bg-rose-50 inline-block px-2 py-0.5 rounded">
                        {t('Problema')}
                      </p>
                      <p className="mt-1.5 text-[14px] text-body italic leading-snug">
                        {feature.problem}
                      </p>
                      <h3 className="mt-5 text-[22px] sm:text-[26px] font-semibold tracking-[-0.025em] text-ink leading-[1.2]">
                        {feature.title}
                      </h3>
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
  )
}
