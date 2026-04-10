export const AFFIX_FORMATS = [
  { value: 'suffix_de', label: 'Nombre de Criadero', example: 'Pablo de Demo Kennels', preposition: 'de' },
  { value: 'suffix_of', label: 'Nombre of Criadero', example: 'Pablo of Demo Kennels', preposition: 'of' },
  { value: 'suffix_von', label: 'Nombre von Criadero', example: 'Pablo von Demo Kennels', preposition: 'von' },
  { value: 'suffix_du', label: 'Nombre du Criadero', example: 'Pablo du Demo Kennels', preposition: 'du' },
  { value: 'suffix_del', label: 'Nombre del Criadero', example: 'Pablo del Demo Kennels', preposition: 'del' },
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
