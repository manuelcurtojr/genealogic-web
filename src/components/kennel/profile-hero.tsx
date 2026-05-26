/**
 * KennelProfileHero — hero del perfil público de criadero, estilo Cal.
 *
 * Layout 2 columnas en desktop:
 *   IZQ: logo, nombre, tagline, badges (verificado, founder…), CTAs
 *   DCHA: card con stats (perros, camadas, awards, visitas)
 *
 * Mobile: stacked (texto arriba, stats abajo en grid 2x2 o 3 cols).
 *
 * Sin imagen de fondo gigante — el hero apuesta por jerarquía tipográfica
 * + numeritos vivos, coherente con el resto de la app.
 */
import Link from 'next/link'
import { ArrowRight, MapPin, Calendar, BadgeCheck, Sparkles } from 'lucide-react'
import { pastelByName } from '@/lib/avatars'
import ContactKennelButton from './contact-kennel-button'

type HeroStat = { value: number; label: string }

interface Props {
  kennelId: string
  kennelName: string
  logoUrl: string | null
  description: string | null
  /** "Madrid, España" o "" si no hay datos */
  location: string
  foundationYear: number | null
  /** Razas principales (top 3 mostrar inline en el hero) */
  topBreeds: string[]
  /** Stats que se muestran en la card derecha */
  stats: HeroStat[]
  /** True si el criadero está verificado (futuro: kennels.verified). Hoy sirve como "founder". */
  verified?: boolean
  /** Sección "ancla" donde llevan los CTAs secundarios */
  perrosAnchor: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contactFormConfig: any
  /** Lista de IDs de sección activas — para mostrar nav anchor en hero */
  enabledSectionIds: string[]
}

export default function KennelProfileHero({
  kennelId, kennelName, logoUrl, description, location, foundationYear,
  topBreeds, stats, verified, perrosAnchor, contactFormConfig, enabledSectionIds,
}: Props) {
  // Excerpt corto del description: primeras 1-2 frases o 180 chars.
  const tagline = description
    ? (description.length > 180 ? description.slice(0, 180).trimEnd() + '…' : description)
    : null

  return (
    <section className="rounded-2xl border border-hairline bg-canvas overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6 lg:gap-10 p-5 sm:p-7 lg:p-8">

        {/* ── Columna izquierda ─────────────────────────────────────── */}
        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 overflow-hidden rounded-2xl">
              {logoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={logoUrl} alt={kennelName} className="h-full w-full object-cover" />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center"
                  style={{ backgroundColor: pastelByName(kennelName) }}
                >
                  <span className="text-3xl sm:text-4xl font-semibold text-white">{kennelName[0]?.toUpperCase()}</span>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
                  Criadero
                </p>
                {verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    <BadgeCheck className="h-3 w-3" /> Verificado
                  </span>
                )}
              </div>
              <h1 className="mt-1 text-[28px] sm:text-[36px] lg:text-[40px] font-semibold leading-[1.05] tracking-[-0.04em] text-ink break-words">
                {kennelName}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[12.5px] text-muted">
                {location && (
                  <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {location}</span>
                )}
                {foundationYear && (
                  <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Desde {foundationYear}</span>
                )}
              </div>
            </div>
          </div>

          {tagline && (
            <p className="text-[15px] sm:text-[16.5px] text-body leading-[1.55] max-w-prose">
              {tagline}
            </p>
          )}

          {topBreeds.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {topBreeds.slice(0, 4).map(b => (
                <span key={b} className="inline-flex items-center rounded-full bg-surface-card border border-hairline px-2.5 py-0.5 text-[11.5px] font-medium text-body">
                  {b}
                </span>
              ))}
            </div>
          )}

          {/* CTAs primarios */}
          <div className="flex flex-wrap gap-2 pt-1">
            <ContactKennelButton
              kennelId={kennelId}
              kennelName={kennelName}
              config={contactFormConfig || null}
            />
            <Link
              href={perrosAnchor}
              className="inline-flex items-center gap-1.5 rounded-xl border border-hairline bg-canvas text-ink px-4 py-2.5 text-[13px] font-bold hover:border-ink/30 transition"
            >
              Ver perros
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Nav anchor a secciones del propio perfil */}
          {enabledSectionIds.length > 0 && (
            <nav className="-mb-1 flex flex-wrap gap-x-4 gap-y-1.5 pt-2 text-[12px] text-muted">
              <Link href="#sobre" className="hover:text-ink transition">Sobre el criadero</Link>
              <span className="opacity-30">·</span>
              <Link href={perrosAnchor} className="hover:text-ink transition">Nuestros perros</Link>
              {enabledSectionIds.includes('awards') && (
                <>
                  <span className="opacity-30">·</span>
                  <Link href="#logros" className="hover:text-ink transition">Logros</Link>
                </>
              )}
              {enabledSectionIds.includes('blog') && (
                <>
                  <span className="opacity-30">·</span>
                  <Link href="#blog" className="hover:text-ink transition">Blog</Link>
                </>
              )}
              {enabledSectionIds.includes('faq') && (
                <>
                  <span className="opacity-30">·</span>
                  <Link href="#faq" className="hover:text-ink transition">FAQ</Link>
                </>
              )}
              <span className="opacity-30">·</span>
              <Link href="#contacto" className="hover:text-ink transition">Contacto</Link>
            </nav>
          )}
        </div>

        {/* ── Columna derecha — stats ────────────────────────────────── */}
        {stats.length > 0 && (
          <div className="rounded-2xl bg-gradient-to-br from-orange-50 via-canvas to-blue-50 border border-hairline p-5 sm:p-6 self-start w-full">
            <div className="flex items-center gap-1.5 mb-4">
              <Sparkles className="h-3.5 w-3.5 text-[#FE6620]" />
              <p className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink">El criadero en números</p>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:gap-5">
              {stats.map(s => (
                <div key={s.label} className="min-w-0">
                  <p className="text-[26px] sm:text-[30px] font-semibold tabular-nums tracking-[-0.03em] text-ink leading-none">
                    {s.value.toLocaleString('es-ES')}
                  </p>
                  <p className="mt-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </section>
  )
}
