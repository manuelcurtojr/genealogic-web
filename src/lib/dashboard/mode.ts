/**
 * Modos de escritorio del criador (presets curados). El usuario elige el
 * enfoque y el escritorio se recompone. El modo se persiste en una cookie
 * (legible por el server component del dashboard) para renderizar solo los
 * bloques de ese modo. Solo aplica a criadores; los propietarios tienen su
 * propia vista.
 */
export type DashboardMode = 'negocio' | 'cria' | 'ejemplares' | 'agenda'

export const DASHBOARD_MODES: DashboardMode[] = ['negocio', 'cria', 'ejemplares', 'agenda']

export const DASHBOARD_MODE_COOKIE = 'dashboard-mode'

export const DASHBOARD_MODE_LABELS: Record<DashboardMode, string> = {
  negocio: 'Negocio',
  cria: 'Cría',
  ejemplares: 'Ejemplares',
  agenda: 'Agenda',
}

export function normalizeMode(v: string | null | undefined): DashboardMode {
  return DASHBOARD_MODES.includes(v as DashboardMode) ? (v as DashboardMode) : 'negocio'
}
