import Link from 'next/link'
import { ArrowLeft, GitBranch, Sparkles, ShieldCheck } from 'lucide-react'
import { Wordmark } from '@/components/ui/wordmark'

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
}

/**
 * Cal.com-style 2-column auth shell:
 *   - Left (lg): clean canvas with Wordmark, headline, form, footer.
 *   - Right (lg only): dark brand panel with Founder pricing badge,
 *     pitch corto y 3 features iconadas. Subtle gradient.
 * On mobile both stack and right panel is hidden.
 */
export function AuthShell({ title, titleTail, subtitle, children, footer }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-canvas text-ink">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
        {/* ── LEFT — Form column ────────────────────────────────────── */}
        <div className="relative flex flex-col px-6 py-8 sm:px-10 sm:py-10 lg:px-16 lg:py-12">
          {/* Top bar — wordmark + back to home */}
          <div className="flex items-center justify-between">
            <Wordmark size="text-xl" />
            <Link
              href="/"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium text-muted transition-colors hover:bg-surface-soft hover:text-ink"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Volver
            </Link>
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

          {/* Bottom legal */}
          <p className="text-[12px] text-muted">
            © {new Date().getFullYear()} Genealogic · El registro público mundial de perros con genealogía
          </p>
        </div>

        {/* ── RIGHT — Brand panel (lg only) ─────────────────────────── */}
        <BrandPanel />
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
            Tu criadero entero, en un solo sitio.
          </h2>
          <p className="mt-5 max-w-[420px] text-[15.5px] leading-[1.6] text-on-dark-soft">
            Genealogías verificables, reservas, clientes, web propia y emailbot. Todo lo que
            necesita un criadero serio.
          </p>

          <div className="mt-10 space-y-4">
            <FeatureRow
              icon={<GitBranch className="h-4 w-4" />}
              title="Árbol genealógico verificable"
              desc="Hasta 5 generaciones, cálculo automático de COI."
            />
            <FeatureRow
              icon={<Sparkles className="h-4 w-4" />}
              title="Importa pedigrees con IA"
              desc="De una foto al árbol completo en 12 segundos."
            />
            <FeatureRow
              icon={<ShieldCheck className="h-4 w-4" />}
              title="Indexable y trazable"
              desc="Cada perro y cada criadero, perfil público en Google."
            />
          </div>
        </div>

        {/* Bottom: quote */}
        <blockquote className="border-l-2 border-[color:var(--brand)] pl-4">
          <p className="text-[14.5px] leading-[1.55] text-on-dark italic">
            «Lo que faltaba en este sector: un registro mundial donde un comprador serio
            verifica linaje, salud y trayectoria en un solo sitio.»
          </p>
          <p className="mt-2 text-[12px] uppercase tracking-[0.1em] text-on-dark-soft">
            Manuel Curtó · 4ª generación de criadores
          </p>
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
