import Link from 'next/link'
import { Info, Lightbulb, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

/**
 * Tipografía estilo Cal.com para el blog. Inter, tight tracking en headlines,
 * line-height generoso en párrafos, max-width 720px para legibilidad.
 *
 * Uso desde un post:
 *   import { H2, H3, P, UL, LI, Strong, A, Callout, Quote, Hr } from '@/components/blog/prose'
 *   <H2>Sección</H2>
 *   <P>Párrafo...</P>
 */

export function Prose({ children }: { children: React.ReactNode }) {
  return <div className="space-y-5 text-[17px] leading-[1.65] text-body">{children}</div>
}

export function H2({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2
      id={id}
      className="mt-12 mb-3 scroll-mt-24 text-[26px] font-semibold text-ink sm:text-[30px]"
      style={{ letterSpacing: '-0.025em', lineHeight: 1.2 }}
    >
      {children}
    </h2>
  )
}

export function H3({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h3
      id={id}
      className="mt-8 mb-2 scroll-mt-24 text-[20px] font-semibold text-ink sm:text-[22px]"
      style={{ letterSpacing: '-0.02em', lineHeight: 1.25 }}
    >
      {children}
    </h3>
  )
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[17px] leading-[1.65] text-body">{children}</p>
}

export function Lead({ children }: { children: React.ReactNode }) {
  return <p className="text-[19px] leading-[1.55] text-body sm:text-[20px]">{children}</p>
}

export function UL({ children }: { children: React.ReactNode }) {
  return <ul className="ml-5 list-disc space-y-2 text-[17px] leading-[1.6] text-body marker:text-muted">{children}</ul>
}

export function OL({ children }: { children: React.ReactNode }) {
  return <ol className="ml-5 list-decimal space-y-2 text-[17px] leading-[1.6] text-body marker:text-muted">{children}</ol>
}

export function LI({ children }: { children: React.ReactNode }) {
  return <li className="pl-1">{children}</li>
}

export function Strong({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-ink">{children}</strong>
}

export function Em({ children }: { children: React.ReactNode }) {
  return <em className="italic">{children}</em>
}

export function A({ href, children }: { href: string; children: React.ReactNode }) {
  const isExternal = href.startsWith('http')
  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-[color:var(--brand)] underline decoration-[color:var(--brand)]/30 underline-offset-2 transition hover:decoration-[color:var(--brand)]"
      >
        {children}
      </a>
    )
  }
  return (
    <Link
      href={href}
      className="font-medium text-[color:var(--brand)] underline decoration-[color:var(--brand)]/30 underline-offset-2 transition hover:decoration-[color:var(--brand)]"
    >
      {children}
    </Link>
  )
}

export function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-surface-card px-1.5 py-0.5 font-mono text-[14.5px] text-ink">
      {children}
    </code>
  )
}

export function Hr() {
  return <hr className="my-10 border-t border-hairline" />
}

export function Quote({ children, source }: { children: React.ReactNode; source?: string }) {
  return (
    <blockquote className="my-6 border-l-2 border-[color:var(--brand)] pl-5">
      <p className="text-[18px] leading-[1.55] text-body italic">{children}</p>
      {source && <p className="mt-2 text-[13px] text-muted">— {source}</p>}
    </blockquote>
  )
}

type CalloutKind = 'info' | 'tip' | 'warning' | 'success'

const CALLOUT_STYLES: Record<CalloutKind, { bg: string; border: string; text: string; icon: any }> = {
  info: { bg: 'bg-[color:var(--male)]/[0.06]', border: 'border-[color:var(--male)]/30', text: 'text-[color:var(--male)]', icon: Info },
  tip: { bg: 'bg-[color:var(--brand-soft)]', border: 'border-[color:var(--brand)]/30', text: 'text-[color:var(--brand)]', icon: Lightbulb },
  warning: { bg: 'bg-[color:var(--warning)]/[0.08]', border: 'border-[color:var(--warning)]/40', text: 'text-[color:var(--warning)]', icon: AlertTriangle },
  success: { bg: 'bg-[color:var(--success)]/[0.08]', border: 'border-[color:var(--success)]/30', text: 'text-[color:var(--success)]', icon: CheckCircle2 },
}

export function Callout({
  kind = 'tip',
  title,
  children,
}: {
  kind?: CalloutKind
  title?: string
  children: React.ReactNode
}) {
  const s = CALLOUT_STYLES[kind]
  const Icon = s.icon
  return (
    <div className={`my-6 flex gap-3 rounded-[12px] border ${s.border} ${s.bg} p-4 sm:p-5`}>
      <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${s.text}`} />
      <div className="flex-1">
        {title && <p className={`mb-1 text-[14px] font-semibold ${s.text}`}>{title}</p>}
        <div className="text-[15.5px] leading-[1.55] text-body">{children}</div>
      </div>
    </div>
  )
}

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 overflow-x-auto rounded-[12px] border border-hairline">
      <table className="w-full text-[15px]">{children}</table>
    </div>
  )
}

export function THead({ children }: { children: React.ReactNode }) {
  return <thead className="bg-surface-soft text-left text-[13px] font-semibold uppercase tracking-[0.06em] text-muted">{children}</thead>
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-hairline">{children}</tbody>
}

export function TR({ children }: { children: React.ReactNode }) {
  return <tr>{children}</tr>
}

export function TH({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3">{children}</th>
}

export function TD({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 align-top text-body">{children}</td>
}

/** Cierre de post estándar con CTA de registro. */
export async function PostCta({ variant = 'register' }: { variant?: 'register' | 'pro' | 'import' }) {
  const t = getTranslator(await getLocale())
  const config = {
    register: {
      title: t('Empieza gratis en Genealogic'),
      body: t('El registro público mundial de perros con genealogía. Crea cuenta, importa tus perros y publica tu árbol verificable en minutos.'),
      cta: t('Crear cuenta gratis'),
      href: '/register',
    },
    pro: {
      title: t('¿Listo para profesionalizar tu criadero?'),
      body: t('Pipeline de reservas, CRM de clientes, web pública con dominio propio y emailbot. Precio Founder por vida si te subes ahora.'),
      cta: t('Ver tier Pro'),
      href: '/#precios',
    },
    import: {
      title: t('Importa tu genealogía con IA'),
      body: t('Sube una foto de una genealogía existente y obtén el árbol completo en segundos. Funciona con cualquier formato: FCI, RSCE, AKC, manuscrito.'),
      cta: t('Probar la importación'),
      href: '/register',
    },
  }[variant]

  return (
    <div className="my-10 rounded-[14px] border border-hairline bg-surface-soft p-6 sm:p-8">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">Genealogic</p>
      <p
        className="mt-2 text-[22px] font-semibold text-ink"
        style={{ letterSpacing: '-0.02em', lineHeight: 1.2 }}
      >
        {config.title}
      </p>
      <p className="mt-2 text-[15px] leading-[1.55] text-body">{config.body}</p>
      <Link
        href={config.href}
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-ink px-5 py-2.5 text-[14px] font-semibold text-on-primary transition-opacity hover:opacity-90"
      >
        {config.cta} →
      </Link>
    </div>
  )
}
