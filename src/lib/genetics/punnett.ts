/**
 * Cálculo Mendeliano de cruces (Punnett squares) para forecast de camadas.
 *
 * Dado un genotipo del padre (sire) y la madre (dam) en un locus concreto,
 * devuelve la distribución de probabilidades de los genotipos resultantes
 * en los cachorros (descendientes F1).
 *
 * Modelo: cada locus tiene 2 alelos por individuo. En la gametogénesis,
 * cada padre aporta UNO de sus 2 alelos al azar (50/50). Por tanto los
 * posibles genotipos de un cachorro son 4 combinaciones (cuadrado de
 * Punnett): sireA×damA, sireA×damB, sireB×damA, sireB×damB.
 *
 * Soporta alelos desconocidos '?': cuando un padre tiene incertidumbre
 * en un alelo, se expande considerando que '?' puede ser cualquiera de
 * los alelos del locus con probabilidad uniforme (modelo conservador).
 *
 * Normalizamos para que la suma de probabilidades sume 100%.
 */

import { LOCI, getLocus, getAllele, type Locus } from './loci'

export interface Genotype {
  locus: string         // 'E', 'K', etc.
  allele1: string       // alelo o '?'
  allele2: string       // alelo o '?'
}

export interface OffspringGenotype {
  locus: string
  allele1: string       // ordenado por dominancia (más dominante primero)
  allele2: string
  probability: number   // 0..1
  /** Descripción legible del genotipo y su fenotipo aproximado */
  label: string
  isWarning: boolean    // true si requiere atención (ej. MM doble merle)
}

/** Ordena dos alelos por dominancia (más dominante primero) */
function orderAlleles(locus: Locus, a: string, b: string): [string, string] {
  const rankA = locus.alleles.find((al) => al.code === a)?.dominanceRank ?? 99
  const rankB = locus.alleles.find((al) => al.code === b)?.dominanceRank ?? 99
  return rankA <= rankB ? [a, b] : [b, a]
}

/**
 * Expande un alelo: si es '?' devuelve todos los alelos posibles del locus
 * con peso 1/N cada uno. Si es concreto, devuelve [(alelo, 1.0)].
 */
function expandAllele(locus: Locus, allele: string): { code: string; weight: number }[] {
  if (allele !== '?' && allele !== '') {
    return [{ code: allele, weight: 1 }]
  }
  // Desconocido: cualquier alelo posible, peso uniforme
  const all = locus.alleles
  return all.map((a) => ({ code: a.code, weight: 1 / all.length }))
}

/**
 * Cruza dos genotipos del mismo locus y devuelve la distribución de
 * los 3-4 genotipos posibles en los cachorros (ordenado por probabilidad).
 */
export function crossLocus(sire: Genotype, dam: Genotype): OffspringGenotype[] {
  if (sire.locus !== dam.locus) {
    throw new Error('Locus must match for sire and dam')
  }
  const locus = getLocus(sire.locus)
  if (!locus) {
    throw new Error(`Unknown locus: ${sire.locus}`)
  }

  // Expandir alelos (soporta '?' = desconocido)
  const sire1 = expandAllele(locus, sire.allele1)
  const sire2 = expandAllele(locus, sire.allele2)
  const dam1 = expandAllele(locus, dam.allele1)
  const dam2 = expandAllele(locus, dam.allele2)

  // Cada padre aporta uno de sus 2 alelos al azar (50/50).
  // Construir distribución del aporte de cada padre.
  const sireGametes = new Map<string, number>()
  for (const a of sire1) sireGametes.set(a.code, (sireGametes.get(a.code) || 0) + 0.5 * a.weight)
  for (const a of sire2) sireGametes.set(a.code, (sireGametes.get(a.code) || 0) + 0.5 * a.weight)

  const damGametes = new Map<string, number>()
  for (const a of dam1) damGametes.set(a.code, (damGametes.get(a.code) || 0) + 0.5 * a.weight)
  for (const a of dam2) damGametes.set(a.code, (damGametes.get(a.code) || 0) + 0.5 * a.weight)

  // Producto cartesiano: probabilidad de cada combinación cachorro
  const counts = new Map<string, { allele1: string; allele2: string; weight: number }>()
  for (const [sa, sp] of sireGametes.entries()) {
    for (const [da, dp] of damGametes.entries()) {
      const [first, second] = orderAlleles(locus, sa, da)
      const key = `${first}|${second}`
      const w = sp * dp
      const existing = counts.get(key)
      if (existing) {
        existing.weight += w
      } else {
        counts.set(key, { allele1: first, allele2: second, weight: w })
      }
    }
  }

  // Normalizar a suma 1
  let totalWeight = 0
  for (const v of counts.values()) totalWeight += v.weight
  if (totalWeight === 0) totalWeight = 1

  // Convertir a array con probabilidades
  const results: OffspringGenotype[] = []
  for (const { allele1, allele2, weight } of counts.values()) {
    const probability = weight / totalWeight
    const a1 = getAllele(locus.code, allele1)
    const a2 = getAllele(locus.code, allele2)
    const label = `${a1?.code || allele1}/${a2?.code || allele2}`
    const isWarning = locus.code === 'M' && allele1 === 'M' && allele2 === 'M'
    results.push({
      locus: locus.code,
      allele1,
      allele2,
      probability,
      label,
      isWarning,
    })
  }

  // Ordenar por probabilidad descendente
  results.sort((a, b) => b.probability - a.probability)
  return results
}

export interface CrossResult {
  locus: Locus
  outcomes: OffspringGenotype[]
  /** Resumen humano-legible del riesgo si existe */
  warning?: string
}

/**
 * Cruza todos los loci disponibles para sire+dam.
 * Devuelve un array de resultados por locus.
 * Si un locus no tiene datos de uno de los dos padres, lo omite.
 */
export function crossAllLoci(
  sireGenotypes: Genotype[],
  damGenotypes: Genotype[],
): CrossResult[] {
  const results: CrossResult[] = []

  for (const locus of LOCI) {
    const sireG = sireGenotypes.find((g) => g.locus === locus.code)
    const damG = damGenotypes.find((g) => g.locus === locus.code)
    if (!sireG || !damG) continue

    const outcomes = crossLocus(sireG, damG)

    // Detección de warnings
    let warning: string | undefined
    if (locus.code === 'M') {
      const doubleMerleProb = outcomes.find((o) => o.allele1 === 'M' && o.allele2 === 'M')?.probability || 0
      if (doubleMerleProb > 0) {
        warning = `⚠️ Riesgo de doble merle: ${Math.round(doubleMerleProb * 100)}% de los cachorros pueden ser MM (alto riesgo de sordera y ceguera). Se desaconseja fuertemente este cruce.`
      }
    }
    if (locus.code === 'B') {
      const bbProb = outcomes.find((o) => o.allele1 === 'b' && o.allele2 === 'b')?.probability || 0
      if (bbProb > 0) {
        // Solo nota informativa, no warning crítico
      }
    }

    results.push({ locus, outcomes, warning })
  }

  return results
}

/**
 * ¿Hay datos genéticos suficientes en ambos padres para hacer al menos un forecast?
 */
export function hasAnyOverlap(sire: Genotype[], dam: Genotype[]): boolean {
  const sireLoci = new Set(sire.map((g) => g.locus))
  return dam.some((g) => sireLoci.has(g.locus))
}
