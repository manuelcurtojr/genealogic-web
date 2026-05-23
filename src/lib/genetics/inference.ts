/**
 * Inferencia de genotipo desde observación visual (fenotipo).
 *
 * El criador medio NO tiene test DNA: solo sabe qué color/patrón VE.
 * Esta capa traduce esa observación a alelos compatibles con un nivel
 * de confidence apropiado, para alimentar el forecast de cruces sin
 * exigir tests caros.
 *
 * Notación: '?' = alelo desconocido (puede ser cualquiera del locus).
 */

import type { Genotype } from './punnett'

export interface ColorObservation {
  color_name?: string | null         // nombre del color de la tabla colors (ej. "Bardino rojo")
  coat_length?: 'short' | 'medium' | 'long' | 'wire'
  white_pattern?: 'none' | 'small' | 'parti' | 'piebald'
  has_merle?: boolean
  has_mask?: boolean
  has_tan_points?: boolean
  has_brindle?: boolean              // bardino / brindle / atigrado
  is_diluted?: boolean               // azul, isabella, lilac
}

export interface InferredAllele {
  code: string                       // alelo concreto o '?'
  certain: boolean                   // true = sabemos seguro este alelo está presente
}

export interface InferredGenotype {
  locus: string
  allele1: InferredAllele
  allele2: InferredAllele
  /** Notas humano-legibles de qué se infirió y por qué */
  reasoning: string[]
}

/**
 * Normaliza nombre de color para matching: lowercase, sin acentos
 */
