/**
 * Componentes base para todos los emails transaccionales.
 *
 * Paleta y tipografía espejando la web (estilo Cal):
 *   - Fondo: #ffffff (canvas)
 *   - Texto principal: #111111 (ink)
 *   - Texto secundario: #374151 (body)
 *   - Muted: #6b7280
 *   - Hairline: #e5e7eb
 *   - Accent: #FE6620 (naranja Genealogic)
 *   - Inter font fallback
 *
 * Estructura: EmailLayout > Hero (icon + título) > Body > Button > Footer
 */
import {
  Html, Head, Body, Container, Section, Row, Column,
  Text, Heading, Link, Img, Hr, Preview,
} from '@react-email/components'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://genealogic.io'
const ICON_URL = `${SITE_URL}/icon.svg`

// ─── Tokens compartidos ─────────────────────────────────────────────────────
const COLORS = {
  canvas: '#ffffff',
  surfaceSoft: '#f8f9fa',
  surfaceCard: '#f5f5f5',
  ink: '#111111',
  body: '#374151',
  muted: '#6b7280',
  hairline: '#e5e7eb',
  accent: '#FE6620',
  success: '#10b981',
  danger: '#ef4444',
  amber: '#f59e0b',
} as const

const FONT_STACK =
  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'

const main = {
  backgroundColor: COLORS.surfaceSoft,
  fontFamily: FONT_STACK,
  margin: 0,
  padding: 0,
}

const container = {
  backgroundColor: COLORS.canvas,
  maxWidth: '560px',
  margin: '0 auto',
  padding: '0',
  border: `1px solid ${COLORS.hairline}`,
  borderRadius: '12px',
  overflow: 'hidden' as const,
}

const header = {
  padding: '28px 32px 0 32px',
}

const contentSection = {
  padding: '8px 32px 32px 32px',
}

const footer = {
  padding: '20px 32px 28px 32px',
  textAlign: 'center' as const,
  backgroundColor: COLORS.surfaceSoft,
  borderTop: `1px solid ${COLORS.hairline}`,
}

const heading1 = {
  fontFamily: FONT_STACK,
  fontSize: '26px',
  lineHeight: '1.15',
  letterSpacing: '-0.025em',
  fontWeight: 600,
  color: COLORS.ink,
  margin: '20px 0 12px 0',
}

const heading2 = {
  fontFamily: FONT_STACK,
  fontSize: '18px',
  lineHeight: '1.3',
  letterSpacing: '-0.02em',
  fontWeight: 600,
  color: COLORS.ink,
  margin: '24px 0 8px 0',
}

const paragraph = {
  fontFamily: FONT_STACK,
  fontSize: '15px',
  lineHeight: '1.6',
  color: COLORS.body,
  margin: '0 0 14px 0',
}

const small = {
  fontFamily: FONT_STACK,
  fontSize: '12px',
  lineHeight: '1.5',
  color: COLORS.muted,
  margin: '0',
}

const buttonPrimary = {
  fontFamily: FONT_STACK,
  backgroundColor: COLORS.ink,
  color: '#ffffff',
  padding: '12px 22px',
  fontSize: '14px',
  fontWeight: 700,
  textDecoration: 'none',
  borderRadius: '10px',
  display: 'inline-block',
}

const buttonSecondary = {
  fontFamily: FONT_STACK,
  backgroundColor: '#ffffff',
  color: COLORS.ink,
  padding: '12px 22px',
  fontSize: '14px',
  fontWeight: 700,
  textDecoration: 'none',
  borderRadius: '10px',
  border: `1px solid ${COLORS.hairline}`,
  display: 'inline-block',
}

// ─── Layout principal ───────────────────────────────────────────────────────

