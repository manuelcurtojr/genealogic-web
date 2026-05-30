/**
 * "Vistos recientemente" — historial de fichas que el usuario ha abierto
 * (perros, criaderos, razas). Se usa en el slider de /search.
 *
 * Almacenamiento: localStorage (clave RECENT_KEY). Funciona para visitantes y
 * logueados por igual; para logueados, una fase 2 sincronizará con Supabase
 * para que persista entre dispositivos.
 */

export type RecentType = 'dog' | 'kennel' | 'breed'

export interface RecentItem {
  type: RecentType
  /** id o slug — lo que sirva para construir el href de vuelta */
  ref: string
  name: string
  image?: string | null
  /** raza del perro, ciudad del criadero, nº perros de la raza… */
  subtitle?: string | null
  /** epoch ms de la última vez que se vio (para ordenar) */
  ts: number
}

const RECENT_KEY = 'genealogic:recent-views'
const MAX_ITEMS = 16

/** Lee el historial (más reciente primero). Seguro si localStorage falla. */
export function getRecentViews(): RecentItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(RECENT_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return []
    return arr
      .filter((x): x is RecentItem => x && typeof x.ref === 'string' && typeof x.name === 'string')
      .sort((a, b) => (b.ts || 0) - (a.ts || 0))
  } catch {
    return []
  }
}

/**
 * Registra una ficha vista. Dedup por (type, ref): si ya existe, sube su ts.
 * Mantiene como máximo MAX_ITEMS. No-op en SSR o si localStorage falla.
 */
export function recordView(item: Omit<RecentItem, 'ts'>): void {
  if (typeof window === 'undefined') return
  if (!item?.ref || !item?.name) return
  try {
    const now = Date.now()
    const existing = getRecentViews().filter(
      (x) => !(x.type === item.type && x.ref === item.ref),
    )
    const next: RecentItem[] = [{ ...item, ts: now }, ...existing].slice(0, MAX_ITEMS)
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    /* localStorage lleno o bloqueado (modo privado) — ignorar */
  }
}

/** Borra todo el historial. */
export function clearRecentViews(): void {
  if (typeof window === 'undefined') return
  try { window.localStorage.removeItem(RECENT_KEY) } catch { /* noop */ }
}

/** href de vuelta a la ficha. */
export function hrefForRecent(item: RecentItem): string {
  if (item.type === 'dog') return `/dogs/${item.ref}`
  if (item.type === 'kennel') return `/kennels/${item.ref}`
  return `/razas/${item.ref}`
}