function normalize(s: string | null | undefined): string {
  if (!s) return ''
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

/**
 * Detecta atributos automáticos desde el nombre del color (en castellano)
 * cuando el usuario no ha rellenado los toggles explícitamente.
 */
function detectFromColorName(colorName: string): Partial<ColorObservation> {
  const n = normalize(colorName)
  const detected: Partial<ColorObservation> = {}

  // Merle
  if (n.includes('merle') || n.includes('arlequin')) detected.has_merle = true

  // Atigrado / bardino / brindle
  if (n.includes('atigrad') || n.includes('bardino') || n.includes('brindle')) {
    detected.has_brindle = true
  }

  // Tan points (negro y fuego)
  if (n.includes('fuego') || n.includes('tan')) detected.has_tan_points = true

  // Dilución (azul, isabella, lilac, plateado en algunas razas)
  if (n.includes('azul') || n.includes('isabela') || n.includes('isabella') ||
      n.includes('lila') || n.includes('lilac') || n.includes('platead')) {
    detected.is_diluted = true
  }

  // Parti / piebald / pinto
  if (n.includes('parti') || n.includes('piebald') || n.includes('pinto')) {
    detected.white_pattern = 'piebald'
  } else if (n.includes('bicolor') || n.includes('y blanc') || n.includes('blanco y')) {
    detected.white_pattern = 'parti'
  }

  return detected
}

/**
 * Detecta si el color base implica chocolate (locus B = bb)
 */
function isChocolateBase(colorName: string): boolean {
  const n = normalize(colorName)
  return n.includes('chocolate') || n.includes('marron') || n.includes('higado') || n.includes('lila')
}

/**
 * Detecta si el color base es rojo/cervato/sable/leonado puro (sugiere Ay o ee)
 */
function isRedBase(colorName: string): boolean {
  const n = normalize(colorName)
  return n.includes('rojo') || n.includes('cervato') || n.includes('sable') ||
         n.includes('leonado') || n.includes('canela') || n.includes('apricot') ||
         n.includes('dorado') || n.includes('rubio') || n.includes('trigo') ||
         n.includes('crema') || n.includes('arena')
}

/**
 * Detecta si es negro sólido como base (sin atigrado, sin sable)
 */
function isBlackSolid(colorName: string): boolean {
  const n = normalize(colorName)
  return (n.includes('negro') && !n.includes('fuego') && !n.includes('y blanc') &&
          !n.includes('blanco y negro')) ||
         n === 'negro solido' || n === 'negro puro'
}

/**
 * Función principal: dada una observación, devuelve los genotipos inferidos
 * para cada locus con su confidence y razonamiento.
 */
export function inferGenotype(obs: ColorObservation, breed?: string | null): InferredGenotype[] {
  // Combinar toggles explícitos con detección automática desde nombre
  const auto = obs.color_name ? detectFromColorName(obs.color_name) : {}
  const combined: ColorObservation = {
    ...auto,
    ...obs,
    has_merle: obs.has_merle ?? auto.has_merle ?? false,
    has_brindle: obs.has_brindle ?? auto.has_brindle ?? false,
    has_tan_points: obs.has_tan_points ?? auto.has_tan_points ?? false,
    is_diluted: obs.is_diluted ?? auto.is_diluted ?? false,
    white_pattern: obs.white_pattern ?? auto.white_pattern ?? 'none',
  }

  const colorName = combined.color_name || ''
  const results: InferredGenotype[] = []

  // ── LOCUS E (Extension / pigmento negro) ──────────────────────────────
  {
    const reasoning: string[] = []
    let a1: InferredAllele = { code: '?', certain: false }
    let a2: InferredAllele = { code: '?', certain: false }

    // Si tiene negro visible (atigrado tiene rayas negras, o tan points = negro y fuego)
    const hasBlackPigment = combined.has_brindle || combined.has_tan_points ||
                            isBlackSolid(colorName) || isChocolateBase(colorName)
    if (hasBlackPigment) {
      a1 = { code: 'E', certain: true }
      reasoning.push('Pigmento negro/marrón visible → tiene al menos un alelo E.')
    } else if (isRedBase(colorName) && !combined.has_brindle && !combined.has_tan_points) {
      // Rojo/leonado puro sin negro podría ser ee (rojo recesivo) o Ay puro
      a1 = { code: '?', certain: false }
      reasoning.push('Color base rojo/leonado sin negro visible — puede ser e/e (rojo recesivo) o Ay/?.')
    }
    if (combined.has_mask) {
      a1 = { code: 'Em', certain: true }
      reasoning.push('Máscara facial negra observada → al menos un alelo Em (máscara).')
    }
    results.push({ locus: 'E', allele1: a1, allele2: a2, reasoning })
  }

  // ── LOCUS K ───────────────────────────────────────────────────────────
  {
    const reasoning: string[] = []
    let a1: InferredAllele = { code: '?', certain: false }
    let a2: InferredAllele = { code: '?', certain: false }

    if (combined.has_brindle) {
      a1 = { code: 'kbr', certain: true }
      reasoning.push('Patrón atigrado/bardino observado → al menos un alelo kbr.')
    } else if (combined.has_tan_points) {
      // Tan points solo se expresa si K = ky/ky
      a1 = { code: 'ky', certain: true }
      a2 = { code: 'ky', certain: true }
      reasoning.push('Negro y fuego visible → K = ky/ky (recesivo, deja expresar locus A).')
    } else if (isBlackSolid(colorName)) {
      // Negro sólido puede ser KB/? o ky/ky + a/a. Más probable KB.
      a1 = { code: '?', certain: false }
      reasoning.push('Negro sólido sin patrón visible — probablemente KB/? (sólido dominante), aunque puede ser ky/ky con A=a/a.')
    }
    results.push({ locus: 'K', allele1: a1, allele2: a2, reasoning })
  }

  // ── LOCUS A (Agouti) ──────────────────────────────────────────────────
  {
    const reasoning: string[] = []
    let a1: InferredAllele = { code: '?', certain: false }
    let a2: InferredAllele = { code: '?', certain: false }

    if (combined.has_tan_points) {
      a1 = { code: 'at', certain: true }
      reasoning.push('Negro y fuego visible → al menos un alelo at (tan points).')
    } else if (isRedBase(colorName) && !combined.is_diluted) {
      // Base roja sugiere Ay (sable) si E permite negro, o ee
      a1 = { code: 'Ay', certain: false }
      reasoning.push('Base rojo/cervato/sable visible — probablemente Ay/? (sable) o e/e en locus E.')
    }
    results.push({ locus: 'A', allele1: a1, allele2: a2, reasoning })
  }

  // ── LOCUS B (Brown / chocolate) ───────────────────────────────────────
  {
    const reasoning: string[] = []
    let a1: InferredAllele = { code: '?', certain: false }
    let a2: InferredAllele = { code: '?', certain: false }

    if (isChocolateBase(colorName)) {
      a1 = { code: 'b', certain: true }
      a2 = { code: 'b', certain: true }
      reasoning.push('Color chocolate/marrón/hígado/lila → b/b (homocigoto recesivo).')
    } else if (isBlackSolid(colorName) || combined.has_brindle || combined.has_tan_points) {
      a1 = { code: 'B', certain: true }
      reasoning.push('Pigmento negro visible (no chocolate) → al menos un alelo B.')
    }
    results.push({ locus: 'B', allele1: a1, allele2: a2, reasoning })
  }

  // ── LOCUS D (Dilución) ────────────────────────────────────────────────
  {
    const reasoning: string[] = []
    let a1: InferredAllele = { code: '?', certain: false }
    let a2: InferredAllele = { code: '?', certain: false }

    if (combined.is_diluted) {
      a1 = { code: 'd', certain: true }
      a2 = { code: 'd', certain: true }
      reasoning.push('Color diluido (azul/isabella/lila) → d/d (homocigoto recesivo).')
    } else {
      // No diluido: tiene al menos un D, pero puede ser portador
      a1 = { code: 'D', certain: true }
      a2 = { code: '?', certain: false }
      reasoning.push('No diluido visible → al menos un alelo D. Puede ser portador oculto (D/d).')
    }
    results.push({ locus: 'D', allele1: a1, allele2: a2, reasoning })
  }

  // ── LOCUS M (Merle) ───────────────────────────────────────────────────
  {
    const reasoning: string[] = []
    let a1: InferredAllele = { code: '?', certain: false }
    let a2: InferredAllele = { code: '?', certain: false }

    if (combined.has_merle) {
      a1 = { code: 'M', certain: true }
      a2 = { code: 'm', certain: true }
      reasoning.push('Patrón merle visible → M/m (heterocigoto). Si fuera M/M sería doble merle con riesgo de salud.')
    } else {
      // No merle visible: m/m (excepto raros casos cryptic merle no detectables sin DNA)
      a1 = { code: 'm', certain: true }
      a2 = { code: 'm', certain: true }
      reasoning.push('Sin merle visible → m/m (no merle).')
    }
    results.push({ locus: 'M', allele1: a1, allele2: a2, reasoning })
  }

  // ── LOCUS S (Manchas blancas) ─────────────────────────────────────────
  {
    const reasoning: string[] = []
    let a1: InferredAllele = { code: '?', certain: false }
    let a2: InferredAllele = { code: '?', certain: false }

    const wp = combined.white_pattern || 'none'
    if (wp === 'piebald') {
      a1 = { code: 'sp', certain: true }
      a2 = { code: 'sp', certain: true }
      reasoning.push('Patrón piebald/parti/pinto extenso → sp/sp.')
    } else if (wp === 'parti') {
      a1 = { code: 'sp', certain: false }
      reasoning.push('Manchas blancas extensas → posible sp/sp o S/sp.')
    } else if (wp === 'small' || wp === 'none') {
      a1 = { code: 'S', certain: true }
      reasoning.push('Sin manchas blancas grandes → al menos un alelo S. Puede ser portador (S/sp).')
    }
    results.push({ locus: 'S', allele1: a1, allele2: a2, reasoning })
  }

  // ── LOCUS L (Longitud de pelo) ────────────────────────────────────────
  {
    const reasoning: string[] = []
    let a1: InferredAllele = { code: '?', certain: false }
    let a2: InferredAllele = { code: '?', certain: false }

    const cl = combined.coat_length || 'short'
    if (cl === 'long') {
      a1 = { code: 'l', certain: true }
      a2 = { code: 'l', certain: true }
      reasoning.push('Pelo largo → l/l (homocigoto recesivo).')
    } else if (cl === 'short' || cl === 'wire') {
      a1 = { code: 'L', certain: true }
      reasoning.push('Pelo corto → al menos un alelo L. Puede ser portador de pelo largo (L/l).')
    } else {
      a1 = { code: 'L', certain: false }
      reasoning.push('Longitud media — probablemente L/? (depende de raza).')
    }
    results.push({ locus: 'L', allele1: a1, allele2: a2, reasoning })
  }

  return results
}

/**
 * Convierte InferredGenotype[] al formato Genotype[] usado por punnett.ts,
 * usando '?' para alelos desconocidos.
 */
export function inferredToGenotypes(inferred: InferredGenotype[]): Genotype[] {
  return inferred
    .filter((i) => i.allele1.code !== '?' || i.allele2.code !== '?')
    .map((i) => ({
      locus: i.locus,
      allele1: i.allele1.code,
      allele2: i.allele2.code,
    }))
}
