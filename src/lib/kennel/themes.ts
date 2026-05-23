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

export type ThemeId = 'classic' | 'bmw-m' | 'lamborghini'

export type ThemeShape = 'soft' | 'sharp'

/** Radio de botones. Mapeado a valores px concretos en themeToCss. */
export type ButtonRadius = 'sharp' | 'subtle' | 'soft' | 'rounded' | 'pill'

/** Fuentes display soportadas. Si se elige una externa, se carga dinámicamente
 * desde Google Fonts via theme-injector. */
export type DisplayFont =
  | 'inter'
  | 'anton'
  | 'oswald'
  | 'bebas-neue'
  | 'playfair'
  | 'archivo-black'
  | 'unbounded'
  | 'montserrat'
  | 'caveat'
  | 'permanent-marker'

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

/** Overrides que el usuario puede aplicar desde la pestaña General. */
export type ThemeOverrides = {
  primary?: string
  accent?: string
  canvas?: string
  ink?: string
  /** Color del texto sobre el botón primario (e.g. negro sobre oro Lambo) */
  on_primary?: string
  /** Banda decorativa multi-color (BMW M tricolor, Lambo gold, etc.).
   * 1 a 3 colores hex. Si la longitud > 0, sustituye al accentStripe del tema. */
  stripe_colors?: string[]
  button_radius?: ButtonRadius
  font_display?: DisplayFont
}

export const BUTTON_RADIUS_PX: Record<ButtonRadius, string> = {
  sharp: '0px',
  subtle: '4px',
  soft: '12px',
  rounded: '24px',
  pill: '9999px',
}

export const FONT_STACKS: Record<DisplayFont, { stack: string; googleFamily?: string; weights?: string }> = {
  inter: { stack: '"Inter", system-ui, sans-serif' },
  anton: { stack: '"Anton", "Bebas Neue", "Inter", sans-serif', googleFamily: 'Anton', weights: '400' },
  oswald: { stack: '"Oswald", "Inter", sans-serif', googleFamily: 'Oswald', weights: '400;500;600;700' },
  'bebas-neue': { stack: '"Bebas Neue", "Anton", sans-serif', googleFamily: 'Bebas+Neue', weights: '400' },
  playfair: { stack: '"Playfair Display", Georgia, serif', googleFamily: 'Playfair+Display', weights: '400;500;700;900' },
  'archivo-black': { stack: '"Archivo Black", "Inter", sans-serif', googleFamily: 'Archivo+Black', weights: '400' },
  unbounded: { stack: '"Unbounded", "Inter", sans-serif', googleFamily: 'Unbounded', weights: '400;600;800' },
  montserrat: { stack: '"Montserrat", "Inter", sans-serif', googleFamily: 'Montserrat', weights: '400;600;800' },
  caveat: { stack: '"Caveat", cursive', googleFamily: 'Caveat', weights: '400;700' },
  'permanent-marker': { stack: '"Permanent Marker", cursive', googleFamily: 'Permanent+Marker', weights: '400' },
}

export const DISPLAY_FONT_LABELS: Record<DisplayFont, string> = {
  inter: 'Inter',
  anton: 'Anton (BMW M)',
  oswald: 'Oswald (Lambo)',
  'bebas-neue': 'Bebas Neue',
  playfair: 'Playfair Display',
  'archivo-black': 'Archivo Black',
  unbounded: 'Unbounded',
  montserrat: 'Montserrat',
  caveat: 'Caveat',
  'permanent-marker': 'Permanent Marker',
}

export const BUTTON_RADIUS_LABELS: Record<ButtonRadius, string> = {
  sharp: 'Sharp (0px)',
  subtle: 'Subtle (4px)',
  soft: 'Soft (12px)',
  rounded: 'Rounded (24px)',
  pill: 'Pill (9999px)',
}