export function EmailLayout({
  preview,
  children,
  showFooter = true,
}: {
  preview: string
  children: React.ReactNode
  showFooter?: boolean
}) {
  return (
    <Html>
      <Head>
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={{ padding: '32px 16px' }}>
          <Container style={container}>
            <Section style={header}>
              <Row>
                <Column>
                  <table cellPadding={0} cellSpacing={0} style={{ borderCollapse: 'collapse' }}>
                    <tr>
                      <td style={{ verticalAlign: 'middle', paddingRight: '8px' }}>
                        <Img
                          src={ICON_URL}
                          width="28"
                          height="28"
                          alt="Genealogic"
                          style={{ display: 'block' }}
                        />
                      </td>
                      <td style={{ verticalAlign: 'middle' }}>
                        <span
                          style={{
                            fontFamily: FONT_STACK,
                            fontSize: '18px',
                            fontWeight: 700,
                            letterSpacing: '-0.025em',
                            color: COLORS.ink,
                          }}
                        >
                          Genealogic
                        </span>
                      </td>
                    </tr>
                  </table>
                </Column>
              </Row>
            </Section>
            <Section style={contentSection}>{children}</Section>
            {showFooter && <EmailFooter />}
          </Container>
          <Text
            style={{
              ...small,
              textAlign: 'center',
              margin: '16px 0 0 0',
              color: COLORS.muted,
            }}
          >
            © {new Date().getFullYear()} Genealogic · Hecho en España
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export function EmailFooter() {
  return (
    <Section style={footer}>
      <Text style={small}>
        Recibes este email porque tienes una cuenta en{' '}
        <Link href={SITE_URL} style={{ color: COLORS.muted, textDecoration: 'underline' }}>
          Genealogic
        </Link>
        .
        <br />
        ¿Quieres gestionar qué emails recibes?{' '}
        <Link
          href={`${SITE_URL}/settings`}
          style={{ color: COLORS.muted, textDecoration: 'underline' }}
        >
          Ajusta tus preferencias
        </Link>
        .
      </Text>
    </Section>
  )
}

export function H1({ children }: { children: React.ReactNode }) {
  return <Heading style={heading1}>{children}</Heading>
}

export function H2({ children }: { children: React.ReactNode }) {
  return <Heading style={heading2}>{children}</Heading>
}

export function P({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <Text style={{ ...paragraph, ...(style || {}) }}>{children}</Text>
}

export function Small({ children }: { children: React.ReactNode }) {
  return <Text style={small}>{children}</Text>
}

export function Eyebrow({ children, color = COLORS.accent }: { children: React.ReactNode; color?: string }) {
  return (
    <Text
      style={{
        fontFamily: FONT_STACK,
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color,
        margin: '0 0 4px 0',
      }}
    >
      {children}
    </Text>
  )
}

export function Btn({
  href,
  variant = 'primary',
  children,
}: {
  href: string
  variant?: 'primary' | 'secondary'
  children: React.ReactNode
}) {
  return (
    <table cellPadding={0} cellSpacing={0} style={{ margin: '20px 0', borderCollapse: 'collapse' }}>
      <tr>
        <td>
          <Link
            href={href}
            style={variant === 'primary' ? buttonPrimary : buttonSecondary}
          >
            {children}
          </Link>
        </td>
      </tr>
    </table>
  )
}

export function Divider() {
  return (
    <Hr
      style={{
        border: 'none',
        borderTop: `1px solid ${COLORS.hairline}`,
        margin: '24px 0',
      }}
    />
  )
}

/** Card destacada (gris claro) para info secundaria o resumen. */
export function InfoCard({ children }: { children: React.ReactNode }) {
  return (
    <Section
      style={{
        backgroundColor: COLORS.surfaceCard,
        borderRadius: '10px',
        padding: '16px 20px',
        margin: '16px 0',
      }}
    >
      {children}
    </Section>
  )
}

/** Pill de estado: success/danger/amber/muted. */
export function Pill({
  children,
  variant = 'muted',
}: {
  children: React.ReactNode
  variant?: 'success' | 'danger' | 'amber' | 'muted' | 'accent'
}) {
  const bg = {
    success: '#d1fae5',
    danger: '#fee2e2',
    amber: '#fef3c7',
    muted: COLORS.surfaceCard,
    accent: '#fed7aa',
  }[variant]
  const color = {
    success: '#065f46',
    danger: '#991b1b',
    amber: '#92400e',
    muted: COLORS.body,
    accent: '#9a3412',
  }[variant]

  return (
    <span
      style={{
        display: 'inline-block',
        backgroundColor: bg,
        color,
        fontFamily: FONT_STACK,
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        padding: '4px 8px',
        borderRadius: '4px',
      }}
    >
      {children}
    </span>
  )
}

export { COLORS, FONT_STACK, SITE_URL }
