/**
 * Stub de getBreederConfig — Pawdoq tenían tenant_breeder_config con muchas
 * opciones; en Genealogic no hay tabla equivalente (todavía). Mientras tanto
 * devolvemos defaults sanos que permiten que las secciones rendericen.
 */

export type BreederConfigStub = {
  kennel_affix: string | null
  brand_primary: string | null
  brand_ink: string | null
  contact_email: string | null
  contact_phone: string | null
  whatsapp_phone: string | null
  whatsapp_enabled: boolean
  social_facebook: string | null
  social_instagram: string | null
  social_tiktok: string | null
  social_youtube: string | null
  locale_default: string
  locales_enabled: string[]
  city: string | null
  country: string | null
  reservation_deposit_cents: number | null
  full_price_default_cents: number | null
}

export async function getBreederConfig(_kennelId: string): Promise<BreederConfigStub> {
  return {
    kennel_affix: null,
    brand_primary: null,
    brand_ink: null,
    contact_email: null,
    contact_phone: null,
    whatsapp_phone: null,
    whatsapp_enabled: false,
    social_facebook: null,
    social_instagram: null,
    social_tiktok: null,
    social_youtube: null,
    locale_default: 'es',
    locales_enabled: ['es'],
    city: null,
    country: null,
    reservation_deposit_cents: null,
    full_price_default_cents: null,
  }
}
