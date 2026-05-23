/**
 * Definiciones de loci genéticos caninos.
 *
 * Cada locus controla una característica visible (color, patrón, longitud
 * de pelo, etc). Los alelos están ordenados por DOMINANCIA — el primero es
 * el más dominante, el último el más recesivo.
 *
 * Convención de alelos:
 *   - MAYÚSCULA o seguido de subíndice/sufijo = dominante
 *   - minúscula = recesivo
 *
 * Notación basada en la convención científica usada por Embark, UC Davis VGL
 * y la mayoría de la literatura canina moderna.
 */

export interface Allele {
  code: string         // ej. 'E', 'e', 'Em'
  name: string         // legible en castellano
  description?: string
  dominanceRank: number // 1 = más dominante; mayor = más recesivo
}

export interface Locus {
  code: string         // 'E', 'K', etc.
  name: string         // nombre legible
  description: string
  category: 'color' | 'pattern' | 'coat'
  alleles: Allele[]
  /** Notas para el criador */
  notes?: string
}

export const LOCI: Locus[] = [
  {
    code: 'E',
    name: 'Locus E (Extensión)',
    description: 'Controla si el perro puede expresar pigmento negro o solo rojo/amarillo.',
    category: 'color',
    alleles: [
      { code: 'Em', name: 'Em (Máscara)', description: 'Máscara facial negra dominante', dominanceRank: 1 },
      { code: 'Eg', name: 'Eg (Grizzle)', description: 'Patrón grizzle/dominio agouti', dominanceRank: 2 },
      { code: 'E', name: 'E (Normal)', description: 'Permite pigmento negro normal', dominanceRank: 3 },
      { code: 'e', name: 'e (Rojo recesivo)', description: 'Solo rojo/amarillo, oculta negro', dominanceRank: 4 },
    ],
    notes: 'ee = solo rojo/amarillo aunque tenga genes para negro. Común en Goldens y Labradors amarillos.',
  },
  {
    code: 'K',
    name: 'Locus K',
    description: 'Determina si el perro es color sólido, atigrado, o expresa el patrón Agouti.',
    category: 'pattern',
    alleles: [
      { code: 'KB', name: 'KB (Sólido)', description: 'Negro/color sólido dominante', dominanceRank: 1 },
      { code: 'kbr', name: 'kbr (Atigrado/Brindle)', description: 'Patrón atigrado', dominanceRank: 2 },
      { code: 'ky', name: 'ky (Permite Agouti)', description: 'Recesivo; permite expresar patrón A', dominanceRank: 3 },
    ],
    notes: 'Solo si KK = kyky se expresa el patrón del locus A.',
  },
  {
    code: 'A',
    name: 'Locus A (Agouti)',
    description: 'Distribución del pigmento. Solo visible cuando K = kyky.',
    category: 'pattern',
    alleles: [
      { code: 'Ay', name: 'Ay (Sable/Cervato)', description: 'Sable rojo/cervato dominante', dominanceRank: 1 },
      { code: 'aw', name: 'aw (Agouti salvaje)', description: 'Agouti tipo lobo', dominanceRank: 2 },
      { code: 'at', name: 'at (Negro y fuego)', description: 'Tan points', dominanceRank: 3 },
      { code: 'a', name: 'a (Negro recesivo)', description: 'Negro sólido recesivo', dominanceRank: 4 },
    ],
  },
  {
    code: 'B',
    name: 'Locus B (Brown)',
    description: 'Diluye el pigmento negro a chocolate/marrón/hígado.',
    category: 'color',
    alleles: [
      { code: 'B', name: 'B (Negro)', description: 'No diluye', dominanceRank: 1 },
      { code: 'b', name: 'b (Marrón/Chocolate)', description: 'Diluye negro → marrón', dominanceRank: 2 },
    ],
    notes: 'bb produce chocolate/hígado. Combinado con dd produce isabella/lilac.',
  },
  {
    code: 'D',
    name: 'Locus D (Dilución)',
    description: 'Diluye el color base a tonos más claros (azul/isabella).',
    category: 'color',
    alleles: [
      { code: 'D', name: 'D (Normal)', description: 'No diluye', dominanceRank: 1 },
      { code: 'd', name: 'd (Diluido)', description: 'Diluye color a azul/isabella', dominanceRank: 2 },
    ],
    notes: 'dd + negro = azul. dd + chocolate = isabella/lilac. Asociado a Color Dilution Alopecia (CDA) en algunas razas.',
  },
  {
    code: 'M',
    name: 'Locus M (Merle)',
    description: 'Produce patrón merle/arlequín. ⚠️ Cruce M×M produce 25% doble merle (riesgo sordera/ceguera).',
    category: 'pattern',
    alleles: [
      { code: 'M', name: 'M (Merle)', description: 'Patrón merle dominante', dominanceRank: 1 },
      { code: 'm', name: 'm (No merle)', description: 'Sin merle', dominanceRank: 2 },
    ],
    notes: '⚠️ CRÍTICO: NUNCA cruzar M × M. El 25% MM (doble merle) tiene riesgo alto de sordera, ceguera y otros problemas.',
  },
  {
    code: 'S',
    name: 'Locus S (Manchas blancas)',
    description: 'Cantidad de blanco / patrón parti/piebald.',
    category: 'pattern',
    alleles: [
      { code: 'S', name: 'S (Sólido)', description: 'Sin manchas blancas grandes', dominanceRank: 1 },
      { code: 'sp', name: 'sp (Piebald/Parti)', description: 'Manchas blancas extensas', dominanceRank: 2 },
    ],
  },
  {
    code: 'L',
    name: 'Locus L (Longitud)',
    description: 'Longitud del pelo: corto (dominante) vs largo (recesivo).',
    category: 'coat',
    alleles: [
      { code: 'L', name: 'L (Pelo corto)', description: 'Pelo corto dominante', dominanceRank: 1 },
      { code: 'l', name: 'l (Pelo largo)', description: 'Pelo largo recesivo', dominanceRank: 2 },
    ],
    notes: 'll = pelo largo. Visible en variantes "long coat" de razas mayoritariamente cortas.',
  },
]

export function getLocus(code: string): Locus | undefined {
  return LOCI.find((l) => l.code === code)
}

export function getAllele(locusCode: string, alleleCode: string): Allele | undefined {
  const locus = getLocus(locusCode)
  return locus?.alleles.find((a) => a.code === alleleCode)
}
