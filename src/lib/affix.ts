export const AFFIX_FORMATS = [
  { value: 'suffix_de', label: 'Nombre de Criadero', example: 'Pablo de Demo Kennels', preposition: 'de' },
  { value: 'suffix_of', label: 'Nombre of Criadero', example: 'Pablo of Demo Kennels', preposition: 'of' },
  { value: 'suffix_von', label: 'Nombre von Criadero', example: 'Pablo von Demo Kennels', preposition: 'von' },
  { value: 'suffix_du', label: 'Nombre du Criadero', example: 'Pablo du Demo Kennels', preposition: 'du' },
  { value: 'suffix_del', label: 'Nombre del Criadero', example: 'Pablo del Demo Kennels', preposition: 'del' },
  { value: 'suffix_di', label: 'Nombre di Criadero', example: 'Pablo di Demo Kennels', preposition: 'di' },
  { value: 'suffix_vom', label: 'Nombre vom Criadero', example: 'Pablo vom Demo Kennels', preposition: 'vom' },
  { value: 'prefix_possessive', label: "Criadero's Nombre", example: "Demo Kennels's Pablo", preposition: "'s" },
  { value: 'prefix_direct', label: 'Criadero Nombre', example: 'Demo Kennels Pablo', preposition: '' },
] as const

export type AffixFormat = typeof AFFIX_FORMATS[number]['value']

export function formatDogName(puppyName: string, kennelName: string, format: AffixFormat): string {
  if (!puppyName || !kennelName) return puppyName

  switch (format) {
    case 'suffix_de':  return `${puppyName} de ${kennelName}`
    case 'suffix_of':  return `${puppyName} of ${kennelName}`
    case 'suffix_von': return `${puppyName} von ${kennelName}`
    case 'suffix_du':  return `${puppyName} du ${kennelName}`
    case 'suffix_del': return `${puppyName} del ${kennelName}`
    case 'suffix_di':  return `${puppyName} di ${kennelName}`
    case 'suffix_vom': return `${puppyName} vom ${kennelName}`
    case 'prefix_possessive': return `${kennelName}'s ${puppyName}`
    case 'prefix_direct': return `${kennelName} ${puppyName}`
    default: return `${puppyName} de ${kennelName}`
  }
}

export function getAffixPreview(format: AffixFormat, kennelName: string): string {
  const name = 'Pablo'
  return formatDogName(name, kennelName || 'Criadero', format)
}

// Extract the personal name from a full dog name by stripping any kennel affix
// "Mito de Irema Curtó" → "Mito"
// "IREMA CURTO's Mito" → "Mito"
// "IREMA CURTO Mito" → harder to detect, returns full name if ambiguous
export function extractPersonalName(fullName: string, kennelName?: string): string {
  const name = fullName.trim()

  // Try suffix patterns: "Name de/of/von/du/del/vom Kennel"
  for (const prep of ['de', 'of', 'von', 'du', 'del', 'vom']) {
    const regex = new RegExp(`^(.+?)\\s+${prep}\\s+.+$`, 'i')
    const match = name.match(regex)
    if (match) return match[1].trim()
  }

  // Try possessive prefix: "Kennel's Name"
  const possMatch = name.match(/^.+'s\s+(.+)$/i)
  if (possMatch) return possMatch[1].trim()

  // If kennel name provided, try removing it from start or end
  if (kennelName) {
    const kn = kennelName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const nl = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (nl.endsWith(kn)) return name.slice(0, name.length - kennelName.length).trim()
    if (nl.startsWith(kn)) return name.slice(kennelName.length).trim()
  }

  return name
}

// Conectores de sufijo reconocidos al PARSEAR (orden: variantes largas primero).
// No se "limpia" el artículo (la/der/los) — se deja en el afijo para que al
// re-aplicar con formatDogName el nombre vuelva idéntico ("de la Esperanza").
const PARSE_PREPS: { re: RegExp; format: AffixFormat }[] = [
  { re: /^(.+?)\s+(?:della|delle|degli|dei|del)\s+(.+)$/i, format: 'suffix_del' },
  { re: /^(.+?)\s+vom\s+(.+)$/i, format: 'suffix_vom' },
  { re: /^(.+?)\s+von\s+(.+)$/i, format: 'suffix_von' },
  { re: /^(.+?)\s+du\s+(.+)$/i, format: 'suffix_du' },
  { re: /^(.+?)\s+di\s+(.+)$/i, format: 'suffix_di' },
  { re: /^(.+?)\s+de\s+(.+)$/i, format: 'suffix_de' },
  { re: /^(.+?)\s+of\s+(.+)$/i, format: 'suffix_of' },
]

/**
 * Separa el nombre de un perro en {base, affix, format} detectando el afijo del
 * criadero. "Rebeca de Irema Curtó" → { base:'Rebeca', affix:'Irema Curtó',
 * format:'suffix_de' }. "Nora d'Hen Tankos" → afijo "Hen Tankos". Si no hay
 * afijo reconocible → { base:name, affix:null, format:null } (no se inventa nada).
 * El `format` re-aplica idéntico con formatDogName (no se limpian artículos).
 */
export function parseAffix(fullName: string): { base: string; affix: string | null; format: AffixFormat | null } {
  const name = (fullName || '').trim()
  if (!name) return { base: name, affix: null, format: null }
  // Conectores normales PRIMERO: así "Sirio de l'Argenteria" parte por "de"
  // (afijo "l'Argenteria") y no por el "l'" del artículo.
  for (const { re, format } of PARSE_PREPS) {
    const m = name.match(re)
    if (m && m[1].trim() && m[2].trim()) return { base: m[1].trim(), affix: m[2].trim(), format }
  }
  // Apóstrofo como conector: "X d'Hen Tankos", "X dell'Alta Tuscia".
  const apos = name.match(/^(.+?)\s+(?:d|dell|l|all|degl|nell)['’]\s*(.+)$/i)
  if (apos && apos[1].trim() && apos[2].trim()) return { base: apos[1].trim(), affix: apos[2].trim(), format: 'suffix_de' }
  // Prefijo posesivo: "Kennel's Name".
  const poss = name.match(/^(.+?)['’]s\s+(.+)$/i)
  if (poss && poss[1].trim() && poss[2].trim()) return { base: poss[2].trim(), affix: poss[1].trim(), format: 'prefix_possessive' }
  return { base: name, affix: null, format: null }
}

/** Normaliza un nombre de criadero/afijo para comparar (sin acentos ni signos). */
export function normalizeAffix(s: string): string {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
}
