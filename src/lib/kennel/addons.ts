import { isEnterpriseUser } from '@/lib/permissions'

/**
 * Extensiones (add-ons) del modelo "Pro + extensiones".
 *
 * Se encienden por criadero (columna kennels.addons), sobre el plan Pro. El
 * founder (ENTERPRISE_USERS) las tiene todas siempre. Phase 1: concesión manual;
 * futuro: sync desde los items de la suscripción de Stripe.
 */
export type AddonKey = 'web' | 'emailbot' | 'newsletter'

export const ADDON_KEYS: AddonKey[] = ['web', 'emailbot', 'newsletter']

export const ADDON_LABEL: Record<AddonKey, string> = {
  web: 'Web del criadero',
  emailbot: 'Emailbot',
  newsletter: 'Newsletter',
}

type KennelLike = { addons?: string[] | null; owner_id?: string | null } | null | undefined

/**
 * ¿El criadero tiene la extensión activa? El founder la tiene siempre.
 * `ownerUserId` es opcional: si no se pasa, se usa kennel.owner_id (cárgalo en
 * el select cuando puedas para que el override de founder funcione).
 */
export function kennelHasAddon(kennel: KennelLike, key: AddonKey, ownerUserId?: string | null): boolean {
  if (isEnterpriseUser(ownerUserId ?? kennel?.owner_id ?? null)) return true
  return Array.isArray(kennel?.addons) && kennel!.addons!.includes(key)
}

/** Conjunto de extensiones activas (incluye todas si es founder). */
export function activeAddons(kennel: KennelLike, ownerUserId?: string | null): Set<AddonKey> {
  if (isEnterpriseUser(ownerUserId ?? kennel?.owner_id ?? null)) return new Set(ADDON_KEYS)
  const list = Array.isArray(kennel?.addons) ? kennel!.addons! : []
  return new Set(list.filter((a): a is AddonKey => (ADDON_KEYS as string[]).includes(a)))
}
