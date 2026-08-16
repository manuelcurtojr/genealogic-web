/**
 * Consentimiento de cookies (RGPD). Fuente única del estado de consentimiento,
 * compartida por el banner de cookies (que lo fija) y Google Analytics (que solo
 * carga si el usuario ACEPTÓ). El evento permite que GA reaccione al aceptar sin
 * recargar la página.
 */

export const CONSENT_KEY = 'cookie-consent'
export const CONSENT_EVENT = 'cookie-consent-changed'

export type ConsentValue = 'accepted' | 'rejected' | null

/** Lee el consentimiento actual del navegador (null = aún no decidido). */
export function getConsent(): ConsentValue {
  if (typeof window === 'undefined') return null
  const v = localStorage.getItem(CONSENT_KEY)
  return v === 'accepted' || v === 'rejected' ? v : null
}

/** Fija el consentimiento y avisa a los oyentes (p. ej. Google Analytics). */
export function setConsent(value: 'accepted' | 'rejected') {
  if (typeof window === 'undefined') return
  localStorage.setItem(CONSENT_KEY, value)
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }))
}
