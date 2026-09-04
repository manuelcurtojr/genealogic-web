/**
 * Multi-cuenta (estilo YouTube/Instagram): guarda las sesiones de varias
 * cuentas de Genealogic en el navegador para cambiar entre ellas sin volver a
 * introducir la contraseña.
 *
 * Se guarda en localStorage porque el cambio de cuenta ocurre en el cliente
 * (supabase.auth.setSession con el par de tokens). Es el patrón habitual de
 * apps multi-cuenta con Supabase. Trade-off: los refresh tokens quedan en el
 * navegador; por eso `clearAccounts()` se llama al cerrar sesión del todo.
 *
 * Solo funciona en el cliente (typeof window). Todo va envuelto en try/catch:
 * en modo incógnito o con el almacenamiento bloqueado, degrada a "sin cuentas
 * guardadas" en vez de romper la barra superior.
 */
export type SavedAccount = {
  userId: string
  email: string
  name: string
  avatarUrl: string | null
  access_token: string
  refresh_token: string
  /** epoch ms del último guardado — para desempatar/ordenar si hiciera falta. */
  savedAt: number
}

const KEY = 'genealogic:accounts'

function read(): SavedAccount[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? (list as SavedAccount[]).filter((a) => a && a.userId && a.refresh_token) : []
  } catch {
    return []
  }
}

function write(list: SavedAccount[]): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    /* almacenamiento no disponible → no-op */
  }
}

export function getSavedAccounts(): SavedAccount[] {
  return read()
}

/** Añade la cuenta o actualiza sus tokens/datos si ya existía (sin reordenar). */
export function upsertAccount(acc: SavedAccount): void {
  const list = read()
  const i = list.findIndex((a) => a.userId === acc.userId)
  if (i >= 0) list[i] = acc
  else list.push(acc)
  write(list)
}

export function removeAccount(userId: string): void {
  write(read().filter((a) => a.userId !== userId))
}

export function clearAccounts(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    /* no-op */
  }
}
