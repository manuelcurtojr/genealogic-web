import 'server-only'
import { createKennelAdminClient } from '@/lib/supabase/server'
import { kennelHasAddon, type AddonKey } from '@/lib/kennel/addons'

/**
 * Guard de SERVIDOR para las extensiones (add-ons).
 *
 * Las páginas/layouts ya gatean la UI, pero las API routes y server actions
 * deben comprobar la entitlement por su cuenta (si no, un free podría llamarlas
 * directas — p.ej. enviar una newsletter). Carga el criadero del usuario y
 * resuelve la extensión (con override de founder vía kennelHasAddon).
 */
export async function userHasAddon(userId: string, key: AddonKey): Promise<boolean> {
  const admin = createKennelAdminClient()
  const { data } = await admin
    .from('kennels')
    .select('addons, owner_id')
    .eq('owner_id', userId)
    .limit(1)
  const kennel = data?.[0] || null
  return kennelHasAddon(kennel, key, userId)
}
