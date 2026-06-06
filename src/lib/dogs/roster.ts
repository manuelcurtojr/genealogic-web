import { createClient } from '@/lib/supabase/client'

/**
 * Filtro PostgREST `.or()` para "los perros del criadero del usuario".
 *
 * Incluye los perros que el usuario POSEE (owner_id) + los importados o
 * producidos que están EN su criadero (kennel_id) o que él crió (breeder_id),
 * aunque NO tengan owner_id — p. ej. "Hilda de Irema Curtó".
 *
 * Antes los selectores de perros (padres de una camada, ancestros del pedigrí,
 * perro de un evento de calendario) filtraban solo por `owner_id = userId`, así
 * que los perros importados del criadero (owner_id null) no aparecían. Este
 * helper resuelve el kennel del usuario y devuelve el filtro completo.
 *
 * Uso: `query.or(await kennelRosterOrFilter(userId)).eq('sex', 'female')`
 */
export async function kennelRosterOrFilter(userId: string): Promise<string> {
  const supabase = createClient()
  const { data } = await supabase.from('kennels').select('id').eq('owner_id', userId).limit(1)
  const kennelId = data?.[0]?.id
  return kennelId
    ? `owner_id.eq.${userId},kennel_id.eq.${kennelId},breeder_id.eq.${userId}`
    : `owner_id.eq.${userId},breeder_id.eq.${userId}`
}
