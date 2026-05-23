/**
 * Inyecta las CSS variables del tema activo del kennel dentro del scope
 * `[data-kennel-theme]`. Server component puro — no JS al cliente.
 *
 * Renderiza opcionalmente:
 *   - <link> a Google Fonts si el tema declara fontDisplay con familia externa
 *   - <style> con los tokens
 *   - <div class="kennel-accent-stripe"> tricolor (BMW M y similares)
 */
import type { Theme } from '@/lib/kennel/themes'
import { themeToCss } from '@/lib/kennel/themes'

type Props = { theme: Theme }

// Mapa de fuentes externas que requieren <link> a Google Fonts según tema
const FONT_LINKS: Record<string, string> = {
  'bmw-m': 'https://fonts.googleapis.com/css2?family=Anton&display=swap',
  lamborghini: 'https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&display=swap',
}

export function ThemeInjector({ theme }: Props) {
  const css = themeToCss(theme, '[data-kennel-theme]')
  const fontHref = FONT_LINKS[theme.id]
  return (
    <>
      {fontHref && (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link href={fontHref} rel="stylesheet" />
      )}
      <style dangerouslySetInnerHTML={{ __html: css }} />
    </>
  )
}

/**
 * Banda decorativa de 3 px en colores del tema (BMW M tricolor: azul claro,
 * azul oscuro, rojo). Solo se renderiza si el tema lo declara.
 */
export function AccentStripe({ theme }: { theme: Theme }) {
  if (!theme.accentStripe || theme.accentStripe.length === 0) return null
  return (
    <div className="flex h-[3px] w-full" aria-hidden="true">
      {theme.accentStripe.map((color, i) => (
        <div key={i} className="flex-1" style={{ backgroundColor: color }} />
      ))}
    </div>
  )
}
