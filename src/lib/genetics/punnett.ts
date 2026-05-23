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
 * Normalizamos para que la suma de probabilidades sume 100%.
 */

import { LOCI, getLocus, getAllele, type Locus } from './loci'

export interface Genotype {
  locus: string         // 'E', 'K', etc.
  allele1: string
  allele2: string
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

  // 4 combinaciones posibles (cuadrado de Punnett), cada una con prob 25%
  const combinations: [string, string][] = [
    [sire.allele1, dam.allele1],
    [sire.allele1, dam.allele2],
    [sire.allele2, dam.allele1],
    [sire.allele2, dam.allele2],
  ]

  // Agrupar por genotipo (los ordenados son equivalentes: Aa == aA)
  const counts = new Map<string, { allele1: string; allele2: string; count: number }>()
  for (const [a, b] of combinations) {
    const [first, second] = orderAlleles(locus, a, b)
    const key = `${first}|${second}`
    const existing = counts.get(key)
    if (existing) {
      existing.count += 1
    } else {
      counts.set(key, { allele1: first, allele2: second, count: 1 })
    }
  }

  // Convertir a array con probabilidades
  const results: OffspringGenotype[] = []
  for (const { allele1, allele2, count } of counts.values()) {
    const probability = count / 4
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
