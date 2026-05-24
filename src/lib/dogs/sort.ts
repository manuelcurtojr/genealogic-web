/**
 * Orden estable que pone primero los perros CON foto.
 *
 * Filosofía: en cualquier listado público o interno de perros (web del
 * criador, dashboard, mis perros, sección descendencia, etc.) queremos
 * que el primer pantallazo no muestre cajas vacías. Las fotos venden;
 * los placeholders son ruido.
 *
 * Mantiene el orden relativo dentro de cada grupo (sort estable de JS).
 * Aceptamos cualquier objeto con un campo `thumbnail_url` opcional.
 */
export function sortDogsPhotoFirst<T extends { thumbnail_url?: string | null }>(
  dogs: T[],
): T[] {
  return [...dogs].sort((a, b) => {
    const aHas = !!a.thumbnail_url
    const bHas = !!b.thumbnail_url
    if (aHas === bHas) return 0
    return aHas ? -1 : 1
  })
}
