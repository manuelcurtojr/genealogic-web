import Link from 'next/link'
import { ArrowLeft, GitBranch, Sparkles, ShieldCheck } from 'lucide-react'
import { Wordmark } from '@/components/ui/wordmark'
import LiveStatsLine from './live-stats-line'

interface AuthShellProps {
  /** Big headline on top of the form (e.g. "Bienvenido de vuelta") */
  title: string
  /** Italic light tail of the headline (e.g. "de vuelta.") */
  titleTail?: string
  /** Short subtitle below the headline */
  subtitle: string
  /** The form itself */
  children: React.ReactNode
  /** Bottom link e.g. { question: '¿No tienes cuenta?', label: 'Regístrate', href: '/register' } */
  footer?: { question: string; label: string; href: string }
  /**
   * Cuando true, oculta el botón "Volver" y la línea de copyright para
   * presentar una versión limpia adecuada al WebView iOS. El caller (un
   * client component como /login) decide leyendo `usePlatform()`.
   */
  hideChrome?: boolean
}

/**
 * Cal.com-style 2-column auth shell:
 *   - Left (lg): clean canvas with Wordmark, headline, form, footer.
 *   - Right (lg only): dark brand panel with Founder pricing badge,
 *     pitch corto y 3 features iconadas. Subtle gradient.
 * On mobile both stack and right panel is hidden.
 */
export function AuthShell({ title, titleTail, subtitle, children, footer, hideChrome = false }: AuthShellProps) {
  // En iOS WebView (hideChrome=true): altura exacta de pantalla, sin scroll,
  // contenido centrado verticalmente. Se siente como una pantalla nativa.
  // En web normal: min-h-screen + scroll natural cuando el form es largo.
  const mainCls = hideChrome
    ? 'h-screen overflow-hidden bg-canvas text-ink'
    : 'min-h-screen bg-canvas text-ink'
  const gridCls = hideChrome
    ? 'grid h-full'
    : 'grid min-h-screen lg:grid-cols-[1.05fr_1fr]'
  const leftColCls = hideChrome
    ? 'relative flex h-full flex-col px-6 py-8 sm:px-10'
    : 'relative flex flex-col px-6 py-8 sm:px-10 sm:py-10 lg:px-16 lg:py-12'

  return (
    <main
      className={mainCls}
      style={{
        // Respeta notch + home bar cuando el shell se renderiza dentro del
        // WebView iOS. En web normal estas vars son 0px (ver globals.css).
        paddingTop: 'var(--safe-area-top)',
        paddingBottom: 'var(--safe-area-bottom)',
      }}
    >
      <div className={gridCls}>
        {/* ── LEFT — Form column ────────────────────────────────────── */}
        <div className={leftColCls}>
          {/* Top bar — wordmark + (opcional) volver */}
          <div className="flex items-center justify-between">
            <Wordmark size="text-xl" />
            {!hideChrome && (
              <Link
                href="/"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium text-muted transition-colors hover:bg-surface-soft hover:text-ink"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Volver
              </Link>
            )}
          </div>

          {/* Centered content */}
          <div className="flex flex-1 items-center justify-center py-12 lg:py-16">
            <div className="w-full max-w-[420px]">
              <h1
                className="font-semibold text-ink"
                style={{ fontSize: 'clamp(32px, 5vw, 44px)', lineHeight: 1.05, letterSpacing: '-0.035em' }}
              >
                {title}
                {titleTail && (
                  <>
                    {' '}
                    <span className="italic font-light text-body">{titleTail}</span>
                  </>
                )}
              </h1>
              <p className="mt-4 text-[15.5px] leading-[1.55] text-body">{subtitle}</p>

              <div className="mt-8">{children}</div>

              {footer && (
                <p className="mt-8 text-[14px] text-body">
                  {footer.question}{' '}
                  <Link
                    href={footer.href}
                    className="font-medium text-ink underline decoration-hairline underline-offset-[3px] transition-colors hover:decoration-ink"
                  >
                    {footer.label}
                  </Link>
                </p>
              )}
            </div>
          </div>

          {/* Bottom legal — oculto en WebView iOS para layout limpio */}
          {!hideChrome && (
            <p className="text-[12px] text-muted">
              © {new Date().getFullYear()} Genealogic · El registro público mundial de perros con genealogía
            </p>
          )}
        </div>

        {/* ── RIGHT — Brand panel — oculto en WebView iOS (no aporta nada en móvil) */}
        {!hideChrome && <BrandPanel />}
      </div>
    </main>
  )
}

function BrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-surface-dark text-on-dark lg:block">
      {/* Decorative gradient blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(50% 50% at 80% 10%, rgba(215,71,9,0.20) 0%, transparent 60%), radial-gradient(40% 40% at 10% 90%, rgba(1,125,250,0.12) 0%, transparent 60%)',
        }}
      />

      <div className="relative flex h-full flex-col justify-between px-12 py-12 xl:px-16 xl:py-16">
        {/* Top: Founder badge */}
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[12px] font-medium text-white backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--brand)] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--brand)]" />
          </span>
          Founder pricing · plazas limitadas
        </div>

        {/* Middle: pitch + features */}
        <div className="my-12">
          <h2
            className="max-w-[16ch] font-semibold text-white"
            style={{ fontSize: 'clamp(34px, 3.4vw, 48px)', lineHeight: 1.05, letterSpacing: '-0.035em' }}
          >
            La genealogía de tu perro, donde tiene que estar.
          </h2>
          <p className="mt-5 max-w-[420px] text-[15.5px] leading-[1.6] text-on-dark-soft">
            El registro público de genealogías caninas. Para criadores que documentan su
            trabajo y propietarios que quieren tenerlo todo a mano.
          </p>

          <div className="mt-10 space-y-4">
            <FeatureRow
              icon={<GitBranch className="h-4 w-4" />}
              title="Árbol genealógico verificable"
              desc="Genealogía completa sin límite de generaciones, COI automático."
            />
            <FeatureRow
              icon={<Sparkles className="h-4 w-4" />}
              title="Importa genealogías con IA"
              desc="De una foto al árbol completo en 12 segundos."
            />
            <FeatureRow
              icon={<ShieldCheck className="h-4 w-4" />}
              title="Indexable y trazable"
              desc="Cada perro, perfil público y permanente en Google."
            />
          </div>
        </div>

        {/* Bottom: stats */}
        <blockquote className="border-l-2 border-[color:var(--brand)] pl-4">
          <p className="text-[14.5px] leading-[1.55] text-on-dark">
            Genealogía verificable. Para siempre.
          </p>
          <LiveStatsLine className="mt-2 text-[12px] uppercase tracking-[0.1em] text-on-dark-soft tabular-nums" />
        </blockquote>
      </div>
    </aside>
  )
}

function FeatureRow({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-white/[0.08] text-white">
        {icon}
      </div>
      <div>
        <p className="text-[14.5px] font-semibold text-white">{title}</p>
        <p className="text-[13px] leading-[1.5] text-on-dark-soft">{desc}</p>
      </div>
    </div>
  )
}

/**
 * Field con label encima + icon a la izquierda. Estilo Cal.com:
 * borde hairline, focus ink, padding cómodo, label uppercase mini.
 */
export function Field({
  label,
  icon,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
  minLength,
  autoComplete,
  rightSlot,
}: {
  label: string
  icon?: React.ReactNode
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
  minLength?: number
  autoComplete?: string
  rightSlot?: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-[12px] font-medium text-ink">{label}</label>
        {rightSlot}
      </div>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          className={`w-full rounded-lg border border-hairline bg-canvas py-2.5 text-[14.5px] text-ink placeholder:text-muted transition-colors focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10 ${
            icon ? 'pl-10 pr-3.5' : 'px-3.5'
          }`}
        />
      </div>
    </div>
  )
}

/** Botón primario Cal.com style — ink bg, full width por defecto en forms */
export function AuthSubmit({
  loading,
  loadingLabel,
  children,
  disabled,
}: {
  loading?: boolean
  loadingLabel?: string
  children: React.ReactNode
  disabled?: boolean
}) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink py-2.75 px-5 text-[14px] font-semibold text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      style={{ paddingTop: 11, paddingBottom: 11 }}
    >
      {loading ? loadingLabel || 'Cargando…' : children}
    </button>
  )
}

/** Bloque de error tipo Cal.com — bg suave, border, ícono */
export function AuthError({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[color:var(--error)]/30 bg-[color:var(--error)]/[0.06] p-3 text-[13.5px] leading-[1.5] text-[color:var(--error)]">
      {children}
    </div>
  )
}

/**
 * Botón "Continuar con Google" estilo Cal.com — fondo canvas, border
 * hairline, hover surface-soft, logo Google oficial inline (SVG colores).
 *
 * Uso (cliente):
 *   <GoogleButton onClick={async () => {
 *     const supabase = createClient()
 *     await supabase.auth.signInWithOAuth({
 *       provider: 'google',
 *       options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` }
 *     })
 *   }} />
 */
export function GoogleButton({
  onClick,
  loading,
  label = 'Continuar con Google',
}: {
  onClick: () => void | Promise<void>
  loading?: boolean
  label?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex w-full items-center justify-center gap-2.5 rounded-lg border border-hairline bg-canvas px-5 py-2.75 text-[14px] font-semibold text-ink shadow-[0_1px_2px_rgba(17,17,17,0.04)] transition-colors hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-50"
      style={{ paddingTop: 10, paddingBottom: 10 }}
    >
      {/* Google "G" oficial — colores Material */}
      <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" aria-hidden style={{ width: 18, height: 18 }}>
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      {loading ? 'Conectando…' : label}
    </button>
  )
}

/** Divider 'o continúa con email' — hairline a ambos lados, texto centrado */
export function OAuthDivider({ label = 'o continúa con email' }: { label?: string }) {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-hairline" />
      <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">{label}</span>
      <span className="h-px flex-1 bg-hairline" />
    </div>
  )
}
