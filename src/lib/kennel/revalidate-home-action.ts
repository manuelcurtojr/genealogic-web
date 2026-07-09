'use server'

/**
 * Server action mínima para revalidar la home pública del criadero tras
 * editar datos básicos (antes vivía en content-actions.ts, retirado junto
 * al constructor de webs).
 */
import { revalidatePath } from 'next/cache'
import { revalidateKennelHome } from '@/lib/kennel/kennel-home-cache'

export async function revalidateKennelHomeAction(kennelId: string, slug?: string | null): Promise<{ ok: true }> {
  revalidatePath('/kennel')
  if (slug) {
    revalidatePath(`/kennels/${slug}`)
    revalidatePath(`/kennels/${slug}/perros`)
    revalidatePath(`/kennels/${slug}/contacto`)
  }
  revalidateKennelHome(kennelId)
  return { ok: true }
}
