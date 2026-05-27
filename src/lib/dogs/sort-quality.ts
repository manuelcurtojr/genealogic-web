/**
 * sortDogsByPhotoQuality — ordena perros priorizando los mejor presentados.
 *
 * Heurística (sin metadata de calidad real de imagen):
 *  1) Perros con MÚLTIPLES fotos en galería (dog_photos.count ≥ 2): los más
 *     curados, suelen tener mejor presentación.
 *  2) Perros con 1 foto en galería (además de thumbnail).
 *  3) Perros con solo thumbnail_url.
 *  4) Perros sin foto.
 *
 * Dentro de cada grupo, mantiene el orden de entrada (suele venir por name
 * o created_at desde el caller).
 *
 * El caller pasa un map { dogId → photoCount } con la cuenta de dog_photos
 * de cada perro. La query que computa ese map vive cacheada dentro del
 * bloque `getKennelHomeData` (TTL 120s), así que no penaliza visitas
 * repetidas.
 */

type DogLike = {
  id: string
  thumbnail_url: string | null
  [k: string]: unknown
}

export function sortDogsByPhotoQuality<T extends DogLike>(
  dogs: T[],
  photoCount: Record<string, number>,
): T[] {
  function score(d: T): number {
    const count = photoCount[d.id] || 0
    if (count >= 2) return 3
    if (count === 1) return 2
    if (d.thumbnail_url) return 1
    return 0
  }
  return [...dogs].sort((a, b) => score(b) - score(a))
}
