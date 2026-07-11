/**
 * Traduce errores crudos de Postgres/Supabase a mensajes humanos en español.
 *
 * Motivo (QA 2026-07-11): al fallar un insert, la UI mostraba literalmente
 * "new row violates row-level security policy for table dogs" — críptico y
 * en inglés. Un criador no técnico no puede hacer nada con eso.
 *
 * Uso: setError(friendlyDbError(err.message)) en vez de setError(err.message).
 * Los errores de negocio propios (DOG_LIMIT_REACHED, etc.) se tratan ANTES
 * de llamar aquí, porque tienen copy específico.
 */
export function friendlyDbError(
  raw: string | null | undefined,
  fallback = 'No se pudo guardar. Inténtalo de nuevo y, si sigue pasando, escríbenos a hola@genealogic.io.'
): string {
  const msg = (raw || '').toLowerCase()
  if (!msg) return fallback
  if (msg.includes('row-level security') || msg.includes('permission denied')) {
    return 'Tu sesión no tiene permiso para hacer esto. Recarga la página e inténtalo de nuevo — si sigue pasando, cierra sesión y vuelve a entrar.'
  }
  if (msg.includes('duplicate key') || msg.includes('already exists')) {
    return 'Ya existe un registro con esos datos (nombre o identificador duplicado). Cambia el nombre e inténtalo de nuevo.'
  }
  if (msg.includes('violates foreign key')) {
    return 'Uno de los datos seleccionados ya no existe (quizá se borró en otra pestaña). Recarga la página e inténtalo de nuevo.'
  }
  if (msg.includes('network') || msg.includes('failed to fetch') || msg.includes('fetch failed')) {
    return 'No hay conexión con el servidor. Comprueba tu internet e inténtalo de nuevo.'
  }
  if (msg.includes('jwt') || msg.includes('not authenticated') || msg.includes('invalid token')) {
    return 'Tu sesión ha caducado. Recarga la página o vuelve a iniciar sesión.'
  }
  return fallback
}
