'use server'
/**
 * Enlaza/desenlaza el padre o madre de un perro en el constructor de genealogías.
 *
 * La RLS de `dogs` solo deja al dueño actualizar (auth.uid()=owner_id), pero los
 * ÁRBOLES contienen ancestros importados con owner_id=null que el criador debe
 * poder editar. Esta action usa el cliente admin pero aplica la regla correcta:
 *   - permitido si eres el dueño del perro hijo, o
 *   - si el perro hijo es un ancestro SIN dueño (owner_id IS NULL).
 *   - NUNCA editar la genealogía de un perro de OTRO criador.
 */
import { createClient, createKennelAdminClient } from '@/lib/supabase/server'

export async function setDogParent(
  childDogId: string,
  role: 'father' | 'mother',
  parentId: string | null,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'unauthorized' }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createKennelAdminClient() as any
    const { data: child } = await admin.from('dogs').select('owner_id').eq('id', childDogId).maybeSingle()
    if (!child) return { ok: false, error: 'not found' }
    if (child.owner_id !== user.id && child.owner_id !== null) {
      return { ok: false, error: 'forbidden' }
    }
    const field = role === 'father' ? 'father_id' : 'mother_id'
    const { error } = await admin.from('dogs').update({ [field]: parentId }).eq('id', childDogId)
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'unknown' }
  }
}
