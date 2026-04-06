// ISO 3166-1 countries with emoji flags
// Names use the country's own convention - browser Intl.DisplayNames will localize them
export const COUNTRIES = [
  { code: 'ES', flag: '🇪🇸' }, { code: 'US', flag: '🇺🇸' }, { code: 'MX', flag: '🇲🇽' },
  { code: 'AR', flag: '🇦🇷' }, { code: 'CO', flag: '🇨🇴' }, { code: 'CL', flag: '🇨🇱' },
  { code: 'PE', flag: '🇵🇪' }, { code: 'VE', flag: '🇻🇪' }, { code: 'EC', flag: '🇪🇨' },
  { code: 'GT', flag: '🇬🇹' }, { code: 'CU', flag: '🇨🇺' }, { code: 'DO', flag: '🇩🇴' },
  { code: 'HN', flag: '🇭🇳' }, { code: 'SV', flag: '🇸🇻' }, { code: 'NI', flag: '🇳🇮' },
  { code: 'CR', flag: '🇨🇷' }, { code: 'PA', flag: '🇵🇦' }, { code: 'UY', flag: '🇺🇾' },
  { code: 'PY', flag: '🇵🇾' }, { code: 'BO', flag: '🇧🇴' }, { code: 'PR', flag: '🇵🇷' },
  { code: 'BR', flag: '🇧🇷' }, { code: 'PT', flag: '🇵🇹' }, { code: 'FR', flag: '🇫🇷' },
  { code: 'DE', flag: '🇩🇪' }, { code: 'IT', flag: '🇮🇹' }, { code: 'GB', flag: '🇬🇧' },
  { code: 'NL', flag: '🇳🇱' }, { code: 'BE', flag: '🇧🇪' }, { code: 'CH', flag: '🇨🇭' },
  { code: 'AT', flag: '🇦🇹' }, { code: 'SE', flag: '🇸🇪' }, { code: 'NO', flag: '🇳🇴' },
  { code: 'DK', flag: '🇩🇰' }, { code: 'FI', flag: '🇫🇮' }, { code: 'PL', flag: '🇵🇱' },
  { code: 'CZ', flag: '🇨🇿' }, { code: 'RO', flag: '🇷🇴' }, { code: 'HU', flag: '🇭🇺' },
  { code: 'GR', flag: '🇬🇷' }, { code: 'IE', flag: '🇮🇪' }, { code: 'HR', flag: '🇭🇷' },
  { code: 'SK', flag: '🇸🇰' }, { code: 'BG', flag: '🇧🇬' }, { code: 'RS', flag: '🇷🇸' },
  { code: 'RU', flag: '🇷🇺' }, { code: 'UA', flag: '🇺🇦' }, { code: 'TR', flag: '🇹🇷' },
  { code: 'IL', flag: '🇮🇱' }, { code: 'AE', flag: '🇦🇪' }, { code: 'SA', flag: '🇸🇦' },
  { code: 'JP', flag: '🇯🇵' }, { code: 'KR', flag: '🇰🇷' }, { code: 'CN', flag: '🇨🇳' },
  { code: 'IN', flag: '🇮🇳' }, { code: 'AU', flag: '🇦🇺' }, { code: 'NZ', flag: '🇳🇿' },
  { code: 'CA', flag: '🇨🇦' }, { code: 'ZA', flag: '🇿🇦' }, { code: 'MA', flag: '🇲🇦' },
  { code: 'EG', flag: '🇪🇬' }, { code: 'PH', flag: '🇵🇭' }, { code: 'TH', flag: '🇹🇭' },
  { code: 'SG', flag: '🇸🇬' }, { code: 'MY', flag: '🇲🇾' }, { code: 'ID', flag: '🇮🇩' },
]

export function getLocalizedCountries(locale?: string): { code: string; flag: string; name: string }[] {
  const lang = locale || (typeof navigator !== 'undefined' ? navigator.language : 'es')
  let displayNames: Intl.DisplayNames | null = null
  try {
    displayNames = new Intl.DisplayNames([lang], { type: 'region' })
  } catch {
    try { displayNames = new Intl.DisplayNames(['es'], { type: 'region' }) } catch {}
  }
  return COUNTRIES.map(c => ({
    ...c,
    name: displayNames?.of(c.code) || c.code,
  })).sort((a, b) => a.name.localeCompare(b.name, lang))
}

export async function searchCities(countryCode: string, query: string): Promise<string[]> {
  if (!query || query.length < 2 || !countryCode) return []
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(query)}&countrycodes=${countryCode.toLowerCase()}&format=json&addressdetails=1&limit=8&featuretype=settlement`
    )
    const data = await res.json()
    const cities = data
      .map((r: any) => r.address?.city || r.address?.town || r.address?.village || r.address?.municipality)
      .filter(Boolean)
    return [...new Set(cities)] as string[]
  } catch {
    return []
  }
}