export type Theme = {
  id: ThemeId
  name: string
  tagline: string
  /** Descripción del feeling para el selector */
  description: string
  /** soft = bordes redondeados generosos; sharp = bordes mínimos (BMW, brutalismo) */
  shape: ThemeShape
  /** Radio de botones default del tema (override por theme_overrides.button_radius) */
  buttonRadius: ButtonRadius
  /** Fuente display default del tema (override por theme_overrides.font_display) */
  displayFont: DisplayFont
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
    buttonRadius: 'soft',
    displayFont: 'inter',
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
    buttonRadius: 'subtle',
    displayFont: 'anton',
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
  {
    id: 'lamborghini',
    name: 'Supercar',
    tagline: 'Negro + oro Giallo',
    description:
      'Inspirado en Lamborghini: lujo brutalista, canvas negro absoluto y oro Giallo (#F0B416) como único acento. Tipografía condensada uppercase, formas angulares (hexagonales). Ideal para criaderos premium que quieran posicionarse como exclusivos.',
    shape: 'sharp',
    buttonRadius: 'sharp',
    displayFont: 'oswald',
    uppercaseDisplay: true,
    displayTracking: '0.02em',
    accentStripe: ['#F0B416'],
    tokens: {
      canvas: '#000000',
      surfaceSoft: '#080808',
      surfaceCard: '#111111',
      ink: '#ffffff',
      body: '#b8b8b8',
      muted: '#6a6a6a',
      hairline: '#1a1a1a',
      primary: '#F0B416',
      primaryHover: '#d99e0a',
      onPrimary: '#000000',
      accent: '#F0B416',
    },
  },
]

export function getTheme(id: string | null | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]
}

/**
 * Aplica overrides de usuario sobre el tema base. Acepta los 4 colores
 * + button_radius + font_display.
 */
export function applyOverrides(theme: Theme, overrides?: ThemeOverrides | null): Theme {
  if (!overrides) return theme
  const o = overrides
  return {
    ...theme,
    ...(o.button_radius ? { buttonRadius: o.button_radius } : {}),
    ...(o.font_display ? { displayFont: o.font_display } : {}),
    ...(o.stripe_colors && o.stripe_colors.length > 0 ? { accentStripe: o.stripe_colors } : {}),
    tokens: {
      ...theme.tokens,
      ...(o.primary ? { primary: o.primary, primaryHover: o.primary } : {}),
      ...(o.accent ? { accent: o.accent } : {}),
      ...(o.canvas ? { canvas: o.canvas } : {}),
      ...(o.ink ? { ink: o.ink } : {}),
      ...(o.on_primary ? { onPrimary: o.on_primary } : {}),
    },
  }
}

/**
 * Genera el CSS que inyectamos en el layout público. Sobreescribe las CSS
 * vars de globals.css solo dentro del scope `[data-theme="..."]`.
 *
 * Variables emitidas para que CUALQUIER componente las pueda usar:
 *   --button-radius      → border-radius de botones (.btn-brand, otros)
 *   --font-display       → font-family de h1/h2/h3 + cualquier .font-display
 *   --theme-accent       → color secundario (numbers, stripes, hover)
 *   --display-uppercase  → 'uppercase' o 'none' (para mixed-case en .font-display)
 *   --display-tracking   → letter-spacing display
 */
export function themeToCss(theme: Theme, scope = '[data-kennel-theme]'): string {
  const t = theme.tokens
  const fontStack = FONT_STACKS[theme.displayFont]?.stack ?? FONT_STACKS.inter.stack
  const radius = BUTTON_RADIUS_PX[theme.buttonRadius] ?? BUTTON_RADIUS_PX.soft
  const uppercase = theme.uppercaseDisplay ? 'uppercase' : 'none'
  const tracking = theme.displayTracking ?? '-0.02em'
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
  --font-display:${fontStack};
  --button-radius:${radius};
  --display-uppercase:${uppercase};
  --display-tracking:${tracking};
}
${scope} h1,${scope} h2,${scope} h3{font-family:var(--font-display);text-transform:var(--display-uppercase);letter-spacing:var(--display-tracking);}
${scope} .btn-brand,${scope} .btn-themed{border-radius:var(--button-radius)!important;}
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
