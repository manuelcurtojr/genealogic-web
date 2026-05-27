/**
 * Sentry — config del lado SERVIDOR (Node runtime).
 *
 * Captura errores de server components, server actions y API routes
 * Node. Activo solo si SENTRY_DSN está definido. Sin overhead si no.
 */
import * as Sentry from '@sentry/nextjs'

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  })
}
