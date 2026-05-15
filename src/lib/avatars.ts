/**
 * Cal.com style pastels — color accent variety para iniciales/avatars.
 * Devuelve hex porque Tailwind JIT 3.x falla con arbitrary values en
 * classNames generados desde helpers. Aplicar siempre vía inline style:
 *
 *   <span style={{ backgroundColor: pastelByName(name) }}>X</span>
 */

const CAL_PASTELS = [
  '#fb923c', // orange
  '#ec4899', // pink
  '#8b5cf6', // violet
  '#34d399', // emerald
  '#f59e0b', // amber
  '#60a5fa', // blue
  '#f472b6', // hot pink
  '#a78bfa', // light violet
] as const

export function pastelByName(name: string | null | undefined): string {
  if (!name) return CAL_PASTELS[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i)
    hash |= 0
  }
  return CAL_PASTELS[Math.abs(hash) % CAL_PASTELS.length]
}

export function initialsFromName(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?'
  return ((parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')).toUpperCase()
}
