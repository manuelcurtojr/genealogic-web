/**
 * AboutHero — encabezado editorial de la página "Sobre nosotros".
 *
 * Se renderiza después del title de ProPageShell. Incluye:
 *  - Logo grande del kennel (o iniciales con pastel si no hay)
 *  - Chips contextuales: año fundación + años activos, ubicación,
 *    raza/s, número de hitos en la historia.
 *
 * Cal.com style: layout limpio, jerarquía clara, sin ruido visual.
 * Cualquier chip que no tenga dato se omite sin dejar hueco.
 */
import { Calendar, MapPin, Medal, Milestone } from 'lucide-react'
import { pastelByName } from '@/lib/avatars'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

interface Props {
  kennelName: string
  logoUrl: string | null
  foundationYear: number | null
  location: string
  breedNames: string[]
  milestoneCount: number
}

export default async function AboutHero({
  kennelName, logoUrl, foundationYear, location, breedNames, milestoneCount,
}: Props) {
  const t = getTranslator(await getLocale())
  const yearsActive = foundationYear ? new Date().getFullYear() - foundationYear : 0
  const chips: Array<{ icon: React.ElementType; primary: string; secondary?: string }> = []

  if (foundationYear) {
    chips.push({
      icon: Calendar,
      primary: `${t('Desde')} ${foundationYear}`,
      secondary: yearsActive >= 1 ? `${yearsActive >= 50 ? '50+' : yearsActive} ${yearsActive === 1 ? t('año') : t('años')}` : undefined,
    })
  }
  if (location) {
    chips.push({ icon: MapPin, primary: location })
  }
  if (breedNames.length === 1) {
    chips.push({ icon: Medal, primary: breedNames[0], secondary: t('Especialidad') })
  } else if (breedNames.length > 1) {
    chips.push({
      icon: Medal,
      primary: `${breedNames.length} ${t('razas')}`,
      secondary: breedNames.slice(0, 2).join(' · ') + (breedNames.length > 2 ? '…' : ''),
    })
  }
  if (milestoneCount >= 2) {
    chips.push({
      icon: Milestone,
      primary: `${milestoneCount} ${t('hitos')}`,
      secondary: t('En la historia'),
    })
  }

  return (
    <section className="border-y border-hairline py-8 sm:py-10 -mx-4 sm:-mx-6 lg:mx-0 px-4 sm:px-6 lg:px-0">
      <div className="flex items-center gap-5 sm:gap-6">
        {/* Logo / avatar grande */}
        {logoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={logoUrl}
            alt={kennelName}
            className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl object-cover border border-hairline shadow-[0_4px_20px_rgba(0,0,0,0.06)] flex-shrink-0"
          />
        ) : (
          <div
            className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl font-bold text-white flex-shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
            style={{ backgroundColor: pastelByName(kennelName) }}
          >
            {kennelName[0]?.toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
            {t('Criadero')}
          </p>
          <p className="mt-0.5 text-[18px] sm:text-[20px] font-semibold tracking-[-0.02em] text-ink leading-snug">
            {kennelName}
          </p>
          {(foundationYear || location) && (
            <p className="mt-0.5 text-[12.5px] text-body">
              {[location, foundationYear ? `${t('est.')} ${foundationYear}` : null].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      </div>

      {/* Chips contextuales */}
      {chips.length > 0 && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {chips.map((chip, i) => (
            <div
              key={i}
              className="rounded-xl border border-hairline bg-canvas px-3.5 py-3 flex items-start gap-2.5"
            >
              <chip.icon className="h-4 w-4 text-muted flex-shrink-0 mt-0.5" strokeWidth={1.8} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-ink leading-snug truncate">
                  {chip.primary}
                </p>
                {chip.secondary && (
                  <p className="mt-0.5 text-[11px] text-muted truncate">
                    {chip.secondary}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
