/**
 * Next.js instrumentation hook. Carga la config de Sentry según el
 * runtime (Node vs Edge). Sin DSN configurado, ambos archivos quedan
 * inertes (cero overhead).
 *
 * onRequestError: Next 15+ lo exporta para errores de request. En Next
 * 14 (versión actual) no existe pero el SDK lo maneja vía wrapper de
 * route handlers automáticamente con withSentryConfig.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}
