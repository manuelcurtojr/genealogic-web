export const AFFIX_FORMATS = [
  { value: 'suffix_de', label: 'Nombre de Criadero', example: 'Pablo de Irema Curtó', preposition: 'de' },
  { value: 'suffix_of', label: 'Nombre of Criadero', example: 'Pablo of Irema Curtó', preposition: 'of' },
  { value: 'suffix_von', label: 'Nombre von Criadero', example: 'Pablo von Irema Curtó', preposition: 'von' },
  { value: 'suffix_du', label: 'Nombre du Criadero', example: 'Pablo du Irema Curtó', preposition: 'du' },
  { value: 'suffix_del', label: 'Nombre del Criadero', example: 'Pablo del Irema Curtó', preposition: 'del' },
  { value: 'suffix_vom', label: 'Nombre vom Criadero', example: 'Pablo vom Irema Curtó', preposition: 'vom' },
  { value: 'prefix_possessive', label: "Criadero's Nombre", example: "Irema Curtó's Pablo", preposition: "'s" },
  { value: 'prefix_direct', label: 'Criadero Nombre', example: 'Irema Curtó Pablo', preposition: '' },
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
