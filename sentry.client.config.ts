/**
 * Sentry — config del lado CLIENTE.
 *
 * Solo se envía si NEXT_PUBLIC_SENTRY_DSN está definido. Si no, queda
 * inactivo (sin overhead). Esto permite el rollout gradual: mergeas el
 * código sin tocar Vercel, y cuando metas el DSN como env var el sistema
 * empieza a capturar.
 *
 * Tracking conservador en cliente: 10% de transactions, replay solo en
 * errores. Aumentamos si necesitamos más visibilidad.
 */
import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || 'development',
    // Sample rate de transactions (performance). 10% suele ser suficiente
    // para detectar regresiones sin saturar la cuota.
    tracesSampleRate: 0.1,
    // Session Replay: solo grabamos cuando hay error (0% normal, 100% en
    // sesión con error). Bajo coste y nos da contexto visual para debug.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    // No enviar PII por defecto — buena práctica GDPR.
    sendDefaultPii: false,
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Filtrar errores ruidosos / esperados que no aportan señal.
    beforeSend(event, hint) {
      const err = hint.originalException
      const msg = err instanceof Error ? err.message : String(err || '')
      // Errores de red puntuales del usuario no son de la app.
      if (msg.includes('NetworkError') || msg.includes('Load failed')) return null
      // ResizeObserver loop limit exceeded — falso positivo común
      if (msg.includes('ResizeObserver')) return null
      return event
    },
  })
}
