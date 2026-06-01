/**
 * KennelProFooter — footer + newsletter fusionados, full-bleed.
 *
 * Originalmente vivía dentro de pro-home.tsx (función `KennelFooterMerged`).
 * Extraído a su propio archivo para que se pueda usar también en otras
 * subpáginas del kennel Pro (razas, sobre, perros, etc.) — el footer
 * pertenece a TODAS las páginas, no solo a la home.
 *
 * Se monta desde el layout.tsx del kennel: aparece automáticamente bajo
 * el {children} cuando el dueño es Pro o enterprise.
 *
 * Extiende a 100vw (sin border lateral, sin rounded) para que sienta
 * como el cierre de una web real, no como una card del scroll.
 */
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import NewsletterSubscribe from './newsletter-subscribe'
import { LEGAL_DOCS } from '@/lib/kennel/legal'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

export type KennelProFooterProps = {
  kennelId: string
  kennelName: string
  kennelSlug: string
  kennelLogoUrl: string | null
  /** Texto ya formateado: "Ciudad, País" o similar. Vacío = no se muestra. */
  location: string
  socials: {
    website?: string | null
    instagram?: string | null
    facebook?: string | null
  }
  /** Bajo dominio propio: links legales cortos (/legal/cookies) en vez de
   *  absolutos (/kennels/<slug>/legal/cookies). El middleware reescribe. */
  shortHrefs?: boolean
}

export default async function KennelProFooter({
  kennelId,
  kennelName,
  kennelSlug,
  kennelLogoUrl,
  location,
  socials,
  shortHrefs = false,
}: KennelProFooterProps) {
  const t = getTranslator(await getLocale())
  const hasAnySocial = !!(socials.instagram || socials.facebook)
  // Base de las URLs legales: corta bajo dominio propio, absoluta en genealogic.io.
  const legalBase = shortHrefs ? '/legal' : `/kennels/${kennelSlug}/legal`
  return (
    <footer
      className="kennel-bleed relative bg-gradient-to-br from-blue-50/40 via-canvas to-orange-50/40 border-t border-hairline"
    >
      {/* Glow sutil */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-[260px] w-[260px] rounded-full blur-3xl opacity-50"
        style={{ background: 'radial-gradient(circle at 50% 50%, rgba(59,130,246,0.2) 0%, transparent 70%)' }}
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-10 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-10 lg:gap-16 items-start">

          {/* ── IZQ — identidad del kennel ─────────────────────────── */}
          <div className="order-2 lg:order-1">
            <div className="flex items-center gap-3">
              {kennelLogoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={kennelLogoUrl}
                  alt={kennelName}
                  className="h-12 w-12 rounded-2xl object-cover border border-hairline"
                />
              ) : (
                <div className="h-12 w-12 rounded-2xl bg-surface-card flex items-center justify-center text-xl font-bold text-ink">
                  {kennelName[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-[20px] sm:text-[22px] font-semibold tracking-[-0.025em] text-ink">
                  {kennelName}
                </p>
                {location && (
                  <p className="text-[12.5px] text-muted">{location}</p>
                )}
              </div>
            </div>

            {hasAnySocial && (
              <div className="mt-5 flex flex-wrap gap-1.5">
                {socials.instagram && (
                  <a
                    href={socials.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-canvas px-3 py-1.5 text-[12px] font-medium text-body hover:border-ink/30 hover:text-ink transition"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Instagram
                  </a>
                )}
                {socials.facebook && (
                  <a
                    href={socials.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-canvas px-3 py-1.5 text-[12px] font-medium text-body hover:border-ink/30 hover:text-ink transition"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Facebook
                  </a>
                )}
              </div>
            )}

            <p className="mt-6 text-[11.5px] text-muted">
              © {new Date().getFullYear()} {kennelName}. {t('Todos los derechos reservados.')}
            </p>
            <p className="mt-1 text-[11px] text-muted inline-flex items-center gap-1">
              {t('Web creada con')}{' '}
              <Link
                href="https://genealogic.io"
                className="font-semibold text-body hover:text-[#FE6620] transition-colors uppercase tracking-[0.1em]"
              >
                Genealogic
              </Link>
            </p>
            {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
            <span className="hidden" data-slug={kennelSlug} />
          </div>

          {/* ── DCHA — newsletter inline ────────────────────────────── */}
          <div className="order-1 lg:order-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#3b82f6]">Newsletter</p>
            <h3 className="mt-1 text-[20px] sm:text-[24px] font-semibold tracking-[-0.025em] text-ink leading-[1.2]">
              {t('Mantente al día con')} {kennelName}
            </h3>
            <p className="mt-2 text-[13.5px] text-body leading-snug max-w-prose">
              {t('Próximas camadas, novedades, eventos. Cero spam. Te das de baja con un click.')}
            </p>
            <div className="mt-5">
              <NewsletterSubscribe kennelId={kennelId} kennelName={kennelName} inline />
            </div>
          </div>

        </div>

        {/* ── Franja inferior — enlaces legales ─────────────────────────
            Aviso legal, privacidad, cookies y términos del criadero. Bajo
            dominio propio van en formato corto (/legal/...); el middleware
            reescribe a /kennels/<slug>/legal/... */}
        <div className="mt-10 sm:mt-14 pt-6 border-t border-hairline flex flex-wrap items-center gap-x-5 gap-y-2">
          {LEGAL_DOCS.map(d => (
            <Link
              key={d.slug}
              href={`${legalBase}/${d.slug}`}
              className="text-[12px] text-muted hover:text-ink transition-colors"
            >
              {t(d.label)}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}
