/**
 * dog audit log — helper para registrar eventos custom.
 *
 * Los triggers en PostgreSQL ya capturan automáticamente:
 *   · dogs INSERT/UPDATE (creación + diff de campos)
 *   · dog_photos INSERT/DELETE
 *   · vet_records INSERT
 *   · awards INSERT
 *
 * Usa logDogAction() solo para eventos compuestos o que pasan FUERA de esos
 * triggers (ej. importación de pedigree, generación de PDF, evento de
 * negocio que no toca la tabla `dogs`).
 *
 * IMPORTANTE: usa el cliente con la sesión del usuario (no service-role)
 * para que auth.uid() en el RPC resuelva al usuario real. Si necesitas
 * loggear desde un job/worker, hay que pasar el actor a mano vía INSERT
 * directo con service-role + actor_user_id explícito.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export type DogAuditAction =
  | 'pedigree_imported'
  | 'pdf_generated'
  | 'transferred'
  | 'claimed'
  | 'litter_assigned'
  | 'contract_signed'
  | 'genotype_imported'
  | 'note_added'
  // Catch-all para eventos ad-hoc que no merecen un literal dedicado
  | (string & Record<never, never>)

export async function logDogAction(
  supabase: SupabaseClient,
  params: {
    dogId: string
    action: DogAuditAction
    payload?: Record<string, unknown>
  },
): Promise<{ id?: string; error?: string }> {
  const { data, error } = await supabase.rpc('log_dog_action', {
    p_dog_id: params.dogId,
    p_action: params.action,
    p_payload: params.payload ?? {},
  })
  if (error) return { error: error.message }
  return { id: data as string }
}
