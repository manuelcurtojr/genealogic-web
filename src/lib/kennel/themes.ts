/**
 * Catálogo de temas visuales para las webs custom de criadores.
 *
 * Cada tema define una paleta completa de tokens CSS que se inyectan como
 * variables en `<html data-theme="...">` dentro de `/c/[slug]/layout.tsx`.
 * Los componentes de sección leen estos tokens via Tailwind v4 (bg-canvas,
 * text-ink, border-hairline, etc.) y se adaptan automáticamente.
 *
 * Añadir un tema nuevo:
 *   1. Push al array `THEMES` con todos los tokens.
 *   2. (Opcional) declarar familia de fuente custom en globals.css.
 *   3. Ya está — el selector en /web/general lo recoge automáticamente.
 */

export type ThemeId = 'classic' | 'bmw-m'

export type ThemeShape = 'soft' | 'sharp'

export type ThemeTokens = {
  /** Color de fondo principal */
  canvas: string
  /** Variante sutil del canvas (nav, sutiles bandas) */
  surfaceSoft: string
  /** Cards, badges, secciones destacadas */
  surfaceCard: string
  /** Texto principal */
  ink: string
  /** Texto secundario */
  body: string
  /** Texto terciario / labels */
  muted: string
  /** Líneas divisorias finas */
  hairline: string
  /** Color primario (CTAs, acentos brand) */
  primary: string
  /** Hover del primario */
  primaryHover: string
  /** Texto sobre fondo primary */
  onPrimary: string
  /** Color secundario / accent (badges, highlights, líneas decorativas) */
  accent: string
}

export type Theme = {
  id: ThemeId
  name: string
  tagline: string
  /** Descripción del feeling para el selector */
  description: string
  /** soft = bordes redondeados generosos; sharp = bordes mínimos (BMW, brutalismo) */
  shape: ThemeShape
  /** Fuente display (titulares). undefined = Inter por defecto */
  fontDisplay?: string
  /** ¿Titulares en mayúsculas siempre? */
  uppercaseDisplay?: boolean
  /** Tracking extra para titulares (e.g. '0.05em' para BMW look) */
  displayTracking?: string
  /** Banda decorativa multi-color (estilo BMW M tricolor stripe). Si presente, se renderiza */
  accentStripe?: string[]
  tokens: ThemeTokens
}

export const THEMES: Theme[] = [
  {
    id: 'classic',
    name: 'Clásico',
    tagline: 'Limpio y profesional',
    description:
      'Diseño Cal.com / Linear: canvas blanco, tipografía Inter, acentos sutiles. La opción segura que funciona en cualquier raza.',
    shape: 'soft',
    tokens: {
      canvas: '#ffffff',
      surfaceSoft: '#f8f9fa',
      surfaceCard: '#f5f5f5',
      ink: '#111111',
      body: '#374151',
      muted: '#6b7280',
      hairline: '#e5e7eb',
      primary: '#111111',
      primaryHover: '#000000',
      onPrimary: '#ffffff',
      accent: '#D74709',
    },
  },
  {
    id: 'bmw-m',
    name: 'Motorsport',
    tagline: 'Negro puro + tricolor',
    description:
      'Inspirado en BMW M: canvas negro absoluto, tipografía bold mayúsculas, banda tricolor azul-claro / azul-oscuro / rojo como acento brand. Ideal para razas de guarda, working dogs o criaderos con identidad fuerte.',
    shape: 'sharp',
    fontDisplay: '"Anton", "Bebas Neue", "Inter", system-ui, sans-serif',
    uppercaseDisplay: true,
    displayTracking: '-0.01em',
    accentStripe: ['#2E9BD6', '#1C3D6E', '#E22718'],
    tokens: {
      canvas: '#000000',
      surfaceSoft: '#0a0a0a',
      surfaceCard: '#141414',
      ink: '#ffffff',
      body: '#c4c4c4',
      muted: '#777777',
      hairline: '#1f1f1f',
      primary: '#E22718',
      primaryHover: '#c61f12',
      onPrimary: '#ffffff',
      accent: '#2E9BD6',
    },
  },
]

export function getTheme(id: string | null | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]
}

/**
 * Aplica overrides de usuario sobre el tema base. Solo permite override de
 * los 4 colores expuestos al usuario en la UI (primary, accent, canvas, ink).
 */
export function applyOverrides(theme: Theme, overrides?: Partial<Pick<ThemeTokens, 'primary' | 'accent' | 'canvas' | 'ink'>> | null): Theme {
  if (!overrides) return theme
  const o = overrides
  return {
    ...theme,
    tokens: {
      ...theme.tokens,
      ...(o.primary ? { primary: o.primary, primaryHover: o.primary } : {}),
      ...(o.accent ? { accent: o.accent } : {}),
      ...(o.canvas ? { canvas: o.canvas } : {}),
      ...(o.ink ? { ink: o.ink } : {}),
    },
  }
}

/**
 * Genera el CSS que inyectamos en el layout público. Sobreescribe las CSS
 * vars de globals.css solo dentro del scope `[data-theme="..."]`, así el
 * dashboard sigue intacto.
 */
export function themeToCss(theme: Theme, scope = '[data-kennel-theme]'): string {
  const t = theme.tokens
  return `${scope}{
  --surface:${t.canvas};
  --surface-soft:${t.surfaceSoft};
  --surface-card:${t.surfaceCard};
  --surface-strong:${t.hairline};
  --ink:${t.ink};
  --body:${t.body};
  --muted:${t.muted};
  --muted-soft:${t.muted};
  --hairline:${t.hairline};
  --hairline-soft:${t.hairline};
  --brand:${t.primary};
  --brand-hover:${t.primaryHover};
  --brand-soft:${hexToRgba(t.primary, 0.1)};
  --brand-strong:${hexToRgba(t.primary, 0.2)};
  --on-primary:${t.onPrimary};
  --on-dark:${t.ink};
  --on-dark-soft:${t.body};
  --theme-accent:${t.accent};
  ${theme.fontDisplay ? `--font-display:${theme.fontDisplay};` : ''}
}
${scope} h1,${scope} h2,${scope} h3{${theme.fontDisplay ? `font-family:var(--font-display);` : ''}${theme.uppercaseDisplay ? 'text-transform:uppercase;' : ''}${theme.displayTracking ? `letter-spacing:${theme.displayTracking};` : ''}}
`
}

function hexToRgba(hex: string, alpha: number): string {
  const m = hex.replace('#', '')
  const bigint = parseInt(m.length === 3 ? m.split('').map((c) => c + c).join('') : m, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r},${g},${b},${alpha})`
}
