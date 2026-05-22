/**
 * AsyncLocalStorage para propagar el "kennel actual" durante el render del
 * web builder público (/c/[slug]/...).
 *
 * Pawdoq tenant-breeder usa `headers()` para resolver el tenant porque cada
 * dominio = un tenant. Aquí múltiples kennels comparten dominio, así que
 * resolvemos por el slug del path en el PageRenderer y propagamos vía ALS
 * a todas las section components.
 */
import 'server-only'
import { AsyncLocalStorage } from 'async_hooks'
import type { KennelContext } from './kennel-site'

const storage = new AsyncLocalStorage<{ kennel: KennelContext }>()

export function runWithKennel<T>(kennel: KennelContext, fn: () => T): T {
  return storage.run({ kennel }, fn)
}

export function getCurrentKennelSync(): KennelContext {
  const store = storage.getStore()
  if (!store) {
    throw new Error('No hay kennel en el contexto. Usar runWithKennel() antes de renderizar secciones.')
  }
  return store.kennel
}

export async function getCurrentKennel(): Promise<KennelContext> {
  return getCurrentKennelSync()
}
