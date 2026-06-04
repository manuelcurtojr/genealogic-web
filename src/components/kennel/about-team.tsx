/**
 * AboutTeam — bloque "Quién está detrás" para la página Sobre nosotros.
 *
 * Pinta al fundador / dueño del kennel con avatar + nombre + bio. Si el
 * profile no tiene avatar usa iniciales con pastel. Si no tiene bio se
 * muestra solo el nombre con un texto genérico ("Fundador del criadero").
 *
 * Diseño: card horizontal con foto a la izquierda y datos a la derecha.
 * En mobile cae a stacked (foto arriba, info abajo).
 *
 * El componente NO se renderiza si el owner no tiene al menos display_name
 * — esa gate la hace la página padre.
 */
import { Img } from '@/components/ui/img'
import { pastelByName } from '@/lib/avatars'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

interface Props {
  owner: {
    display_name: string | null
    avatar_url: string | null
    bio: string | null
  }
  kennelName: string
}

export default async function AboutTeam({ owner, kennelName }: Props) {
  const t = getTranslator(await getLocale())
  const name = owner.display_name || t('Equipo del criadero')
  // Trunca bio para no convertir el card en un essay
  const bio = owner.bio ? truncate(owner.bio, 360) : null

  return (
    <section>
      <div className="mb-6 sm:mb-8">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#FE6620]">
          {t('Las personas')}
        </p>
        <h2 className="mt-1.5 text-[22px] sm:text-[28px] font-semibold tracking-[-0.03em] text-ink leading-[1.15]">
          {t('Quién está detrás')}
        </h2>
      </div>

      <article className="rounded-2xl border border-hairline bg-canvas p-5 sm:p-7 flex flex-col sm:flex-row items-start gap-5 sm:gap-7">
        {/* Avatar */}
        {owner.avatar_url ? (
          <Img
            w={480}
            src={owner.avatar_url}
            alt={name}
            className="h-20 w-20 sm:h-28 sm:w-28 rounded-2xl object-cover border border-hairline flex-shrink-0"
          />
        ) : (
          <div
            className="h-20 w-20 sm:h-28 sm:w-28 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl font-bold text-white flex-shrink-0"
            style={{ backgroundColor: pastelByName(name) }}
          >
            {name[0]?.toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted">
            {t('Fundador')} · {kennelName}
          </p>
          <h3 className="mt-0.5 text-[20px] sm:text-[24px] font-semibold tracking-[-0.025em] text-ink leading-snug">
            {name}
          </h3>
          {bio ? (
            <p className="mt-3 text-[14px] sm:text-[15px] text-body leading-[1.6] whitespace-pre-line max-w-prose">
              {bio}
            </p>
          ) : (
            <p className="mt-3 text-[13.5px] text-muted italic max-w-prose">
              {t('Responsable de la cría, selección y continuidad del criadero.')}
            </p>
          )}
        </div>
      </article>
    </section>
  )
}

/** Trunca en último espacio antes de maxChars (sin '…'). */
function truncate(text: string, maxChars: number): string {
  const trimmed = text.trim()
  if (trimmed.length <= maxChars) return trimmed
  const slice = trimmed.slice(0, maxChars)
  const lastBreak = Math.max(slice.lastIndexOf(' '), slice.lastIndexOf('\n'))
  if (lastBreak < maxChars * 0.6) return slice.trimEnd() + '…'
  return slice.slice(0, lastBreak).trimEnd() + '…'
}
