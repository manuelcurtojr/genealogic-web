/**
 * Sistema de Early Access (alpha).
 *
 * Hay features que están construidas pero NO listas para todo el mundo:
 *  - dependen de env vars que pueden no estar (Stripe, Resend)
 *  - cuestan dinero real sin metered billing (test suite, importer IA)
 *  - tienen calidad legal/operativa insuficiente (contratos sin firma robusta)
 *
 * Mientras tanto, las activamos solo para los kennels en `EARLY_ACCESS_KENNELS`
 * (típicamente el del fundador + 1-2 cobayas) y al resto les mostramos un
 * placeholder "Próximamente" en lugar del feature roto.
 *
 * Para promocionar a alguien a early access: añadir su kennel_id al array.
 * Para abrir el feature a todos: borrar el guard del código que use
 * `isEarlyAccessKennel(...)`.
 *
 * Si en el futuro queremos un sistema más sofisticado (flag por feature en
 * profiles.early_access_features), se sube fácil — esto cubre el 99% hoy.
 */

/**
 * Kennels con acceso a features alpha. Hoy: solo Irema Curtó (kennel del
 * fundador).
 */
export const EARLY_ACCESS_KENNELS = new Set<string>([
  '9675883f-f47e-4c51-bd5d-7fc2c6242963', // Irema Curtó
])

export function isEarlyAccessKennel(kennelId: string | null | undefined): boolean {
  if (!kennelId) return false
  return EARLY_ACCESS_KENNELS.has(kennelId)
}

/** Features bajo gate de early access (para UI consistente). */
export const EARLY_ACCESS_FEATURES = {
  stripe_payments:   { label: 'Pagos online (Stripe)', eta: 'próximas semanas' },
  newsletter_send:   { label: 'Envío de newsletter',    eta: 'próximas semanas' },
  newsletter:        { label: 'Newsletter',             eta: 'próximas semanas' },
  bot_test_suite:    { label: 'Test suite del Emailbot', eta: 'próximamente' },
  ai_importer:       { label: 'Importar a la biblioteca con IA', eta: 'próximamente' },
  contracts:         { label: 'Contratos con firma electrónica', eta: 'próximamente' },
  billing:           { label: 'Facturación con Stripe', eta: 'próximas semanas' },
  web_builder:       { label: 'Web pública del criadero', eta: 'próximamente' },
  emailbot:          { label: 'Emailbot',                eta: 'próximamente' },
} as const

export type EarlyAccessFeatureId = keyof typeof EARLY_ACCESS_FEATURES
