'use server'
/**
 * Resuelve el padre/madre de un perro DEL USUARIO con el cliente admin, para
 * incluir ancestros importados/privados (owner_id=null) o de otro criadero que
 * la RLS del usuario no ve. Necesario porque las listas de padres del editor se
 * cargan con limit(500) sobre 70k+ perros y casi nunca incluyen al padre real.
 *
 * Seguridad: solo el DUEÑO del perro hijo puede resolver sus padres.
 */
import { createClient, createKennelAdminClient } from '@/lib/supabase/server'

export type ParentDog = { id: string; name: string; sex: string; thumbnail_url: string | null }

export async function getDogParents(childDogId: string): Promise<ParentDog[]> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createKennelAdminClient() as any
    const { data: child } = await admin
      .from('dogs')
      .select('owner_id, father_id, mother_id')
      .eq('id', childDogId)
      .maybeSingle()
    if (!child || child.owner_id !== user.id) return []
    const ids = [child.father_id, child.mother_id].filter(Boolean)
    if (!ids.length) return []
    const { data } = await admin.from('dogs').select('id, name, sex, thumbnail_url').in('id', ids)
    return (data || []) as ParentDog[]
  } catch {
    return []
  }
}
