'use client'

/**
 * LocaleProvider + useT — contexto de idioma para componentes cliente.
 *
 * El locale se resuelve SERVER-SIDE (getLocale, lib/locale.ts) y se inyecta
 * aquí desde el root layout. Cualquier componente cliente descendiente puede
 * hacer:
 *
 *   const t = useT()
 *   ...
 *   <span>{t('Mi texto en español')}</span>
 *
 * Esto evita el prop-drilling de `locale` por todo el árbol. Server components
 * NO usan este hook (no pueden) — ahí se usa getTranslator(await getLocale())
 * directamente.
 *
 * El diccionario vive en lib/i18n.ts (getTranslator). 'es' es la clave base.
 */
import { createContext, useContext, useMemo } from 'react'
import { getTranslator } from '@/lib/i18n'

const LocaleContext = createContext<string>('es')

export function LocaleProvider({
  locale,
  children,
}: {
  locale: string
  children: React.ReactNode
}) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
}

/** Devuelve el locale actual (string: 'es' | 'en' | ...). */
export function useLocale(): string {
  return useContext(LocaleContext)
}

/** Devuelve la función de traducción t() para el locale actual. */
export function useT(): (key: string) => string {
  const locale = useContext(LocaleContext)
  return useMemo(() => getTranslator(locale), [locale])
}
