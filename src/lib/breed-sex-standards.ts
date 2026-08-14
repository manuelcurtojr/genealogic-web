/**
 * Referencias por SEXO de los rasgos morfológicos dimórficos y medibles, para
 * proyectar un cruce por sexo (macho proyectado / hembra proyectada) en vez de
 * una media plana que no representa a ninguno de los dos.
 *
 * Por qué: el peso y la alzada tienen dimorfismo sexual marcado (el macho sale
 * más grande y masivo). La media mid-parent predice la media del CONJUNTO de la
 * camada, que cae en el hueco entre machos y hembras. Lo correcto es estandarizar
 * respecto a la media de cada sexo, promediar esa desviación y re-aplicar la media
 * del sexo objetivo (ver projectBySex).
 *
 * Solo se incluyen rasgos con referencia por sexo defendible en el estándar. El
 * resto de medidas (perímetros, cabeza, etc.) NO se proyecta por sexo: se deja
 * como media familiar, porque el estándar no da norma por sexo y no vamos a
 * inventar factores (falsa precisión).
 *
 * Keyed por breeds.id. Para añadir una raza: mete su id y sus rangos por sexo.
 * Sin 'use client': se usa en el componente (UI) y en la ruta /api/cross-rating.
 */

export type SexRange = { min: number; max: number }
export type SexTraitRef = { m: SexRange; f: SexRange }

export const BREED_SEX_STANDARDS: Record<string, Record<string, SexTraitRef>> = {
  // ── Presa Canario (FCI 346) ──────────────────────────────────────────────
  '3cc9ea09-fd89-442f-ae8c-03ace2fc2b2d': {
    // Alzada a la cruz: rangos exactos del estándar FCI.
    height_withers_cm: { m: { min: 60, max: 66 }, f: { min: 56, max: 62 } },
    // Alzada a la grupa: el estándar no la acota; grupa ≈ cruz +1 (práctica de cría).
    height_rump_cm: { m: { min: 61, max: 67 }, f: { min: 57, max: 63 } },
    // Peso: el FCI solo fija mínimo (machos 50, hembras 40). Banda práctica para
    // tener un centro con el que proyectar; el mínimo del estándar sigue siendo el suelo.
    weight_kg: { m: { min: 50, max: 65 }, f: { min: 40, max: 55 } },
  },
}

/** Devuelve las referencias por sexo de una raza, o null si no las tenemos. */
export function sexStandardFor(
  breedId: string | null | undefined,
): Record<string, SexTraitRef> | null {
  if (!breedId) return null
  return BREED_SEX_STANDARDS[breedId] ?? null
}

/**
 * Proyección por sexo (estandarización por desviación respecto a la media de
 * cada sexo). Elimina el dimorfismo, promedia la desviación genética de los
 * progenitores y la re-aplica a la media de cada sexo:
 *
 *   desv = [(padre − media_machos) + (madre − media_hembras)] / 2
 *   macho  = media_machos  + desv
 *   hembra = media_hembras + desv
 *
 * `sire` es el valor del padre (macho); `dam` el de la madre (hembra).
 */
export function projectBySex(
  sire: number,
  dam: number,
  ref: SexTraitRef,
): { male: number; female: number } {
  const mMid = (ref.m.min + ref.m.max) / 2
  const fMid = (ref.f.min + ref.f.max) / 2
  const dev = (sire - mMid + (dam - fMid)) / 2
  return {
    male: Math.round((mMid + dev) * 10) / 10,
    female: Math.round((fMid + dev) * 10) / 10,
  }
}
