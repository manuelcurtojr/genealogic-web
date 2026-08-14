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
    // Alzada a la cruz: rango exacto del estándar cargado (♂ 61-66, ♀ 57-62).
    height_withers_cm: { m: { min: 61, max: 66 }, f: { min: 57, max: 62 } },
    // Alzada a la grupa: el estándar la sitúa ~1,5 cm por encima de la cruz
    // (igualdad grupa-cruz = falta leve).
    height_rump_cm: { m: { min: 62.5, max: 67.5 }, f: { min: 58.5, max: 63.5 } },
    // Peso: "media" del estándar (♂ 45-57, ♀ 40-50). Es una media orientativa, no un
    // tope rígido: la masa/sustancia por encima, si es proporcionada, es deseable
    // (ver BREEDER_CRITERIA en cross-eval.ts).
    weight_kg: { m: { min: 45, max: 57 }, f: { min: 40, max: 50 } },
  },
}

// ── Índices morfológicos (proporciones del estándar) ─────────────────────────
/**
 * Rasgos que el estándar define como PROPORCIÓN, no en cm absolutos. Se juzgan
 * como cociente numCol/denCol contra un objetivo. Ej.: el perímetro torácico del
 * Presa = alzada + 1/3 (≈1,33×), deseablemente superior → índice torácico. Juzgar
 * el tórax en cm sueltos es un error: depende de la alzada del perro.
 */
export type BreedIndex = {
  key: string
  label: string
  numCol: string
  denCol: string
  min?: number
  max?: number
  moreIsBetter?: boolean // "deseablemente superior": pasarse del objetivo es bueno
  note: string
}

export const BREED_INDICES: Record<string, BreedIndex[]> = {
  // ── Presa Canario ─────────────────────────────────────────────────────────
  '3cc9ea09-fd89-442f-ae8c-03ace2fc2b2d': [
    {
      key: 'thorax',
      label: 'Índice torácico (perímetro torácico ÷ alzada a la cruz)',
      numCol: 'chest_girth_cm',
      denCol: 'height_withers_cm',
      min: 1.33,
      moreIsBetter: true,
      note: 'El estándar pide perímetro torácico = alzada + 1/3 (≈1,33×), deseablemente SUPERIOR. Un tórax amplio y profundo es sustancia deseable, no un exceso a penalizar.',
    },
    {
      key: 'body',
      label: 'Índice corporal (longitud de tronco ÷ alzada a la cruz)',
      numCol: 'body_length_cm',
      denCol: 'height_withers_cm',
      min: 1.1,
      max: 1.12,
      note: 'Mesomorfo: tronco 10-12% más largo que la alzada. Por debajo = aspecto agalgado (falta grave); muy por encima = bajo y largo.',
    },
    {
      key: 'skull_face',
      label: 'Proporción de la cara (longitud de morro ÷ longitud total de cabeza)',
      numCol: 'muzzle_length_cm',
      denCol: 'head_length_cm',
      min: 0.38,
      max: 0.42,
      note: 'Cráneo-cara 6:4 → la cara ≈40% de la cabeza; el morro es más corto que el cráneo.',
    },
  ],
}

/** Índices morfológicos definidos para una raza, o null si no hay. */
export function indicesFor(breedId?: string | null): BreedIndex[] | null {
  if (!breedId) return null
  return BREED_INDICES[breedId] ?? null
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
