/**
 * ReviewAvatar — avatar circular para reseñas.
 *
 * Si hay foto: la muestra.
 * Si no: círculo con la inicial en blanco sobre fondo pastel único por
 *         nombre (deterministic — el mismo nombre siempre tiene el mismo
 *         color).
 */
import { Img } from '@/components/ui/img'
import { pastelByName } from '@/lib/avatars'

interface Props {
  name: string
  avatarUrl?: string | null
  size?: number
}

export default function ReviewAvatar({ name, avatarUrl, size = 40 }: Props) {
  const initial = (name?.[0] || '?').toUpperCase()
  const sz = `${size}px`

  if (avatarUrl) {
    return (
      <div
        className="overflow-hidden rounded-full border border-hairline flex-shrink-0"
        style={{ width: sz, height: sz }}
      >
        <Img w={120} src={avatarUrl} alt={name} className="h-full w-full object-cover" />
      </div>
    )
  }

  return (
    <div
      className="flex items-center justify-center rounded-full flex-shrink-0"
      style={{
        width: sz,
        height: sz,
        backgroundColor: pastelByName(name),
      }}
    >
      <span
        className="font-semibold text-white select-none"
        style={{ fontSize: `${Math.round(size * 0.42)}px` }}
      >
        {initial}
      </span>
    </div>
  )
}
