/**
 * Check if running inside Capacitor native app (iOS/Android).
 * Use this to hide payment/pricing features that must go through the web.
 */
export function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false
  return !!(window as any).Capacitor?.isNativePlatform?.()
}
